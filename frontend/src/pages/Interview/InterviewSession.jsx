import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, CircleNotch, StopCircle, Microphone, Clock, TextT, X } from "@phosphor-icons/react";
import showToast from "@/utils/toast";
import { INTERVIEW_STAGES } from "@/pages/Interview/index.jsx";

export default function InterviewSession({ setStage, setRecordedVideo, setRecordedAudio, setTranscriptData, customQuestions }) {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [transcriptMessages, setTranscriptMessages] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [showFeedbackHistory, setShowFeedbackHistory] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState(null);
  const [recordingStartTime, setRecordingStartTime] = useState(null);
  const [currentUserSpeech, setCurrentUserSpeech] = useState("");
  const [interviewerQuestions, setInterviewerQuestions] = useState([
    "Hi there! Thanks for joining the call. I'm Mike, and I'll be conducting your behavioral interview today for the Sample Associate position at Costco. How are you doing?",
    "Could you tell me about a time when you had to deal with a difficult customer or colleague?",
    "Can you describe a situation where you had to work under pressure to meet a deadline?",
    "Tell me about a time when you had to learn a new skill quickly.",
    "How do you prioritize tasks when you have multiple responsibilities?",
    "Thank you for your responses. Do you have any questions for me about the position or company?"
  ]);
  const [speechRecognitionAvailable, setSpeechRecognitionAvailable] = useState(true);
  const [speechRecognitionStatus, setSpeechRecognitionStatus] = useState('inactive'); // 'inactive', 'active', 'error'

  // Define speech recognition support check
  const isSpeechRecognitionSupported = typeof window !== 'undefined' && 
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  // Use custom questions if provided
  useEffect(() => {
    if (customQuestions && customQuestions.length > 0) {
      // Keep the intro and outro questions, replace the middle ones
      setInterviewerQuestions([
        interviewerQuestions[0],
        ...customQuestions,
        interviewerQuestions[interviewerQuestions.length - 1]
      ]);
    }
  }, [customQuestions]);

  // Mock function to analyze speech in real-time
  const analyzeSpeech = (text) => {
    // This would be replaced with actual NLP analysis in production
    if (text.toLowerCase().includes("um") || text.toLowerCase().includes("like") || text.toLowerCase().includes("you know")) {
      return {
        type: "filler_words",
        message: "Try to reduce filler words like 'um', 'like', and 'you know'."
      };
    }
    
    if (text.length > 10 && text.split(" ").length < 4) {
      return {
        type: "short_response",
        message: "Try to elaborate more on your answers to provide more context."
      };
    }
    
    return null;
  };

  useEffect(() => {
    // Initialize camera and microphone
    async function setupMedia() {
      try {
        setIsLoading(true);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        streamRef.current = stream;
        
        // Ensure video track is active and enabled
        const videoTracks = stream.getVideoTracks();
        if (videoTracks.length === 0) {
          console.error("No video track found in stream");
          showToast("Could not access camera. Please check your camera settings and refresh.", "error");
        } else {
          console.log("Video track obtained:", videoTracks[0].label);
          // Ensure video track is enabled
          videoTracks.forEach(track => {
            track.enabled = true;
          });
        }

        // Setup MediaRecorder
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          setRecordedVideo(new Blob(chunksRef.current, { type: "video/webm" }));
          setRecordedAudio(new Blob(chunksRef.current, { type: "audio/webm" }));
          chunksRef.current = [];
        };

        // Start recording
        mediaRecorder.start();
        setIsRecording(true);
        setIsLoading(false);
        setRecordingStartTime(Date.now());
        
        // Ensure video element displays the stream properly
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            try {
              videoRef.current.play().catch(e => {
                console.error("Error playing video:", e);
                showToast("Error displaying video feed. Please refresh the page.", "error");
              });
            } catch (error) {
              console.error("Error starting video playback:", error);
            }
          };
        } else {
          console.error("Video element reference not available");
          showToast("Video element not found. Please refresh the page.", "error");
        }
        
        // Add the first interviewer question to transcript
        const firstQuestion = interviewerQuestions[0];
        const newMessage = {
          role: 'assistant',
          content: firstQuestion,
          timestamp: 0, // At the start of the recording
        };
        
        setTranscriptMessages([newMessage]);
        
        // Use our global isSpeechRecognitionSupported variable
        if (isSpeechRecognitionSupported) {
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          const recognition = new SpeechRecognition();
          
          // Check if getUserMedia is supported for audio capture
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error('getUserMedia not supported in this browser');
            showToast("Speech recognition may not work properly in this browser. Please try Chrome or Edge.", "warning");
          }
          
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';
          
          recognition.onresult = (event) => {
            // Set status to active when we get results
            setSpeechRecognitionStatus('active');
            
            let interimTranscript = '';
            let finalTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
                
                // Add to overall transcript
                setTranscript(prev => prev + ' ' + finalTranscript);
                
                // Calculate timestamp relative to recording start
                const currentTime = Date.now();
                const elapsedSeconds = Math.floor((currentTime - recordingStartTime) / 1000);
                
                // Add user message to transcript messages
                const userMessage = {
                  role: 'user',
                  content: finalTranscript.trim(),
                  timestamp: elapsedSeconds,
                };
                
                setTranscriptMessages(prev => [...prev, userMessage]);
                setCurrentUserSpeech('');
                
                // Analyze speech for feedback
                const newFeedback = analyzeSpeech(finalTranscript);
                if (newFeedback) {
                  setFeedback(newFeedback);
                  setFeedbackHistory(prev => [...prev, newFeedback]);
                  
                  // Add feedback to the last user message
                  setTranscriptMessages(prev => {
                    const updated = [...prev];
                    if (updated.length > 0) {
                      const lastMsg = updated[updated.length - 1];
                      if (lastMsg.role === 'user') {
                        updated[updated.length - 1] = {
                          ...lastMsg,
                          feedback: newFeedback.message
                        };
                      }
                    }
                    return updated;
                  });
                }
              } else {
                interimTranscript += event.results[i][0].transcript;
                setCurrentUserSpeech(interimTranscript);
              }
            }
          };
          
          recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            showToast(`Speech recognition error: ${event.error}`, "error");
            
            // Update status to error
            setSpeechRecognitionStatus('error');
            
            // Add error recovery logic
            if (event.error === 'no-speech' || event.error === 'audio-capture' || event.error === 'network') {
              // These errors can be recovered from, so try to restart recognition after a short delay
              setTimeout(() => {
                try {
                  if (speechRecognition) {
                    speechRecognition.stop();
                  }
                  recognition.start();
                  console.log('Restarted speech recognition after error');
                } catch (restartError) {
                  console.error('Failed to restart speech recognition:', restartError);
                  showToast("Could not restart speech recognition. Please refresh the page.", "error");
                }
              }, 1000);
            } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
              // Permission errors require user action
              setPermissionDenied(true);
              showToast("Microphone access denied. Please enable microphone access and refresh the page.", "error");
            } else if (event.error === 'aborted') {
              // User or system aborted, no need to show error
              console.log('Speech recognition aborted');
            }
          };
          
          // Add onend handler to automatically restart if it ends unexpectedly
          recognition.onend = () => {
            // Only restart if we're still recording and not manually stopped
            if (isRecording && !permissionDenied) {
              try {
                recognition.start();
                console.log('Restarted speech recognition after it ended');
                // Set status back to active after restart
                setSpeechRecognitionStatus('active');
              } catch (restartError) {
                console.error('Failed to restart speech recognition:', restartError);
                setSpeechRecognitionStatus('error');
              }
            } else {
              setSpeechRecognitionStatus('inactive');
            }
          };
          
          try {
            recognition.start();
            setSpeechRecognition(recognition);
            setSpeechRecognitionStatus('active');
          } catch (startError) {
            console.error('Error starting speech recognition:', startError);
            showToast(`Could not start speech recognition: ${startError.message}`, "error");
          }
        } else {
          // Fallback when speech recognition is not supported
          console.warn('Speech recognition not supported in this browser');
          showToast("Speech recognition is not supported in this browser. Please use Chrome or Edge for the best experience.", "warning");
          
          // Set a flag to indicate speech recognition is not available
          setSpeechRecognitionAvailable(false);
        }
      } catch (error) {
        console.error("Error accessing media devices:", error);
        setPermissionDenied(true);
        setIsLoading(false);
        showToast(`Error: ${error.message}`, "error");
      }
    }
    
    setupMedia();
    
    return () => {
      // Cleanup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (speechRecognition) {
        speechRecognition.stop();
      }
      
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    
    if (speechRecognition) {
      speechRecognition.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const handleQuitInterview = () => {
    stopRecording();
    setStage(INTERVIEW_STAGES.PREPARATION);
  };

  const handleCompleteInterview = () => {
    stopRecording();
    // Pass transcript data to parent component
    setTranscriptData(transcriptMessages);
    setStage(INTERVIEW_STAGES.ANALYTICS);
  };

  const handleNextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;
    
    if (nextIndex < interviewerQuestions.length) {
      setCurrentQuestionIndex(nextIndex);
      
      // Calculate timestamp relative to recording start
      const currentTime = Date.now();
      const elapsedSeconds = Math.floor((currentTime - recordingStartTime) / 1000);
      
      // Add interviewer question to transcript messages
      const newMessage = {
        role: 'assistant',
        content: interviewerQuestions[nextIndex],
        timestamp: elapsedSeconds,
      };
      
      setTranscriptMessages(prev => [...prev, newMessage]);
    } else {
      handleCompleteInterview();
    }
  };

  const dismissFeedback = () => {
    setFeedback(null);
  };

  const toggleFeedbackHistory = () => {
    setShowFeedbackHistory(!showFeedbackHistory);
  };

  // When the interview is complete, pass the transcript data to the parent
  useEffect(() => {
    return () => {
      if (transcriptMessages.length > 0) {
        setTranscriptData(transcriptMessages);
      }
    };
  }, [transcriptMessages]);

  // Add a function to manually restart speech recognition
  const restartSpeechRecognition = () => {
    if (speechRecognition) {
      try {
        speechRecognition.stop();
        setTimeout(() => {
          try {
            speechRecognition.start();
            setSpeechRecognitionStatus('active');
            showToast("Speech recognition restarted", "success");
          } catch (error) {
            console.error("Failed to restart speech recognition:", error);
            setSpeechRecognitionStatus('error');
            showToast("Failed to restart speech recognition", "error");
          }
        }, 500);
      } catch (error) {
        console.error("Error stopping speech recognition:", error);
      }
    } else if (isSpeechRecognitionSupported) {
      // If speechRecognition is null but supported, try to initialize it again
      setupMedia();
    }
  };

  // Add network connectivity monitoring
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network connection restored');
      showToast("Network connection restored", "success");
      
      // Try to restart speech recognition if it was in error state
      if (speechRecognitionStatus === 'error' && isRecording) {
        restartSpeechRecognition();
      }
    };
    
    const handleOffline = () => {
      console.log('Network connection lost');
      showToast("Network connection lost. Speech recognition may be affected.", "warning");
      
      // Mark speech recognition as having an error
      if (speechRecognitionStatus === 'active') {
        setSpeechRecognitionStatus('error');
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [speechRecognitionStatus, isRecording]);

  // Add a function to check and fix video display
  const checkVideoDisplay = () => {
    if (videoRef.current && streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      
      if (videoTracks.length > 0 && !videoTracks[0].enabled) {
        console.log("Re-enabling video track");
        videoTracks[0].enabled = true;
      }
      
      // Reassign stream to video element
      if (!videoRef.current.srcObject || videoRef.current.paused) {
        console.log("Reassigning stream to video element");
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(e => {
          console.error("Error playing video after reassignment:", e);
        });
      }
    }
  };
  
  // Periodically check video display
  useEffect(() => {
    if (!isLoading && isRecording) {
      // Initial check
      checkVideoDisplay();
      
      // Set up periodic check
      const checkInterval = setInterval(() => {
        checkVideoDisplay();
      }, 5000); // Check every 5 seconds
      
      return () => {
        clearInterval(checkInterval);
      };
    }
  }, [isLoading, isRecording]);

  if (permissionDenied) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-theme-text-primary mb-4">Permission Denied</h2>
          <p className="text-theme-text-secondary mb-6">
            We need camera and microphone access to conduct the interview. Please allow access in your browser settings.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary-button hover:bg-primary-button-hover text-white font-medium rounded-lg transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-full">
          <CircleNotch size={48} className="text-primary-button animate-spin mb-4" />
          <p className="text-theme-text-secondary">Setting up your interview session...</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            {/* Video preview */}
            <div className="md:w-2/3 bg-black rounded-lg overflow-hidden shadow-lg relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover scale-x-[-1]"
                id="webcam-preview"
                style={{ minHeight: "360px", backgroundColor: "#000" }}
                onError={(e) => {
                  console.error("Video element error:", e);
                  showToast("Video display error. Try clicking 'Refresh Video'", "error");
                }}
              />
              
              {/* Video refresh button */}
              <button 
                onClick={checkVideoDisplay}
                className="absolute top-4 left-4 bg-theme-bg-container bg-opacity-80 text-theme-text-primary px-3 py-1 rounded-md text-sm font-medium hover:bg-opacity-100 transition-all"
              >
                Refresh Video
              </button>
              
              {/* Real-time feedback */}
              {feedback && (
                <div className="absolute top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                  {feedback.type === "filler_words" ? (
                    <Microphone size={20} />
                  ) : feedback.type === "short_response" ? (
                    <TextT size={20} />
                  ) : (
                    <Clock size={20} />
                  )}
                  <span>{feedback.message}</span>
                  <button onClick={dismissFeedback} className="ml-2 hover:bg-white hover:bg-opacity-20 rounded-full p-1">
                    <X size={16} />
                  </button>
                </div>
              )}
              
              {/* Feedback history toggle button */}
              <button 
                onClick={toggleFeedbackHistory}
                className="absolute bottom-4 right-4 bg-theme-bg-container bg-opacity-80 text-theme-text-primary px-3 py-1 rounded-md text-sm font-medium hover:bg-opacity-100 transition-all"
              >
                {showFeedbackHistory ? "Hide Feedback" : "Show Feedback History"}
              </button>
            </div>

            {/* Question display */}
            <div className="md:w-1/3 bg-theme-bg-container p-6 rounded-lg shadow-md flex flex-col">
              <div className="mb-4">
                <span className="text-sm font-medium text-theme-text-secondary">
                  Question {currentQuestionIndex + 1} of {interviewerQuestions.length}
                </span>
              </div>

              <h2 className="text-xl font-semibold text-theme-text-primary mb-6 flex-1">
                {interviewerQuestions[currentQuestionIndex]}
              </h2>

              <div className="flex justify-between gap-4">
                <button
                  onClick={handleQuitInterview}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
                >
                  <StopCircle weight="bold" size={20} />
                  Quit Interview
                </button>

                <button
                  onClick={handleNextQuestion}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-button hover:bg-primary-button-hover text-white font-medium rounded-lg transition-colors"
                >
                  Next Question
                  <ArrowRight weight="bold" size={20} />
                </button>
              </div>
            </div>
          </div>
          
          {/* Feedback history panel */}
          {showFeedbackHistory && feedbackHistory.length > 0 && (
            <div className="bg-theme-bg-container p-4 rounded-lg shadow-md mb-6">
              <h3 className="text-lg font-semibold text-theme-text-primary mb-3">Feedback History</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {feedbackHistory.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-theme-bg-secondary rounded-md">
                    <div className="bg-blue-500 p-1 rounded-full text-white">
                      {item.type === "filler_words" ? (
                        <Microphone size={16} />
                      ) : item.type === "short_response" ? (
                        <TextT size={16} />
                      ) : (
                        <Clock size={16} />
                      )}
                    </div>
                    <span className="text-theme-text-primary">{item.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recording indicator */}
          {isRecording && (
            <div className="fixed top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full flex items-center gap-2 shadow-md">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Recording</span>
            </div>
          )}

          {/* Speech recognition status indicator */}
          <div className="fixed top-4 left-4 bg-theme-bg-container p-2 rounded-full flex items-center gap-2 shadow-md z-10">
            <div 
              className={`w-3 h-3 rounded-full ${
                speechRecognitionStatus === 'active' 
                  ? 'bg-green-500 animate-pulse' 
                  : speechRecognitionStatus === 'error' 
                    ? 'bg-red-500' 
                    : 'bg-gray-400'
              }`}
            />
            <span className="text-sm font-medium text-theme-text-primary">
              {speechRecognitionStatus === 'active' 
                ? 'Listening' 
                : speechRecognitionStatus === 'error' 
                  ? 'Recognition Error' 
                  : 'Microphone Off'}
            </span>
            {speechRecognitionStatus === 'error' && (
              <button 
                onClick={restartSpeechRecognition}
                className="ml-2 bg-primary-button text-white px-2 py-1 text-xs rounded-md hover:bg-primary-button-hover"
              >
                Restart
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
