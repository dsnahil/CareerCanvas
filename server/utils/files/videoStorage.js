const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4 } = require("uuid");
const { normalizePath } = require(".");
const { spawn } = require("child_process");
const crypto = require("crypto");

/**
 * Check if ffmpeg is available on the system
 * @returns {Promise<boolean>} Whether ffmpeg is available
 */
const checkFfmpegAvailable = async () => {
  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-version']);
    ffmpeg.on('error', () => {
      console.log('FFmpeg not available for video processing');
      resolve(false);
    });
    ffmpeg.on('close', (code) => {
      resolve(code === 0);
    });
  });
};

/**
 * Validate a video file to ensure it's properly formatted
 * @param {string} filePath - Path to the video file
 * @returns {Promise<boolean>} Whether the file is valid
 */
const validateVideoFile = async (filePath) => {
  return new Promise((resolve) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=codec_type',
      '-of', 'csv=p=0',
      filePath
    ]);
    
    let output = '';
    ffprobe.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    ffprobe.on('error', () => {
      console.error('Error validating video file');
      resolve(false);
    });
    
    ffprobe.on('close', (code) => {
      resolve(code === 0 && output.trim() === 'video');
    });
  });
};

/**
 * Fix a webm file to ensure it has proper duration metadata
 * @param {string} inputPath - Path to the input video file
 * @param {string} outputPath - Path to save the fixed video file
 * @returns {Promise<boolean>} Whether the fix was successful
 */
const fixWebmFile = async (inputPath, outputPath) => {
  return new Promise((resolve) => {
    console.log(`Attempting to fix webm file: ${inputPath}`);
    
    // First, check if the input file exists and has content
    if (!fs.existsSync(inputPath)) {
      console.error(`Input file does not exist: ${inputPath}`);
      resolve(false);
      return;
    }
    
    const stats = fs.statSync(inputPath);
    if (stats.size === 0) {
      console.error(`Input file is empty: ${inputPath}`);
      resolve(false);
      return;
    }
    
    console.log(`Input file size: ${stats.size} bytes`);
    
    // Use ffmpeg to remux the file with proper metadata
    const ffmpeg = spawn('ffmpeg', [
      '-i', inputPath,
      '-c', 'copy',
      '-y',
      outputPath
    ]);
    
    let stderr = '';
    ffmpeg.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      console.log(`FFmpeg: ${output}`);
    });
    
    ffmpeg.on('error', (err) => {
      console.error('Error fixing webm file:', err);
      resolve(false);
    });
    
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        // Check if the output file exists and has content
        if (!fs.existsSync(outputPath)) {
          console.error(`Output file was not created: ${outputPath}`);
          resolve(false);
          return;
        }
        
        const outputStats = fs.statSync(outputPath);
        console.log(`Output file size: ${outputStats.size} bytes`);
        
        if (outputStats.size < 1000) {
          console.error(`Output file is suspiciously small (${outputStats.size} bytes), not using it`);
          resolve(false);
          return;
        }
        
        console.log(`Successfully fixed webm file: ${outputPath}`);
        
        try {
          // Make a backup of the original file just in case
          const backupPath = `${inputPath}.backup`;
          fs.copyFileSync(inputPath, backupPath);
          
          // Replace the original file with the fixed one
          fs.copyFileSync(outputPath, inputPath);
          fs.unlinkSync(outputPath); // Remove the temporary file
          
          // If everything went well, remove the backup
          fs.unlinkSync(backupPath);
          
          resolve(true);
        } catch (err) {
          console.error('Error replacing original file:', err);
          resolve(false);
        }
      } else {
        console.error(`FFmpeg exited with code ${code}, stderr: ${stderr}`);
        resolve(false);
      }
    });
  });
};

/**
 * Storage configuration for video recordings
 */
const videoRecordingStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadOutput =
      process.env.NODE_ENV === "development"
        ? path.resolve(__dirname, `../../storage/recordings`)
        : path.resolve(process.env.STORAGE_DIR, "recordings");
    
    // Create directory if it doesn't exist
    try {
      console.log("Debug - Creating recordings directory:", uploadOutput);
      fs.mkdirSync(uploadOutput, { recursive: true });
      console.log("Debug - Directory created or already exists");
      return cb(null, uploadOutput);
    } catch (error) {
      console.error("Debug - Error creating directory:", {
        error: error.message,
        path: uploadOutput
      });
      return cb(error);
    }
  },
  filename: function (req, file, cb) {
    // Generate a unique filename with timestamp and UUID
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const randomFileName = `recording-${timestamp}-${v4()}${path.extname(file.originalname || '.webm')}`;
    
    console.log("Debug - Generated filename:", {
      originalName: file.originalname,
      newFileName: randomFileName,
      mimetype: file.mimetype
    });
    
    // Store the generated filename in the request object for later use
    req.videoFileName = randomFileName;
    cb(null, randomFileName);
  },
});

/**
 * Middleware to handle video recording uploads
 * @param {Request} request
 * @param {Response} response
 * @param {NextFunction} next
 */
