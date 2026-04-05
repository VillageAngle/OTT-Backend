import { Router } from "express";
import {
  createChannel,
  getAllChannels,
  getChannelById,
  updateChannel,
  deleteChannel,
} from "../controllers/channels";
import { verifyToken } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// Public routes
router.get("/", asyncHandler(getAllChannels));
router.get("/:id", asyncHandler(getChannelById));

// Protected routes (admin)
router.post("/", verifyToken, asyncHandler(createChannel));
router.put("/:id", verifyToken, asyncHandler(updateChannel));
router.delete("/:id", verifyToken, asyncHandler(deleteChannel));

export default router;
