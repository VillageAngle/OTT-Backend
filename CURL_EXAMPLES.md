# OTT Backend API - cURL Testing Examples

Use these commands from your terminal to test the API directly.

## Prerequisites

```bash
# Start the server
cd /Users/surajpatel/Developer/FreeLancing/OTT-Backend
yarn dev

# In another terminal, run cURL commands
```

---

## Configuration

Set these variables for easier copy-pasting:

```bash
export BASE_URL="http://localhost:3000/api"
export EMAIL="test@example.com"
export USERNAME="testuser"
export PASSWORD="TestPassword123"
export JWT_TOKEN=""  # Will be set after login
export CHANNEL_ID=""  # Will be set after creating channel
export VIDEO_ID=""    # Will be set after creating video
export LIVESTREAM_ID=""  # Will be set after creating livestream
export STREAM_TOKEN=""   # Will be set after generating token
```

---

## 1. Health Check

```bash
curl -X GET http://localhost:3000/health
```

**Expected Response**:
```json
{
  "status": "ok"
}
```

---

## 2. Authentication

### Register User

```bash
curl -X POST $BASE_URL/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$EMAIL'",
    "username": "'$USERNAME'",
    "password": "'$PASSWORD'"
  }'
```

**Or with direct values**:

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "TestPassword123"
  }'
```

**Expected Response**:
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

### Save JWT Token

After login, extract and save the token:

```bash
# Save token from response (you'll do this manually)
export JWT_TOKEN="your-token-from-response"

# Or use jq to extract automatically
JWT_TOKEN=$(curl -s -X POST $BASE_URL/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$EMAIL'",
    "password": "'$PASSWORD'"
  }' | jq -r '.data.token')

echo "JWT Token: $JWT_TOKEN"
```

### Login User

```bash
curl -X POST $BASE_URL/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$EMAIL'",
    "password": "'$PASSWORD'"
  }'
```

### Get User Profile

```bash
curl -X GET $BASE_URL/users/profile \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

## 3. Channels

### Create Channel

```bash
curl -X POST $BASE_URL/channels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "name": "My Test Channel",
    "description": "Test channel description",
    "bannerUrl": "https://example.com/banner.jpg"
  }'
```

**Save Channel ID**:

```bash
CHANNEL_ID=$(curl -s -X POST $BASE_URL/channels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "name": "My Test Channel",
    "description": "Test channel",
    "bannerUrl": "https://example.com/banner.jpg"
  }' | jq -r '.data.id')

echo "Channel ID: $CHANNEL_ID"
```

### Get All Channels

```bash
curl -X GET "$BASE_URL/channels?limit=10&page=1"
```

### Get Channel by ID

```bash
curl -X GET "$BASE_URL/channels/$CHANNEL_ID"
```

### Update Channel

```bash
curl -X PUT "$BASE_URL/channels/$CHANNEL_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "name": "Updated Channel Name",
    "description": "Updated description",
    "bannerUrl": "https://example.com/new-banner.jpg"
  }'
```

### Delete Channel

```bash
curl -X DELETE "$BASE_URL/channels/$CHANNEL_ID" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

## 4. Videos

### Create Video

```bash
curl -X POST $BASE_URL/videos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "channelId": "'$CHANNEL_ID'",
    "title": "Test Video",
    "duration": 3600,
    "fileUrl": "https://cdn.example.com/video.mp4"
  }'
```

**Save Video ID**:

```bash
VIDEO_ID=$(curl -s -X POST $BASE_URL/videos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "channelId": "'$CHANNEL_ID'",
    "title": "Test Video",
    "duration": 3600,
    "fileUrl": "https://cdn.example.com/video.mp4"
  }' | jq -r '.data.id')

