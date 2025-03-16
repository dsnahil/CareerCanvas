import React, { useState, useEffect } from "react";
import { Play, Trash, DotsThree } from "@phosphor-icons/react";
import { deleteRecording, getRecordings } from "@/utils/recordingStorage";
import showToast from "@/utils/toast";
import InterviewPlayback from "../Interview/InterviewPlayback";
import { formatDate } from "@/utils/dateUtils";
import { getServerUrl } from "@/utils/api";

/**
 * Ensure a URL is absolute with the correct port
 * @param {string} url - The URL to check
 * @returns {string} The absolute URL
 */
const ensureAbsoluteUrl = (url) => {
  if (!url) return url;
  if (url.startsWith('/')) {
    return `${getServerUrl()}${url}`;
  }
  return url;
};

export default function RecordingsList() {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [thumbnails, setThumbnails] = useState({});

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = async () => {
    setLoading(true);
    try {
      const fetchedRecordings = await getRecordings();
      console.log("Fetched recordings:", fetchedRecordings);
      
      // Debug each recording to check for serverFileName
      fetchedRecordings.forEach(recording => {
        console.log(`Recording ${recording.id} details:`, {
          title: recording.title,
          serverFileName: recording.serverFileName,
          videoUrl: recording.videoUrl
        });
      });
      
      // Ensure all video URLs are absolute
      const processedRecordings = fetchedRecordings.map(recording => ({
        ...recording,
        videoUrl: ensureAbsoluteUrl(recording.videoUrl)
      }));
      
      setRecordings(processedRecordings);

      // Load thumbnails for the videos
      for (const recording of processedRecordings) {
        if (recording.serverFileName) {
          generateThumbnail(recording);
        }
      }
    } catch (error) {
      console.error("Error loading recordings:", error);
      showToast("Failed to load recordings", "error");
    } finally {
      setLoading(false);
    }
  };

  const generateThumbnail = async (recording) => {
    if (!recording.serverFileName) return;
    
    try {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = `${getServerUrl()}/api/recordings/video/${recording.serverFileName}`;
      
      video.addEventListener('loadeddata', () => {
        // Create a canvas and draw the video frame
        video.currentTime = 1; // Seek to 1 second to avoid black frames at the beginning
      });
      
      video.addEventListener('seeked', () => {
        // Now the video has seeked to the requested time
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get the thumbnail as a data URL
        const thumbnailUrl = canvas.toDataURL('image/jpeg');
        
        // Update thumbnails state
        setThumbnails(prev => ({
          ...prev,
          [recording.id]: thumbnailUrl
        }));
        
        // Clean up
        video.remove();
      });
      
      // Start loading the video
      video.load();
    } catch (error) {
      console.error("Error generating thumbnail:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this recording?")) {
      return;
    }

    try {
      const recordingToDelete = recordings.find(r => r.id === id);
      if (!recordingToDelete) {
        throw new Error("Recording not found");
      }

      await deleteRecording(recordingToDelete);
      setRecordings(recordings.filter(recording => recording.id !== id));
      showToast("Recording deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting recording:", error);
      showToast("Failed to delete recording", "error");
    }
  };

  const handlePlay = (recording) => {
    // Add debug log to see what's being sent to InterviewPlayback
    console.log("Debug - handlePlay recording data:", {
      id: recording.id,
      title: recording.title,
      videoUrl: recording.videoUrl,
      serverFileName: recording.serverFileName
    });
    
    // Fix missing serverFileName if we have a videoUrl that contains it
    let updatedRecording = {...recording};
    
    if (!updatedRecording.serverFileName && updatedRecording.videoUrl) {
      // Extract serverFileName from videoUrl if possible
      const match = updatedRecording.videoUrl.match(/\/api\/recordings\/video\/([^?#]+)/);
      if (match && match[1]) {
        console.log(`Fixing missing serverFileName for recording ${updatedRecording.id} from URL`);
        updatedRecording.serverFileName = match[1];
      }
    }
    
    // Ensure the videoUrl is absolute before setting the selected recording
    setSelectedRecording({
      ...updatedRecording,
      videoUrl: ensureAbsoluteUrl(updatedRecording.videoUrl)
    });
    
    // Log after setting to verify data
    console.log("Debug - selectedRecording after setting:", {
      ...updatedRecording,
      videoUrl: ensureAbsoluteUrl(updatedRecording.videoUrl)
    });
  };

  const handleMenuToggle = (id) => {
    setMenuOpen(menuOpen === id ? null : id);
  };

  if (selectedRecording) {
    return <InterviewPlayback 
      setStage={() => setSelectedRecording(null)} 
      selectedRecording={selectedRecording} 
      isStandalone={true} 
    />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-theme-text-primary mb-6">Recordings</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-theme-text-primary"></div>
        </div>
      ) : recordings.length === 0 ? (
        <div className="text-center py-12">
          <Play size={48} className="mx-auto text-theme-text-secondary mb-4" />
          <h2 className="text-xl font-medium text-theme-text-primary mb-2">No recordings yet</h2>
          <p className="text-theme-text-secondary mb-6">Recordings will appear here after you complete practice interviews</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recordings.map((recording) => (
            <div 
              key={recording.id} 
              className="bg-theme-bg-secondary rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
            >
              <div 
                className="aspect-video bg-black relative cursor-pointer"
                onClick={() => handlePlay(recording)}
              >
                {recording.videoUrl ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black">
                    {thumbnails[recording.id] ? (
                      <img 
                        src={thumbnails[recording.id]} 
                        alt={recording.title || "Recording thumbnail"} 
                        className="w-full h-full object-cover opacity-70"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-black bg-opacity-50 hover:bg-opacity-30 transition-all flex items-center justify-center">
                      <Play size={48} weight="fill" className="text-white opacity-80" />
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <p className="text-gray-400">No video available</p>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 
                    className="text-lg font-semibold text-theme-text-primary cursor-pointer hover:text-primary-button transition-colors"
                    onClick={() => handlePlay(recording)}
                  >
                    {recording.title || "Untitled Recording"}
                  </h3>
                  
                  <div className="relative">
                    <button 
                      onClick={() => handleMenuToggle(recording.id)}
                      className="p-1 rounded-full hover:bg-theme-bg-primary transition-colors"
                    >
                      <DotsThree size={24} className="text-theme-text-secondary" />
                    </button>
                    
                    {menuOpen === recording.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-theme-bg-container rounded-md shadow-lg z-10 border border-theme-border">
                        <button
                          onClick={() => handleDelete(recording.id)}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-theme-bg-secondary transition-colors"
                        >
                          <Trash size={18} className="mr-2" />
                          Delete Recording
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-theme-text-secondary mb-3">
                  {formatDate(recording.created)}
                </p>
                
                <div className="flex justify-between text-xs text-theme-text-secondary">
                  <span>{recording.type || "Interview"}</span>
                  <span>{recording.duration || "—"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 