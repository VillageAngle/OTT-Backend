# OTT Backend Testing Plan

## Overview
This document outlines the comprehensive testing strategy for the OTT (Over-The-Top) streaming platform backend API.

**Server URL**: `http://localhost:3000`  
**Base API Path**: `/api`

---

## Testing Checklist

### 1. Health Check
- [ ] Server is running on port 3000
- [ ] Health endpoint responds with 200 OK

**Endpoint**: `GET /health`

---

## 2. User Authentication Testing

### 2.1 User Registration
- [ ] Register new user with valid email, username, and password
- [ ] Handle duplicate email error
- [ ] Handle duplicate username error
- [ ] Validate required fields (email, username, password)
- [ ] Password hashing verification

**Endpoint**: `POST /api/users/register`

**Request Body**:
```json
{
  "email": "user@example.com",
  "username": "testuser",
  "password": "SecurePassword123"
}
```

### 2.2 User Login
- [ ] Login with valid credentials
- [ ] Login with invalid email
- [ ] Login with invalid password
- [ ] Verify JWT token generation
- [ ] Verify token format and expiration

**Endpoint**: `POST /api/users/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

### 2.3 Get User Profile
- [ ] Retrieve authenticated user profile
- [ ] Test without authentication token (should fail)
- [ ] Test with invalid/expired token
- [ ] Verify profile data matches registered user

**Endpoint**: `GET /api/users/profile`

**Headers Required**:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 3. Channel Management Testing

### 3.1 Create Channel
- [ ] Create channel with valid data (name, description, bannerUrl)
- [ ] Verify channel creation requires authentication
- [ ] Verify ChannelAnalytics record is auto-created
- [ ] Check channel ID generation
- [ ] Validate required fields

**Endpoint**: `POST /api/channels`

**Request Body**:
```json
{
  "name": "My Awesome Channel",
  "description": "Channel description",
  "bannerUrl": "https://example.com/banner.jpg"
}
```

### 3.2 Get All Channels
- [ ] Retrieve all channels (public endpoint)
- [ ] Verify pagination works
- [ ] Verify analytics and video counts are included
- [ ] Test with different limit values

**Endpoint**: `GET /api/channels`

**Query Parameters**: `?limit=10&page=1`

### 3.3 Get Channel by ID
- [ ] Retrieve specific channel with videos and live streams
- [ ] Test with non-existent channel ID
- [ ] Verify related videos and streams are included

**Endpoint**: `GET /api/channels/:id`

### 3.4 Update Channel
- [ ] Update channel name, description, and banner
- [ ] Verify authorization (owner only)
- [ ] Update individual fields
- [ ] Validate no unauthorized users can update

**Endpoint**: `PUT /api/channels/:id`

**Request Body**:
```json
{
  "name": "Updated Channel Name",
  "description": "Updated description",
  "bannerUrl": "https://example.com/new-banner.jpg"
}
```

### 3.5 Delete Channel
- [ ] Delete channel (should cascade delete videos and streams)
- [ ] Verify authorization
- [ ] Verify from database that related records are deleted
- [ ] Test with non-existent channel

**Endpoint**: `DELETE /api/channels/:id`

---

## 4. Video Management Testing

### 4.1 Create Video
- [ ] Create video with valid channel ID
- [ ] Verify video requires authentication
- [ ] Test with non-existent channel ID
- [ ] Verify status is set to ACTIVE
- [ ] Check duration, fileUrl, and metadata

**Endpoint**: `POST /api/videos`

**Request Body**:
```json
{
  "channelId": "channel-id-here",
  "title": "Video Title",
  "duration": 3600,
  "fileUrl": "https://cdn.example.com/video.mp4"
}
```

### 4.2 Get Videos by Channel
- [ ] Retrieve all videos from a channel
- [ ] Test pagination
- [ ] Test with non-existent channel

**Endpoint**: `GET /api/videos/channel/:channelId`

**Query Parameters**: `?limit=10&page=1`

### 4.3 Get Video by ID
- [ ] Retrieve video details
- [ ] Test with non-existent video ID
- [ ] Verify all fields are returned

**Endpoint**: `GET /api/videos/:id`

### 4.4 Get Video with Preview
- [ ] Test 2-minute preview for non-authenticated users
- [ ] Verify authenticated users can request full access
- [ ] Check preview duration logic (120 seconds)
- [ ] Test canWatchFull flag based on watch history

**Endpoint**: `GET /api/videos/:id/preview`

### 4.5 Update Video
- [ ] Update video title, duration, fileUrl, status
- [ ] Verify authorization (channel owner)
- [ ] Test status changes (ACTIVE, PROCESSING, ARCHIVED)

**Endpoint**: `PUT /api/videos/:id`

**Request Body**:
```json
{
  "title": "Updated Title",
  "duration": 3600,
  "fileUrl": "https://cdn.example.com/updated-video.mp4",
  "status": "ACTIVE"
}
```

### 4.6 Delete Video
- [ ] Delete video
- [ ] Verify authorization
- [ ] Verify cascading deletion of watch history

**Endpoint**: `DELETE /api/videos/:id`

---

## 4.7 Video Streaming with HTTP Range Requests
Chunked video streaming for smooth, lag-free playback with adaptive buffering.

### 4.7.1 Stream Full Video (No Range Header)
- [ ] GET request without Range header returns full video
- [ ] Response status is 200 OK
- [ ] Content-Type is video/mp4
- [ ] Accept-Ranges header is present
- [ ] Content-Length equals file size
- [ ] Video plays without stuttering

**Endpoint**: `GET /api/video-stream/:id/stream`

**Expected Response Headers**:
```
HTTP/1.1 200 OK
Content-Type: video/mp4
Content-Length: 104857600
Accept-Ranges: bytes
Cache-Control: public, max-age=86400
```

### 4.7.2 Stream Video with Range Header (First Chunk)
- [ ] GET request with Range header returns partial content
- [ ] Response status is 206 Partial Content
- [ ] Content-Range header shows byte range (e.g., bytes 0-262143/104857600)
- [ ] Content-Length matches requested range size
- [ ] Server returns exactly requested bytes
- [ ] Adaptive chunk size matches network speed

**Endpoint**: `GET /api/video-stream/:id/stream`

**Request Headers**:
```
Range: bytes=0-262143
```

**Expected Response Headers**:
```
HTTP/1.1 206 Partial Content
Content-Type: video/mp4
Content-Length: 262144
Content-Range: bytes 0-262143/104857600
Accept-Ranges: bytes
```

### 4.7.3 Stream Video - Resume from Middle (Seeking)
- [ ] GET request with Range for middle of video
- [ ] Response status is 206 Partial Content
- [ ] Seek time is < 100ms (instant)
- [ ] Content-Range shows correct offset
- [ ] Video plays smoothly from seek position
- [ ] No buffering delay

**Endpoint**: `GET /api/video-stream/:id/stream`

**Request Headers**:
```
Range: bytes=50000000-50262143
```

**Expected Response**:
- Status: 206 Partial Content
- Content-Range: bytes 50000000-50262143/104857600
- Seek latency: < 100ms

### 4.7.4 Stream Video - Last Chunk (Suffix-Range)
- [ ] GET request with suffix Range (bytes=-1048576)
- [ ] Gets last 1MB without knowing file size
- [ ] Response status is 206 Partial Content
- [ ] Content-Range calculated correctly
- [ ] Useful for testing seek-to-end functionality

**Endpoint**: `GET /api/video-stream/:id/stream`

**Request Headers**:
```
Range: bytes=-1048576
```

**Expected Response**:
- Status: 206 Partial Content
- Content-Range: bytes CALCULATED_START-TOTAL/TOTAL

### 4.7.5 Stream Video - Custom Range
- [ ] GET request with arbitrary byte range
- [ ] Server returns exact range requested
- [ ] Multiple sequential ranges work smoothly
- [ ] Backpressure prevents memory spikes
- [ ] No stuttering with rapid range requests

**Endpoint**: `GET /api/video-stream/:id/stream`

**Test Cases**:
```
Range: bytes=2097152-5242879      (2-5MB)
Range: bytes=10485760-            (from 10MB to end)
Range: bytes=0-262143             (first chunk)
Range: bytes=262144-524287        (second chunk)
```

### 4.7.6 Get Stream Info (Metadata Endpoint)
- [ ] GET request returns video metadata without downloading
- [ ] Response includes file size in bytes
- [ ] Response includes adaptive chunk size based on network
- [ ] Response includes estimated bandwidth
- [ ] Response includes streaming support flags
- [ ] Response time < 50ms (metadata cached)
- [ ] No video bytes transferred

**Endpoint**: `GET /api/video-stream/:id/stream-info`

**Expected Response**:
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
      "supportRange": true,
      "maxConcurrentStreams": 3,
      "estimatedBandwidth": 625000
    }
  }
}
```

