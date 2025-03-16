/**
 * Utility functions for API calls
 */

import { getApiUrl } from './constants';

/**
 * Get the base URL for API requests
 * @returns {string} The base URL for API requests
 */
function getBaseUrl() {
  return getApiUrl();
}

/**
 * Get the server URL based on the current environment
 * @returns {string} The server URL
 */
export const getServerUrl = () => {
  // In development, use localhost with correct port
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001';
  }
  
  // For production, use the current domain
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';
  
  return `${protocol}//${hostname}${port}`;
};

/**
 * Ensure a URL is absolute with the correct port
 * @param {string} url - The URL to check
 * @returns {string} The absolute URL
 */
export const ensureAbsoluteUrl = (url) => {
  if (!url) return url;
  if (url.startsWith('/')) {
    return `${getServerUrl()}${url}`;
  }
  return url;
};

/**
 * Upload a video recording to the server
 * @param {Blob} blob - The video blob to upload
 * @returns {Promise<Object>} - The server response with the video URL
 */
export const uploadVideoRecording = async (blob) => {
  try {
    if (!blob || blob.size === 0) {
      console.error("Debug - No video data to upload");
      throw new Error('No video data to upload');
    }

    console.log("Debug - Starting video upload:", {
      blobSize: blob.size,
      blobType: blob.type,
      timestamp: new Date().toISOString(),
      apiUrl: getBaseUrl()
    });
    
    const formData = new FormData();
    formData.append('video', blob, `recording-${Date.now()}.webm`);
    
    // Use the server URL with the correct path
    const uploadUrl = `${getServerUrl()}/api/recordings/upload`;
    console.log("Debug - Upload URL:", uploadUrl);
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });
    
    const contentType = response.headers.get('content-type');
    console.log("Debug - Response content type:", contentType);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Debug - Upload failed:", {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      throw new Error(`Upload failed: ${response.statusText || errorText}`);
    }
    
    let result;
    try {
      result = await response.json();
    } catch (jsonError) {
      console.error("Debug - Error parsing response:", jsonError);
      const responseText = await response.text();
      console.log("Debug - Response text:", responseText);
      throw new Error('Invalid response from server');
    }
    
    console.log("Debug - Upload response:", result);
    
    if (!result.success || !result.recording?.url) {
      throw new Error('Upload succeeded but no video URL returned');
    }
    
    return result;
  } catch (error) {
    console.error('Debug - Error uploading video:', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Delete a video recording from the server
 * @param {string} fileName - The filename of the video to delete
 * @returns {Promise<boolean>} - Whether the deletion was successful
 */
export const deleteVideoRecording = async (fileName) => {
  try {
    console.log("Debug - Deleting video recording:", fileName);
    
    // Use the server URL with the correct path
    const deleteUrl = `${getServerUrl()}/api/recordings/video/${fileName}`;
    console.log("Debug - Delete URL:", deleteUrl);
    
    const response = await fetch(deleteUrl, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Deletion failed with status: ${response.status}`);
    }
    
    console.log("Debug - Deletion successful");
    return true;
  } catch (error) {
    console.error('Debug - Error deleting video:', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Check if a video URL is accessible
 * @param {string} url - The URL to check
 * @returns {Promise<boolean>} - Whether the URL is accessible
 */
export const checkVideoUrl = async (url) => {
  try {
    console.log("Debug - Checking video URL:", url);
    const response = await fetch(url, { method: 'HEAD' });
    
    console.log("Debug - URL check response:", {
      status: response.status,
      ok: response.ok,
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length')
    });
    
    return response.ok;
  } catch (error) {
    console.error('Debug - Error checking video URL:', {
      error: error.message,
      url
    });
    return false;
  }
}; 