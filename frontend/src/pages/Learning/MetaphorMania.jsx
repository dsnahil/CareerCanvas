import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { CaretLeft, Gear, SpeakerHigh, Pause, Play, Microphone, MicrophoneSlash, Record, Stop } from "@phosphor-icons/react";
import showToast from "@/utils/toast";

export default function MetaphorMania() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(6); // in seconds
  const [numPrompts, setNumPrompts] = useState(5);
  const [timeBetweenPrompts, setTimeBetweenPrompts] = useState(6); // in seconds
  const [showSettings, setShowSettings] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [audioURL, setAudioURL] = useState(null);
  const [aiResponse, setAiResponse] = useState("");
  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  
  const prompts = [
    "Playing hopscotch is like a toilet because...",
    "Gardening is like plastic because...",
    "Getting directions is like lighting a fire because...",
    "An astronaut is like opening a beer because...",
    "Organic chemistry is like watching soccer because..."
  ];

  // Other speech practice placeholders
  const spinAYarnMessage = "Spin a Yarn - Coming soon...";
  const noFillerMessage = "No Filler - Coming soon...";
  const storytellerMessage = "Storyteller - Coming soon...";

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            if (currentPromptIndex < numPrompts - 1) {
              setCurrentPromptIndex(prev => prev + 1);
              return timeBetweenPrompts;
            } else {
              clearInterval(timerRef.current);
              setIsPlaying(false);
              setIsCompleted(true);
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    
    return () => clearInterval(timerRef.current);
  }, [isPlaying, currentPromptIndex, numPrompts, timeBetweenPrompts]);

  // Cleanup audio recording resources when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(err => console.error("Error closing audio context:", err));
      }
    };
  }, []);

  const handleStart = () => {
    setIsPlaying(true);
    setTimeRemaining(timeBetweenPrompts);
    setCurrentPromptIndex(0);
    setIsCompleted(false);
    setAudioURL(null);
    setRecordedChunks([]);
    setAiResponse("");
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleComplete = () => {
    setIsPlaying(false);
    setIsCompleted(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      // Reset recording state
      setRecordedChunks([]);
      setRecordingTime(0);
      setAudioURL(null);
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Create audio context to mute feedback
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      
      // By not connecting the source to the audio context destination,
      // we effectively mute the microphone feedback
      // This prevents the user from hearing their own voice during recording
      
      // Create media recorder
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg'
      ];
      
      // Find the first supported MIME type
      let mimeType = null;
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          console.log(`Using MIME type: ${mimeType}`);
          break;
        }
      }
      
      const options = {
        mimeType,
        audioBitsPerSecond: 128000 // 128kbps audio
      };
      
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      
      // Handle data available event
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          setRecordedChunks(prev => [...prev, event.data]);
        }
      };
      
      // Start recording
      recorder.start(1000); // Collect data every second
      setIsRecording(true);
      
      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error("Error starting recording:", err);
      showToast("Failed to start recording. Please check your microphone permissions.", "error");
    }
  };
  
  const stopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
      return;
    }
    
    try {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop and clear all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(err => console.error("Error closing audio context:", err));
        audioContextRef.current = null;
      }
      
      // Clear timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      
      // Process the recorded chunks
      setTimeout(() => {
        if (recordedChunks.length > 0) {
          const blob = new Blob(recordedChunks, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          setAudioURL(url);
          setRecordedAudio(blob);
          
          // Generate AI response
          generateAIResponse();
        }
      }, 500);
      
    } catch (err) {
      console.error("Error stopping recording:", err);
      showToast("Error stopping recording", "error");
    }
  };
  
  const generateAIResponse = () => {
    // Simulate AI response - in a real app, this would call an API
    const responses = [
      "That's an interesting metaphor! I like how you connected those concepts.",
      "Great job thinking on your feet. Your metaphor was creative and unexpected.",
      "I can see the connection you made. Try to elaborate more on the similarities next time.",
      "Excellent metaphor! You showed great lateral thinking skills.",
      "That was a unique perspective. Keep practicing to make your metaphors even more vivid."
    ];
    
    // Simulate loading time
    setTimeout(() => {
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setAiResponse(randomResponse);
    }, 1500);
  };

  return (
    <div className="flex flex-col w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600">
      <div className="p-4">
        <Link to="/learning" className="flex items-center text-white hover:text-blue-200 transition-colors">
          <CaretLeft size={24} />
          <span className="ml-2">Back</span>
        </Link>
      </div>
      
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
          {!isCompleted ? (
            <>
              <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-blue-600 mb-8">Metaphor Mania</h1>
                
                {showHowToPlay ? (
                  <div className="text-left mb-8">
                    <h2 className="text-xl font-semibold mb-4">How to Play</h2>
                    <p className="mb-4">
                      In this exercise, you'll be given a series of prompts asking you to create metaphors.
                      Each prompt will appear for a limited time, and you need to quickly think of a creative
                      analogy that connects the two unrelated concepts.
                    </p>
                    <p className="mb-4">
                      The goal is to build your lateral thinking skills and ability to make connections
                      under time pressure.
                    </p>
                    <button 
                      onClick={() => setShowHowToPlay(false)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Got it
                    </button>
                  </div>
                ) : showSettings ? (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Settings</h2>
                    
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Set number of prompts
                      </label>
                      <div className="flex items-center justify-between">
                        <span>3</span>
                        <input
                          type="range"
                          min="3"
                          max="25"
                          value={numPrompts}
                          onChange={(e) => setNumPrompts(parseInt(e.target.value))}
                          className="mx-4 w-full"
                        />
                        <span>25</span>
                      </div>
                      <div className="text-center font-bold mt-1">{numPrompts}</div>
                    </div>
                    
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Set time between prompts
                      </label>
                      <div className="flex items-center justify-between">
                        <span>0:02</span>
                        <input
                          type="range"
                          min="2"
                          max="10"
                          value={timeBetweenPrompts}
                          onChange={(e) => setTimeBetweenPrompts(parseInt(e.target.value))}
                          className="mx-4 w-full"
                        />
                        <span>0:10</span>
                      </div>
                      <div className="text-center font-bold mt-1">{formatTime(timeBetweenPrompts)}</div>
                    </div>
                    
                    <button 
                      onClick={() => setShowSettings(false)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Save Settings
                    </button>
                  </div>
                ) : !isPlaying ? (
                  <div className="flex flex-col items-center justify-center space-y-6">
                    <div className="flex space-x-4">
                      <button
                        onClick={() => setShowHowToPlay(true)}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                      >
                        <span>How to Play</span>
                        <CaretLeft size={16} className="transform rotate-180" />
                      </button>
                      
                      <button
                        onClick={() => setShowSettings(true)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <Gear size={24} />
                      </button>
                    </div>
                    
                    <button
                      onClick={handleStart}
                      className="px-8 py-3 bg-blue-500 text-white rounded-full text-lg font-semibold hover:bg-blue-600 transition-colors"
                    >
                      Start
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <h2 className="text-xl mb-12">{prompts[currentPromptIndex % prompts.length]}</h2>
                    
                    <div className="relative w-40 h-40 mb-8">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="12"
                        />
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="12"
                          strokeDasharray="439.8"
                          strokeDashoffset={439.8 * (1 - timeRemaining / timeBetweenPrompts)}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                        <span className="text-4xl font-bold text-blue-500">{formatTime(timeRemaining)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={handlePause}
                        className="flex items-center justify-center w-12 h-12 rounded-full bg-white border-2 border-blue-500 text-blue-500"
                      >
                        <Pause size={24} weight="fill" />
                      </button>
                      
                      {!isRecording ? (
                        <button
                          onClick={startRecording}
                          className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500 text-white"
                          title="Start recording (your voice will be muted during recording to prevent feedback)"
                        >
                          <Microphone size={24} weight="fill" />
                        </button>
                      ) : (
                        <button
                          onClick={stopRecording}
                          className="flex items-center justify-center w-12 h-12 rounded-full bg-red-600 text-white animate-pulse"
                          title="Stop recording"
                        >
                          <Stop size={24} weight="fill" />
                        </button>
                      )}
                    </div>
                    
                    {isRecording && (
                      <div className="mt-4 text-sm text-white bg-red-500 px-3 py-1 rounded-full flex items-center gap-2">
                        <span>Recording... {formatTime(recordingTime)}</span>
                        <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <MicrophoneSlash size={12} />
                          Feedback muted
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="p-4 flex justify-end">
                <button
                  onClick={handleComplete}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Complete Exercise
                </button>
              </div>
            </>
          ) : (
            <div className="p-8">
              <h1 className="text-2xl font-bold text-blue-600 mb-8 text-center">Metaphor Mania</h1>
              
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Prompts</h2>
                  <div className="flex flex-col md:flex-row items-center gap-2">
                    {audioURL ? (
                      <div className="flex items-center">
                        <audio
                          src={audioURL}
                          controls
                          className="w-64"
                        />
                        <button 
                          onClick={startRecording}
                          className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                          Record Again
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={startRecording}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                        title="Your voice will be muted during recording to prevent feedback"
                      >
                        <Microphone size={16} />
                        Record Your Answer
                      </button>
                    )}
                  </div>
                </div>
                
                {isRecording && (
                  <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>Recording... {formatTime(recordingTime)}</span>
                      <span className="text-xs bg-red-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <MicrophoneSlash size={12} />
                        Feedback muted
                      </span>
                    </div>
                    <button 
                      onClick={stopRecording}
                      className="px-3 py-1 bg-red-600 text-white rounded-md flex items-center gap-1"
                    >
                      <Stop size={14} />
                      Stop
                    </button>
                  </div>
                )}
                
                {aiResponse && (
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="font-medium mb-2 text-blue-800 dark:text-blue-300">AI Feedback:</h3>
                    <p className="text-gray-700 dark:text-gray-300">{aiResponse}</p>
                  </div>
                )}
                
                <ul className="space-y-4">
                  {prompts.slice(0, numPrompts).map((prompt, index) => (
                    <li key={index} className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      {index + 1}. {prompt}
                    </li>
                  ))}
                </ul>
                
                <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h3 className="font-medium mb-2 text-yellow-800 dark:text-yellow-300">Other Speech Practices:</h3>
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                    <li>{spinAYarnMessage}</li>
                    <li>{noFillerMessage}</li>
                    <li>{storytellerMessage}</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={() => window.history.back()}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Share your score with your friends!
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 