### 4.7.7 Streaming Service Health Check
- [ ] GET request returns service status
- [ ] Shows number of active concurrent streams
- [ ] Shows streaming configuration
- [ ] Response time < 50ms
- [ ] Can be called frequently for monitoring

**Endpoint**: `GET /api/video-stream/health/status`

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

### 4.7.8 Invalid Range Handling
- [ ] Invalid Range format returns 400 Bad Request
- [ ] Range beyond file size returns 416 Range Not Satisfiable
- [ ] Negative ranges handled correctly
- [ ] Non-numeric ranges rejected
- [ ] Proper error messages in response

**Test Cases**:
```
Range: bytes=invalid              (malformed)
Range: bytes=0-999999999999       (beyond file size)
Range: invalid-format             (wrong format)
```

### 4.7.9 Rate Limiting - Max Concurrent Streams
- [ ] User can open up to 3 concurrent streams
- [ ] 4th concurrent stream returns 429 Too Many Requests
- [ ] Error message: "Too many concurrent streams"
- [ ] After stream closes, new stream allowed
- [ ] Prevents resource exhaustion

**Test**:
```
Open 3 streams simultaneously → All succeed
Open 4th stream → 429 error
Close one stream → New stream allowed
```

### 4.7.10 Adaptive Buffering Performance
- [ ] Desktop network (5 Mbps): chunk size ~625 KB
- [ ] Mobile network (2.5 Mbps): chunk size ~312 KB
- [ ] Fast network (10+ Mbps): chunk size ~1 MB
- [ ] No jitter or stuttering during playback
- [ ] Buffer maintained at ~1 second of video
- [ ] Smooth transitions between chunks

