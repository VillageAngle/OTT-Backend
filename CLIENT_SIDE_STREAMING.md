# Client-Side Video Streaming Guide

## Overview

The backend now supports chunked video streaming with HTTP Range requests. This guide shows how to implement smooth video playback on the client side.

## Quick Start: HTML5 Video Player

### Basic Implementation
```html
<!DOCTYPE html>
<html>
<head>
    <title>OTT Video Player</title>
    <style>
        #video-container {
            max-width: 100%;
            margin: 20px auto;
        }
        video {
            width: 100%;
            height: auto;
        }
        #video-info {
            background: #f5f5f5;
            padding: 15px;
            margin: 10px 0;
            border-radius: 4px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div id="video-container">
        <h1 id="video-title">Loading...</h1>
        <video id="video-player" controls>
            <source src="" type="video/mp4">
            Your browser does not support the video tag.
        </video>
        <div id="video-info"></div>
    </div>

    <script src="video-player.js"></script>
</body>
</html>
```

### JavaScript Implementation (`video-player.js`)
```javascript
/**
 * Smooth OTT Video Player
 * Handles chunked streaming with adaptive buffering
 */

class OTTVideoPlayer {
    constructor(videoElementId, videoId, apiBaseUrl) {
        this.video = document.getElementById(videoElementId);
        this.videoId = videoId;
        this.apiBaseUrl = apiBaseUrl || 'http://localhost:3000/api';
        this.streamInfo = null;
        this.init();
    }

    async init() {
        try {
            // Get video metadata and streaming info
            await this.loadStreamInfo();
            
            // Set video source - browser handles Range requests automatically
            const streamUrl = `${this.apiBaseUrl}/video-stream/${this.videoId}/stream`;
            this.video.src = streamUrl;
            
            // Display video info
            this.displayVideoInfo();
            
            // Set up event listeners for smooth playback
            this.setupEventListeners();
            
            console.log('✅ Video player ready for streaming');
        } catch (error) {
            console.error('❌ Failed to initialize video player:', error);
            this.displayError(error.message);
        }
    }

    /**
     * Load video metadata and streaming capabilities
     */
    async loadStreamInfo() {
        const response = await fetch(
            `${this.apiBaseUrl}/video-stream/${this.videoId}/stream-info`
        );
        
        if (!response.ok) {
            throw new Error('Failed to load video info');
        }
        
        const result = await response.json();
        this.streamInfo = result.data;
        return this.streamInfo;
    }

    /**
     * Display video information
     */
    displayVideoInfo() {
        if (!this.streamInfo) return;
        
        const { video, streaming } = this.streamInfo;
        const infoDiv = document.getElementById('video-info');
        
        const sizeInMB = (streaming.fileSize / (1024 * 1024)).toFixed(2);
        const chunkInKB = (streaming.adaptiveChunkSize / 1024).toFixed(2);
        const durationInMin = Math.floor(video.duration / 60);
        
        infoDiv.innerHTML = `
            <strong>Video Info:</strong><br>
            📹 Duration: ${durationInMin} minutes<br>
            📊 File Size: ${sizeInMB} MB<br>
            ⚡ Adaptive Chunk: ${chunkInKB} KB<br>
            🌐 Network: ${streaming.estimatedBandwidth} bytes/sec<br>
            ✅ Range Support: ${streaming.supportRange ? 'Yes' : 'No'}
        `;
        
        // Update title
        document.getElementById('video-title').textContent = video.title;
    }

    /**
     * Set up video event listeners for monitoring
     */
    setupEventListeners() {
        // Monitor buffering progress
        this.video.addEventListener('progress', () => {
            this.logBufferStatus();
        });

        // Track playback
        this.video.addEventListener('play', () => {
            console.log('▶️ Playback started');
        });

        this.video.addEventListener('pause', () => {
            console.log('⏸️ Playback paused');
        });

        // Monitor seeking - should be instant with chunked streaming
        this.video.addEventListener('seeking', () => {
            const time = this.formatTime(this.video.currentTime);
            console.log(`🔍 Seeking to ${time}`);
        });

        this.video.addEventListener('seeked', () => {
            const time = this.formatTime(this.video.currentTime);
            console.log(`✅ Seeked to ${time}`);
        });

        // Error handling
        this.video.addEventListener('error', (e) => {
            console.error('❌ Video error:', e);
            this.displayError('Playback error. Check browser console.');
        });

        // Monitor for buffering delays (should be minimal)
        this.video.addEventListener('waiting', () => {
            console.log('⏳ Buffering...');
        });

        this.video.addEventListener('canplay', () => {
            console.log('✅ Buffering complete, can play');
        });
    }

    /**
     * Log buffer status for debugging
     */
    logBufferStatus() {
        if (this.video.buffered.length > 0) {
            const buffered = [];
            for (let i = 0; i < this.video.buffered.length; i++) {
                buffered.push({
                    start: this.formatTime(this.video.buffered.start(i)),
                    end: this.formatTime(this.video.buffered.end(i))
                });
            }
            // Log occasionally to avoid spam
            if (Math.random() < 0.1) {
                console.log('Buffer status:', buffered);
            }
        }
    }

    /**
     * Display error message to user
     */
    displayError(message) {
        const infoDiv = document.getElementById('video-info');
        infoDiv.innerHTML = `<div style="color: red; font-weight: bold;">❌ ${message}</div>`;
    }

    /**
     * Format time in seconds to MM:SS
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Get current playback position
     */
    getCurrentTime() {
        return this.video.currentTime;
    }

    /**
     * Get total duration
     */
    getDuration() {
        return this.video.duration;
    }

    /**
     * Save watch progress to backend
     */
    async saveProgress() {
        if (!this.videoId) return;
        
        const progress = (this.video.currentTime / this.video.duration) * 100;
        
        try {
            await fetch(`${this.apiBaseUrl}/watch-history`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    videoId: this.videoId,
                    watchDuration: Math.floor(this.video.currentTime),
                    totalDuration: Math.floor(this.video.duration),
                    progress: Math.floor(progress),
                    isCompleted: progress > 90
                })
            });
        } catch (error) {
            console.error('Failed to save progress:', error);
        }
    }

    /**
     * Get auth token from storage (implement as per your auth system)
     */
    getAuthToken() {
        return localStorage.getItem('authToken') || '';
    }
}

// Initialize player when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Get video ID from URL params or data attribute
    const videoId = new URLSearchParams(window.location.search).get('id') 
                 || document.body.dataset.videoId;
    
    if (!videoId) {
        console.error('Video ID not provided');
        return;
    }

    // Create player instance
    window.videoPlayer = new OTTVideoPlayer('video-player', videoId);

    // Save progress periodically
    setInterval(() => {
        window.videoPlayer.saveProgress();
    }, 5000); // Every 5 seconds

    // Save progress before leaving page
    window.addEventListener('beforeunload', () => {
        window.videoPlayer.saveProgress();
    });
});
```

