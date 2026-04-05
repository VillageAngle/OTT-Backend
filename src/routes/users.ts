import { Router } from "express";
import { registerUser, loginUser, getUserProfile } from "../controllers/users";
import { verifyToken } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// Public routes
router.post("/register", asyncHandler(registerUser));
router.post("/login", asyncHandler(loginUser));

// Protected routes
router.get("/profile", verifyToken, asyncHandler(getUserProfile));

export default router;