**Expected Behavior**:
- Network detected from User-Agent
- Chunk size calculated: bandwidth × 1 second
- Consistent response times per chunk
- No CPU spikes during streaming

---

## 5. Live Stream Management Testing

### 5.1 Create Live Stream
- [ ] Create live stream with valid channel ID
- [ ] Verify RTMP URL and key generation
- [ ] Verify status is set to OFFLINE
- [ ] Check viewerCount is initialized to 0
- [ ] Verify requires authentication

**Endpoint**: `POST /api/live-streams`

**Request Body**:
```json
{
  "channelId": "channel-id-here",
  "title": "Live Stream Title"
}
```

### 5.2 Get All Live Streams
- [ ] Retrieve all live streams (public)
- [ ] Test pagination
- [ ] Filter by status (OFFLINE, SCHEDULED, LIVE, ENDED)

**Endpoint**: `GET /api/live-streams`

**Query Parameters**: `?status=LIVE&limit=10&page=1`

### 5.3 Get Live Streams by Channel
- [ ] Retrieve live streams for specific channel
- [ ] Test pagination
- [ ] Verify viewer counts

**Endpoint**: `GET /api/live-streams/channel/:channelId`

### 5.4 Get Live Stream by ID
- [ ] Retrieve specific live stream details
- [ ] Verify RTMP URL and viewer count

**Endpoint**: `GET /api/live-streams/:id`

### 5.5 Update Live Stream Status
- [ ] Transition from OFFLINE → SCHEDULED
- [ ] Transition from SCHEDULED → LIVE
- [ ] Transition from LIVE → OFFLINE
- [ ] Update viewer count
- [ ] Verify authorization

**Endpoint**: `PUT /api/live-streams/:id/status`

**Request Body**:
```json
{
  "status": "LIVE",
  "viewerCount": 150
}
```

### 5.6 End Live Stream
- [ ] End active live stream
- [ ] Save recording URL for VOD conversion
- [ ] Verify status changes to ENDED
- [ ] Record endedAt timestamp

**Endpoint**: `POST /api/live-streams/:id/end`

