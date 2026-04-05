# OTT Backend API - Quick Reference Guide

## API Base URL
```
http://localhost:3000/api
```

## Authentication
All protected endpoints require:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## Quick API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/users/register` | ❌ | Register new user |
| POST | `/users/login` | ❌ | Login user |
| GET | `/users/profile` | ✅ | Get user profile |

### Channels
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/channels` | ❌ | Get all channels |
| GET | `/channels/:id` | ❌ | Get channel by ID |
| POST | `/channels` | ✅ | Create channel |
| PUT | `/channels/:id` | ✅ | Update channel |
| DELETE | `/channels/:id` | ✅ | Delete channel |

### Videos
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/videos/:id` | ❌ | Get video by ID |
| GET | `/videos/:id/preview` | ❌ | Get video preview (2 min) |
| GET | `/videos/channel/:channelId` | ❌ | Get videos by channel |
| POST | `/videos` | ✅ | Create video |
| PUT | `/videos/:id` | ✅ | Update video |
| DELETE | `/videos/:id` | ✅ | Delete video |

### Live Streams
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/live-streams` | ❌ | Get all live streams |
| GET | `/live-streams/:id` | ❌ | Get live stream by ID |
| GET | `/live-streams/channel/:channelId` | ❌ | Get live streams by channel |
| POST | `/live-streams` | ✅ | Create live stream |
| PUT | `/live-streams/:id/status` | ✅ | Update live stream status |
| POST | `/live-streams/:id/end` | ✅ | End live stream |

### Watch History
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/watch-history` | ✅ | Get watch history |
| GET | `/watch-history/continue/watching` | ✅ | Get continue watching |
| GET | `/watch-history/completed` | ✅ | Get completed videos |
| PUT | `/watch-history/:videoId` | ✅ | Update watch progress |

### Stream Tokens
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/stream-tokens/verify` | ❌ | Verify stream token |
| POST | `/stream-tokens/video/:videoId` | ✅ | Generate video token |
| POST | `/stream-tokens/live/:liveStreamId` | ✅ | Generate live token |
| DELETE | `/stream-tokens/:token` | ✅ | Revoke token |
| GET | `/stream-tokens` | ✅ | Get user tokens |

---

## Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | GET, PUT, DELETE success |
| 201 | Created | POST success |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Database/server error |

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // response payload
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
```

---

## Common Request Bodies

### Register User
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "SecurePassword123"
}
```

### Login User
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

### Create Channel
```json
{
  "name": "Channel Name",
  "description": "Channel description",
  "bannerUrl": "https://example.com/banner.jpg"
}
```

### Create Video
```json
{
  "channelId": "channel-id",
  "title": "Video Title",
  "duration": 3600,
  "fileUrl": "https://cdn.example.com/video.mp4"
}
```

### Create Live Stream
```json
{
  "channelId": "channel-id",
  "title": "Live Stream Title"
}
```

### Update Watch History
```json
{
  "currentTime": 1800
}
```

### Update Live Stream Status
```json
{
  "status": "LIVE",
  "viewerCount": 100
}
```

### End Live Stream
```json
{
  "recordingUrl": "https://cdn.example.com/recording.mp4"
}
```

---

## Environment Variables for Postman

```
base_url = http://localhost:3000
email = test@example.com
username = testuser
password = TestPassword123
jwt_token = (set after login)
channel_id = (set after creating channel)
video_id = (set after creating video)
livestream_id = (set after creating livestream)
stream_token = (set after generating token)
```

---

## Video Status Options
- `ACTIVE` - Available for viewing
- `PROCESSING` - Being processed
- `ARCHIVED` - Archived content

## Live Stream Status Options
- `OFFLINE` - Not streaming
- `SCHEDULED` - Scheduled to go live
- `LIVE` - Currently streaming
- `ENDED` - Stream ended

---

## Token Expiry Times
- **Video Token**: 24 hours
- **Live Stream Token**: 1 hour
- **JWT Token**: Configurable (typically 1 hour)

---

## Common Testing Patterns

### Test Authentication Flow
1. `POST /api/users/register` → Get new account
2. `POST /api/users/login` → Get JWT token
3. Use JWT token in subsequent requests

### Test Channel Management
1. `POST /api/channels` → Create channel
2. `GET /api/channels/:id` → Retrieve
3. `PUT /api/channels/:id` → Update
4. `DELETE /api/channels/:id` → Delete

### Test Video Management
1. `POST /api/videos` → Create video
2. `GET /api/videos/:id` → Get details
3. `GET /api/videos/:id/preview` → Test preview
4. `PUT /api/watch-history/:videoId` → Track watching
5. `GET /api/watch-history/continue/watching` → Get continue list

---

## Postman Tips

### Auto-save JWT Token
In **Tests** tab of Login request:
```javascript
if (pm.response.code === 200) {
  var token = pm.response.json().data.token;
  pm.environment.set("jwt_token", token);
}
```

### Auto-save IDs
In **Tests** tab of Create Channel:
```javascript
if (pm.response.code === 201) {
  var id = pm.response.json().data.id;
  pm.environment.set("channel_id", id);
}
```

### Create Pre-request Script
In **Pre-request Script** tab:
```javascript
// Add timestamp
pm.environment.set("timestamp", Date.now());

// Add random string
const uuid = require('crypto').randomBytes(16).toString('hex');
pm.environment.set("random_string", uuid);
```

---

## Useful Postman Collections Features

### Collection Runner
1. Select multiple requests
2. Run them in sequence
3. Monitor pass/fail
4. Generate reports

### Monitor Collection
1. Create monitor from collection
2. Run at scheduled intervals
3. Track API uptime
4. Get alerts on failures

### Mock Server
1. Create mock responses
2. Test frontend without backend
3. Share with team

---

## Server Commands

### Start Development Server
```bash
cd /Users/surajpatel/Developer/FreeLancing/OTT-Backend
yarn dev
```

### View Database
```bash
npx prisma studio
# Opens at http://localhost:5555
```

### Run Migrations
```bash
npx prisma migrate dev --name <migration_name>
```

### Generate Prisma Client
```bash
npx prisma generate
```

### Build for Production
```bash
yarn build
yarn start
```

---

## Database Connection
```
Provider: PostgreSQL
URL: postgresql://suraj@localhost:5432/postgres?schema=public
Tables: User, Channel, Video, LiveStream, WatchHistory, StreamToken, ChannelAnalytics
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| 401 Unauthorized | Check JWT token is set and valid |
| 404 Not Found | Verify resource ID exists in database |
| 500 Server Error | Check server logs, restart server |
| Request timeout | Ensure server is running on port 3000 |
| CORS error | Check CORS configuration in server |
| Database error | Check DATABASE_URL in .env file |

---

## Performance Tips

1. **Use pagination** - Add `?limit=10&page=1` to list endpoints
2. **Cache tokens** - Store valid tokens to avoid API calls
3. **Batch operations** - Group related operations
4. **Monitor logs** - Watch server output during testing

---

## Security Notes

1. ✅ Never commit JWT secrets to version control
2. ✅ Use HTTPS in production
3. ✅ Rotate tokens regularly
4. ✅ Validate all user inputs
5. ✅ Use strong passwords
6. ✅ Enable CORS only for trusted domains
7. ✅ Rate limit authentication endpoints

---

## Next Testing Steps

- [ ] Load testing with Artillery
- [ ] API documentation (Swagger)
- [ ] Integration tests (Jest)
- [ ] Security testing (OWASP)
- [ ] Performance profiling
- [ ] Automated testing pipeline

---

For detailed testing steps, see **TESTING_STEPS.md**
