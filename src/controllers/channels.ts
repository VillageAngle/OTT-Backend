import { Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../lib/db";
import { AuthRequest } from "../middleware/auth";
import { ErrorResponse } from "../utils/errorResponse";

// Create a new channel (admin)
export const createChannel = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      throw new ErrorResponse("Channel name is required", 400);
    }

    // Check if channel already exists
    const existingChannel = await prisma.channel.findUnique({
      where: { name },
    });

    if (existingChannel) {
      throw new ErrorResponse("Channel with this name already exists", 400);
    }

    // Create channel
    const channel = await prisma.channel.create({
      data: {
        name,
        description: description || null,
        // Create associated analytics
        analytics: {
          create: {},
        },
      },
      include: {
        analytics: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Channel created successfully",
      data: channel,
    });
  } catch (error) {
    return next(
      error instanceof ErrorResponse ? error : new ErrorResponse((error as any).message, 500)
    );
  }
};

// Get all channels
export const getAllChannels = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const channels = await prisma.channel.findMany({
      include: {
        analytics: true,
        _count: {
          select: { videos: true, liveStreams: true },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Channels retrieved successfully",
      data: channels,
    });
  } catch (error) {
    return next(
      error instanceof ErrorResponse ? error : new ErrorResponse((error as any).message, 500)
    );
  }
};

// Get channel by ID
export const getChannelById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const channel = await prisma.channel.findUnique({
      where: { id },
      include: {
        videos: {
          select: {
            id: true,
            title: true,
            description: true,
            duration: true,
            thumbnailUrl: true,
            createdAt: true,
          },
        },
        liveStreams: {
          select: {
            id: true,
            title: true,
            status: true,
            viewerCount: true,
            createdAt: true,
          },
        },
        analytics: true,
      },
    });

    if (!channel) {
      throw new ErrorResponse("Channel not found", 404);
    }

    return res.status(200).json({
      success: true,
      message: "Channel retrieved successfully",
      data: channel,
    });
  } catch (error) {
    return next(
      error instanceof ErrorResponse ? error : new ErrorResponse((error as any).message, 500)
    );
  }
};

// Update channel
export const updateChannel = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, description, bannerUrl } = req.body;

    const channel = await prisma.channel.update({
      where: { id },
      data: {
        name,
        description,
        bannerUrl,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Channel updated successfully",
      data: channel,
    });
  } catch (error) {
    return next(
      error instanceof ErrorResponse ? error : new ErrorResponse((error as any).message, 500)
    );
  }
};

// Delete channel
export const deleteChannel = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    await prisma.channel.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Channel deleted successfully",
      data: null,
    });
  } catch (error) {
    return next(
      error instanceof ErrorResponse ? error : new ErrorResponse((error as any).message, 500)
    );
  }
};