## Advanced: Custom Player with HLS Support

For better adaptive bitrate (future enhancement):

```javascript
/**
 * Advanced Player with HLS Support
 * (requires hls.js library)
 */

class AdvancedOTTPlayer extends OTTVideoPlayer {
    async init() {
        // For future use with HLS streaming
        // Example: when implementing adaptive bitrate
        
        if (this.streamInfo?.streaming.supportHLS) {
            this.initializeHLS();
        } else {
            // Fall back to standard streaming
            await super.init();
        }
    }

    initializeHLS() {
        // This would use hls.js for adaptive streaming
        // Implementation depends on your HLS setup
        console.log('HLS support added for future');
    }
}
```

## Monitoring Playback Quality

### Collect Metrics
```javascript
class PlaybackMetrics {
    constructor(player) {
        this.player = player.video;
        this.metrics = {
            bufferingEvents: 0,
            seekCount: 0,
            errorCount: 0,
            totalPlayTime: 0,
            abandonedTime: null
        };
        
        this.setupTracking();
    }

    setupTracking() {
        this.player.addEventListener('waiting', () => {
            this.metrics.bufferingEvents++;
        });

        this.player.addEventListener('seeking', () => {
            this.metrics.seekCount++;
        });

        this.player.addEventListener('error', () => {
            this.metrics.errorCount++;
        });
    }

    getMetrics() {
        return {
            ...this.metrics,
            playbackQuality: this.calculateQuality()
        };
    }

    calculateQuality() {
        // Low buffering + many seeks = good network quality
        if (this.metrics.bufferingEvents < 2 && this.metrics.seekCount > 5) {
            return 'excellent';
        }
        if (this.metrics.bufferingEvents < 5) {
            return 'good';
        }
        return 'fair';
    }

    async reportMetrics(videoId) {
        // Send metrics to backend
        await fetch('/api/analytics/playback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                videoId,
                metrics: this.getMetrics(),
                timestamp: new Date()
            })
        });
    }
}
```

