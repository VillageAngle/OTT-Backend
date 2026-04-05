import { Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../lib/db";
import { AuthRequest } from "../middleware/auth";
import { ErrorResponse } from "../utils/errorResponse";

// Create a new live stream
export const createLiveStream = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, description, channelId } = req.body;

    if (!title || !channelId) {
      throw new ErrorResponse("Title and channelId are required", 400);
    }

    // Verify channel exists
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new ErrorResponse("Channel not found", 404);
    }

    // Generate RTMP key
    const rtmpKey = uuidv4();
    const rtmpUrl = `rtmp://streaming.example.com/live/${channelId}`;

    // Create live stream
    const liveStream = await prisma.liveStream.create({
      data: {
        title,
        description: description || null,
        rtmpUrl,
        rtmpKey,
        channelId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Live stream created successfully",
      data: {
        ...liveStream,
        rtmpKey, // Include RTMP key for broadcasting
      },
    });
  } catch (error) {
    return next(
      error instanceof ErrorResponse ? error : new ErrorResponse((error as any).message, 500)
    );
  }
};

// Get all live streams for a channel
export const getLiveStreamsByChannel = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { channelId } = req.params;

    const liveStreams = await prisma.liveStream.findMany({
      where: { channelId },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        viewerCount: true,
        startedAt: true,
        endedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      message: "Live streams retrieved successfully",
      data: liveStreams,
    });
  } catch (error) {
    return next(
      error instanceof ErrorResponse ? error : new ErrorResponse((error as any).message, 500)
    );
  }
};

// Get live stream by ID
export const getLiveStreamById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const liveStream = await prisma.liveStream.findUnique({
      where: { id },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            description: true,
            bannerUrl: true,
          },
        },
      },
    });

    if (!liveStream) {
      throw new ErrorResponse("Live stream not found", 404);
    }

    // Don't expose RTMP key to public
    const { rtmpKey, ...safeStream } = liveStream;

    return res.status(200).json({
      success: true,
      message: "Live stream retrieved successfully",
      data: safeStream,
    });
  } catch (error) {
    return next(
      error instanceof ErrorResponse ? error : new ErrorResponse((error as any).message, 500)
    );
  }
};

// Update live stream status
export const updateLiveStreamStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status, viewerCount } = req.body;

    const liveStream = await prisma.liveStream.update({
      where: { id },
      data: {
        status,
        viewerCount: viewerCount || undefined,
        startedAt: status === "LIVE" ? new Date() : undefined,
        endedAt: status === "ENDED" ? new Date() : undefined,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Live stream updated successfully",
      data: liveStream,
    });
  } catch (error) {
    return next(
      error instanceof ErrorResponse ? error : new ErrorResponse((error as any).message, 500)
    );
  }
};

// Get currently live streams
export const getLiveStreams = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const liveStreams = await prisma.liveStream.findMany({
      where: {
        status: "LIVE",
      },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            description: true,
            bannerUrl: true,
          },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      message: "Live streams retrieved successfully",
      data: liveStreams,
    });
  } catch (error) {
    return next(
      error instanceof ErrorResponse ? error : new ErrorResponse((error as any).message, 500)
    );
  }
};

// End live stream (convert to VOD optionally)
export const endLiveStream = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { recordingUrl } = req.body;

    const liveStream = await prisma.liveStream.update({
      where: { id },
      data: {
        status: "ENDED",
        endedAt: new Date(),
        recordingUrl: recordingUrl || null,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Live stream ended successfully",
      data: liveStream,
    });
  } catch (error) {
    return next(
      error instanceof ErrorResponse ? error : new ErrorResponse((error as any).message, 500)
    );
  }
};
