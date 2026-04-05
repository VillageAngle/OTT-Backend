import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    mobileNo: string;
    username: string;
  };
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

// Utility function to generate JWT token
export const generateToken = (userId: string, mobileNo: string, username: string): string => {
  return jwt.sign({ id: userId, mobileNo, username }, JWT_SECRET, { expiresIn: "24h" });
};
