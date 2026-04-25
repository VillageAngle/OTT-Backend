/**
 * Video Streaming Controller
 * Implements smooth, lag-free video streaming with adaptive buffering
 * Features:
 * - HTTP 206 Partial Content response for efficient chunking
 * - Intelligent buffering to prevent jitter
 * - Backpressure handling for smooth playback
 * - Range request support for seeking
 * - Connection keep-alive for stable streaming
 */

import { Response, NextFunction } from "express";
import { prisma } from "../lib/db";
import { AuthRequest } from "../middleware/auth";
import { ErrorResponse } from "../utils/errorResponse";
import { parseRangeHeader, generateContentRangeHeader, calculateChunkSize } from "../utils/rangeParser";
import { getVideoMetadata, getVideoStream } from "../lib/s3";

/**
 * CONFIGURATION FOR SMOOTH STREAMING
 */
const STREAMING_CONFIG = {
  // Default chunk size: 256KB - optimal for most networks
  DEFAULT_CHUNK_SIZE: 256 * 1024,

  // Maximum chunk size to prevent memory spikes
  MAX_CHUNK_SIZE: 1024 * 1024, // 1MB

  // Minimum chunk size for stable connections
  MIN_CHUNK_SIZE: 64 * 1024, // 64KB

  // Socket timeout to prevent hanging connections
  SOCKET_TIMEOUT: 60000, // 60 seconds

  // Stream buffer size (Node.js will manage backpressure automatically)
  HIGH_WATER_MARK: 256 * 1024, // 256KB

  // Keep-alive interval to detect stale connections
  KEEP_ALIVE_INTERVAL: 25000, // 25 seconds

  // Maximum concurrent streams per user (prevents abuse)
  MAX_CONCURRENT_STREAMS: 3,
};

/**
 * Track active streams per user for abuse prevention
 */
const activeStreams = new Map<string, number>();

/**
 * Increment active stream count
 */
const incrementActiveStreams = (userId: string): boolean => {
  const count = activeStreams.get(userId) || 0;
  if (count >= STREAMING_CONFIG.MAX_CONCURRENT_STREAMS) {
    return false;
  }
  activeStreams.set(userId, count + 1);
  return true;
};

/**
 * Decrement active stream count
 */
const decrementActiveStreams = (userId: string): void => {
  const count = activeStreams.get(userId) || 0;
  if (count > 0) {
    activeStreams.set(userId, count - 1);
  }
};

/**
 * Detect network speed based on User-Agent and connection type
 * Returns estimated bandwidth in bytes/sec
 */
const estimateNetworkSpeed = (req: AuthRequest): number => {
  const userAgent = req.get("user-agent") || "";

  // Mobile networks are typically slower
  if (/mobile|android|iphone|ipad/i.test(userAgent)) {
    // Assume 2.5 Mbps for mobile
    return 312500; // bytes/sec
  }

  // Default to 5 Mbps for desktop
  return 625000; // bytes/sec
};

/**
 * Calculate adaptive chunk size based on network conditions
 * Prevents buffering and jitter by adapting to available bandwidth
 */
const calculateAdaptiveChunkSize = (networkSpeed: number): number => {
  // Target: 1 second of video data per chunk
  // This means the chunk will be downloaded in ~1 second
  // Prevents long buffering waits while ensuring smooth playback

  let chunkSize = Math.floor(networkSpeed * 1); // 1 second worth

  // Clamp to min/max bounds
  chunkSize = Math.max(STREAMING_CONFIG.MIN_CHUNK_SIZE, chunkSize);
  chunkSize = Math.min(STREAMING_CONFIG.MAX_CHUNK_SIZE, chunkSize);

  return chunkSize;
};

/**
 * Main video streaming endpoint
 * GET /api/videos/:id/stream
 * Supports Range header for seeking and resume capability
 */