echo "Video ID: $VIDEO_ID"
```

### Get Video by ID

```bash
curl -X GET "$BASE_URL/videos/$VIDEO_ID"
```

### Get Video Preview

```bash
curl -X GET "$BASE_URL/videos/$VIDEO_ID/preview"
```

### Get Videos by Channel

```bash
curl -X GET "$BASE_URL/videos/channel/$CHANNEL_ID?limit=10&page=1"
```

### Update Video

```bash
curl -X PUT "$BASE_URL/videos/$VIDEO_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "title": "Updated Title",
    "duration": 3600,
    "fileUrl": "https://cdn.example.com/updated.mp4",
    "status": "ACTIVE"
  }'
```

### Delete Video

```bash
curl -X DELETE "$BASE_URL/videos/$VIDEO_ID" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

## 5. Live Streams

### Create Live Stream

```bash
curl -X POST $BASE_URL/live-streams \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "channelId": "'$CHANNEL_ID'",
    "title": "Test Live Stream"
  }'
```

**Save Live Stream ID**:

```bash
LIVESTREAM_ID=$(curl -s -X POST $BASE_URL/live-streams \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "channelId": "'$CHANNEL_ID'",
    "title": "Test Live Stream"
  }' | jq -r '.data.id')

echo "Live Stream ID: $LIVESTREAM_ID"
```

### Get All Live Streams

```bash
curl -X GET "$BASE_URL/live-streams?limit=10&page=1"
```

### Get Live Stream by ID

```bash
curl -X GET "$BASE_URL/live-streams/$LIVESTREAM_ID"
```

### Get Live Streams by Channel

```bash
curl -X GET "$BASE_URL/live-streams/channel/$CHANNEL_ID"
```

### Update Live Stream Status

```bash
curl -X PUT "$BASE_URL/live-streams/$LIVESTREAM_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "status": "LIVE",
    "viewerCount": 100
  }'
```

**Test Status Transitions**:

```bash
# OFFLINE → SCHEDULED
curl -X PUT "$BASE_URL/live-streams/$LIVESTREAM_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"status": "SCHEDULED"}'

# SCHEDULED → LIVE
curl -X PUT "$BASE_URL/live-streams/$LIVESTREAM_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"status": "LIVE", "viewerCount": 50}'

# LIVE → OFFLINE
curl -X PUT "$BASE_URL/live-streams/$LIVESTREAM_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"status": "OFFLINE"}'
```

### End Live Stream

```bash
curl -X POST "$BASE_URL/live-streams/$LIVESTREAM_ID/end" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "recordingUrl": "https://cdn.example.com/recording.mp4"
  }'
```

---

## 6. Watch History

### Update Watch Progress

```bash
curl -X PUT "$BASE_URL/watch-history/$VIDEO_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "currentTime": 1800
  }'
```

**Test Progress Calculation**:

```bash
# 50% progress (1800 of 3600)
curl -X PUT "$BASE_URL/watch-history/$VIDEO_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"currentTime": 1800}'

# 90% progress (marks as completed)
curl -X PUT "$BASE_URL/watch-history/$VIDEO_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"currentTime": 3240}'

# 100% progress
curl -X PUT "$BASE_URL/watch-history/$VIDEO_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"currentTime": 3600}'
```

### Get Watch History

```bash
curl -X GET "$BASE_URL/watch-history?limit=10&page=1" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Get Continue Watching

```bash
curl -X GET "$BASE_URL/watch-history/continue/watching?limit=5" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Get Completed Videos

```bash
curl -X GET "$BASE_URL/watch-history/completed?limit=10&page=1" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

## 7. Stream Tokens

### Generate Video Token

```bash
curl -X POST "$BASE_URL/stream-tokens/video/$VIDEO_ID" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Save Stream Token**:

```bash
STREAM_TOKEN=$(curl -s -X POST "$BASE_URL/stream-tokens/video/$VIDEO_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq -r '.data.token')

echo "Stream Token: $STREAM_TOKEN"
```

### Generate Live Stream Token

```bash
curl -X POST "$BASE_URL/stream-tokens/live/$LIVESTREAM_ID" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Verify Stream Token

```bash
curl -X GET "$BASE_URL/stream-tokens/verify?token=$STREAM_TOKEN"
```

### Revoke Stream Token

```bash
curl -X DELETE "$BASE_URL/stream-tokens/$STREAM_TOKEN" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### Get User Stream Tokens

