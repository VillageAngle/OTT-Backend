import { Response, NextFunction } from "express";
import { prisma } from "../lib/db";
import { generateToken, AuthRequest } from "../middleware/auth";
import { ErrorResponse } from "../utils/errorResponse";
import { generateOTP, getOTPExpiry, isOTPValid } from "../utils/otp";

// Step 1: Register - Send OTP to mobile number
export const registerUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { mobileNo, username } = req.body;

    if (!mobileNo || !username) {
      throw new ErrorResponse("Mobile number and username are required", 400);
    }

    // Validate mobile number format (basic validation)
    if (!/^\d{10}$/.test(mobileNo)) {
      throw new ErrorResponse("Mobile number must be 10 digits", 400);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ mobileNo }, { username }],
      },
    });

    if (existingUser) {
      throw new ErrorResponse("User with this mobile number or username already exists", 400);
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();

    // Create user with OTP
    const user = await prisma.user.create({
      data: {
        mobileNo,
        username,
        otp,
        otpExpiry,
        isVerified: false,
      },
    });

    // TODO: Send OTP via SMS service here
    console.log(`OTP for ${mobileNo}: ${otp}`); // For testing purposes

    return res.status(201).json({
      success: true,
      message: "OTP sent to your mobile number",
      data: {
        userId: user.id,
        mobileNo: user.mobileNo,
        username: user.username,
        // In development, you can return OTP for testing
        otp: process.env.NODE_ENV === "development" ? otp : undefined,
      },
    });
  } catch (error) {
    return next(
      error instanceof ErrorResponse ? error : new ErrorResponse((error as any).message, 500)
    );
  }
};

// Step 2: Verify OTP for registration
export const verifyRegistrationOTP = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      throw new ErrorResponse("User ID and OTP are required", 400);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ErrorResponse("User not found", 404);
    }

    // Check if OTP is valid
    if (!isOTPValid(user.otp, user.otpExpiry)) {
      throw new ErrorResponse("OTP has expired or is invalid", 401);
    }

    // Verify OTP
    if (user.otp !== otp) {
      throw new ErrorResponse("Invalid OTP", 401);
    }

    // Update user as verified
    const verifiedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isVerified: true,
        otp: null,
        otpExpiry: null,
      },
    });

    // Generate JWT token
    const token = generateToken(verifiedUser.id, verifiedUser.mobileNo, verifiedUser.username);

    return res.status(200).json({
      success: true,
      message: "Registration completed successfully",
      data: {
        token,
        user: {
          id: verifiedUser.id,
          mobileNo: verifiedUser.mobileNo,
          username: verifiedUser.username,
        },
      },
    });
  } catch (error) {
    return next(
      error instanceof ErrorResponse ? error : new ErrorResponse((error as any).message, 500)
    );
  }
};

// Step 1: Login - Send OTP to mobile number
export const loginUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { mobileNo } = req.body;

    if (!mobileNo) {
      throw new ErrorResponse("Mobile number is required", 400);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { mobileNo },
    });

    if (!user) {
      throw new ErrorResponse("User not found", 404);
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();

    // Update user with OTP
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        otp,
        otpExpiry,
      },
    });

    // TODO: Send OTP via SMS service here
    console.log(`OTP for ${mobileNo}: ${otp}`); // For testing purposes

    return res.status(200).json({
      success: true,
      message: "OTP sent to your mobile number",
      data: {
        userId: updatedUser.id,
        mobileNo: updatedUser.mobileNo,
        username: updatedUser.username,
        // In development, you can return OTP for testing
        otp: process.env.NODE_ENV === "development" ? otp : undefined,
      },
    });
  } catch (error) {
    return next(
      error instanceof ErrorResponse ? error : new ErrorResponse((error as any).message, 500)
    );
  }
};

// Step 2: Verify OTP for login
export const verifyLoginOTP = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      throw new ErrorResponse("User ID and OTP are required", 400);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ErrorResponse("User not found", 404);
    }

    // Check if OTP is valid
    if (!isOTPValid(user.otp, user.otpExpiry)) {
      throw new ErrorResponse("OTP has expired or is invalid", 401);
    }

    // Verify OTP
    if (user.otp !== otp) {
      throw new ErrorResponse("Invalid OTP", 401);
    }

    // Clear OTP
    const loginUser = await prisma.user.update({
      where: { id: userId },
      data: {
        otp: null,
        otpExpiry: null,
      },
    });

    // Generate JWT token
    const token = generateToken(loginUser.id, loginUser.mobileNo, loginUser.username);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: loginUser.id,
          mobileNo: loginUser.mobileNo,
          username: loginUser.username,
        },
      },
    });
  } catch (error) {
    return next(
      error instanceof ErrorResponse ? error : new ErrorResponse((error as any).message, 500)
    );
  }
};

// Get user profile
export const getUserProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        mobileNo: true,
        username: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new ErrorResponse("User not found", 404);
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return next(
      error instanceof ErrorResponse ? error : new ErrorResponse((error as any).message, 500)
    );
  }
};
