import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, ChartLine, DownloadSimple, VideoCamera, TextT } from "@phosphor-icons/react";
import { INTERVIEW_STAGES } from "./index.jsx";
import InterviewAnalytics from "./InterviewAnalytics";
import showToast from "@/utils/toast";
import { ensureAbsoluteUrl, getServerUrl } from "@/utils/api";
import TranscriptDisplay from "@/components/TranscriptDisplay";

export default function InterviewPlayback({ setStage, selectedRecording, isStandalone = false }) {
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [activeTab, setActiveTab] = useState("video"); // "video" or "transcript"
  const [videoSrc, setVideoSrc] = useState("");
  const videoRef = useRef(null);
  
  // Log the props immediately to see what we're receiving
  console.log("Debug - InterviewPlayback received props:", {
    selectedRecording,
    hasServerFileName: selectedRecording?.serverFileName ? true : false,
    videoUrl: selectedRecording?.videoUrl,
    isStandalone
  });

  // Use a state variable to track when the component has fully mounted
  const [isMounted, setIsMounted] = useState(false);
  
  // Set isMounted to true after the component has mounted
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Extract transcript data from the recording if available
  const transcriptData = selectedRecording?.transcript || [];
  
  // Calculate analytics from transcript data
  const [analytics, setAnalytics] = useState({
    score: 0,
    duration: 0,
    userSpeakingTime: 0,
    fillerWords: {
      count: 0,
      percentage: 0
    }
  });

  // Process transcript data to generate analytics
  useEffect(() => {
    if (transcriptData && transcriptData.length > 0) {
      // Calculate analytics
      const lastTimestamp = transcriptData[transcriptData.length - 1]?.timestamp || 0;
      const userMessages = transcriptData.filter(msg => msg.role === 'user');
      const userSpeakingTime = userMessages.reduce((total, msg) => total + (msg.content.split(' ').length * 0.4), 0); // Rough estimate
      
      // Count filler words
      const fillerWordRegex = /\b(um|uh|like|you know|sort of|kind of)\b/gi;
      let fillerWordCount = 0;
      let totalWords = 0;
      
      userMessages.forEach(msg => {
        const matches = msg.content.match(fillerWordRegex) || [];
        fillerWordCount += matches.length;
        totalWords += msg.content.split(' ').length;
      });
      
      const fillerWordPercentage = totalWords > 0 ? Math.round((fillerWordCount / totalWords) * 100 * 10) / 10 : 0;
      
      // Calculate score (simple algorithm)
      const baseScore = 70;
      const fillerPenalty = Math.min(fillerWordPercentage * 2, 20);
      const responseLengthBonus = Math.min(totalWords / 20, 15);
      const finalScore = Math.round(Math.min(Math.max(baseScore - fillerPenalty + responseLengthBonus, 0), 100));
      
      setAnalytics({
        score: finalScore,
        duration: lastTimestamp,
        userSpeakingTime: Math.round(userSpeakingTime),
        fillerWords: {
          count: fillerWordCount,
          percentage: fillerWordPercentage
        }
      });
    }
  }, [transcriptData]);

  // Set up video source when component mounts or recording changes
  useEffect(() => {
    if (!selectedRecording) return;
    
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      console.log("Debug - Setting up video source for:", {
        id: selectedRecording.id,
        serverFileName: selectedRecording.serverFileName,
        videoUrl: selectedRecording.videoUrl
      });
      
      // Check if we have the required data to play the video
      if (selectedRecording.serverFileName && selectedRecording.serverFileName.trim() !== '') {
        // Create the video source URL
        const videoSourceUrl = `${getServerUrl()}/api/recordings/video/${selectedRecording.serverFileName}`;
        console.log("Debug - Setting video source to:", videoSourceUrl);
        
        // Set the video source
        setVideoSrc(videoSourceUrl);
        
        // Set a timeout to stop the loading indicator even if the video doesn't load
        setTimeout(() => {
          setIsLoading(false);
        }, 3000);
      } else if (selectedRecording.videoUrl) {
        // Use the videoUrl if available
        console.log("Debug - Using videoUrl:", selectedRecording.videoUrl);
        setVideoSrc(selectedRecording.videoUrl);
        
        setTimeout(() => {
          setIsLoading(false);
        }, 3000);
      } else {
        // No video source available
        console.log("Debug - No video source available");
        setErrorMessage("No video available for this recording");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error setting up video:", error);
      setErrorMessage(`Error loading video: ${error.message}`);
      setIsLoading(false);
    }
  }, [selectedRecording]);

  // Handle video load events
  const handleVideoLoaded = () => {
    console.log("Video loaded successfully");
    setIsLoading(false);
    
    try {
      // Get the video element
      const videoElement = videoRef.current;
      if (!videoElement) return;
      
      // Check for audio tracks
      if (videoElement.audioTracks) {
        console.log(`Video has ${videoElement.audioTracks.length} audio tracks`);
        
        // Log audio track details
        Array.from(videoElement.audioTracks).forEach((track, index) => {
          console.log(`Audio track ${index}:`, {
            enabled: track.enabled,
            id: track.id,
            kind: track.kind,
            label: track.label,
            language: track.language
          });
          
          // Ensure track is enabled
          track.enabled = true;
        });
      } else {
        console.log("No audioTracks property available on video element");
      }
      
      // Ensure audio is unmuted and volume is up
      if (videoElement.muted) {
        console.log("Video was muted, unmuting...");
        videoElement.muted = false;
      }
      
      videoElement.volume = 1.0;
      console.log("Set volume to:", videoElement.volume);
      
      // Try to force audio initialization by seeking slightly
      if (videoElement.readyState >= 3) { // HAVE_FUTURE_DATA or higher
        const currentTime = videoElement.currentTime;
        console.log("Seeking slightly to initialize audio...");
        videoElement.currentTime = currentTime + 0.1;
      }
      
      // Log audio context state if Web Audio API is being used
      if (window.AudioContext || window.webkitAudioContext) {
        console.log("Audio API is available for debugging");
      }
    } catch (err) {
      console.error("Error setting up audio:", err);
    }
  };

  // Handle video error events
  const handleVideoError = (e) => {
    console.error("Debug - Video error:", e);
    setErrorMessage("Could not play the video. The file may be corrupted or unavailable.");
    setIsLoading(false);
  };

  if (!selectedRecording) {
    // If no recording is selected, go back to the recordings list
    if (typeof setStage === 'function') {
      if (isStandalone) {
        setStage();
      } else {
        setStage(INTERVIEW_STAGES.RECORDINGS);
      }
    }
    return null;
  }

  const handleDownload = async () => {
    if (!selectedRecording.serverFileName) {
      showToast("No recording available for download", "error");
      return;
    }

    setIsDownloading(true);

    try {
      // Use the server URL with getServerUrl() instead of hardcoded localhost
      const videoUrl = `${getServerUrl()}/api/recordings/video/${selectedRecording.serverFileName}`;
      console.log("Debug - Using server URL for download:", videoUrl);
      
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = videoUrl;
      a.download = `${selectedRecording.title || "interview"}-${new Date().toISOString()}.webm`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      document.body.removeChild(a);

      showToast("Recording downloaded successfully", "success");
    } catch (error) {
      console.error("Error downloading recording:", error);
      showToast("Error downloading recording", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyTranscript = () => {
    showToast("Transcript copied to clipboard", "success");
  };

  if (showAnalytics) {
    return (
      <InterviewAnalytics 
        setStage={setShowAnalytics} 
        recordedAudio={null} 
        transcript={selectedRecording?.transcript || ""} 
        transcriptData={transcriptData}
        isStandalone={true} 
      />
    );
  }

  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto">
      <div className="flex items-center mb-8">
        <button
          onClick={() => setStage(isStandalone ? null : INTERVIEW_STAGES.RECORDINGS)}
          className="mr-4 p-2 rounded-full hover:bg-theme-bg-secondary transition-colors"
        >
          <ArrowLeft size={24} className="text-theme-text-primary" />
        </button>
        <h1 className="text-2xl font-bold text-theme-text-primary">
          {selectedRecording?.title || "Interview Recording"}
        </h1>
      </div>

      <div className="flex justify-center mb-6">
        <div className="flex border-b border-theme-border">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "video"
                ? "text-primary-button border-b-2 border-primary-button"
                : "text-theme-text-secondary hover:text-theme-text-primary"
            }`}
            onClick={() => setActiveTab("video")}
          >
            <div className="flex items-center gap-2">
              <VideoCamera size={18} />
              Video
            </div>
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "transcript"
                ? "text-primary-button border-b-2 border-primary-button"
                : "text-theme-text-secondary hover:text-theme-text-primary"
            }`}
            onClick={() => setActiveTab("transcript")}
          >
            <div className="flex items-center gap-2">
              <TextT size={18} />
              Transcript
            </div>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {activeTab === "video" ? (
          <>
            {isLoading && !errorMessage ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-button"></div>
              </div>
            ) : errorMessage ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center p-6 bg-red-100 rounded-lg max-w-md">
                  <p className="text-red-600 font-medium mb-2">Error Loading Recording</p>
                  <p className="text-red-500">{errorMessage}</p>
                  <div className="mt-4 text-sm text-gray-600">
                    <p>Debug info:</p>
                    <p>Video URL: {selectedRecording.videoUrl || "None"}</p>
                    <p>Server filename: {selectedRecording.serverFileName || "None"}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full bg-black rounded-lg overflow-hidden shadow-lg mb-6">
                {videoSrc ? (
                  <video
                    ref={videoRef}
                    className="w-full h-full"
                    controls
                    preload="metadata"
                    onLoadedData={handleVideoLoaded}
                    onCanPlay={(e) => {
                      console.log("Video can play now");
                      e.target.volume = 1.0;
                      try {
                        // Try to play automatically, but catch any autoplay prevention errors
                        const playPromise = e.target.play();
                        if (playPromise !== undefined) {
                          playPromise.catch(err => {
                            console.log("Autoplay prevented:", err);
                          });
                        }
                      } catch (err) {
                        console.error("Error during autoplay:", err);
                      }
                    }}
                    onError={(e) => {
                      console.error("Video error:", e.target.error);
                      setErrorMessage("Failed to load video. Please try again.");
                      setIsLoading(false);
                    }}
                  >
                    <source src={videoSrc} type="video/webm; codecs=vp8,opus" />
                    <source src={videoSrc} type="video/webm" />
                    <source src={videoSrc} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="aspect-video flex items-center justify-center text-white">
                    <p>No video source available</p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="w-full mb-6">
            {transcriptData && transcriptData.length > 0 ? (
              <TranscriptDisplay 
                messages={transcriptData} 
                analytics={analytics}
                onCopyTranscript={handleCopyTranscript}
              />
            ) : (
              <div className="bg-theme-bg-secondary p-6 rounded-lg text-center">
                <h3 className="text-xl font-semibold text-theme-text-primary mb-4">Transcript Not Available</h3>
                <p className="text-theme-text-secondary">
                  This recording doesn't have a transcript. Newer recordings will include transcripts automatically.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-4 justify-center mt-6">
          <button
            onClick={() => setShowAnalytics(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-button hover:bg-primary-button-hover text-white font-medium rounded-lg transition-colors"
          >
            <ChartLine weight="bold" size={20} />
            View Speech Analytics
          </button>
          
          <button
            onClick={handleDownload}
            disabled={isDownloading || !selectedRecording?.serverFileName}
            className={`flex items-center justify-center gap-2 px-6 py-3 bg-theme-bg-container hover:bg-theme-bg-primary text-theme-text-primary font-medium rounded-lg transition-colors border border-theme-border ${
              isDownloading || !selectedRecording?.serverFileName ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <DownloadSimple weight="bold" size={20} />
            {isDownloading ? "Downloading..." : "Download Recording"}
          </button>
        </div>
      </div>
    </div>
  );
} 