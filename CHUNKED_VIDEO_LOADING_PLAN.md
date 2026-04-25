# Chunked Video Loading from S3 - Implementation Plan

## Problem Statement
Currently, the OTT platform loads entire videos into memory or streams them without proper chunking, causing:
- **High latency**: Large files take time to load
- **Memory exhaustion**: Server memory fills up with multiple concurrent users
- **Bandwidth wastage**: Unnecessary data transfer for partially watched videos
- **Poor UX**: Users with slow connections experience buffering
- **Scalability issues**: Cannot handle many concurrent viewers

## Solution Architecture

### Core Concept: HTTP Range Requests
Use HTTP 206 Partial Content responses to serve video chunks on-demand, allowing:
- Clients to request specific byte ranges
- Resume capability if connection drops
- Adaptive bitrate selection
- Server-side bandwidth optimization

---

## Implementation Phases

### Phase 1: Backend Infrastructure Setup

#### 1.1 Install Dependencies
```bash
npm install aws-sdk dotenv
# or for recent AWS SDK:
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage
```

#### 1.2 Create S3 Service Layer (`src/lib/s3.ts`)
```typescript
// S3 helper to:
// - Initialize S3 client
// - Get object metadata (size, content-type)
// - Generate presigned URLs
// - Handle range requests
// - Stream chunks to client
```

#### 1.3 Add Environment Variables
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your_bucket
CHUNK_SIZE=1048576  // 1MB chunks
```

#### 1.4 Update Prisma Schema (Optional Enhancement)
```prisma
model Video {
  // ... existing fields
  fileSize          Int?      // Store S3 file size for Range validation
  contentType       String?   // Store video MIME type (video/mp4, etc.)
  streamUrl         String?   // CDN URL if using CloudFront
}
```

---

### Phase 2: Streaming Endpoint Implementation

#### 2.1 Create Streaming Controller (`src/controllers/videoStream.ts`)

**Key Features:**
- Parse `Range` header from client request
- Validate range against video file size
- Return 206 Partial Content response
- Support multiple range formats:
  - `bytes=0-1023` (first 1024 bytes)
  - `bytes=1024-` (from byte 1024 to end)
  - `bytes=-1024` (last 1024 bytes)
  - `bytes=0-1023,2048-3071` (multiple ranges)

#### 2.2 Endpoint Design

**Route:** `GET /api/videos/:id/stream`

**Request Headers:**
```
Range: bytes=0-1048575
```

**Response Headers (206 Partial Content):**
```
HTTP/1.1 206 Partial Content
Content-Type: video/mp4
Content-Length: 1048576
Content-Range: bytes 0-1048575/104857600
Accept-Ranges: bytes
```

**Response Headers (Full Content):**
```
HTTP/1.1 200 OK
Content-Type: video/mp4
Content-Length: 104857600  // Full file size
Accept-Ranges: bytes
```

#### 2.3 Implementation Steps

1. **Fetch video metadata from database or S3:**
   ```typescript
   const video = await prisma.video.findUnique({ where: { id } });
   const s3Object = await getS3ObjectMetadata(video.fileUrl);
   const totalSize = s3Object.ContentLength;
   ```

2. **Parse Range header:**
   ```typescript
   const rangeHeader = req.headers.range;
   const { start, end } = parseRangeHeader(rangeHeader, totalSize);
   ```

3. **Stream from S3 with GetObject Range:**
   ```typescript
   const s3Stream = await s3Client.getObject({
     Bucket: AWS_S3_BUCKET,
     Key: videoKey,
     Range: `bytes=${start}-${end}`
   });
   ```

4. **Send response with proper headers:**
   ```typescript
   res.status(206);
   res.setHeader('Content-Type', 'video/mp4');
   res.setHeader('Content-Length', chunkSize);
   res.setHeader('Content-Range', `bytes ${start}-${end}/${totalSize}`);
   res.setHeader('Accept-Ranges', 'bytes');
   res.setHeader('Cache-Control', 'public, max-age=3600');
   ```

---

### Phase 3: Client-Side Implementation

#### 3.1 Video Player Configuration

**HTML5 Video Element:**
```html
<video controls>
  <source src="/api/videos/:id/stream" type="video/mp4">
</video>
```

**Browser handles Range requests automatically** when using native `<video>` element.

#### 3.2 Custom Player (if needed)

```typescript
const video = document.querySelector('video');

// Browser automatically sends Range headers
// No additional client code needed for basic streaming

// For progress tracking:
video.addEventListener('progress', () => {
  console.log('Buffered ranges:', video.buffered);
});

