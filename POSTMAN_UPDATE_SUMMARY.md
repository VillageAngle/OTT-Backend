# Postman Collection Update - Summary

## What Was Added

Updated the OTT Platform API Postman collection with a complete **"Video Streaming (Chunked)"** section for testing the new HTTP Range-based video streaming implementation.

## New Section: Video Streaming (Chunked)

### 7 New Test Requests

1. **Stream Full Video**
   - Simple GET request for full video
   - No Range header
   - Tests baseline video streaming

2. **Stream Video - First 1MB (Range Request)**
   - Demonstrates Range header usage
   - Gets first 1MB using `bytes=0-1048575`
   - Server responds with 206 Partial Content

3. **Stream Video - From Middle (1MB offset)**
   - Simulates seeking/resume from position
   - Range header: `bytes=1048576-`
   - Tests resume capability

4. **Stream Video - Last 1MB (Seek to End)**
   - Gets last 1MB without knowing file size
   - Range header: `bytes=-1048576`
   - Tests suffix-range format

5. **Stream Video - Custom Range (2-5MB)**
   - Arbitrary range selection
   - Range header: `bytes=2097152-5242879`
   - Tests flexible seeking

6. **Get Stream Info (Metadata)**
   - Fetches video metadata without download
   - Shows file size, adaptive chunk size, bandwidth estimate
   - Tests metadata endpoint

7. **Streaming Service Health Check**
   - Monitors streaming service status
   - Shows active concurrent streams
   - Displays configuration

## How to Use

### Step 1: Import Updated Collection
```
1. Download OTT-API-Collection.postman_collection.json
2. Open Postman
3. Click "Import"
4. Select the JSON file
5. Confirm import
```

### Step 2: Set Variables
```
1. Click "Variables" tab in collection
2. Set base_url = http://localhost:3000
3. Set video_id = YOUR_VIDEO_ID (from database)
```

### Step 3: Test Requests
```
1. Expand "Video Streaming (Chunked)" section
2. Click any request
3. Click "Send"
4. Review response in "Response" tab
```

## Testing Guide

### Quick Test Flow
```
1. Run "Streaming Service Health Check"
   → Verify service is running

2. Run "Get Stream Info (Metadata)"
   → Check file size and adaptive chunk size

3. Run "Stream Full Video"
   → Verify basic streaming works

4. Run "Stream Video - First 1MB (Range Request)"
   → Verify 206 Partial Content response

5. Run "Stream Video - From Middle (1MB offset)"
   → Verify seeking/resume works

6. Run "Stream Video - Last 1MB"
   → Verify seeking to end works

7. Run "Stream Video - Custom Range"
   → Verify arbitrary ranges work

Result: ✅ All streaming features working!
```

## Expected Responses

### Full Video (200 OK)
```
Status: 200 OK
Accept-Ranges: bytes
Content-Length: 104857600
```

### Range Request (206 Partial Content)
```
Status: 206 Partial Content
Content-Range: bytes 0-1048575/104857600
Content-Length: 1048576
Accept-Ranges: bytes
```

### Stream Info
```json
{
  "success": true,
  "data": {
    "video": {
      "id": "...",
      "title": "...",
      "duration": 3600
    },
    "streaming": {
      "fileSize": 104857600,
      "contentType": "video/mp4",
      "adaptiveChunkSize": 262144,
      "supportRange": true
    }
  }
}
```

### Health Check
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "activeStreams": 5,
    "timestamp": "2026-04-25T10:30:00Z"
  }
}
```

## Key Features of Updated Collection

✅ **Pre-configured Headers**
- Range headers ready to use
- Proper content-type headers

✅ **Variable Support**
- Auto-substitutes {{video_id}}
- Auto-substitutes {{base_url}}

✅ **Detailed Descriptions**
- Each request explains what it does
- Why each test matters
- Expected responses

✅ **Multiple Test Scenarios**
- Full streaming
- Range requests
- Seeking
- Resume capability
- Metadata fetching
- Health monitoring

## Testing Different Scenarios

### Scenario 1: Full Video Playback
```
Send: GET /api/video-stream/VIDEO_ID/stream
      (no Range header)

Expect: 200 OK response with full video
```

### Scenario 2: Seek to Middle
```
Send: GET /api/video-stream/VIDEO_ID/stream
      Range: bytes=50000000-

Expect: 206 Partial Content from position 50MB
```

### Scenario 3: Jump to End
```
Send: GET /api/video-stream/VIDEO_ID/stream
      Range: bytes=-1000000

Expect: Last 1MB of video with 206 response
```

### Scenario 4: Check Service Health
```
Send: GET /api/video-stream/health/status

Expect: Service status and active stream count
```

## Postman Response Inspection

For each request, inspect:

1. **Status Code**
   - 200 = Full content
   - 206 = Partial content
   - 404 = Video not found
   - 416 = Range invalid

2. **Response Headers**
   - Content-Range (for 206 responses)
   - Accept-Ranges
   - Content-Length
   - Content-Type

3. **Response Body**
   - Video bytes (for stream requests)
   - JSON (for metadata/health requests)

4. **Response Time**
   - Should be <200ms for local testing
   - Indicates server performance

## Troubleshooting

**"404 Not Found"**
- Verify video_id is set correctly
- Check video exists in database

**"No Range header sent"**
- Click on request
- Add manually if missing:
  - Header key: Range
  - Header value: bytes=0-1048575

**"Response is huge"**
- Range requests return byte ranges
- Full video streams entire file
- Use Range header to limit size

**"206 not showing"**
- Send request WITH Range header
- Check request headers in Postman
- Verify header format is correct

## File Changes

**Modified Files:**
- ✅ `OTT-API-Collection.postman_collection.json` - Added Video Streaming section

**New Documentation:**
- ✅ `POSTMAN_TESTING_GUIDE.md` - Comprehensive testing guide

## Connection to Code

**Postman Requests** ↔ **Backend Endpoints**

```
Stream Full Video                 → GET /api/video-stream/:id/stream
Stream Video - First 1MB          → GET /api/video-stream/:id/stream (with Range)
Stream Video - From Middle        → GET /api/video-stream/:id/stream (with Range)
Stream Video - Last 1MB           → GET /api/video-stream/:id/stream (with Range)
Stream Video - Custom Range       → GET /api/video-stream/:id/stream (with Range)
Get Stream Info (Metadata)        → GET /api/video-stream/:id/stream-info
Streaming Service Health Check    → GET /api/video-stream/health/status
```

## Next Steps

1. **Import the collection** into Postman
2. **Set your video_id** in variables
3. **Run through test scenarios** in order
4. **Check Network tab** in DevTools for HTTP details
5. **Monitor response headers** for Range support
6. **Verify adaptive buffering** with different ranges

## Collection Version

- **Version**: 2.0
- **Updated**: 25 April 2026
- **New Requests**: 7
- **Total Requests**: 30+

---

For detailed testing instructions, see **POSTMAN_TESTING_GUIDE.md**
