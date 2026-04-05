import { Router } from "express";
import { 
  registerUser, 
  verifyRegistrationOTP,
  loginUser,
  verifyLoginOTP,
  getUserProfile 
} from "../controllers/users";
import { verifyToken } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// Authentication routes
// Step 1: Register - sends OTP
router.post("/register", asyncHandler(registerUser));
// Step 2: Verify registration OTP
router.post("/register/verify-otp", asyncHandler(verifyRegistrationOTP));

// Step 1: Login - sends OTP
router.post("/login", asyncHandler(loginUser));
// Step 2: Verify login OTP
router.post("/login/verify-otp", asyncHandler(verifyLoginOTP));

// Protected routes
router.get("/profile", verifyToken, asyncHandler(getUserProfile));

export default router;