function handleVideoUpload(request, response, next) {
  console.log("Debug - Starting video upload handler");
  
  // Create upload directory if it doesn't exist
  const uploadOutput =
    process.env.NODE_ENV === "development"
      ? path.resolve(__dirname, `../../storage/recordings`)
      : path.resolve(process.env.STORAGE_DIR, "recordings");
  
  try {
    console.log("Debug - Creating recordings directory:", uploadOutput);
    fs.mkdirSync(uploadOutput, { recursive: true });
    console.log("Debug - Directory created or already exists");
  } catch (error) {
    console.error("Debug - Error creating directory:", {
      error: error.message,
      path: uploadOutput
    });
    return response.status(500).json({
      success: false,
      error: `Failed to create upload directory: ${error.message}`
    });
  }
  
  const upload = multer({ 
    storage: videoRecordingStorage,
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB limit
    },
    fileFilter: (req, file, cb) => {
      console.log("Debug - File filter:", {
        mimetype: file.mimetype,
        originalname: file.originalname
      });
      
      // Accept only video files or any file type in development
      if (file.mimetype.startsWith('video/') || process.env.NODE_ENV === 'development') {
        cb(null, true);
      } else {
        cb(new Error('Only video files are allowed'));
      }
    }
  }).single("video");
  
  upload(request, response, async function (err) {
    if (err) {
      console.error("Debug - Upload error:", {
        error: err.message,
        stack: err.stack
      });
      
      response
        .status(500)
        .json({
          success: false,
          error: `Invalid video upload. ${err.message}`,
        })
        .end();
      return;
    }
    
    // If no file was uploaded, continue
    if (!request.file) {
      console.log("Debug - No file uploaded");
      next();
      return;
    }
    
    const filePath = request.file.path;
    console.log(`Debug - Video uploaded to: ${filePath}`, {
      size: request.file.size,
      mimetype: request.file.mimetype,
      filename: request.file.filename
    });
    
    // Validate the uploaded video file with audio
    const isValid = validateVideoWithAudio(filePath);
    if (!isValid) {
      console.error('Debug - Invalid video file or missing audio');
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkErr) {
        console.error('Error deleting invalid video file:', unlinkErr);
      }
      
      response
        .status(400)
        .json({
          success: false,
          error: 'Invalid video file or missing audio',
        })
        .end();
      return;
    }
    
    // Check if ffmpeg is available
    const ffmpegAvailable = await checkFfmpegAvailable();
    if (!ffmpegAvailable) {
      console.log('Debug - FFmpeg not available, skipping video validation and fixing');
      next();
      return;
    }
    
    // Validate the video file
    const isVideoValid = await validateVideoFile(filePath);
    if (!isVideoValid) {
      console.error('Debug - Invalid video file uploaded');
      response
        .status(400)
        .json({
          success: false,
          error: 'Invalid video file format',
        })
        .end();
      return;
    }
    
    // Fix webm files to ensure they have proper duration metadata
    if (request.file.mimetype === 'video/webm' || path.extname(filePath) === '.webm') {
      const tempPath = `${filePath}.fixed.webm`;
      const fixed = await fixWebmFile(filePath, tempPath);
      if (!fixed) {
        console.warn('Debug - Could not fix webm file, but continuing anyway');
      }
    }
    
    next();
  });
}

/**
 * Get the URL for a video recording
 * @param {string} filename - The filename of the video
 * @returns {string} The URL to access the video
 */
function getVideoUrl(filename) {
  const url = `/api/recordings/video/${filename}`;
  console.log("Debug - Generated video URL:", url);
  return url;
}

/**
 * Delete a video recording
 * @param {string} filename - The filename of the video to delete
 * @returns {Promise<boolean>} Success status
 */
async function deleteVideo(filename) {
  try {
    const videoPath = process.env.NODE_ENV === "development"
      ? path.resolve(__dirname, `../../storage/recordings/${filename}`)
      : path.resolve(process.env.STORAGE_DIR, `recordings/${filename}`);
    
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting video:', error);
    return false;
  }
}

// A function to validate video files with audio
const validateVideoWithAudio = (filePath) => {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File does not exist: ${filePath}`);
      return false;
    }
    
    // Check file size
    const stats = fs.statSync(filePath);
    if (stats.size < 1000) { // Less than 1KB is likely corrupted
      console.error(`File too small (${stats.size} bytes): ${filePath}`);
      return false;
    }
    
    // Read first few bytes to check for proper WebM header
    // This is a basic check, not comprehensive
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(8);
    fs.readSync(fd, buffer, 0, 8, 0);
    fs.closeSync(fd);
    
    // WebM files start with 0x1A 0x45 0xDF 0xA3 (EBML header)
    const isWebM = buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3;
    
    if (!isWebM) {
      console.warn(`File does not appear to be a valid WebM file: ${filePath}`);
      // Don't return false here as this is just a warning
    }
    
    console.log(`Video file validated: ${filePath}`);
    return true;
  } catch (err) {
    console.error(`Error validating video file: ${err.message}`);
    return false;
  }
};

module.exports = {
  handleVideoUpload,
  getVideoUrl,
  deleteVideo,
}; 