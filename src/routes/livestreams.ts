import { Router } from "express";
import {
  createLiveStream,
  getLiveStreamsByChannel,
  getLiveStreamById,
  updateLiveStreamStatus,
  getLiveStreams,
  endLiveStream,
} from "../controllers/livestreams";
import { verifyToken } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// Public routes
router.get("/", asyncHandler(getLiveStreams));
router.get("/:id", asyncHandler(getLiveStreamById));
router.get("/channel/:channelId", asyncHandler(getLiveStreamsByChannel));

// Protected routes (admin/broadcaster)
router.post("/", verifyToken, asyncHandler(createLiveStream));
router.put("/:id/status", verifyToken, asyncHandler(updateLiveStreamStatus));
router.post("/:id/end", verifyToken, asyncHandler(endLiveStream));

export default router;