**Request Body**:
```json
{
  "recordingUrl": "https://cdn.example.com/recording.mp4"
}
```

---

## 6. Watch History Testing

### 6.1 Update Watch History
- [ ] Record video viewing progress
- [ ] Calculate progress percentage
- [ ] Mark video as completed at 90% progress
- [ ] Upsert behavior (create if not exists, update if exists)

**Endpoint**: `PUT /api/watch-history/:videoId`

**Request Body**:
```json
{
  "currentTime": 1800
}
```

### 6.2 Get Watch History
- [ ] Retrieve all videos user has watched
- [ ] Test pagination
- [ ] Verify sorted by lastWatchedAt

**Endpoint**: `GET /api/watch-history`

**Query Parameters**: `?limit=10&page=1`

### 6.3 Get Continue Watching
- [ ] Retrieve incomplete videos (progress < 90%)
- [ ] Default limit should be 5
- [ ] Sorted by most recent
- [ ] Test pagination

**Endpoint**: `GET /api/watch-history/continue/watching`

**Query Parameters**: `?limit=5`

### 6.4 Get Completed Videos
- [ ] Retrieve completed videos (progress >= 90%)
- [ ] Test pagination
- [ ] Sorted by completion date

**Endpoint**: `GET /api/watch-history/completed`

**Query Parameters**: `?limit=10&page=1`

---

## 7. Stream Token Testing

### 7.1 Generate Video Token
- [ ] Generate 24-hour expiry token for video
- [ ] Create StreamToken record in database
- [ ] Verify token format and uniqueness
- [ ] Requires authentication

**Endpoint**: `POST /api/stream-tokens/video/:videoId`

### 7.2 Generate Live Stream Token
- [ ] Generate 1-hour expiry token for live stream
- [ ] Create StreamToken record
- [ ] Verify shorter expiry than video token
- [ ] Requires authentication

**Endpoint**: `POST /api/stream-tokens/live/:liveStreamId`

### 7.3 Verify Stream Token
- [ ] Verify valid token (returns success)
- [ ] Verify expired token (returns error)
- [ ] Verify non-existent token
- [ ] Check proper error handling

**Endpoint**: `GET /api/stream-tokens/verify`

**Query Parameters**: `?token=<token-value>`

### 7.4 Revoke Stream Token
- [ ] Revoke active token
- [ ] Verify revoked token cannot be used
- [ ] Requires authentication

**Endpoint**: `DELETE /api/stream-tokens/:token`

### 7.5 Get User Stream Tokens
- [ ] Retrieve all tokens for authenticated user
- [ ] Test pagination
- [ ] Verify token status (active/revoked/expired)

**Endpoint**: `GET /api/stream-tokens`

**Query Parameters**: `?limit=10&page=1`

---

## 8. Error Handling Testing

### 8.1 Validation Errors
- [ ] Missing required fields → 400 Bad Request
- [ ] Invalid data types → 400 Bad Request
- [ ] Email validation → proper error format

### 8.2 Authentication Errors
- [ ] Missing Authorization header → 401 Unauthorized
- [ ] Invalid token → 401 Unauthorized
- [ ] Expired token → 401 Unauthorized
- [ ] Malformed header → 401 Unauthorized

### 8.3 Authorization Errors
- [ ] User attempting to modify other user's data → 403 Forbidden
- [ ] User attempting to update channel they don't own → 403 Forbidden

### 8.4 Not Found Errors
- [ ] Non-existent channel ID → 404 Not Found
- [ ] Non-existent video ID → 404 Not Found
- [ ] Non-existent user ID → 404 Not Found

### 8.5 Server Errors
- [ ] Database connection failure → 500 Internal Server Error
- [ ] Unhandled exceptions → 500 Internal Server Error
- [ ] Proper error response format with message

### 8.6 Error Response Format
All errors should follow format:
```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
```

---

## 9. Success Response Format Testing

