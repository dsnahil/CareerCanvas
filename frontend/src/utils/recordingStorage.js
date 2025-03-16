/**
 * Utility for storing and retrieving interview recordings locally
 */

import { ensureAbsoluteUrl, getServerUrl } from './api';
import { showToast } from './toast';

const STORAGE_KEY = 'CareerCanvas_interview_recordings';

/**
 * Save a recording to local storage
 * @param {Object} recording - The recording object to save
 * @param {Blob} videoBlob - The video blob to save
 * @returns {Object} The saved recording with an ID
 */
export const saveRecording = async (recording, videoBlob) => {
  try {
    // Get metadata from session storage if available
    const metadataStr = sessionStorage.getItem('lastRecordingMetadata');
    const metadata = metadataStr ? JSON.parse(metadataStr) : {};
    
    console.log("Debug - Saving recording:", {
      recordingDetails: recording,
      metadata,
      videoBlobSize: videoBlob ? videoBlob.size : null,
      videoBlobType: videoBlob ? videoBlob.type : null
    });
    
    // Get existing recordings
    const existingRecordings = getRecordings();
    
    // Generate a unique ID
    const id = Date.now().toString();
    
    // Upload the video to the server
    let serverFileName = null;
    let serverUrl = null;
    
    if (videoBlob && videoBlob instanceof Blob && videoBlob.size > 0) {
      try {
        console.log("Debug - Starting video upload...");
        
        // Create a FormData object for the upload
        const formData = new FormData();
        formData.append('video', videoBlob, `recording-${Date.now()}.webm`);
        
        // Use the server URL with the correct path
        const uploadUrl = `${getServerUrl()}/api/recordings/upload`;
        console.log("Debug - Upload URL:", uploadUrl);
        
        // Upload the video
        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Debug - Upload failed:", {
            status: response.status,
            statusText: response.statusText,
            errorText
          });
          throw new Error(`Upload failed: ${response.statusText || errorText}`);
        }
        
        // Parse the response
        const result = await response.json();
        console.log("Debug - Upload response:", result);
        
        if (!result.success || !result.recording?.url) {
          throw new Error('Upload succeeded but no video URL returned');
        }
        
        serverFileName = result.recording.fileName;
        serverUrl = result.recording.url;
        
        // Ensure the URL is absolute
        serverUrl = ensureAbsoluteUrl(serverUrl);
        console.log("Debug - Video upload successful:", {
          serverFileName,
          serverUrl,
          originalUrl: result.recording.url
        });
        
        // Verify the URL is accessible
        const isAccessible = await checkVideoUrl(serverUrl);
        console.log("Debug - URL accessibility check:", {
          url: serverUrl,
          isAccessible
        });
        
        if (!isAccessible) {
          console.warn("Debug - Video URL is not accessible:", {
            url: serverUrl,
            fileName: serverFileName
          });
          showToast("Warning: Video saved but may not be playable", "warning");
        }
      } catch (error) {
        console.error('Debug - Error uploading to server:', {
          error: error.message,
          stack: error.stack
        });
        throw new Error(`Could not upload video to server: ${error.message}`);
      }
    } else {
      console.error('Debug - No valid video blob provided:', {
        hasBlob: !!videoBlob,
        isBlob: videoBlob instanceof Blob,
        size: videoBlob?.size
      });
      throw new Error('No valid video data to upload');
    }
    
    if (!serverUrl) {
      throw new Error('No video URL returned from server');
    }
    
    // Create a new recording object with ID, metadata, and creation date
    const newRecording = {
      ...recording,
      ...metadata, // Include metadata from session storage
      id,
      created: new Date(),
      serverFileName,
      videoUrl: serverUrl,
      // Don't store blob URLs in localStorage as they become invalid after page refresh
      blobUrl: null, // recording.blobUrl || null,
      savedAt: new Date().toISOString(),
      duration: metadata.duration || recording.duration || "00:00", // Ensure duration has a default value
      type: metadata.type || recording.type || "Interview"
    };
    
    console.log("Debug - Final recording object:", {
      id: newRecording.id,
      videoUrl: newRecording.videoUrl,
      blobUrl: newRecording.blobUrl,
      serverFileName: newRecording.serverFileName,
      created: newRecording.created,
      duration: newRecording.duration,
      type: newRecording.type
    });
    
    // Add to existing recordings
    const updatedRecordings = [newRecording, ...existingRecordings];
    
    // Save to local storage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecordings));
    
    // Clear session storage metadata
    sessionStorage.removeItem('lastRecordingMetadata');
    
    return newRecording;
  } catch (error) {
    console.error('Debug - Error in saveRecording:', {
      error: error.message,
      stack: error.stack
    });
    throw error; // Propagate the error to the caller
  }
};

