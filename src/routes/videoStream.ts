import { Router } from "express";
import {
  streamVideo,
  getStreamInfo,
  streamingHealthCheck,
} from "../controllers/videoStream";
import { verifyToken } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

/**
 * Public streaming endpoints
 * No authentication required for video streaming
 * (Authentication can be added at channel/video level if needed)
 */

// Stream video with Range support for smooth playback
// Supports seeking and resume functionality
router.get("/:id/stream", asyncHandler(streamVideo));

// Get streaming metadata without downloading video
// Useful for UI to prepare player with video info
router.get("/:id/stream-info", asyncHandler(getStreamInfo));

// Health check for streaming service
// Monitors active streams and configuration
router.get("/health/status", asyncHandler(streamingHealthCheck));

export default router;
