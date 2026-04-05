import { Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/db";
import { generateToken, AuthRequest } from "../middleware/auth";
import { ErrorResponse } from "../utils/errorResponse";

// Register a new user
export const registerUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      throw new ErrorResponse("Email, username, and password are required", 400);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      throw new ErrorResponse("User with this email or username already exists", 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
    });

    // Generate JWT token
    const token = generateToken(user.id, user.email, user.username);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      },
    });
  } catch (error) {
    return next(
      error instanceof ErrorResponse ? error : new ErrorResponse((error as any).message, 500)
    );
  }
};

// Login user
export const loginUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ErrorResponse("Email and password are required", 400);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new ErrorResponse("Invalid credentials", 401);
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new ErrorResponse("Invalid credentials", 401);
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email, user.username);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
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
        email: true,
        username: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "User profile retrieved successfully",
      data: user,
    });
  } catch (error) {
    return next(
      error instanceof ErrorResponse ? error : new ErrorResponse((error as any).message, 500)
    );
  }
};
