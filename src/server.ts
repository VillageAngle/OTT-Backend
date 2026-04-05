import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { prisma } from "./lib/db";
import { errorHandler } from "./middleware/errorHandler";

// Import routes
import userRoutes from "./routes/users";
import channelsRoutes from "./routes/channels";
import videosRoutes from "./routes/videos";
import liveStreamsRoutes from "./routes/livestreams";
import watchHistoryRoutes from "./routes/watchHistory";
import streamTokensRoutes from "./routes/streamTokens";

dotenv.config({
  path: "./.env",
});

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "healthy", timestamp: new Date() });
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/channels", channelsRoutes);
app.use("/api/videos", videosRoutes);
app.use("/api/live-streams", liveStreamsRoutes);
app.use("/api/watch-history", watchHistoryRoutes);
app.use("/api/stream-tokens", streamTokensRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log("Available endpoints:");
  console.log("  GET  /health");
  console.log("  POST /api/users/register");
  console.log("  POST /api/users/login");
  console.log("  GET  /api/users/profile (protected)");
  console.log("  GET  /api/channels");
  console.log("  POST /api/channels (protected)");
  console.log("  GET  /api/videos/:id");
  console.log("  POST /api/videos (protected)");
  console.log("  GET  /api/live-streams");
  console.log("  POST /api/live-streams (protected)");
  console.log("  GET  /api/watch-history (protected)");
  console.log("  GET  /api/stream-tokens/verify");
  console.log("  POST /api/stream-tokens/video/:videoId (protected)");
});
