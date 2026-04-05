import { Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../lib/db";
import { AuthRequest } from "../middleware/auth";
import { ErrorResponse } from "../utils/errorResponse";

// Generate streaming token for video
export const generateVideoToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { videoId } = req.params;
    const userId = req.user!.id;

    // Verify video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new ErrorResponse("Video not found", 404);
    }

    // Generate token that expires in 24 hours
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create streaming token
    const streamToken = await prisma.streamToken.create({
      data: {
        token,
        userId,
        videoId,
        expiresAt,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Streaming token generated successfully",
      data: {
        token: streamToken.token,
        expiresAt: streamToken.expiresAt,
        streamUrl: `/stream/video/${videoId}?token=${streamToken.token}`,
      },
    });
  } catch (error) {
    return next(
      error instanceof ErrorResponse ? error : new ErrorResponse((error as any).message, 500)
    );
  }
};

// Generate streaming token for live stream
export const generateLiveStreamToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { liveStreamId } = req.params;
    const userId = req.user!.id;

    // Verify live stream exists
    const liveStream = await prisma.liveStream.findUnique({
      where: { id: liveStreamId },
    });

    if (!liveStream) {
      throw new ErrorResponse("Live stream not found", 404);
    }

    // Generate token that expires in 1 hour for live streams
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Create streaming token
    const streamToken = await prisma.streamToken.create({
      data: {
        token,
        userId,
        liveStreamId,
        expiresAt,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Live streaming token generated successfully",
      data: {
        token: streamToken.token,
        expiresAt: streamToken.expiresAt,
        streamUrl: `/stream/live/${liveStreamId}?token=${streamToken.token}`,
      },
    });
  } catch (error) {
    return next(
      error instanceof ErrorResponse ? error : new ErrorResponse((error as any).message, 500)
    );
  }
};

// Verify streaming token
export const verifyStreamToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.query;

    if (!token) {
      throw new ErrorResponse("Token is required", 400);
    }

    const streamToken = await prisma.streamToken.findUnique({
      where: { token: token as string },
      include: {
        video: {
          select: { id: true, title: true, fileUrl: true },
        },
        liveStream: {
          select: { id: true, title: true, rtmpUrl: true },
        },
      },
    });

    if (!streamToken) {
      throw new ErrorResponse("Invalid token", 404);
    }

    // Check if token is expired
    if (new Date() > streamToken.expiresAt) {
      throw new ErrorResponse("Token expired", 401);
    }

    return res.status(200).json({
      success: true,
      message: "Token verified successfully",
      data: {
        valid: true,
        token: streamToken,
      },
    });
  } catch (error) {
    return next(
      error instanceof ErrorResponse ? error : new ErrorResponse((error as any).message, 500)
    );
  }
};

// Revoke streaming token
export const revokeStreamToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.params;
    const userId = req.user!.id;

    // Verify ownership
    const streamToken = await prisma.streamToken.findUnique({
      where: { token },
    });

    if (!streamToken) {
      throw new ErrorResponse("Token not found", 404);
    }

    if (streamToken.userId !== userId) {
      throw new ErrorResponse("Unauthorized", 403);
    }

    // Delete token
    await prisma.streamToken.delete({
      where: { token },
    });

    return res.status(200).json({
      success: true,
      message: "Token revoked successfully",
      data: null,
    });
  } catch (error) {
    return next(
      error instanceof ErrorResponse ? error : new ErrorResponse((error as any).message, 500)
    );
  }
};

// Get user's stream tokens
export const getUserStreamTokens = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const tokens = await prisma.streamToken.findMany({
      where: { userId },
      select: {
        id: true,
        token: true,
        expiresAt: true,
        video: {
          select: { id: true, title: true },
        },
        liveStream: {
          select: { id: true, title: true },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Stream tokens retrieved successfully",
      data: tokens,
    });
  } catch (error) {
    return next(
      error instanceof ErrorResponse ? error : new ErrorResponse((error as any).message, 500)
    );
  }
};
