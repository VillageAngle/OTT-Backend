# Quick Start Guide - Video Streaming

## 30-Minute Setup

### Step 1: Install Dependencies (2 min)
```bash
npm install
```

### Step 2: Configure AWS Credentials (3 min)

Edit `.env`:
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_KEY
AWS_S3_BUCKET=your-s3-bucket-name
```

**How to get AWS credentials:**
1. Go to AWS Console → IAM → Users
2. Click "Security credentials"
3. Create new access key (keep secret key safe!)
4. Use both values in `.env`

**Bucket permissions needed:**
- `s3:GetObject` - Read video files
- `s3:HeadObject` - Get file metadata

### Step 3: Start Server (1 min)
```bash
npm run dev
```

Should see:
```
Server running on port 3000
Available endpoints:
  GET  /health
  POST /api/users/register
```

### Step 4: Test Streaming (5 min)

**Get a video ID from your database:**
```bash
# Connect to your database and get a video ID
psql postgresql://user:pass@localhost:5432/ott_db
SELECT id FROM "Video" LIMIT 1;
```

**Test with curl:**
```bash
VIDEO_ID="your-video-id-here"

# Get video info
curl http://localhost:3000/api/video-stream/$VIDEO_ID/stream-info

# Stream full video
curl http://localhost:3000/api/video-stream/$VIDEO_ID/stream \
  -o video_full.mp4

# Stream first 1MB
curl -H "Range: bytes=0-1048575" \
  http://localhost:3000/api/video-stream/$VIDEO_ID/stream \
  -o video_chunk.mp4
```

### Step 5: Test in Browser (10 min)

Create `test.html`:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Video Player Test</title>
</head>
<body>
    <h1>OTT Streaming Test</h1>
    
    <video width="800" height="600" controls>
        <source src="http://localhost:3000/api/video-stream/VIDEO_ID/stream" type="video/mp4">
    </video>

    <div id="info"></div>

    <script>
        const VIDEO_ID = "YOUR-VIDEO-ID";
        
        fetch(`http://localhost:3000/api/video-stream/${VIDEO_ID}/stream-info`)
            .then(r => r.json())
            .then(d => {
                const info = d.data.streaming;
                document.getElementById('info').innerHTML = `
                    <h3>Streaming Info:</h3>
                    <p>File Size: ${(info.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                    <p>Chunk Size: ${(info.adaptiveChunkSize / 1024).toFixed(2)} KB</p>
                    <p>Supports Range: ${info.supportRange ? 'Yes' : 'No'}</p>
                `;
            })
            .catch(e => console.error('Error:', e));
    </script>
</body>
</html>
```

Replace `YOUR-VIDEO-ID` with actual ID and open in browser.

**Check Network tab in DevTools:**
1. Play video
2. Open DevTools → Network tab
3. Look for requests with `Range: bytes=...`
4. Should see `206 Partial Content` responses

---

## Verification Checklist

- [ ] AWS credentials configured in `.env`
- [ ] `npm install` completed successfully
- [ ] Server running on port 3000
- [ ] Can fetch `/health` endpoint
- [ ] Can fetch `/api/video-stream/VIDEOID/stream-info`
- [ ] Video plays in browser
- [ ] Browser Network tab shows Range requests
- [ ] HTTP 206 responses in Network tab

---

## Common Issues

### Issue: "No such file or directory: .env"
**Solution**: Create `.env` file in root directory with credentials

### Issue: "Invalid AWS credentials"
**Solution**: 
1. Verify credentials in AWS console
2. Check region matches bucket region
3. Verify IAM permissions for `s3:GetObject`

### Issue: "NoSuchBucket error"
**Solution**: Bucket name case-sensitive, must match exactly

### Issue: "Video plays but no Range headers"
**Solution**: 
1. Check browser console for errors
2. Verify video file exists in S3
3. Check bucket CORS configuration

### Issue: "ECONNREFUSED"
**Solution**: Server not running, try `npm run dev`

---

## Next Steps

### For Development
1. ✅ Verify streaming works locally
2. Deploy to staging server
3. Load test with multiple concurrent streams
4. Monitor performance metrics

### For Production
1. Set up CloudFront CDN
2. Enable S3 versioning
3. Set up CloudWatch monitoring
4. Configure auto-scaling
5. Enable S3 access logs

### Optional Enhancements
1. Add HLS streaming for adaptive bitrate
2. Implement analytics tracking
3. Add download capability
4. Implement pause/resume resume
5. Add subtitle support

---

## Performance Verification

### Expected Response Times
- Stream info: < 50ms
- First byte of video: < 200ms
- Subsequent chunks: < 100ms
- Seek time: < 100ms

### Expected Resource Usage
- CPU: < 5% per stream
- Memory: 10-20 MB per stream
- Bandwidth: 50-70% of file size

### Concurrent User Capacity
- Budget ~50MB RAM per stream
- Budget ~5% CPU per stream
- 4GB server: ~80 concurrent streams
- 16GB server: ~320 concurrent streams

---

## Testing with Different Files

```bash
# Test video files in S3
aws s3 ls s3://your-bucket/ --recursive

# Get file size
aws s3 ls s3://your-bucket/video.mp4 --human-readable

# Test partial download
curl -H "Range: bytes=0-9" \
  http://localhost:3000/api/video-stream/$VIDEO_ID/stream
# Should return exactly 10 bytes
```

---

## Monitoring in Production

### Health Check
```bash
curl http://localhost:3000/api/video-stream/health/status
```

Response shows active streams count.

### Log Streaming Errors
```bash
# Add to server.ts to debug
console.log(`Stream created for user ${userId}`);
```

### Monitor S3 Costs
AWS S3 charges per:
- GET requests: $0.0004 per 1,000
- Data transfer: ~$0.09 per GB

Metadata caching reduces requests by 50-80%.

---

## Performance Tuning

### Optimize for Mobile
```env
# Reduce chunk size
MAX_CHUNK_SIZE=512000
```

### Optimize for High Performance
```env
# Increase concurrent streams
MAX_CONCURRENT_STREAMS=5
```

### Optimize for Memory-Limited Servers
```env
# Reduce concurrent streams
MAX_CONCURRENT_STREAMS=1
```

---

**Status**: 🚀 Ready to stream!

For detailed info, see:
- `VIDEO_STREAMING_IMPLEMENTATION.md` - Full architecture
- `CLIENT_SIDE_STREAMING.md` - Frontend guide
