import { Router } from "express";
import {
  createVideo,
  getVideosByChannel,
  getVideoById,
  updateVideo,
  deleteVideo,
  getVideoWithPreview,
} from "../controllers/videos";
import { verifyToken } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// Public routes
router.get("/:id", asyncHandler(getVideoById));
router.get("/:id/preview", asyncHandler(getVideoWithPreview));
router.get("/channel/:channelId", asyncHandler(getVideosByChannel));

// Protected routes (admin)
router.post("/", verifyToken, asyncHandler(createVideo));
router.put("/:id", verifyToken, asyncHandler(updateVideo));
router.delete("/:id", verifyToken, asyncHandler(deleteVideo));

export default router;
