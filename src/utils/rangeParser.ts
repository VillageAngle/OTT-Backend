/**
 * Range Request Parser
 * Parses HTTP Range header for efficient video streaming
 * Supports formats: bytes=0-1023, bytes=1024-, bytes=-1024
 */

export interface ParsedRange {
  start: number;
  end: number;
  isValid: boolean;
  error?: string;
}

/**
 * Parse Range header and validate against total file size
 * @param rangeHeader - HTTP Range header value (e.g., "bytes=0-1023")
 * @param totalSize - Total file size in bytes
 * @returns Parsed range with start and end positions
 */
export const parseRangeHeader = (
  rangeHeader: string | undefined,
  totalSize: number
): ParsedRange => {
  // If no range header, request full content
  if (!rangeHeader || !rangeHeader.startsWith("bytes=")) {
    return {
      start: 0,
      end: totalSize - 1,
      isValid: true,
    };
  }

  const rangeValue = rangeHeader.replace("bytes=", "").trim();
  const rangeParts = rangeValue.split("-");

  if (rangeParts.length !== 2) {
    return {
      start: 0,
      end: totalSize - 1,
      isValid: false,
      error: "Invalid range format",
    };
  }

  const [startStr, endStr] = rangeParts;

  try {
    let start: number;
    let end: number;

    // Handle: bytes=1024-2047 (standard range)
    if (startStr && endStr) {
      start = parseInt(startStr, 10);
      end = parseInt(endStr, 10);

      if (isNaN(start) || isNaN(end) || start > end) {
        return {
          start: 0,
          end: totalSize - 1,
          isValid: false,
          error: "Invalid range values",
        };
      }
    }
    // Handle: bytes=1024- (from position to end)
    else if (startStr && !endStr) {
      start = parseInt(startStr, 10);
      end = totalSize - 1;

      if (isNaN(start)) {
        return {
          start: 0,
          end: totalSize - 1,
          isValid: false,
          error: "Invalid start position",
        };
      }
    }
    // Handle: bytes=-1024 (last N bytes)
    else if (!startStr && endStr) {
      const suffixLength = parseInt(endStr, 10);
      if (isNaN(suffixLength)) {
        return {
          start: 0,
          end: totalSize - 1,
          isValid: false,
          error: "Invalid suffix length",
        };
      }
      start = Math.max(0, totalSize - suffixLength);
      end = totalSize - 1;
    } else {
      return {
        start: 0,
        end: totalSize - 1,
        isValid: false,
        error: "Invalid range format",
      };
    }

    // Validate ranges
    if (start < 0 || end >= totalSize || start > end) {
      return {
        start: 0,
        end: totalSize - 1,
        isValid: false,
        error: "Range out of bounds",
      };
    }

    return {
      start,
      end,
      isValid: true,
    };
  } catch (error) {
    return {
      start: 0,
      end: totalSize - 1,
      isValid: false,
      error: "Error parsing range header",
    };
  }
};

/**
 * Generate Content-Range header value
 * @param start - Start byte position
 * @param end - End byte position
 * @param totalSize - Total file size
 * @returns Content-Range header value
 */
export const generateContentRangeHeader = (
  start: number,
  end: number,
  totalSize: number
): string => {
  return `bytes ${start}-${end}/${totalSize}`;
};

/**
 * Calculate chunk size based on available data
 * @param start - Start position
 * @param end - End position
 * @returns Chunk size in bytes
 */
export const calculateChunkSize = (start: number, end: number): number => {
  return end - start + 1;
};
