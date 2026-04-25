# Postman Collection - Testing Guide

## Overview

The updated Postman collection includes a new **"Video Streaming (Chunked)"** section with comprehensive tests for the new video streaming endpoints.

## Video Streaming Endpoints

### 1. **Stream Full Video**
```
GET /api/video-stream/:id/stream
```
**Description**: Stream entire video file. Browser automatically handles Range requests for seeking.

**Use Case**: Play full video without Range header. Useful for baseline testing.

**Expected Response**:
- Status: `200 OK`
- Headers: `Accept-Ranges: bytes`
- Body: Full video file stream

---

### 2. **Stream Video - First 1MB (Range Request)**
```
GET /api/video-stream/:id/stream
Header: Range: bytes=0-1048575
```
**Description**: Request first 1MB of video using Range header.

**Use Case**: Test Range request support and partial content delivery.

**Expected Response**:
- Status: `206 Partial Content`
- Header: `Content-Range: bytes 0-1048575/TOTAL_SIZE`
- Body: First 1MB of video

**Why it matters**: Tests that server correctly supports Range headers.

---

### 3. **Stream Video - From Middle (1MB offset)**
```
GET /api/video-stream/:id/stream
Header: Range: bytes=1048576-
```
**Description**: Resume streaming from byte position 1MB onwards.

**Use Case**: Test seeking to middle of video, simulating pause/resume scenarios.

**Expected Response**:
- Status: `206 Partial Content`
- Header: `Content-Range: bytes 1048576-TOTAL_SIZE/TOTAL_SIZE`
- Body: Video from 1MB to end

**Why it matters**: Tests seeking capability and reconnection support.

---

### 4. **Stream Video - Last 1MB (Seek to End)**
```
GET /api/video-stream/:id/stream
Header: Range: bytes=-1048576
```
**Description**: Request last 1MB of video (without knowing total size).

**Use Case**: Test suffix-range functionality, useful for previewing video ending.

**Expected Response**:
- Status: `206 Partial Content`
- Header: `Content-Range: bytes <START>-TOTAL_SIZE/TOTAL_SIZE`
- Body: Last 1MB of video

**Why it matters**: Tests all Range request variants including suffix format.

---

### 5. **Stream Video - Custom Range (2-5MB)**
```
GET /api/video-stream/:id/stream
Header: Range: bytes=2097152-5242879
```
**Description**: Stream specific byte range (example: 2MB to 5MB).

**Use Case**: Test arbitrary range selection, flexible seeking.

**Expected Response**:
- Status: `206 Partial Content`
- Header: `Content-Range: bytes 2097152-5242879/TOTAL_SIZE`
- Body: 3MB of video data

**Why it matters**: Tests flexibility of Range requests for any byte range.

---

### 6. **Get Stream Info (Metadata)**
```
GET /api/video-stream/:id/stream-info
```
**Description**: Get video metadata without downloading video.

**Use Case**: Before playing, fetch streaming capabilities, file size, adaptive chunk size based on client network speed.

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "video": {
      "id": "...",
      "title": "...",
      "duration": 3600,
      ...
    },
    "streaming": {
      "fileSize": 104857600,
      "contentType": "video/mp4",
      "adaptiveChunkSize": 262144,
      "supportRange": true,
      "maxConcurrentStreams": 3,
      "estimatedBandwidth": 625000
    }
  }
}
```

**Key Info**:
- `fileSize`: Total video size in bytes
- `adaptiveChunkSize`: Recommended chunk size based on detected network speed
- `estimatedBandwidth`: Estimated bandwidth in bytes/sec (for your connection)

**Why it matters**: 
- Tells frontend how many bytes to request per chunk
- Helps estimate buffering time
- Indicates server's streaming capabilities

---

### 7. **Streaming Service Health Check**
```
GET /api/video-stream/health/status
```
**Description**: Check streaming service health and active metrics.

**Use Case**: Monitor server load, verify streaming service is running, check active concurrent streams.

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "activeStreams": 12,
    "timestamp": "2026-04-25T10:30:00Z",
    "config": {
      "defaultChunkSize": 262144,
      "maxChunkSize": 1048576,
      "socketTimeout": 60000
    }
  }
}
```

**Why it matters**: 
- Verify server is responsive
- Track concurrent stream usage
- Monitor for performance issues

---

## How to Use in Postman

### Setup Variables

1. **Import Collection**
   - Download `OTT-API-Collection.postman_collection.json`
   - Open Postman → Import → Select file

2. **Set Variables**
   - Click "Variables" tab in collection
   - Set `base_url`: `http://localhost:3000` (or your server)
   - Set `video_id`: Use actual video ID from your database

3. **Get Video ID**
   ```bash
   # From database
   psql postgresql://user:pass@localhost:5432/ott_db
   SELECT id FROM "Video" LIMIT 1;
   
   # Set in Postman Variables
   video_id = cj4v5x8z9a2b1c3d4e
   ```

### Test Each Endpoint

1. **Start with Health Check**
   - Click "Streaming Service Health Check"
   - Send request → Verify service is running

2. **Get Stream Info**
   - Click "Get Stream Info (Metadata)"
   - Send request → Note file size, adaptive chunk size

3. **Test Full Stream**
   - Click "Stream Full Video"
   - Send request → File download in footer

4. **Test Range Requests** (in order)
   - "First 1MB" → Verify 206 response
   - "From Middle" → Verify it resumes correctly
   - "Last 1MB" → Verify seeking to end works
   - "Custom Range" → Verify arbitrary ranges work

### Monitor Network Activity

In Postman, for each request:
1. Go to "Response" tab
2. Check Status Code
3. Look at Headers (especially `Content-Range`, `Accept-Ranges`)
4. See Body (actual video bytes)

