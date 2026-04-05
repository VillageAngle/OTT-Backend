# OTT Backend API - Testing Steps & Guide

## Prerequisites

1. **Install Postman**
   - Download from [https://www.postman.com/downloads/](https://www.postman.com/downloads/)
   - Alternative: Use Thunder Client, Insomnia, or curl

2. **Verify Server is Running**
   ```bash
   cd /Users/surajpatel/Developer/FreeLancing/OTT-Backend
   yarn dev
   # Should see: "Server running on port 3000"
   ```

3. **Database Status**
   - Ensure Prisma database is connected
   - Check `.env` file has `DATABASE_URL` configured

---

## Setup Postman Collection

### Step 1: Import Collection File
1. Open Postman
2. Click **File** → **Import**
3. Select `OTT-API-Collection.postman_collection.json`
4. Click **Import**

### Step 2: Configure Environment Variables
1. In Postman, click **Environments** (left sidebar)
2. Click **Create New Environment**
3. Name it: `OTT Local`
4. Add these variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| base_url | http://localhost:3000 | http://localhost:3000 |
| email | test@example.com | (set during testing) |
| username | testuser | (set during testing) |
| password | TestPassword123 | (set during testing) |
| jwt_token | (empty) | (set after login) |
| channel_id | (empty) | (set after creating channel) |
| video_id | (empty) | (set after creating video) |
| livestream_id | (empty) | (set after creating livestream) |
| stream_token | (empty) | (set after generating token) |

5. Click **Save**
6. Select the environment from dropdown (top-right)

---

## Testing Workflow

### Phase 1: Health & Authentication Testing

#### Step 1.1: Check Server Health
**Request**: `GET /health`

1. In Postman, go to **Health Check** folder
2. Click **Health Check** request
3. Click **Send**
4. **Expected Response**:
   ```json
   {
     "status": "ok"
   }
   ```
5. ✅ Should see **Status: 200 OK**

#### Step 1.2: Register New User
**Request**: `POST /api/users/register`

1. Go to **Authentication** folder
2. Click **Register User**
3. Update variables in body (if needed):
   - Change `{{email}}`, `{{username}}`, `{{password}}`
   - Or use default test values
4. Click **Send**
5. **Expected Response**:
   ```json
   {
     "success": true,
     "message": "User registered successfully",
     "data": {
       "id": "...",
       "email": "test@example.com",
       "username": "testuser",
       "token": "eyJhbGc..."
     }
   }
   ```
6. ✅ Status: **201 Created**
7. **Save JWT Token**: Copy token from response and paste into `jwt_token` environment variable

#### Step 1.3: Login with Registered User
**Request**: `POST /api/users/login`

1. Click **Login User** in Authentication folder
2. Verify email and password match what you registered
3. Click **Send**
4. **Expected Response**:
   ```json
   {
     "success": true,
     "message": "Login successful",
     "data": {
       "id": "...",
       "email": "test@example.com",
       "token": "eyJhbGc..."
     }
   }
   ```
5. ✅ Status: **200 OK**
6. **Save New JWT Token**: Update `jwt_token` variable

#### Step 1.4: Get User Profile
**Request**: `GET /api/users/profile`

1. Click **Get User Profile**
2. Verify **Authorization** header has `Bearer {{jwt_token}}`
3. Click **Send**
4. **Expected Response**:
   ```json
   {
     "success": true,
     "message": "User profile retrieved",
     "data": {
       "id": "...",
       "email": "test@example.com",
       "username": "testuser",
       "createdAt": "2026-04-05T...",
       "updatedAt": "2026-04-05T..."
     }
   }
   ```
5. ✅ Status: **200 OK**

---

### Phase 2: Channel Management Testing

#### Step 2.1: Create Channel
**Request**: `POST /api/channels`

1. Go to **Channels** folder
2. Click **Create Channel**
3. Update request body (optional):
   ```json
   {
     "name": "My Test Channel",
     "description": "This is a test channel",
     "bannerUrl": "https://example.com/banner.jpg"
   }
   ```
4. Verify **Authorization** header has JWT token
5. Click **Send**
6. **Expected Response**:
   ```json
   {
     "success": true,
     "message": "Channel created successfully",
     "data": {
       "id": "clk...",
       "name": "My Test Channel",
       "description": "This is a test channel",
       "bannerUrl": "https://example.com/banner.jpg",
       "createdAt": "2026-04-05T...",
       "updatedAt": "2026-04-05T..."
     }
   }
   ```
7. ✅ Status: **201 Created**
8. **Save Channel ID**: Copy `data.id` and set `{{channel_id}}` variable

#### Step 2.2: Get All Channels
**Request**: `GET /api/channels`

1. Click **Get All Channels**
2. Click **Send**
3. **Expected Response**: List of all channels with pagination
4. ✅ Status: **200 OK**

#### Step 2.3: Get Channel by ID
**Request**: `GET /api/channels/:id`

1. Click **Get Channel by ID**
2. URL should use `{{channel_id}}`
3. Click **Send**
4. **Expected Response**: Single channel details with videos and live streams
5. ✅ Status: **200 OK**

#### Step 2.4: Update Channel
**Request**: `PUT /api/channels/:id`

1. Click **Update Channel**
2. Modify the request body:
   ```json
   {
     "name": "Updated Channel Name",
     "description": "Updated description",
     "bannerUrl": "https://example.com/updated-banner.jpg"
   }
   ```
3. Click **Send**
4. **Expected Response**: Updated channel data
5. ✅ Status: **200 OK**

---

### Phase 3: Video Management Testing

#### Step 3.1: Create Video
**Request**: `POST /api/videos`

1. Go to **Videos** folder
2. Click **Create Video**
3. Update request body:
   ```json
   {
     "channelId": "{{channel_id}}",
     "title": "Test Video",
     "duration": 3600,
     "fileUrl": "https://cdn.example.com/test-video.mp4"
   }
   ```
4. Verify JWT token in Authorization header
5. Click **Send**
6. **Expected Response**:
   ```json
   {
     "success": true,
     "message": "Video created successfully",
     "data": {
       "id": "...",
       "channelId": "{{channel_id}}",
       "title": "Test Video",
       "duration": 3600,
       "fileUrl": "https://cdn.example.com/test-video.mp4",
       "status": "ACTIVE"
     }
   }
   ```
7. ✅ Status: **201 Created**
8. **Save Video ID**: Set `{{video_id}}` variable

#### Step 3.2: Get Videos by Channel
**Request**: `GET /api/videos/channel/:channelId`

1. Click **Get Videos by Channel**
2. Should return videos from the channel you created
3. Click **Send**
4. ✅ Status: **200 OK**

#### Step 3.3: Get Video by ID
**Request**: `GET /api/videos/:id`

1. Click **Get Video by ID**
2. Uses `{{video_id}}`
3. Click **Send**
4. **Expected Response**: Video details
5. ✅ Status: **200 OK**

#### Step 3.4: Get Video Preview
**Request**: `GET /api/videos/:id/preview`

1. Click **Get Video with Preview**
2. Click **Send**
3. **Expected Response**: Should indicate 2-minute preview available
   ```json
   {
     "success": true,
     "data": {
       "preview": true,
       "duration": 120,
       "canWatchFull": false
     }
   }
   ```
4. ✅ Status: **200 OK**

#### Step 3.5: Update Video
**Request**: `PUT /api/videos/:id`

1. Click **Update Video**
2. Modify body:
   ```json
   {
     "title": "Updated Video Title",
     "status": "ACTIVE"
   }
   ```
3. Click **Send**
4. ✅ Status: **200 OK**

---

### Phase 4: Live Stream Testing

#### Step 4.1: Create Live Stream
**Request**: `POST /api/live-streams`

1. Go to **Live Streams** folder
2. Click **Create Live Stream**
3. Update body:
   ```json
   {
     "channelId": "{{channel_id}}",
     "title": "Test Live Stream"
   }
   ```
4. Verify JWT token
5. Click **Send**
6. **Expected Response**: Should include RTMP URL and key
   ```json
   {
     "success": true,
     "data": {
       "id": "...",
       "channelId": "{{channel_id}}",
       "title": "Test Live Stream",
       "rtmpUrl": "rtmp://example.com/live",
       "rtmpKey": "unique-uuid-key",
       "status": "OFFLINE",
       "viewerCount": 0
     }
   }
   ```
7. ✅ Status: **201 Created**
8. **Save Stream ID**: Set `{{livestream_id}}` variable

#### Step 4.2: Get All Live Streams
**Request**: `GET /api/live-streams`

1. Click **Get All Live Streams**
2. Click **Send**
3. ✅ Status: **200 OK**

#### Step 4.3: Get Live Stream by ID
**Request**: `GET /api/live-streams/:id`

1. Click **Get Live Stream by ID**
2. Uses `{{livestream_id}}`
3. Click **Send**
4. ✅ Status: **200 OK**

#### Step 4.4: Update Live Stream Status
**Request**: `PUT /api/live-streams/:id/status`

1. Click **Update Live Stream Status**
2. Update body to test state transitions:
   ```json
   {
     "status": "LIVE",
     "viewerCount": 100
   }
   ```
3. Click **Send**
4. **Test State Transitions**:
   - OFFLINE → SCHEDULED → LIVE → OFFLINE
5. ✅ Status: **200 OK**

#### Step 4.5: End Live Stream
**Request**: `POST /api/live-streams/:id/end`

1. Click **End Live Stream**
2. Update body:
   ```json
   {
     "recordingUrl": "https://cdn.example.com/recording.mp4"
   }
   ```
3. Click **Send**
4. **Expected Response**: Status should change to ENDED
5. ✅ Status: **200 OK**

---

### Phase 5: Watch History Testing

#### Step 5.1: Update Watch History
**Request**: `PUT /api/watch-history/:videoId`

1. Go to **Watch History** folder
2. Click **Update Watch History**
3. URL uses `{{video_id}}`
4. Update body:
   ```json
   {
     "currentTime": 1800
   }
   ```
5. Verify JWT token in Authorization header
6. Click **Send**
7. **Expected Response**:
   ```json
   {
     "success": true,
     "data": {
       "userId": "...",
       "videoId": "{{video_id}}",
       "currentTime": 1800,
       "progress": 50,
       "isCompleted": false
     }
   }
   ```
8. ✅ Status: **200 OK** or **201 Created**

**Test Progress Calculation**:
- Send with `currentTime: 1800` (50% of 3600)
- Send with `currentTime: 3240` (90% - should mark as completed)
- Send with `currentTime: 3600` (100%)

#### Step 5.2: Get Watch History
**Request**: `GET /api/watch-history`

1. Click **Get Watch History**
2. Verify JWT token
3. Click **Send**
4. **Expected Response**: List of watched videos
5. ✅ Status: **200 OK**

#### Step 5.3: Get Continue Watching
**Request**: `GET /api/watch-history/continue/watching`

1. Click **Get Continue Watching**
2. Verify JWT token
3. Click **Send**
4. **Expected Response**: Only videos with progress < 90%
5. ✅ Status: **200 OK**

#### Step 5.4: Get Completed Videos
**Request**: `GET /api/watch-history/completed`

1. Click **Get Completed Videos**
2. Verify JWT token
3. Click **Send**
4. **Expected Response**: Only videos with progress >= 90%
5. ✅ Status: **200 OK**

---

### Phase 6: Stream Tokens Testing

#### Step 6.1: Generate Video Stream Token
**Request**: `POST /api/stream-tokens/video/:videoId`

1. Go to **Stream Tokens** folder
2. Click **Generate Video Token**
3. URL uses `{{video_id}}`
4. Verify JWT token
5. Click **Send**
6. **Expected Response**:
   ```json
   {
     "success": true,
     "data": {
       "token": "unique-token-string",
       "expiresAt": "2026-04-06T...",
       "expiresIn": 86400
     }
   }
   ```
7. ✅ Status: **201 Created**
8. **Save Stream Token**: Set `{{stream_token}}` variable

#### Step 6.2: Generate Live Stream Token
**Request**: `POST /api/stream-tokens/live/:liveStreamId`

1. Click **Generate Live Stream Token**
2. URL uses `{{livestream_id}}`
3. Verify JWT token
4. Click **Send**
5. **Expected Response**: Similar to video token but with 1-hour expiry
6. ✅ Status: **201 Created**

#### Step 6.3: Verify Stream Token
**Request**: `GET /api/stream-tokens/verify`

1. Click **Verify Stream Token**
2. Query parameter uses `{{stream_token}}`
3. Click **Send**
4. **Expected Response**:
   ```json
   {
     "success": true,
     "data": {
       "valid": true,
       "token": "unique-token-string",
       "expiresAt": "2026-04-06T..."
     }
   }
   ```
5. ✅ Status: **200 OK**

**Test Expired Token**:
- Manually change token to invalid value
- Should return `valid: false` or **401 Unauthorized**

#### Step 6.4: Revoke Stream Token
**Request**: `DELETE /api/stream-tokens/:token`

1. Click **Revoke Stream Token**
2. URL uses `{{stream_token}}`
3. Verify JWT token
4. Click **Send**
5. ✅ Status: **200 OK** or **204 No Content**

#### Step 6.5: Get User Stream Tokens
**Request**: `GET /api/stream-tokens`

1. Click **Get User Stream Tokens**
2. Verify JWT token
3. Click **Send**
4. **Expected Response**: List of all user's tokens
5. ✅ Status: **200 OK**

---

## Error Testing Scenarios

### Test 1: Missing Authorization Header
1. Remove Authorization header from **Get User Profile**
2. Click **Send**
3. **Expected**: Status **401 Unauthorized**
   ```json
   {
     "success": false,
     "message": "Authorization token required"
   }
   ```

### Test 2: Invalid Token
1. In **Get User Profile**, change JWT token to invalid value
2. Click **Send**
3. **Expected**: Status **401 Unauthorized**
   ```json
   {
     "success": false,
     "message": "Invalid or expired token"
   }
   ```

### Test 3: Non-Existent Resource
1. In **Get Video by ID**, change `{{video_id}}` to "invalid-id"
2. Click **Send**
3. **Expected**: Status **404 Not Found**
   ```json
   {
     "success": false,
     "message": "Video not found"
   }
   ```

### Test 4: Validation Error
1. In **Create Channel**, remove the `name` field
2. Click **Send**
3. **Expected**: Status **400 Bad Request**
   ```json
   {
     "success": false,
     "message": "Channel name is required"
   }
   ```

### Test 5: Unauthorized Action
1. Register a **second user** (different email)
2. Login as second user and save JWT token
3. Try to **Update Channel** created by first user
4. **Expected**: Status **403 Forbidden**
   ```json
   {
     "success": false,
     "message": "Unauthorized to update this resource"
   }
   ```

---

## Complete Test Workflow

### Full Integration Test (15 minutes)
1. ✅ Register User
2. ✅ Login User
3. ✅ Get User Profile
4. ✅ Create Channel
5. ✅ Create Video
6. ✅ Get Video Preview
7. ✅ Update Watch History (progress: 50%)
8. ✅ Update Watch History (progress: 90% - marks as complete)
9. ✅ Get Continue Watching (should be empty)
10. ✅ Get Completed Videos (should include video)
11. ✅ Generate Video Token
12. ✅ Verify Stream Token
13. ✅ Create Live Stream
14. ✅ Update Live Stream Status (OFFLINE → LIVE)
15. ✅ End Live Stream

---

## Database Verification

After testing, verify data in Prisma Studio:

```bash
cd /Users/surajpatel/Developer/FreeLancing/OTT-Backend
npx prisma studio
```

This opens **Prisma Studio** at `http://localhost:5555`

**Check Tables**:
1. **User** - See registered users
2. **Channel** - See created channels
3. **Video** - See created videos
4. **WatchHistory** - See watch progress records
5. **StreamToken** - See issued tokens

---

## Performance Testing

### Load Test: Rapid Requests
1. Create request in Postman
2. Use **Collection Runner** (top-left)
3. Select all requests
4. Set **Iterations**: 10
5. Run and monitor performance

### Expected Performance
- Auth endpoints: < 200ms
- CRUD endpoints: < 500ms
- Complex queries: < 1000ms

---

## Debugging Tips

### Issue: "Authorization token required"
- ✅ Verify JWT token is set in environment
- ✅ Check Authorization header is present
- ✅ Ensure token format is `Bearer <token>`

### Issue: "Channel not found"
- ✅ Verify `{{channel_id}}` variable is set
- ✅ Confirm channel exists in database (Prisma Studio)
- ✅ Ensure you're using correct channel ID

### Issue: "Invalid or expired token"
- ✅ Login again and get new JWT token
- ✅ Update `{{jwt_token}}` variable
- ✅ Check token wasn't modified

### Issue: 500 Internal Server Error
- ✅ Check database connection status
- ✅ Review server logs: `yarn dev`
- ✅ Verify all required fields in request body

### Issue: Request Timeout
- ✅ Ensure server is running: `yarn dev`
- ✅ Check `base_url` is `http://localhost:3000`
- ✅ Restart server if needed

---

## Success Checklist

- [ ] Health endpoint responds
- [ ] User registration works
- [ ] Login generates JWT token
- [ ] Profile retrieval works with token
- [ ] Channel CRUD operations work
- [ ] Video CRUD operations work
- [ ] Video preview endpoint works
- [ ] Live stream operations work
- [ ] Watch history tracking works
- [ ] Stream tokens generate and verify
- [ ] Error responses have correct format
- [ ] Database data visible in Prisma Studio
- [ ] All endpoint responses include `success`, `message`, `data` fields

---

## Next Steps

Once all tests pass:
1. ✅ Write integration tests (Jest/Mocha)
2. ✅ Set up CI/CD pipeline
3. ✅ Deploy to staging environment
4. ✅ Load testing in production-like environment
5. ✅ Security penetration testing
6. ✅ API documentation (Swagger/OpenAPI)

---

## Support

For issues:
1. Check server logs: `yarn dev`
2. Check database: `npx prisma studio`
3. Review `.env` configuration
4. Verify all environment variables are set
5. Check Postman environment variables
