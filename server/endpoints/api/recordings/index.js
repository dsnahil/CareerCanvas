const path = require("path");
const fs = require("fs");
const { handleVideoUpload, getVideoUrl, deleteVideo } = require("../../../utils/files/videoStorage");
const { EventLogs } = require("../../../models/eventLogs");
const mime = require("mime-types");

function recordingsEndpoints(app) {
  if (!app) return;

  // Upload a video recording
  app.post(
    "/api/recordings/upload",
    [handleVideoUpload],
    async (request, response) => {
      try {
        if (!request.file || !request.videoFileName) {
          response
            .status(400)
            .json({
              success: false,
              error: "No video file provided",
            })
            .end();
          return;
        }

        const videoFileName = request.videoFileName;
        const videoUrl = getVideoUrl(videoFileName);
        
        // Log the event
        await EventLogs.logEvent("video_recording_uploaded", {
          fileName: videoFileName,
        });
        
        response.status(200).json({
          success: true,
          error: null,
          recording: {
            fileName: videoFileName,
            url: videoUrl,
            uploadedAt: new Date().toISOString(),
          },
        });
      } catch (e) {
        console.error("Error uploading video recording:", e);
        response.status(500).json({
          success: false,
          error: "Failed to upload video recording",
        }).end();
      }
    }
  );

  // Serve a video recording
  app.get(
    "/api/recordings/video/:fileName",
    async (request, response) => {
      try {
        const { fileName } = request.params;
        
        // Validate filename to prevent directory traversal
        if (!fileName || fileName.includes("..") || fileName.includes("/")) {
          response.status(400).json({
            success: false,
            error: "Invalid file name",
          }).end();
          return;
        }
        
        const uploadOutput =
          process.env.NODE_ENV === "development"
            ? path.resolve(__dirname, `../../../storage/recordings`)
            : path.resolve(process.env.STORAGE_DIR, "recordings");
        
        const filePath = path.join(uploadOutput, fileName);
        
        console.log("Debug - Video request:", {
          fileName,
          filePath,
          exists: fs.existsSync(filePath)
        });
        
        if (!fs.existsSync(filePath)) {
          console.log("Debug - Video file not found");
          response.status(404).json({
            success: false,
            error: "Video not found",
          }).end();
          return;
        }
        
        // Determine MIME type with explicit codec information for better browser handling
        const fileExt = path.extname(filePath).toLowerCase();
        let mimeType = 'video/webm; codecs=vp8,opus';
        
        if (fileExt === '.mp4') {
          mimeType = 'video/mp4';
        } else if (fileExt === '.webm') {
          mimeType = 'video/webm; codecs=vp8,opus';
        } else {
          mimeType = mime.lookup(filePath) || 'video/webm; codecs=vp8,opus';
        }
        
        // Set appropriate headers for video streaming
        response.set({
          'Content-Type': mimeType,
          'Content-Disposition': `inline; filename="${fileName}"`,
          'Accept-Ranges': 'bytes',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
          'Access-Control-Allow-Headers': 'Content-Type, Range, Origin, Accept',
          'Access-Control-Expose-Headers': 'Content-Length, Content-Range',
          'Cache-Control': 'no-cache, no-store, must-revalidate', // Prevent caching issues
          'Cross-Origin-Resource-Policy': 'cross-origin'
        });
        
        // Handle range requests for video seeking
        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const range = request.headers.range;
        
        if (range) {
          const parts = range.replace(/bytes=/, "").split("-");
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
          
          // For audio continuity, use larger chunks but not too large
          // This helps ensure audio frames aren't split across requests
          const maxChunkSize = 1024 * 1024 * 4; // 4MB chunks for better audio continuity
          const minChunkSize = 1024 * 256; // 256KB minimum to ensure complete audio frames
          const requestedChunkSize = (end - start) + 1;
          
          // Ensure chunk size is at least the minimum for audio continuity
          const chunksize = Math.max(
            Math.min(requestedChunkSize, maxChunkSize),
            Math.min(minChunkSize, fileSize - start)
          );
          
          const adjustedEnd = Math.min(start + chunksize - 1, fileSize - 1);
          
          console.log("Debug - Range request:", { 
            start, 
            requestedEnd: end,
            adjustedEnd,
            requestedChunkSize,
            chunksize,
            fileSize
          });
          
          response.status(206);
          response.set({
            'Content-Range': `bytes ${start}-${adjustedEnd}/${fileSize}`,
            'Content-Length': chunksize
          });
          
          const stream = fs.createReadStream(filePath, { 
            start, 
            end: adjustedEnd,
            highWaterMark: 1024 * 512 // Use larger buffer for smoother streaming
          });
          
          stream.on('error', (err) => {
            console.error("Stream error:", err);
            if (!response.headersSent) {
              response.status(500).json({
                success: false,
                error: "Error streaming video"
              }).end();
            }
          });
          
          stream.pipe(response);
        } else {
          console.log("Debug - Full file request");
          response.set({
            'Content-Length': fileSize
          });
          
          // Stream the file with larger buffer for smoother playback
          const fileStream = fs.createReadStream(filePath, {
            highWaterMark: 1024 * 1024 // 1MB buffer
          });
          
          fileStream.on('error', (err) => {
            console.error("Stream error:", err);
            if (!response.headersSent) {
              response.status(500).json({
                success: false,
                error: "Error streaming video"
              }).end();
            }
          });
          
          fileStream.pipe(response);
        }
      } catch (e) {
        console.error("Debug - Error serving video recording:", {
          error: e.message,
          stack: e.stack
        });
        
        response.status(500).json({
          success: false,
          error: "Failed to serve video recording",
        }).end();
      }
    }
  );

  // Handle OPTIONS request for CORS preflight
  app.options(
    "/api/recordings/video/:fileName",
    (request, response) => {
      response.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Range',
        'Access-Control-Max-Age': '86400'
      });
      response.end();
    }
  );

  // Delete a video recording
  app.delete(
    "/api/recordings/video/:fileName",
    async (request, response) => {
      try {
        const { fileName } = request.params;
        
        // Validate filename to prevent directory traversal
        if (!fileName || fileName.includes("..") || fileName.includes("/")) {
          response.status(400).json({
            success: false,
            error: "Invalid file name",
          }).end();
          return;
        }
        
        const success = await deleteVideo(fileName);
        
        if (!success) {
          response.status(404).json({
            success: false,
            error: "Video not found or could not be deleted",
          }).end();
          return;
        }
        
        // Log the event
        await EventLogs.logEvent("video_recording_deleted", {
          fileName,
        });
        
        response.status(200).json({
          success: true,
          error: null,
        });
      } catch (e) {
        console.error("Error deleting video recording:", e);
        response.status(500).json({
          success: false,
          error: "Failed to delete video recording",
        }).end();
      }
    }
  );
}

module.exports = {
  recordingsEndpoints,
}; 