/**
 * Get all recordings from local storage
 * @returns {Array} Array of recording objects
 */
export const getRecordings = () => {
  try {
    const recordings = localStorage.getItem(STORAGE_KEY);
    const parsedRecordings = recordings ? JSON.parse(recordings) : [];
    
    // Process recordings to fix missing serverFileName
    const processedRecordings = parsedRecordings.map(recording => {
      // If serverFileName is missing but videoUrl contains a filename, extract it
      if (!recording.serverFileName && recording.videoUrl) {
        const match = recording.videoUrl.match(/\/api\/recordings\/video\/([^?#]+)/);
        if (match && match[1]) {
          console.log(`Fixed missing serverFileName for recording ${recording.id}`);
          return {
            ...recording,
            serverFileName: match[1]
          };
        }
      }
      return recording;
    });
    
    // If we fixed any recordings, update localStorage
    if (JSON.stringify(processedRecordings) !== JSON.stringify(parsedRecordings)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(processedRecordings));
      console.log("Updated recordings in localStorage with fixed serverFileNames");
    }
    
    return processedRecordings;
  } catch (error) {
    console.error('Error getting recordings:', error);
    return [];
  }
};

/**
 * Delete a recording from local storage
 * @param {string} id - The ID of the recording to delete
 * @returns {boolean} Success status
 */
export const deleteRecording = (id) => {
  try {
    const recordings = getRecordings();
    const updatedRecordings = recordings.filter(recording => recording.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecordings));
    return true;
  } catch (error) {
    console.error('Error deleting recording:', error);
    return false;
  }
};

/**
 * Get a single recording by ID
 * @param {string} id - The ID of the recording to get
 * @returns {Object|null} The recording object or null if not found
 */
export const getRecordingById = (id) => {
  try {
    const recordings = getRecordings();
    return recordings.find(recording => recording.id === id) || null;
  } catch (error) {
    console.error('Error getting recording by ID:', error);
    return null;
  }
};

/**
 * Clear all recordings from local storage
 * @returns {boolean} Success status
 */
export const clearRecordings = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing recordings:', error);
    return false;
  }
};

/**
 * Check if a video URL is accessible
 * @param {string} url - The URL to check
 * @returns {Promise<boolean>} Whether the URL is accessible
 */
const checkVideoUrl = async (url) => {
  if (!url) return false;
  
  try {
    console.log("Debug - Checking video URL:", url);
    
    // For blob URLs, they're always accessible in the current session
    if (url.startsWith('blob:')) {
      return true;
    }
    
    // For server URLs, try to fetch the headers
    const response = await fetch(url, { 
      method: 'HEAD',
      cache: 'no-cache'
    });
    
    console.log("Debug - URL check response:", {
      url,
      status: response.status,
      ok: response.ok,
      contentType: response.headers.get('content-type')
    });
    
    return response.ok && response.headers.get('content-type')?.includes('video');
  } catch (error) {
    console.error("Debug - Error checking video URL:", {
      url,
      error: error.message
    });
    return false;
  }
}; 