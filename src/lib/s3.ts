/**
 * S3 Service Layer for efficient video streaming
 * Features: Presigned URLs, metadata caching, range request support
 */

import {
  S3Client,
  GetObjectCommand,
  HeadObjectCommand,
  HeadObjectCommandOutput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";

interface S3VideoMetadata {
  size: number;
  contentType: string;
  lastModified?: Date;
  eTag?: string;
}

interface StreamOptions {
  start?: number;
  end?: number;
}

// In-memory cache for S3 metadata (can be replaced with Redis)
const metadataCache = new Map<string, { data: S3VideoMetadata; timestamp: number }>();
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

/**
 * Extract S3 key from full URL or key
 */
const normalizeS3Key = (fileUrl: string): string => {
  // If it's a full S3 URL, extract the key
  if (fileUrl.includes("s3")) {
    const parts = fileUrl.split(".com/");
    return parts[1] || fileUrl;
  }
  return fileUrl;
};

/**
 * Get video metadata with caching
 * Minimizes S3 HeadObject calls which can cause latency
 */
export const getVideoMetadata = async (
  fileUrl: string
): Promise<S3VideoMetadata> => {
  const cacheKey = `s3-meta:${fileUrl}`;

  // Check cache first
  const cached = metadataCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const key = normalizeS3Key(fileUrl);
    const bucket = process.env.AWS_S3_BUCKET || "";

    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await s3Client.send(command);

    const metadata: S3VideoMetadata = {
      size: response.ContentLength || 0,
      contentType: response.ContentType || "video/mp4",
      lastModified: response.LastModified,
      eTag: response.ETag,
    };

    // Cache the metadata
    metadataCache.set(cacheKey, {
      data: metadata,
      timestamp: Date.now(),
    });

    return metadata;
  } catch (error) {
    throw new Error(
      `Failed to get S3 metadata: ${(error as any).message || "Unknown error"}`
    );
  }
};

/**
 * Stream video chunk from S3 with range support
 * Supports Range header for efficient partial content delivery
 */
export const getVideoStream = async (
  fileUrl: string,
  options?: StreamOptions
): Promise<Readable> => {
  try {
    const key = normalizeS3Key(fileUrl);
    const bucket = process.env.AWS_S3_BUCKET || "";

    // Build Range parameter for S3 GetObject
    let rangeParam: string | undefined;
    if (options?.start !== undefined && options?.end !== undefined) {
      rangeParam = `bytes=${options.start}-${options.end}`;
    }

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ...(rangeParam && { Range: rangeParam }),
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      throw new Error("No body in S3 response");
    }

    // Convert S3 response to Node.js Readable stream
    return response.Body as Readable;
  } catch (error) {
    throw new Error(
      `Failed to get video stream: ${(error as any).message || "Unknown error"}`
    );
  }
};

/**
 * Generate presigned URL for direct client access
 * Useful for reducing server load and enabling CDN caching
 */
export const generatePresignedUrl = async (
  fileUrl: string,
  expirationSeconds: number = 3600
): Promise<string> => {
  try {
    const key = normalizeS3Key(fileUrl);
    const bucket = process.env.AWS_S3_BUCKET || "";

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: expirationSeconds,
    });

    return presignedUrl;
  } catch (error) {
    throw new Error(
      `Failed to generate presigned URL: ${(error as any).message || "Unknown error"}`
    );
  }
};

/**
 * Clear metadata cache (for manual invalidation if needed)
 */
export const clearMetadataCache = (fileUrl?: string): void => {
  if (fileUrl) {
    const cacheKey = `s3-meta:${fileUrl}`;
    metadataCache.delete(cacheKey);
  } else {
    metadataCache.clear();
  }
};

/**
 * Get cache stats for monitoring
 */
export const getCacheStats = () => {
  return {
    size: metadataCache.size,
    keys: Array.from(metadataCache.keys()),
  };
};

export default {
  getVideoMetadata,
  getVideoStream,
  generatePresignedUrl,
  clearMetadataCache,
  getCacheStats,
};
