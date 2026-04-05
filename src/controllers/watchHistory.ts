import { Response, NextFunction } from "express";
import { prisma } from "../lib/db";
import { AuthRequest } from "../middleware/auth";
import { ErrorResponse } from "../utils/errorResponse";

// Update or create watch history
export const updateWatchHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { videoId } = req.params;
    const { watchDuration, totalDuration } = req.body;
    const userId = req.user!.id;

    if (!videoId || watchDuration === undefined || totalDuration === undefined) {
      throw new ErrorResponse(
        "videoId, watchDuration, and totalDuration are required",
        400
      );
    }

    // Verify video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new ErrorResponse("Video not found", 404);
    }

    // Calculate progress percentage
    const progress = (watchDuration / totalDuration) * 100;
    const isCompleted = progress >= 90; // Consider completed if 90% watched

    // Upsert watch history
    const watchHistory = await prisma.watchHistory.upsert({
      where: {
        userId_videoId: {
          userId,
          videoId,
        },
      },
      update: {
        watchDuration,
        totalDuration,
        progress,
        isCompleted,
        lastWatchedAt: new Date(),
      },
      create: {
        userId,
        videoId,
        watchDuration,
        totalDuration,
        progress,
        isCompleted,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Watch history updated successfully",
      data: watchHistory,
    });
  } catch (error) {
    return next(
      error instanceof ErrorResponse ? error : new ErrorResponse((error as any).message, 500)
    );
  }
};

// Get user's watch history
export const getWatchHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const watchHistory = await prisma.watchHistory.findMany({
      where: { userId },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            description: true,
            duration: true,
            thumbnailUrl: true,
            channel: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      skip,
      take: limit,
      orderBy: { lastWatchedAt: "desc" },
    });

    const total = await prisma.watchHistory.count({ where: { userId } });

    return res.status(200).json({
      success: true,
      message: "Watch history retrieved successfully",
      data: {
        watchHistory,
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

// Get continue watching (videos with progress < 90%)
export const getContinueWatching = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 5;

    const continueWatching = await prisma.watchHistory.findMany({
      where: {
        userId,
        isCompleted: false,
      },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            description: true,
            duration: true,
            thumbnailUrl: true,
            channel: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      take: limit,
      orderBy: { lastWatchedAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      message: "Continue watching retrieved successfully",
      data: continueWatching,
    });
  } catch (error) {
    return next(
      error instanceof ErrorResponse ? error : new ErrorResponse((error as any).message, 500)
    );
  }
};

// Get completed videos
export const getCompletedVideos = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const completed = await prisma.watchHistory.findMany({
      where: {
        userId,
        isCompleted: true,
      },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            description: true,
            duration: true,
            thumbnailUrl: true,
            channel: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      skip,
      take: limit,
      orderBy: { lastWatchedAt: "desc" },
    });

    const total = await prisma.watchHistory.count({
      where: {
        userId,
        isCompleted: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Completed videos retrieved successfully",
      data: {
        completed,
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