```bash
curl -X GET "$BASE_URL/stream-tokens?limit=10&page=1" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

## Error Testing

### Missing Authorization

```bash
curl -X GET $BASE_URL/users/profile
# Should return 401 Unauthorized
```

### Invalid Token

```bash
curl -X GET $BASE_URL/users/profile \
  -H "Authorization: Bearer invalid-token"
# Should return 401 Unauthorized
```

### Non-Existent Resource

```bash
curl -X GET "$BASE_URL/videos/invalid-id"
# Should return 404 Not Found
```

### Missing Required Field

```bash
curl -X POST $BASE_URL/channels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"description": "No name field"}'
# Should return 400 Bad Request
```

---

## Useful cURL Options

### Pretty Print JSON Response

```bash
curl -X GET $BASE_URL/channels | jq '.'
```

### Save Response to File

```bash
curl -X GET $BASE_URL/channels > response.json
```

### Show Headers and Body

```bash
curl -i -X GET $BASE_URL/channels
```

### Verbose Output (for debugging)

```bash
curl -v -X GET $BASE_URL/channels
```

### Set Custom Headers

```bash
curl -X GET $BASE_URL/users/profile \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "X-Custom-Header: value"
```

### Upload JSON from File

```bash
curl -X POST $BASE_URL/channels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d @channel.json
```

Where `channel.json` contains:
```json
{
  "name": "My Channel",
  "description": "Channel description",
  "bannerUrl": "https://example.com/banner.jpg"
}
```

---

## Bash Script for Full Integration Test

Create a file `test.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000/api"
EMAIL="test@example.com"
USERNAME="testuser"
PASSWORD="TestPassword123"

echo "1. Registering user..."
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$EMAIL'",
    "username": "'$USERNAME'",
    "password": "'$PASSWORD'"
  }')

JWT_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.data.token')
echo "JWT Token: $JWT_TOKEN"

echo ""
echo "2. Creating channel..."
CHANNEL_RESPONSE=$(curl -s -X POST $BASE_URL/channels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "name": "Test Channel",
    "description": "Test",
    "bannerUrl": "https://example.com/banner.jpg"
  }')

CHANNEL_ID=$(echo $CHANNEL_RESPONSE | jq -r '.data.id')
echo "Channel ID: $CHANNEL_ID"

echo ""
echo "3. Creating video..."
VIDEO_RESPONSE=$(curl -s -X POST $BASE_URL/videos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "channelId": "'$CHANNEL_ID'",
    "title": "Test Video",
    "duration": 3600,
    "fileUrl": "https://cdn.example.com/video.mp4"
  }')

VIDEO_ID=$(echo $VIDEO_RESPONSE | jq -r '.data.id')
echo "Video ID: $VIDEO_ID"

echo ""
echo "4. Getting user profile..."
curl -s -X GET $BASE_URL/users/profile \
  -H "Authorization: Bearer $JWT_TOKEN" | jq '.'
```

Run it:
```bash
chmod +x test.sh
./test.sh
```

---

## Performance Testing with Apache Bench

```bash
# Install Apache Bench
brew install httpd

# Test endpoint performance
ab -n 100 -c 10 http://localhost:3000/api/channels
```

---

## Load Testing with GNU Parallel

```bash
# Install parallel
brew install parallel

# Make 100 requests in parallel
seq 1 100 | parallel curl -s http://localhost:3000/api/channels | jq '.data | length'
```

---

## Tips

1. **Always check status code**: Use `curl -i` to see headers with status codes
2. **Format JSON**: Use `| jq '.'` for readable output
3. **Debug with -v**: Use `-v` flag to see all request/response details
4. **Set variables**: Use `export VAR="value"` for reusability
5. **Save tokens**: Always extract and save JWT tokens from responses

---

For Postman testing, see **TESTING_STEPS.md**

For API reference, see **QUICK_REFERENCE.md**