Expected pattern:
```
Request 1: Range: bytes=0-1048575
Response:  206 Partial Content
           Content-Range: bytes 0-1048575/104857600

Request 2: Range: bytes=1048576-
Response:  206 Partial Content
           Content-Range: bytes 1048576-104857599/104857600
```

---

## Testing Scenarios

### Scenario 1: Full Video Playback
1. Get Stream Info
2. Stream Full Video
3. Verify no jitter, smooth playback

### Scenario 2: Seeking
1. Get Stream Info (note file size)
2. Stream from specific position (use Range header)
3. Verify instant seek

### Scenario 3: Resume After Connection Drop
1. Start streaming (e.g., bytes 0-1MB)
2. Calculate last byte received
3. Resume from next byte position
4. Verify seamless resume

### Scenario 4: Multiple Concurrent Streams
1. Open 3 tabs in Postman
2. Let each stream a different Range
3. Check Health Status endpoint
4. Verify `activeStreams: 3`

### Scenario 5: Load Testing (Multiple Requests)
```bash
# Terminal: Send 10 concurrent requests
for i in {1..10}; do
  curl -H "Range: bytes=0-1048575" \
    http://localhost:3000/api/video-stream/VIDEO_ID/stream > /dev/null &
done

# Check health after
curl http://localhost:3000/api/video-stream/health/status
```

---

## Response Status Codes

| Code | Meaning | When It Happens |
|------|---------|-----------------|
| 200 OK | Full content returned | No Range header sent |
| 206 Partial Content | Partial content returned | Valid Range header sent |
| 400 Bad Request | Invalid Range format | Invalid Range syntax |
| 404 Not Found | Video not found | Video ID doesn't exist |
| 416 Range Not Satisfiable | Range out of bounds | Requested range > file size |
| 429 Too Many Requests | Too many concurrent streams | User has 3+ concurrent streams |
| 500 Server Error | Server error | AWS S3 or other error |

---

## Important Headers to Check

### Request Headers
```
Range: bytes=START-END
  Example: Range: bytes=0-1048575
```

### Response Headers (206 responses)
```
HTTP/1.1 206 Partial Content
Content-Type: video/mp4
Content-Length: 262144
Content-Range: bytes 0-262143/104857600
Accept-Ranges: bytes
```

### Response Headers (200 responses)
```
HTTP/1.1 200 OK
Content-Type: video/mp4
Content-Length: 104857600
Accept-Ranges: bytes
```

---

## Troubleshooting

### Issue: "206 responses not working"
**Check**:
1. Are you sending Range header?
2. Is Range format correct? (bytes=START-END)
3. Are START and END within file size?

**Fix**:
```
✓ Correct:   Range: bytes=0-1048575
✗ Wrong:     Range: 0-1048575
✗ Wrong:     Range: bytes 0 to 1048575
```

### Issue: "404 Not Found"
**Check**:
1. Is `video_id` variable set correctly?
2. Does video exist in database?
3. Does video have fileUrl in S3?

**Fix**:
```bash
# Verify video exists
psql postgresql://user:pass@localhost:5432/ott_db
SELECT id, fileUrl FROM "Video" WHERE id = 'VIDEO_ID';
```

### Issue: "429 Too Many Requests"
**Means**: You have 3+ concurrent streams open

**Fix**: Close other streams or increase `MAX_CONCURRENT_STREAMS` in config

### Issue: "Slow responses"
**Check**:
1. Server running locally or remote?
2. Network latency to S3?
3. S3 bucket in correct region?

**Optimize**:
- Use local S3 mock (LocalStack) for testing
- Or use CloudFront CDN for production

---

## Best Practices

✅ **DO:**
- Always call "Stream Info" first to understand capabilities
- Check "Health Status" before heavy testing
- Use Range headers for seeking tests
- Monitor Response headers

❌ **DON'T:**
- Send multiple Range requests without setting video_id
- Leave streams hanging (Postman times out after 60s)
- Request ranges larger than file size
- Ignore error responses

---

## Performance Testing

### Test Adaptive Buffering
```
1. Set up request with Range: bytes=0-262144 (256KB chunk)
2. Monitor response time
3. Repeat with different ranges
4. Verify response time is consistent (~100-200ms)
```

### Test Concurrency
```
1. Get Health Status → activeStreams: 0
2. Start 5 concurrent stream requests
3. Quickly check Health Status
4. Should show activeStreams: 5
5. Let requests complete
6. Check again → activeStreams: 0
```

### Test Large File Seeking
```
1. Get info for 2GB video file
2. Request last 1MB: Range: bytes=-1048576
3. Should be instant (< 100ms)
4. Request middle: Range: bytes=1073741824-
5. Should also be instant
```

---

## Example Test Flow

```
1. Health Check
   ✓ Service running

2. Stream Info
   ✓ File size: 500MB
   ✓ Adaptive chunk: 262KB
   ✓ Bandwidth: 625KB/sec

3. Stream First 1MB
   ✓ 206 response
   ✓ Content-Range header present

4. Stream from 100MB
   ✓ 206 response
   ✓ Seeks instantly

5. Stream Last 1MB
   ✓ 206 response
   ✓ Works without knowing file size

Result: ✅ Streaming fully functional!
```

---

## Additional Notes

- All times are measured in milliseconds
- Byte ranges are 0-indexed
- Content-Range header shows inclusive ranges
- Browser automatically handles Range for `<video>` element
- Metadata is cached for 1 hour server-side

---

**Last Updated**: 25 April 2026
**Collection Version**: 2.0 (with Video Streaming)