## Testing Chunked Streaming

### Test in Browser DevTools

1. **Open DevTools** → Network tab
2. **Play video** → Watch network requests
3. **Look for**:
   - Multiple GET requests with Range headers
   - 206 Partial Content responses
   - Small, frequent requests (chunks)

### Expected Behavior
```
Request 1: Range: bytes=0-262143        → 206 Partial Content
Request 2: Range: bytes=262144-524287   → 206 Partial Content
Request 3: Range: bytes=524288-786431   → 206 Partial Content
...
```

### Test Seeking
1. **Play for a few seconds** → Let it buffer
2. **Click to seek** → Should be instant (<100ms)
3. **Check Network tab** → New Range request to that position

## Smooth Playback Tips

### ✅ DO:
- Use native `<video>` element (handles Range automatically)
- Let browser manage buffering
- Monitor metrics to detect issues
- Save progress periodically

### ❌ DON'T:
- Load entire video into memory
- Make manual chunk requests (let browser handle it)
- Ignore buffering status
- Play while streaming hasn't started

## Troubleshooting Client-Side

### Issue: "Seeking is slow"
```javascript
// Check if Range is supported
console.log(video.canPlayType('video/mp4'));
// Should show: "probably" or "maybe"

// Browser should send Range headers automatically
// If not: check browser compatibility (older IE?)
```

### Issue: "Buffering forever"
```javascript
// Monitor buffer status
video.addEventListener('progress', () => {
    if (video.buffered.length > 0) {
        console.log('Buffered up to:', video.buffered.end(0));
    }
});
```

### Issue: "Video stops playing"
```javascript
// Add error handler
video.addEventListener('error', (e) => {
    console.error('Error:', e.target.error.code);
    // 1 = MEDIA_ERR_ABORTED
    // 2 = MEDIA_ERR_NETWORK
    // 3 = MEDIA_ERR_DECODE
    // 4 = MEDIA_ERR_SRC_NOT_SUPPORTED
});
```

## Performance Optimization

### Preload Video Metadata
```javascript
// Faster seeking response
video.preload = 'metadata';
```

### Throttle Progress Tracking
```javascript
// Not every frame, only occasionally
let lastSave = 0;
video.addEventListener('timeupdate', () => {
    const now = Date.now();
    if (now - lastSave > 5000) { // Every 5 seconds
        saveProgress();
        lastSave = now;
    }
});
```

### Cleanup on Page Exit
```javascript
window.addEventListener('unload', () => {
    video.pause();
    video.src = ''; // Clear source
});
```

## Cross-Browser Support

| Browser | Range Support | Status |
|---------|---------------|--------|
| Chrome | ✅ Yes | Excellent |
| Firefox | ✅ Yes | Excellent |
| Safari | ✅ Yes | Excellent |
| Edge | ✅ Yes | Excellent |
| IE 11 | ⚠️ Limited | Use fallback |

## Example HTML Page

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTT Video Platform</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto; }
        
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        
        .player-wrapper {
            position: relative;
            padding-top: 56.25%; /* 16:9 */
            background: #000;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        
        .player-wrapper video {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }
        
        .video-info {
            background: #f9f9f9;
            padding: 20px;
            margin-top: 20px;
            border-radius: 8px;
            border-left: 4px solid #007bff;
        }
        
        .info-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        
        .info-item:last-child { border-bottom: none; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎬 OTT Video Streaming</h1>
        
        <div class="player-wrapper">
            <video id="video-player" controls preload="metadata">
                <source type="video/mp4">
                Your browser does not support HTML5 video.
            </video>
        </div>
        
        <div class="video-info" id="video-info">
            Loading video information...
        </div>
    </div>

    <script src="video-player.js"></script>
</body>
</html>
```

---

**Status**: ✅ Client-side implementation ready
**Browser Support**: ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
**Range Request**: ✅ Automatic (no code needed)