video.addEventListener('seeking', (e) => {
  // Browser handles resuming from new position
  const timestamp = video.currentTime * 1000;
  const rangeStart = calculateBytePosition(timestamp);
});
```

#### 3.3 Advanced Client Features

- **Adaptive Bitrate Streaming** (future): Generate multiple quality versions
- **Resume Support**: Store last watched position in `WatchHistory`
- **Preload Optimization**: Prefetch next chunks intelligently

---

### Phase 4: Database & Analytics Enhancements

#### 4.1 Add Streaming Metrics Table

```prisma
model StreamingMetrics {
  id              String @id @default(cuid())
  videoId         String
  userId          String?
  chunksRequested Int
  totalBytesServed Int
  timestamp       DateTime @default(now())
  
  // Relationships
  video          Video @relation(fields: [videoId], references: [id])
  
  @@index([videoId])
  @@index([timestamp])
}
```

#### 4.2 Track Streaming Usage
- Log chunks served per video
- Monitor bandwidth consumption
- Identify popular content
- Detect abuse patterns

---

### Phase 5: Performance & Reliability

#### 5.1 Caching Strategy

**Server-side:**
```typescript
// Cache S3 object metadata
const cacheKey = `video-metadata:${videoId}`;
const cached = await redis.get(cacheKey);
if (!cached) {
  const metadata = await getS3Metadata(...);
  await redis.setex(cacheKey, 3600, metadata);
}
```

**Client-side:**
```
Cache-Control: public, max-age=3600
```

#### 5.2 CDN Integration (CloudFront)

- Set up CloudFront distribution pointing to S3
- Replace S3 direct URLs with CloudFront domain
- Automatic edge caching closer to users
- Reduced latency by 50-80%

```typescript
// Update Prisma Video model
streamUrl: "https://d123456.cloudfront.net/video-key"
```

#### 5.3 Error Handling

- Handle invalid ranges
- Handle missing files
- Handle permission errors
- Implement retry logic
- Graceful degradation

```typescript
try {
  // Stream logic
} catch (error) {
  if (error.Code === 'NoSuchKey') {
    res.status(404).json({ error: 'Video not found' });
  } else if (error.Code === 'AccessDenied') {
    res.status(403).json({ error: 'Unauthorized' });
  } else {
    res.status(500).json({ error: 'Stream error' });
  }
}
```

#### 5.4 Security Measures

- **Presigned URLs**: Use time-limited S3 URLs for clients
- **Rate Limiting**: Limit requests per IP/user
- **Authentication**: Verify user has access to video
- **Token Expiration**: Rotate stream tokens regularly

```typescript
// Generate presigned URL (valid for 1 hour)
const presignedUrl = await s3Client.getSignedUrl('getObject', {
  Bucket: AWS_S3_BUCKET,
  Key: videoKey,
  Expires: 3600
});
```

---

## Implementation Roadmap

### Week 1: Core Setup
- [ ] Install AWS SDK
- [ ] Create S3 service layer
- [ ] Implement Range header parsing
- [ ] Create `/api/videos/:id/stream` endpoint

### Week 2: Testing & Optimization
- [ ] Unit tests for Range parsing
- [ ] Integration tests with S3
- [ ] Load testing with multiple concurrent streams
- [ ] Benchmark latency improvements

### Week 3: Enhancement
- [ ] Add streaming metrics tracking
- [ ] Implement caching layer
- [ ] Add presigned URL support
- [ ] Security testing

### Week 4: Production
- [ ] Set up CloudFront CDN
- [ ] Performance monitoring
- [ ] Rate limiting & throttling
- [ ] Deploy to production

---

## Performance Improvements Expected

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Initial Load Time | 3-5s | 0.5-1s | 75-85% |
| Memory per Stream | 500MB | 10-20MB | 95% |
| Max Concurrent Viewers | 10-20 | 500-1000 | 50-100x |
| Bandwidth/User | 100% of filesize | 30-50% | 50-70% |
| Seek Time | 5-10s | 0.5-1s | 90% |

---

## Example Flow Diagram

```
User opens video
    ↓
Browser loads <video> element with src="/api/videos/:id/stream"
    ↓
Browser sends: GET /api/videos/:id/stream (no Range header)
    ↓
Backend returns: 200 OK + Accept-Ranges: bytes + metadata
    ↓
Video player starts buffering first chunk
    ↓
Browser sends: GET /api/videos/:id/stream
              Range: bytes=0-1048575
    ↓
Backend streams:
  - Get object from S3 (key)
  - Extract requested range
  - Return 206 Partial Content
  - Stream chunk to client
    ↓
Browser buffers chunk, plays video
    ↓
User seeks → Browser sends Range for new position
    ↓
Backend streams next chunk from S3
    ↓
Repeat until video complete
```

---

## Files to Create/Modify

### New Files
1. `src/lib/s3.ts` - S3 service layer
2. `src/controllers/videoStream.ts` - Streaming controller
3. `src/utils/rangeParser.ts` - Range header parsing utility
4. `src/routes/videoStream.ts` - Streaming routes

### Modified Files
1. `src/server.ts` - Register streaming routes
2. `prisma/schema.prisma` - Add fileSize & contentType (optional)
3. `package.json` - Add AWS SDK dependencies
4. `.env` - Add AWS configuration

---

## Testing Checklist

- [ ] Range parsing works for all formats
- [ ] Video plays smoothly with chunked loading
- [ ] Seeking works correctly
- [ ] Resuming interrupted stream works
- [ ] Multiple concurrent streams work
- [ ] Error handling for invalid ranges
- [ ] Performance meets targets
- [ ] Security validation passes
- [ ] Load testing (100+ concurrent streams)

---

## Next Steps

1. **Start with Phase 1**: Set up AWS SDK and S3 service
2. **Implement Phase 2**: Create streaming endpoint
3. **Test thoroughly**: Verify with browser DevTools
4. **Optimize**: Add caching and CDN
5. **Monitor**: Track metrics in production

Would you like me to proceed with implementing Phase 1 (S3 service layer) and Phase 2 (streaming endpoint)?