### 9.1 Response Structure
All successful responses should follow:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // response payload
  }
}
```

### 9.2 Status Codes
- `201 Created` - for POST requests creating resources
- `200 OK` - for successful GET/PUT/DELETE requests
- `204 No Content` - for DELETE operations (optional)

---

## 10. Integration Testing Scenarios

### Scenario 1: Complete User Journey
1. Register new user
2. Login and get JWT token
3. Create a channel
4. Upload a video to channel
5. Request video preview (2-minute)
6. Generate stream token for video
7. Verify stream token
8. Watch video and update watch history
9. Check continue watching list
10. Logout/token expiry

### Scenario 2: Live Streaming Flow
1. Register user and create channel
2. Create live stream (get RTMP URL)
3. Transition status: OFFLINE → SCHEDULED → LIVE
4. Update viewer count
5. Generate live stream token
6. End live stream with recording URL
7. Verify stream token revoked

### Scenario 3: Multi-User Interaction
1. User A creates channel with videos
2. User B watches User A's videos
3. User B's watch history tracked
4. User A views analytics
5. User B cannot modify User A's content

### Scenario 4: Error Scenarios
1. Invalid login credentials
2. Non-existent resource access
3. Unauthorized update attempt
4. Expired token usage
5. Duplicate registration

---

## 11. Performance Testing

### 11.1 Load Testing
- [ ] 100 concurrent user registrations
- [ ] Bulk video listing (1000+ videos)
- [ ] Watch history pagination with large datasets

### 11.2 Response Time Benchmarks
- [ ] Auth endpoints: < 200ms
- [ ] Resource retrieval: < 500ms
- [ ] Complex queries: < 1000ms

### 11.3 Database Query Optimization
- [ ] Verify indexes are effective
- [ ] Monitor slow queries
- [ ] Check N+1 query problems

### 11.4 Video Streaming Performance
- [ ] Stream info endpoint: < 50ms (metadata cached)
- [ ] First byte of video stream: < 200ms
- [ ] Subsequent chunks: < 100ms each
- [ ] Seek time (range requests): < 100ms
- [ ] No latency increase with concurrent streams

### 11.5 Concurrent Streaming Load
- [ ] 10 concurrent video streams: CPU < 15%, Memory < 300MB
- [ ] 50 concurrent streams: CPU < 40%, Memory < 1GB
- [ ] 100 concurrent streams: CPU < 60%, Memory < 1.5GB
- [ ] Max concurrent streams enforced (3 per user)
- [ ] Active stream count accurate in health check

### 11.6 Memory Usage During Streaming
- [ ] Memory per stream: 10-20 MB (not 500MB+)
- [ ] Memory stable after buffer fills
- [ ] No memory leaks with long-duration streams
- [ ] Backpressure prevents buffer overflow
- [ ] Garbage collection effective

### 11.7 Bandwidth Efficiency
- [ ] Full video streaming: uses 100% of file size
- [ ] Range requests: use only requested bytes
- [ ] Partial watches: save 50-70% bandwidth
- [ ] Metadata cached: reduces S3 API calls by 50-80%
- [ ] Seek operations: < 5KB overhead per seek

---

## 12. Security Testing

### 12.1 Authentication Security
- [ ] JWT token validation
- [ ] Token expiration enforcement
- [ ] Password hashing verification
- [ ] No passwords in API responses

### 12.2 Authorization Security
- [ ] User cannot access other user's data
- [ ] Channel owner verification on updates
- [ ] Token scope validation

### 12.3 Input Validation
- [ ] SQL injection prevention
- [ ] XSS prevention in stored data
- [ ] Rate limiting on auth endpoints
- [ ] CORS configuration validation

### 12.4 Data Privacy
- [ ] Sensitive data not logged
- [ ] Error messages don't leak info
- [ ] User data isolation verified

---

## 12.5 Streaming Security (New)
- [ ] Rate limiting: max 3 concurrent streams per user
- [ ] 4th stream attempt returns 429 Too Many Requests
- [ ] Invalid Range headers rejected with 400
- [ ] Out-of-bounds ranges rejected with 416
- [ ] Malformed byte ranges detected and rejected
- [ ] Socket timeout after 60 seconds prevents resource leak
- [ ] No buffer overflow vulnerabilities possible
- [ ] Proper CORS headers for Range requests
- [ ] No sensitive data in streaming response headers

### 12.6 Streaming Error Security
- [ ] 400 Bad Request for invalid Range format
- [ ] 416 Range Not Satisfiable for out-of-bounds
- [ ] 429 Too Many Requests for rate limit exceeded
- [ ] 500 Server Error without exposing internals
- [ ] Proper error messages without S3 bucket info

---

## 13. Database Testing

### 13.1 Data Integrity
- [ ] Foreign key constraints enforced
- [ ] Cascade delete operations verified
- [ ] Unique constraints working (email, username)

### 13.2 Data Consistency
- [ ] Watch history progress values valid (0-100)
- [ ] Status enums only contain valid values
- [ ] Timestamps are accurate

### 13.3 Migration Testing
- [ ] Fresh database setup works
- [ ] Migration rollback possible
- [ ] Schema matches Prisma definition

---

## 14. Tools & Setup

### Required Tools
- [x] Postman (for API testing)
- [x] Thunder Client (alternative)
- [ ] curl (command line)
- [ ] Insomnia (alternative)

### Environment Variables
```
BASE_URL=http://localhost:3000
JWT_SECRET=your-secret-key-change-in-production
DATABASE_URL=postgresql://suraj@localhost:5432/postgres?schema=public
```

### Test Credentials
- **Email**: test@example.com
- **Username**: testuser
- **Password**: TestPassword123

---

## 15. Regression Testing

After each code change:
- [ ] Run full test suite
- [ ] Verify existing endpoints still work
- [ ] Check error handling unchanged
- [ ] Validate database state

---

## 16. Browser-Based Streaming Tests (New)

### 16.1 HTML5 Video Player Integration
- [ ] Video tag loads stream endpoint correctly
- [ ] Video controls appear (play, pause, seek, volume)
- [ ] Browser automatically sends Range headers
- [ ] Seeking works instantly (< 100ms)
- [ ] Progress bar reflects actual playback position
- [ ] Time display shows correct duration and current time
- [ ] No manual Range header configuration needed

**Test Process**:
```html
<video controls>
  <source src="/api/video-stream/VIDEO_ID/stream" type="video/mp4">
