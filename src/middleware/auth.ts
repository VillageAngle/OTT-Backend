import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const OTP_JWT_SECRET = process.env.OTP_JWT_SECRET || "your-otp-secret-key-change-in-production";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    mobileNo: string;
    username: string;
  };
}

export interface OTPTokenPayload {
  userId: string;
  mobileNo: string;
  otp: string;
  type: "registration" | "login";
}

// Middleware to verify JWT token
export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Utility function to generate authentication JWT token
export const generateToken = (userId: string, mobileNo: string, username: string): string => {
  return jwt.sign({ id: userId, mobileNo, username }, JWT_SECRET, { expiresIn: "24h" });
};

// Generate OTP JWT token (5 minutes expiry)
export const generateOTPToken = (userId: string, mobileNo: string, otp: string, type: "registration" | "login"): string => {
  return jwt.sign(
    { userId, mobileNo, otp, type },
    OTP_JWT_SECRET,
    { expiresIn: "5m" }
  );
};

// Verify OTP JWT token and extract payload
export const verifyOTPToken = (token: string): OTPTokenPayload | null => {
  try {
    const decoded = jwt.verify(token, OTP_JWT_SECRET) as OTPTokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