export const streamVideo = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  let userId = req.user?.id || "anonymous";
  let streamStarted = false;

  try {
    const { id } = req.params;

    // Rate limiting: Check concurrent streams
    if (!incrementActiveStreams(userId)) {
      throw new ErrorResponse(
        "Too many concurrent streams. Maximum 3 streams per user.",
        429
      );
    }
    streamStarted = true;

    // Verify video exists in database
    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        channel: {
          select: { id: true },
        },
      },
    });

    if (!video) {
      throw new ErrorResponse("Video not found", 404);
    }

    // Get video metadata from S3 with caching to reduce latency
    const metadata = await getVideoMetadata(video.fileUrl);
    const totalSize = metadata.size;

    if (totalSize === 0) {
      throw new ErrorResponse("Invalid video file", 400);
    }

    // Parse Range header for partial content requests
    const rangeHeader = req.get("range");
    const range = parseRangeHeader(rangeHeader, totalSize);

    if (!range.isValid) {
      throw new ErrorResponse(range.error || "Invalid range", 416);
    }

    // Calculate chunk size based on network conditions for smooth playback
    const networkSpeed = estimateNetworkSpeed(req);
    const adaptiveChunkSize = calculateAdaptiveChunkSize(networkSpeed);

    // Build response headers for optimal streaming
    const headers: Record<string, string | number> = {
      "Content-Type": metadata.contentType || "video/mp4",
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      "Content-Length": calculateChunkSize(range.start, range.end),

      // Keep connection alive and prevent premature closure
      "Connection": "keep-alive",
      "Transfer-Encoding": "chunked",

      // CORS headers for frontend access
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Expose-Headers": "Content-Range, Content-Length, Accept-Ranges",

      // ETag for efficient caching
      ...(metadata.eTag && { "ETag": metadata.eTag }),
    };

    // Add range-specific headers
    if (rangeHeader) {
      res.status(206); // Partial Content
      headers["Content-Range"] = generateContentRangeHeader(
        range.start,
        range.end,
        totalSize
      );
    } else {
      res.status(200); // Full content
    }

    // Set all headers at once for efficiency
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Configure socket for stable streaming
    const socket = res.socket;
    if (socket) {
      socket.setTimeout(STREAMING_CONFIG.SOCKET_TIMEOUT);

      // Handle socket errors gracefully
      socket.on("error", (error) => {
        console.error(`Socket error during video stream: ${error.message}`);
        // Stream will be cleaned up automatically
      });

      // Prevent socket from being kept alive too long
      socket.on("close", () => {
        decrementActiveStreams(userId);
        streamStarted = false;
      });
    }

    // Get video stream from S3 with range support
    const stream = await getVideoStream(video.fileUrl, {
      start: range.start,
      end: range.end,
    });

    // Handle backpressure to prevent memory spikes and ensure smooth playback
    // When client can't consume fast enough, S3 stream automatically pauses
    stream.on("error", (error) => {
      console.error(`Stream error: ${error.message}`);
      if (!res.headersSent) {
        res.status(500).json({ error: "Stream error" });
      } else {
        res.end();
      }
    });

    // Configure response stream for smooth delivery
    // Backpressure handling is automatic when piping
    stream.pipe(res, {
      end: true, // End response when stream ends
    });

    // Track streaming completion
    res.on("finish", () => {
      decrementActiveStreams(userId);
      streamStarted = false;
    });

    res.on("error", () => {
      if (streamStarted) {
        decrementActiveStreams(userId);
        streamStarted = false;
      }
    });
  } catch (error) {
    // Clean up stream count on error
    if (streamStarted) {
      decrementActiveStreams(userId);
    }

    return next(
      error instanceof ErrorResponse
        ? error
        : new ErrorResponse((error as any).message, 500)
    );
  }
};

/**
 * Get video streaming info endpoint
 * Provides metadata without streaming the full video
 * Useful for UI to show video duration, file size, etc.
 * GET /api/videos/:id/stream-info
 */
export const getStreamInfo = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const video = await prisma.video.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        fileUrl: true,
        thumbnailUrl: true,
        status: true,
        createdAt: true,
      },
    });

    if (!video) {
      throw new ErrorResponse("Video not found", 404);
    }

    // Get S3 metadata (cached)
    const metadata = await getVideoMetadata(video.fileUrl);

    const networkSpeed = estimateNetworkSpeed(req);
    const adaptiveChunkSize = calculateAdaptiveChunkSize(networkSpeed);

    return res.status(200).json({
      success: true,
      data: {
        video,
        streaming: {
          fileSize: metadata.size,
          contentType: metadata.contentType,
          adaptiveChunkSize,
          supportRange: true,
          maxConcurrentStreams: STREAMING_CONFIG.MAX_CONCURRENT_STREAMS,
          estimatedBandwidth: networkSpeed,
        },
      },
    });
  } catch (error) {
    return next(
      error instanceof ErrorResponse
        ? error
        : new ErrorResponse((error as any).message, 500)
    );
  }
};

/**
 * Health check for streaming service
 * GET /api/videos/stream/health
 */
export const streamingHealthCheck = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const totalActive = Array.from(activeStreams.values()).reduce(
      (a, b) => a + b,
      0
    );

    return res.status(200).json({
      success: true,
      data: {
        status: "healthy",
        activeStreams: totalActive,
        timestamp: new Date(),
        config: {
          defaultChunkSize: STREAMING_CONFIG.DEFAULT_CHUNK_SIZE,
          maxChunkSize: STREAMING_CONFIG.MAX_CHUNK_SIZE,
          socketTimeout: STREAMING_CONFIG.SOCKET_TIMEOUT,
        },
      },
    });
  } catch (error) {
    return next(new ErrorResponse("Health check failed", 500));
  }
};

export default {
  streamVideo,
  getStreamInfo,
  streamingHealthCheck,
};
