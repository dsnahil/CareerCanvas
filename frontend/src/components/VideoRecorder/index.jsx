import React, { useState, useRef, useEffect } from "react";
import { Camera, Microphone, MicrophoneSlash, Record, Stop, CaretDown } from "@phosphor-icons/react";
import { saveRecording } from "@/utils/recordingStorage";
import showToast from "@/utils/toast";
import { ensureAbsoluteUrl } from "@/utils/api";

// Add this helper function to stop media tracks
const stopMediaTracks = (mediaStream) => {
  if (!mediaStream) return;
  
  mediaStream.getTracks().forEach(track => {
    track.stop();
  });
};

export default function VideoRecorder({ onRecordingComplete, onError }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [stream, setStream] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState(null);
  const [showAudioDeviceMenu, setShowAudioDeviceMenu] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioAnalyserRef = useRef(null);
  const audioDataRef = useRef(null);
  const audioLevelTimerRef = useRef(null);

  // Get available audio input devices
  const getAudioDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      console.log("Available audio input devices:", audioInputs);
      setAudioDevices(audioInputs);
      
      // If we have devices and no selected device yet, select the first one
      if (audioInputs.length > 0 && !selectedAudioDevice) {
        setSelectedAudioDevice(audioInputs[0]);
      }
    } catch (err) {
      console.error("Error getting audio devices:", err);
    }
  };

  // Set up audio level monitoring
  const setupAudioLevelMonitoring = (mediaStream) => {
    try {
      // Clean up any existing audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      
      if (audioLevelTimerRef.current) {
        clearInterval(audioLevelTimerRef.current);
      }
      
      // Create audio context and analyzer
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const audioSource = audioContext.createMediaStreamSource(mediaStream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      audioSource.connect(analyser);
      
      // We're not connecting the analyzer to the destination (speakers)
      // to avoid feedback loops
      
      audioAnalyserRef.current = analyser;
      
      // Create a data array to hold the audio data
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      audioDataRef.current = dataArray;
      
      // Set up interval to check audio levels
      audioLevelTimerRef.current = setInterval(() => {
        if (analyser && dataArray) {
          analyser.getByteFrequencyData(dataArray);
          
          // Calculate average volume level
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          
          // Normalize to 0-100 range
          const normalizedLevel = Math.min(100, Math.max(0, average * 1.5));
          setAudioLevel(normalizedLevel);
        }
      }, 100);
      
    } catch (err) {
      console.error("Error setting up audio monitoring:", err);
    }
  };

  useEffect(() => {
    // Get available audio devices
    getAudioDevices();
    
    // Initialize camera
    startCamera();
    
    // Cleanup on unmount
    return () => {
      stopCamera();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (audioLevelTimerRef.current) {
        clearInterval(audioLevelTimerRef.current);
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Restart camera when audio device changes
  useEffect(() => {
    if (selectedAudioDevice && !isRecording) {
      stopCamera();
      startCamera();
    }
  }, [selectedAudioDevice]);

  const startCamera = async () => {
    try {
      if (stream) {
        // Stop any existing stream
        stopMediaTracks(stream);
      }

      setErrorMessage("");
      setIsLoading(true);
      setCameraEnabled(false); // Set to false until camera is successfully started

      // Create audio constraints based on selected device
      const audioConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000, // Higher sample rate for better quality
        sampleSize: 16,    // 16-bit audio
        channelCount: 2,   // Stereo if available
      };

      // Add deviceId if a specific audio device is selected
      if (selectedAudioDevice && selectedAudioDevice.deviceId) {
        audioConstraints.deviceId = { exact: selectedAudioDevice.deviceId };
      }

      console.log("Using audio constraints:", audioConstraints);

      // Request media with video and audio
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: audioConstraints
      });

      // Log audio tracks for debugging
      const audioTracks = mediaStream.getAudioTracks();
      console.log(`Got ${audioTracks.length} audio tracks`);
      audioTracks.forEach((track, index) => {
        console.log(`Audio track ${index}:`, {
          label: track.label,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
          constraints: track.getConstraints(),
          settings: track.getSettings()
        });
      });

      // Set up audio level monitoring if available
      if (audioTracks.length > 0) {
        setupAudioLevelMonitoring(mediaStream);
      }

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      // Camera is now enabled
      setCameraEnabled(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setErrorMessage(`Error accessing camera: ${err.message}`);
      setCameraEnabled(false);
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    // Clean up audio monitoring
    if (audioLevelTimerRef.current) {
      clearInterval(audioLevelTimerRef.current);
      audioLevelTimerRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setAudioLevel(0);
    setCameraEnabled(false);
  };

  const toggleMute = () => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const startRecording = () => {
    if (!stream) {
      showToast("Camera not available", "error");
      return;
    }

    // Reset state
    setRecordedChunks([]);
    setIsRecording(true);
    setRecordingTime(0);
    setErrorMessage("");

    try {
      // Define MIME types in order of preference for better audio
      const mimeTypes = [
        'video/webm;codecs=vp8,opus', // Best for audio quality
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=h264,opus',
        'video/webm;codecs=vp8',
        'video/webm'
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

      if (!mimeType) {
        console.warn("None of the preferred MIME types are supported, using default");
      }

      // Create recorder with high audio quality settings
      const options = {
        mimeType,
        audioBitsPerSecond: 256000, // 256kbps audio for better quality
        videoBitsPerSecond: 2500000, // 2.5Mbps video
      };

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      // Log the actual settings used
      console.log("MediaRecorder settings:", {
        mimeType: recorder.mimeType,
        audioBitsPerSecond: options.audioBitsPerSecond,
        videoBitsPerSecond: options.videoBitsPerSecond,
        audioTracks: stream.getAudioTracks().map(track => ({
          label: track.label,
          settings: track.getSettings()
        }))
      });

      // Handle data available event
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          console.log(`Received chunk: ${event.data.size} bytes`);
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };

      // Handle recording stop
      recorder.onstop = () => {
        console.log("MediaRecorder stopped");
        setIsRecording(false);
        // Stop the timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      // Handle recording errors
      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event.error);
        setErrorMessage(`Recording error: ${event.error.message || "Unknown error"}`);
        recorder.stop();
      };

      // Start the recorder with smaller, more frequent chunks for more consistent audio
      recorder.start(500); // Collect data every 500ms for more consistent audio

      // Start a timer to track recording time
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);

      console.log("Recording started");
    } catch (err) {
      console.error("Error starting recording:", err);
      setErrorMessage(`Failed to start recording: ${err.message}`);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
      return;
    }
    
    try {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } catch (err) {
      console.error("Error stopping recording:", err);
      setErrorMessage(`Error stopping recording: ${err.message}`);
    }
  };

  // Helper function to ensure proper audio processing
  const ensureProperAudioProcessing = (chunks) => {
    if (!chunks || chunks.length === 0) return [];
    
    console.log(`Processing ${chunks.length} chunks for audio quality`);
    
    // Filter out any empty chunks
    const validChunks = chunks.filter(chunk => chunk && chunk.size > 0);
    
    if (validChunks.length === 0) {
      console.warn("No valid chunks found for processing");
      return [];
    }
    
    // Log chunk sizes for debugging
    validChunks.forEach((chunk, index) => {
      console.log(`Chunk ${index}: ${chunk.size} bytes, type: ${chunk.type}`);
    });
    
    // Sort chunks by size to identify potential audio-only or video-only chunks
    const sortedChunks = [...validChunks].sort((a, b) => a.size - b.size);
    const medianSize = sortedChunks[Math.floor(sortedChunks.length / 2)].size;
    
    console.log(`Median chunk size: ${medianSize} bytes`);
    
    // Filter out suspiciously small chunks (less than 10% of median)
    // These might be corrupted or contain incomplete audio frames
    const filteredChunks = validChunks.filter(chunk => chunk.size > medianSize * 0.1);
    
    if (filteredChunks.length < validChunks.length) {
      console.log(`Filtered out ${validChunks.length - filteredChunks.length} potentially problematic chunks`);
    }
    
    return filteredChunks;
  };

  const saveAndProcessRecording = async () => {
    if (recordedChunks.length === 0) {
      showToast("No recording data available", "error");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      console.log(`Processing ${recordedChunks.length} chunks of recorded data`);
      
      // Process chunks to ensure audio quality
      const processedChunks = ensureProperAudioProcessing(recordedChunks);
      
      if (processedChunks.length === 0) {
        throw new Error("No valid recording data available after processing");
      }
      
      // Create a blob with specific MIME type to ensure proper audio handling
      const blob = new Blob(processedChunks, { 
        type: 'video/webm; codecs=vp8,opus'  // Explicitly set codecs for better compatibility
      });
      
      console.log("Recording blob size:", blob.size, "bytes");
      
      if (blob.size < 1000) { // Less than 1KB is probably an error
        throw new Error("Recording is too small, likely corrupted");
      }
      
      // Create a title with date and time
      const now = new Date();
      const title = `Interview Recording - ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
      
      // Add information about the audio device used
      const audioDeviceInfo = selectedAudioDevice 
        ? `Recorded with: ${selectedAudioDevice.label || 'Selected microphone'}`
        : 'Recorded with default microphone';
      
      // Save the recording - pass the blob as the second parameter
      const savedRecording = await saveRecording({
        title,
        type: "Interview",
        duration: formatTime(recordingTime),
        notes: audioDeviceInfo // Add microphone info to the recording metadata
      }, blob);
      
      console.log("Saved recording:", savedRecording);
      
      // Ensure the URL is absolute
      if (savedRecording.videoUrl) {
        try {
          // Use the imported ensureAbsoluteUrl function
          savedRecording.videoUrl = ensureAbsoluteUrl(savedRecording.videoUrl);
        } catch (err) {
          // Fallback if the imported function fails
          console.warn("Error using ensureAbsoluteUrl, using fallback:", err);
          const baseUrl = window.location.origin;
          const url = savedRecording.videoUrl;
          savedRecording.videoUrl = url.startsWith('http') ? url : 
                                   url.startsWith('/') ? `${baseUrl}${url}` : 
                                   `${baseUrl}/${url}`;
        }
      }
      
      // Call the callback with the saved recording
      if (onRecordingComplete) {
        onRecordingComplete(savedRecording);
      }
      
      showToast("Recording saved successfully", "success");
    } catch (err) {
      console.error("Error saving recording:", err);
      setErrorMessage(`Error saving recording: ${err.message}`);
      showToast("Failed to save recording", "error");
      if (onError) {
        onError(err);
      }
    } finally {
      setIsProcessing(false);
      setRecordedChunks([]);
    }
  };

  useEffect(() => {
    if (!isRecording && recordedChunks.length > 0) {
      saveAndProcessRecording();
    }
  }, [isRecording, recordedChunks]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full max-w-3xl aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
        {cameraEnabled ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            onLoadedMetadata={() => {
              // Ensure video plays when metadata is loaded
              if (videoRef.current) {
                videoRef.current.play().catch(err => {
                  console.error("Error playing video:", err);
                });
              }
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <p className="text-white text-center p-4">
              {errorMessage || "Camera not available. Please check permissions and try again."}
            </p>
          </div>
        )}
        
        {isRecording && (
          <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center">
            <div className="w-3 h-3 rounded-full bg-white animate-pulse mr-2"></div>
            <span>{formatTime(recordingTime)}</span>
          </div>
        )}
        
        {isProcessing && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
              <p>Processing recording...</p>
            </div>
          </div>
        )}
      </div>
      
      {errorMessage && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md w-full max-w-3xl">
          <p>{errorMessage}</p>
        </div>
      )}
      
      {/* Audio device selector and level indicator */}
      <div className="mt-4 w-full max-w-3xl">
        <div className="flex flex-col md:flex-row items-center justify-center mb-2 gap-4">
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">Microphone:</span>
            <div className="relative">
              <button
                onClick={() => setShowAudioDeviceMenu(!showAudioDeviceMenu)}
                disabled={isRecording || isProcessing}
                className={`flex items-center justify-between px-3 py-1 bg-gray-100 rounded text-sm ${
                  (isRecording || isProcessing) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'
                }`}
              >
                <span className="mr-2 max-w-[200px] truncate">
                  {selectedAudioDevice ? selectedAudioDevice.label || `Microphone (${selectedAudioDevice.deviceId.substring(0, 5)}...)` : 'Default Microphone'}
                </span>
                <CaretDown size={14} />
              </button>
              
              {showAudioDeviceMenu && (
                <div className="absolute z-10 mt-1 w-64 bg-white rounded-md shadow-lg overflow-hidden">
                  <ul className="max-h-60 overflow-y-auto">
                    {audioDevices.length === 0 ? (
                      <li className="px-4 py-2 text-sm text-gray-500">No microphones found</li>
                    ) : (
                      audioDevices.map((device) => (
                        <li 
                          key={device.deviceId}
                          className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                            selectedAudioDevice?.deviceId === device.deviceId ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                          }`}
                          onClick={() => {
                            setSelectedAudioDevice(device);
                            setShowAudioDeviceMenu(false);
                          }}
                        >
                          {device.label || `Microphone (${device.deviceId.substring(0, 5)}...)`}
                        </li>
                      ))
                    )}
                  </ul>
                  <div className="border-t border-gray-200 px-4 py-2">
                    <button 
                      className="text-xs text-blue-500 hover:text-blue-700"
                      onClick={() => {
                        getAudioDevices();
                        setShowAudioDeviceMenu(false);
                      }}
                    >
                      Refresh devices
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Audio level indicator */}
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">Audio Level:</span>
            <div className="w-32 h-4 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${audioLevel > 70 ? 'bg-red-500' : audioLevel > 30 ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${audioLevel}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-500 ml-2">{Math.round(audioLevel)}%</span>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex items-center justify-center space-x-6">
        <button
          onClick={toggleMute}
          disabled={!cameraEnabled || isRecording || isProcessing}
          className={`p-3 rounded-full ${
            isMuted ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-800'
          } hover:bg-opacity-80 transition-colors ${
            (!cameraEnabled || isRecording || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isMuted ? (
            <MicrophoneSlash size={24} weight="bold" />
          ) : (
            <Microphone size={24} weight="bold" />
          )}
        </button>
        
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={!cameraEnabled || isProcessing}
            className={`p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors ${
              (!cameraEnabled || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Record size={32} weight="fill" />
          </button>
        ) : (
          <button
            onClick={stopRecording}
            disabled={isProcessing}
            className={`p-4 rounded-full bg-gray-800 text-white hover:bg-gray-900 transition-colors ${
              isProcessing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Stop size={32} weight="fill" />
          </button>
        )}
        
        <button
          onClick={startCamera}
          disabled={isRecording || isProcessing}
          className={`p-3 rounded-full bg-gray-100 text-gray-800 hover:bg-opacity-80 transition-colors ${
            (isRecording || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Camera size={24} weight="bold" />
        </button>
      </div>
    </div>
  );
} 