import { Router } from "express";
import {
  generateVideoToken,
  generateLiveStreamToken,
  verifyStreamToken,
  revokeStreamToken,
  getUserStreamTokens,
} from "../controllers/streamTokens";
import { verifyToken } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// Public routes
router.get("/verify", asyncHandler(verifyStreamToken));

// Protected routes
router.use(verifyToken);
router.post("/video/:videoId", asyncHandler(generateVideoToken));
router.post("/live/:liveStreamId", asyncHandler(generateLiveStreamToken));
router.delete("/:token", asyncHandler(revokeStreamToken));
router.get("/", asyncHandler(getUserStreamTokens));

export default router;