</video>
```

1. Verify video loads
2. Open browser DevTools Network tab
3. Play video and monitor Range headers
4. Seek to different positions
5. Verify 206 responses for each seek

### 16.2 Cross-Browser Compatibility
- [ ] Chrome 90+: Full support, Range requests working
- [ ] Firefox 88+: Full support, Range requests working
- [ ] Safari 14+: Full support, Range requests working
- [ ] Edge 90+: Full support, Range requests working
- [ ] Mobile Chrome: Adaptive buffering effective
- [ ] Mobile Safari: Adaptive buffering effective

### 16.3 Mobile Streaming Testing
- [ ] Mobile on 3G: Uses smaller chunks (312KB), buffers appropriately
- [ ] Mobile on 4G: Uses medium chunks (625KB), faster buffering
- [ ] Mobile on WiFi: Uses larger chunks efficiently
- [ ] Network switch during playback: Adapts chunk size gracefully
- [ ] Low bandwidth: No stuttering with adaptive buffering

### 16.4 Desktop Streaming Testing
- [ ] Desktop on Fiber: Uses max chunk size (1MB), instant buffering
- [ ] Desktop on WiFi: Uses large chunks, smooth playback
- [ ] Desktop on Ethernet: Uses optimal chunk size
- [ ] Multiple tabs streaming: All play without interference
- [ ] Bandwidth changes: Playback quality adjusts smoothly

### 16.5 Player Controls Testing
- [ ] Play/pause toggles correctly
- [ ] Seeking slider moves smoothly
- [ ] Seeking updates video instantly
- [ ] Volume slider adjusts playback volume
- [ ] Fullscreen mode works seamlessly
- [ ] Progress bar fills accurate to position
- [ ] Duration display shows total video length
- [ ] Buffering indicator shows during loading

### 16.6 Adaptive Playback Quality
- [ ] Network speed detected correctly
- [ ] User-Agent parsed to determine device
- [ ] Chunk size calculated accordingly:
  - Mobile: bandwidth × 1 = chunk size
  - Desktop: bandwidth × 1 = chunk size
- [ ] Playback smooth throughout video
- [ ] No quality drops if chunk timing is consistent
- [ ] Buffer maintained at ~1 second of video

---

## 17. Detailed Integration Scenarios (New)

### Scenario 1: Complete Streaming User Journey
**Objective**: Test entire workflow from video discovery to playback completion

1. ✅ User registers and logs in
2. ✅ Browse available channels
3. ✅ View video list from channel
4. ✅ Click video to view details
5. ✅ Call `/api/video-stream/:id/stream-info` to get metadata
6. ✅ Open HTML5 video player
7. ✅ Watch video:
   - Browser sends GET request (no Range)
   - Server responds with 200 OK + full video
   - Video plays smoothly
8. ✅ Test seeking:
   - Click to 25% mark
   - Browser sends Range request to that position
   - Server responds with 206 Partial Content
   - Video plays from new position instantly
9. ✅ Stop video at 50% mark
10. ✅ Call `/api/watch-history` to save progress
11. ✅ Close browser
12. ✅ Reopen app and navigate to same video
13. ✅ Verify resume position matches saved progress
14. ✅ Complete video playback (reach 90%+)
15. ✅ Verify video marked as completed

**Expected Result**: Seamless streaming experience from start to finish

### Scenario 2: Adaptive Network Conditions
**Objective**: Verify streaming adapts to network speed changes

1. ✅ Detect network speed (fast fiber)
2. ✅ Get stream info → adaptive chunk size = 1MB
3. ✅ Start streaming with 1MB chunks
4. ✅ Monitor consistent response times (~100ms)
5. ✅ Network degrades to 3G
6. ✅ System detects new speed
7. ✅ Adapt chunk size down to 312KB
8. ✅ Playback continues smoothly without interruption
9. ✅ No buffering or jitter during transition
10. ✅ Network improves back to fiber
11. ✅ Chunk size increases back to 1MB
12. ✅ Streaming continues optimally

**Expected Result**: Seamless quality adaptation to network

### Scenario 3: Concurrent Streaming Limits
**Objective**: Verify rate limiting prevents resource exhaustion

1. ✅ User opens video stream 1 → Success (status 200/206)
2. ✅ Check `/api/video-stream/health/status` → activeStreams: 1
3. ✅ User opens video stream 2 → Success (status 200/206)
4. ✅ Check health → activeStreams: 2
5. ✅ User opens video stream 3 → Success (status 200/206)
6. ✅ Check health → activeStreams: 3
7. ✅ User attempts stream 4 → Fails with 429 Too Many Requests
8. ✅ Error message: "Too many concurrent streams. Maximum 3 per user."
9. ✅ User closes stream 1
10. ✅ Check health → activeStreams: 2
11. ✅ User opens new stream → Success (4th attempt now succeeds)
12. ✅ Check health → activeStreams: 3

**Expected Result**: Rate limiting enforced, prevents > 3 concurrent streams

### Scenario 4: Seeking and Resume
**Objective**: Test Range request seeking and resume capability

1. ✅ Start streaming video (1GB file)
2. ✅ Play for 10 seconds
3. ✅ Seek to 50% mark (500MB mark)
   - Browser sends: Range: bytes=524288000-524548863
   - Server responds: 206 with Content-Range header
   - Seek latency: < 100ms
4. ✅ Continue playback from new position
5. ✅ Play for another 10 seconds
6. ✅ Simulate connection drop (pause network in DevTools)
7. ✅ Wait 5 seconds (connection is down)
8. ✅ Restore connection
9. ✅ Calculate last received byte position
10. ✅ Send Range request from that position
11. ✅ Server resumes playback seamlessly
12. ✅ No loss of data or position
13. ✅ Continue to video completion

**Expected Result**: Seamless seeking and resume on connection loss

### Scenario 5: Performance Under Load
**Objective**: Verify streaming performance with multiple concurrent users

1. ✅ 10 concurrent users streaming
   - Monitor CPU: < 15%
   - Monitor Memory: < 300MB total
   - Monitor response times: < 100ms per chunk
2. ✅ 50 concurrent users streaming
   - Monitor CPU: < 40%
   - Monitor Memory: < 1GB total
   - Monitor response times: < 100ms per chunk
3. ✅ 100 concurrent users streaming
   - Monitor CPU: < 60%
   - Monitor Memory: < 1.5GB total
   - Monitor response times: maintained at < 100ms
4. ✅ All users can seek instantly
5. ✅ No buffering delays
6. ✅ No dropped connections
7. ✅ Health check still responsive
8. ✅ Gradually reduce load back to baseline
9. ✅ Verify metrics return to normal

**Expected Result**: System handles 100+ concurrent streams efficiently

### Scenario 6: Error Handling
**Objective**: Verify streaming error handling

**Case A: Invalid Range Format**
1. Send: `Range: invalid-format`
2. Expected: 400 Bad Request
3. Message: "Invalid range format"

**Case B: Out of Bounds Range**
1. Video size: 100MB
2. Send: `Range: bytes=0-999999999`
3. Expected: 416 Range Not Satisfiable

**Case C: Non-existent Video**
1. Send: GET `/api/video-stream/invalid-id/stream`
2. Expected: 404 Not Found

**Case D: Too Many Concurrent Streams**
1. Open 4 streams
2. Expected: 429 Too Many Requests
3. Message: "Too many concurrent streams"

**Case E: Connection Timeout**
1. Start stream
2. Wait > 60 seconds without activity
3. Expected: Socket timeout + connection close

---

## 18. Postman Testing (Updated)

### Updated Collection Structure
- ✅ Authentication (5 endpoints)
- ✅ Channels (5 endpoints)
- ✅ Videos (6 endpoints)
- ✅ **Video Streaming (7 NEW endpoints)**
- ✅ Live Streams (6 endpoints)
- ✅ Watch History (4 endpoints)
- ✅ Stream Tokens (5 endpoints)

**Total**: 30+ endpoints

### Video Streaming Endpoints in Postman
1. Stream Full Video
2. Stream Video - First 1MB (Range)
3. Stream Video - From Middle (Resume)
4. Stream Video - Last 1MB (Seek to end)
5. Stream Video - Custom Range
6. Get Stream Info (Metadata)
7. Streaming Service Health Check

**File**: `OTT-API-Collection.postman_collection.json` (v2.0)
**Guide**: `POSTMAN_TESTING_GUIDE.md`

---

## 19. Testing Execution Order

### Phase 1: Unit Tests (Before pushing code)
- [ ] Range parser utility tests
- [ ] S3 service layer tests
- [ ] Error handling tests

### Phase 2: Endpoint Tests (Postman)
- [ ] Health check
- [ ] Stream info endpoint
- [ ] Full video streaming
- [ ] Range request variants
- [ ] Error cases

### Phase 3: Integration Tests
- [ ] Complete user journey
- [ ] Concurrent streaming
- [ ] Seeking and resume
- [ ] Rate limiting

### Phase 4: Performance Tests
- [ ] Load testing (10, 50, 100 concurrent)
- [ ] Memory usage monitoring
- [ ] Response time benchmarks
- [ ] Bandwidth efficiency

### Phase 5: Security Tests
- [ ] Rate limiting enforcement
- [ ] Invalid range handling
- [ ] Socket timeout verification
- [ ] CORS headers validation

### Phase 6: Browser Tests
- [ ] HTML5 video player
- [ ] Cross-browser compatibility
- [ ] Mobile testing
- [ ] Adaptive quality

---

## 20. Success Criteria

### Streaming Must Pass All Tests:
- ✅ Stream info: < 50ms
- ✅ First byte: < 200ms
- ✅ Chunk stream: < 100ms
- ✅ Seek time: < 100ms
- ✅ Memory/stream: 10-20MB
- ✅ Concurrent: 3 per user max
- ✅ CPU at 100 concurrent: < 60%
- ✅ No jitter or stuttering
- ✅ Smooth playback throughout
- ✅ Resume works correctly
- ✅ Rate limiting enforced
- ✅ All error cases handled

### Test Coverage Target:
- ✅ All 7 streaming endpoints tested
- ✅ All Range request variants tested
- ✅ Error cases tested
- ✅ Performance benchmarks met
- ✅ Security checks passed
- ✅ Browser compatibility verified

---

**Last Updated**: 25 April 2026
**Status**: Ready for comprehensive streaming testing

---

## 16. Documentation

- [x] API endpoints documented
- [x] Error codes documented
- [ ] Request/response examples provided
- [ ] Authentication flow documented
- [ ] Database schema documented

---

## Summary

- **Total Endpoints**: 30+
- **Test Categories**: 16
- **Critical Tests**: Authentication, Authorization, CRUD operations
- **Success Criteria**: All endpoints respond with correct status codes and formats
