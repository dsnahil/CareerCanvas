import React, { useState } from "react";
import InterviewRecordings from "../Interview/InterviewRecordings";
import InterviewPlayback from "../Interview/InterviewPlayback";

export default function Recordings() {
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [showPlayback, setShowPlayback] = useState(false);

  const handleSetSelectedRecording = (recording) => {
    setSelectedRecording(recording);
    setShowPlayback(true);
  };

  const handleBackToRecordings = () => {
    setShowPlayback(false);
  };

  return (
    <div className="flex-1 overflow-auto">
      {showPlayback && selectedRecording ? (
        <InterviewPlayback 
          setStage={handleBackToRecordings} 
          selectedRecording={selectedRecording} 
          isStandalone={true} 
        />
      ) : (
        <InterviewRecordings 
          setStage={() => {}} 
          setSelectedRecording={handleSetSelectedRecording} 
          isStandalone={true} 
        />
      )}
    </div>
  );
} 