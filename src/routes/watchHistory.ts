import { Router } from "express";
import {
  updateWatchHistory,
  getWatchHistory,
  getContinueWatching,
  getCompletedVideos,
} from "../controllers/watchHistory";
import { verifyToken } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Watch history routes
router.put("/:videoId", asyncHandler(updateWatchHistory));
router.get("/", asyncHandler(getWatchHistory));
router.get("/continue/watching", asyncHandler(getContinueWatching));
router.get("/completed", asyncHandler(getCompletedVideos));

export default router;
