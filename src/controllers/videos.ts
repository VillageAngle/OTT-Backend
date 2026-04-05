import { Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../lib/db";
import { AuthRequest } from "../middleware/auth";
import { ErrorResponse } from "../utils/errorResponse";

// Create a new video (VOD)
export const createVideo = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, description, duration, fileUrl, channelId, thumbnailUrl } = req.body;

    if (!title || !channelId || !fileUrl || duration === undefined) {
      throw new ErrorResponse(
        "Title, channelId, fileUrl, and duration are required",
        400
      );
    }

    // Verify channel exists
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new ErrorResponse("Channel not found", 404);
    }

    // Create video
    const video = await prisma.video.create({
      data: {
        title,
        description: description || null,
        duration,
        fileUrl,
        thumbnailUrl: thumbnailUrl || null,
        channelId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Video created successfully",
      data: video,
    });
  } catch (error) {
    return next(
      error instanceof ErrorResponse ? error : new ErrorResponse((error as any).message, 500)
    );
  }
};

// Get all videos for a channel
export const getVideosByChannel = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { channelId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const videos = await prisma.video.findMany({
      where: { channelId },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        thumbnailUrl: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.video.count({ where: { channelId } });

    return res.status(200).json({
      success: true,
      message: "Videos retrieved successfully",
      data: {
        videos,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    return next(
      error instanceof ErrorResponse ? error : new ErrorResponse((error as any).message, 500)
    );
  }
};

// Get video by ID
export const getVideoById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const video = await prisma.video.findUnique({
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

    if (!video) {
      throw new ErrorResponse("Video not found", 404);
    }

    return res.status(200).json({
      success: true,
      message: "Video retrieved successfully",
      data: video,
    });
  } catch (error) {
    return next(
      error instanceof ErrorResponse ? error : new ErrorResponse((error as any).message, 500)
    );
  }
};

// Update video
export const updateVideo = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;

    const video = await prisma.video.update({
      where: { id },
      data: {
        title,
        description,
        status,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Video updated successfully",
      data: video,
    });
  } catch (error) {
    return next(
      error instanceof ErrorResponse ? error : new ErrorResponse((error as any).message, 500)
    );
  }
};

// Delete video
export const deleteVideo = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await prisma.video.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Video deleted successfully",
      data: null,
    });
  } catch (error) {
    return next(
      error instanceof ErrorResponse ? error : new ErrorResponse((error as any).message, 500)
    );
  }
};

// Get video with preview duration check
export const getVideoWithPreview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!video) {
      throw new ErrorResponse("Video not found", 404);
    }

    // Check if user has watch history
    let watchHistory = null;
    if (userId) {
      watchHistory = await prisma.watchHistory.findUnique({
        where: {
          userId_videoId: {
            userId,
            videoId: id,
          },
        },
      });
    }

    const PREVIEW_DURATION = 120; // 2 minutes in seconds
    const canWatchFull = userId && (!!watchHistory || video.duration <= PREVIEW_DURATION);

    return res.status(200).json({
      success: true,
      message: "Video preview retrieved successfully",
      data: {
        video,
        preview: {
          duration: PREVIEW_DURATION,
          canWatchFull,
          requiresAuth: !userId && video.duration > PREVIEW_DURATION,
        },
        watchHistory,
      },
    });
  } catch (error) {
    return next(
      error instanceof ErrorResponse ? error : new ErrorResponse((error as any).message, 500)
    );
  }
};
