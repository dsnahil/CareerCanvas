import React, { useEffect, useState, useRef } from "react";
import { DownloadSimple, ArrowClockwise, CheckCircle, ChartLine, VideoCamera } from "@phosphor-icons/react";
import { showToast } from "@/utils/toast";
import { INTERVIEW_STAGES } from "./index.jsx";
import InterviewAnalytics from "./InterviewAnalytics";
import { saveRecording } from "@/utils/recordingStorage";
import paths from "@/utils/paths";
import { useNavigate } from "react-router-dom";
import TranscriptDisplay from "@/components/TranscriptDisplay";

export default function InterviewEnd({ recordedBlob, recordedAudio, transcriptData = [], setStage }) {
  const videoRef = useRef(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recordingSaved, setRecordingSaved] = useState(false);
  const [recordingTitle, setRecordingTitle] = useState("Interview Session");
  const [processingVideo, setProcessingVideo] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState("recording"); // "recording" or "transcript"
  const navigate = useNavigate();

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

  useEffect(() => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      setVideoUrl(url);

      // Clean up the URL when component unmounts
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [recordedBlob]);

  // Process transcript data to generate analytics
  useEffect(() => {
    if (transcriptData && transcriptData.length > 0) {
      // Convert transcript array to string for legacy components
      const fullTranscript = transcriptData
        .map(msg => `${msg.role === 'user' ? 'You' : 'Interviewer'}: ${msg.content}`)
        .join('\n\n');
      
      setTranscript(fullTranscript);
      
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

  const handleDownload = () => {
    if (!recordedBlob) {
      showToast("No recording available", "error");
      return;
    }

    setIsDownloading(true);

    try {
      const url = URL.createObjectURL(recordedBlob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `interview-recording-${new Date().toISOString()}.webm`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast("Recording downloaded successfully", "success");
    } catch (error) {
      console.error("Error downloading recording:", error);
      showToast("Error downloading recording", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleStartNewInterview = () => {
    window.location.reload();
  };
  
  const handleViewAnalytics = () => {
    setShowAnalytics(true);
  };

  const handleSaveRecording = async () => {
    try {
      setProcessingVideo(true);
      setErrorMessage(null);
      
      console.log("Debug - Starting save recording process");
      
      // Validate that we have a valid blob
      if (!recordedBlob || !(recordedBlob instanceof Blob) || recordedBlob.size === 0) {
        console.error("Debug - Invalid or missing video blob:", {
          hasBlob: !!recordedBlob,
          isBlob: recordedBlob instanceof Blob,
          size: recordedBlob?.size
        });
        throw new Error("No valid recording found to save");
      }
      
      // Use the recording title from state instead of interviewTopic
      const title = recordingTitle || `Interview ${new Date().toLocaleDateString()}`;
      
      // Get video duration from the video element or metadata
      let duration = "00:00";
      if (videoRef.current && videoRef.current.duration) {
        const totalSeconds = Math.floor(videoRef.current.duration);
        const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const seconds = (totalSeconds % 60).toString().padStart(2, '0');
        duration = `${minutes}:${seconds}`;
      }
      
      console.log("Debug - Preparing recording metadata:", {
        title,
        duration,
        blobSize: recordedBlob.size,
        blobType: recordedBlob.type
      });
      
      // Save recording with metadata and blob
      const savedRecording = await saveRecording({
        title,
        duration,
        type: "Interview",
        topic: "General", // Use a default topic since interviewTopic is not defined
        questions: [], // Use empty array since sessionQuestions is not defined
        transcript: transcriptData // Save transcript data with the recording
      }, recordedBlob);
      
      console.log("Debug - Recording saved successfully:", {
        id: savedRecording.id,
        videoUrl: savedRecording.videoUrl,
        serverFileName: savedRecording.serverFileName
      });
      
      // Verify we have a valid video URL from the server
      if (!savedRecording.videoUrl) {
        console.error("Debug - No video URL in saved recording");
        throw new Error("Recording saved but no video URL was returned");
      }
      
      // Show success message
      showToast("Recording saved successfully!", "success");
      setRecordingSaved(true);
      
      // Navigate to the recordings page
      navigate('/recordings');
    } catch (error) {
      console.error("Debug - Error saving recording:", {
        error: error.message,
        stack: error.stack
      });
      setErrorMessage(`Failed to save recording: ${error.message}`);
      showToast(`Error: ${error.message}`, "error");
    } finally {
      setProcessingVideo(false);
    }
  };

  const handleViewRecordings = () => {
    // Use window.location for navigation instead of useNavigate
    window.location.href = paths.recordings();
  };

  const handleCopyTranscript = () => {
    showToast("Transcript copied to clipboard", "success");
  };

  if (showAnalytics) {
    return <InterviewAnalytics 
      setStage={setShowAnalytics} 
      recordedAudio={recordedAudio} 
      transcript={transcript}
      transcriptData={transcriptData}
    />;
  }

  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <CheckCircle size={32} weight="fill" className="text-green-500 mr-2" />
          <h1 className="text-3xl font-bold text-theme-text-primary">Interview Completed</h1>
        </div>
        <p className="text-lg text-theme-text-secondary">You've successfully completed your practice interview.</p>
      </div>

      <div className="flex justify-center mb-6">
        <div className="flex border-b border-theme-border">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "recording"
                ? "text-primary-button border-b-2 border-primary-button"
                : "text-theme-text-secondary hover:text-theme-text-primary"
            }`}
            onClick={() => setActiveTab("recording")}
          >
            Recording
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "transcript"
                ? "text-primary-button border-b-2 border-primary-button"
                : "text-theme-text-secondary hover:text-theme-text-primary"
            }`}
            onClick={() => setActiveTab("transcript")}
          >
            Transcript
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center">
        {activeTab === "recording" ? (
          <>
            {videoUrl ? (
              <div className="w-full bg-black rounded-lg overflow-hidden shadow-lg mb-6">
                <video 
                  ref={videoRef} 
                  src={videoUrl} 
                  controls 
                  className="w-full h-full" 
                  onLoadedMetadata={() => {
                    // Once video metadata is loaded, we can get the duration
                    if (videoRef.current) {
                      const duration = `${Math.floor(videoRef.current.duration / 60)}:${Math.floor(videoRef.current.duration % 60).toString().padStart(2, '0')}`;
                      console.log("Video duration:", duration);
                    }
                  }}
                />
              </div>
            ) : (
              <div className="w-full bg-theme-bg-container rounded-lg flex items-center justify-center p-12 mb-6">
                <p className="text-theme-text-secondary">No recording available</p>
              </div>
            )}

            {videoUrl && !recordingSaved && (
              <div className="w-full bg-theme-bg-secondary p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-semibold text-theme-text-primary mb-4">Save Your Recording</h2>
                <div className="mb-4">
                  <label htmlFor="recording-title" className="block text-theme-text-secondary mb-2">
                    Recording Title
                  </label>
                  <input
                    id="recording-title"
                    type="text"
                    value={recordingTitle}
                    onChange={(e) => setRecordingTitle(e.target.value)}
                    className="w-full p-2 rounded border border-theme-border bg-theme-bg-container text-theme-text-primary"
                    placeholder="Enter a title for your recording"
                  />
                </div>
                <button
                  onClick={handleSaveRecording}
                  disabled={processingVideo}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-button hover:bg-primary-button-hover text-white font-medium rounded-lg transition-colors ${
                    processingVideo ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {processingVideo ? "Saving..." : (
                    <>
                      <VideoCamera weight="bold" size={20} />
                      Save Recording
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="w-full mb-6">
            <TranscriptDisplay 
              messages={transcriptData} 
              analytics={analytics}
              onCopyTranscript={handleCopyTranscript}
            />
          </div>
        )}

        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={handleViewAnalytics}
            disabled={!recordedBlob}
            className={`flex items-center justify-center gap-2 px-6 py-3 bg-primary-button hover:bg-primary-button-hover text-white font-medium rounded-lg transition-colors ${
              !recordedBlob ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <ChartLine weight="bold" size={20} />
            View Speech Analytics
          </button>
          
          <button
            onClick={handleDownload}
            disabled={!recordedBlob || isDownloading}
            className={`flex items-center justify-center gap-2 px-6 py-3 bg-theme-bg-container hover:bg-theme-bg-primary text-theme-text-primary font-medium rounded-lg transition-colors border border-theme-border ${
              !recordedBlob || isDownloading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <DownloadSimple weight="bold" size={20} />
            {isDownloading ? "Downloading..." : "Download Recording"}
          </button>

          {recordingSaved && (
            <button
              onClick={handleViewRecordings}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-theme-bg-container hover:bg-theme-bg-primary text-theme-text-primary font-medium rounded-lg transition-colors border border-theme-border"
            >
              <VideoCamera weight="bold" size={20} />
              View All Recordings
            </button>
          )}

          <button
            onClick={handleStartNewInterview}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-theme-bg-container hover:bg-theme-bg-primary text-theme-text-primary font-medium rounded-lg transition-colors border border-theme-border"
          >
            <ArrowClockwise weight="bold" size={20} />
            Start New Interview
          </button>
        </div>
      </div>
    </div>
  );
}
