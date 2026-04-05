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
