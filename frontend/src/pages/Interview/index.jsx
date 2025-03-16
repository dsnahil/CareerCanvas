import React, { useMemo, useState } from "react";
import { isMobile } from "react-device-detect";
import Sidebar from "@/components/Sidebar";
import InterviewPreparation from "./InterviewPreparation.jsx";
import InterviewSession from "./InterviewSession";
import InterviewEnd from "./InterviewEnd";
import InterviewAnalytics from "./InterviewAnalytics";
import InterviewRecordings from "./InterviewRecordings";
import InterviewPlayback from "./InterviewPlayback";

export const INTERVIEW_STAGES = {
  PREPARATION: "preparation",
  SESSION: "session",
  ANALYTICS: "analytics",
  SPEECH_ANALYTICS: "speech_analytics",
  RECORDINGS: "recordings",
  PLAYBACK: "playback",
};

export default function Interview() {
  const [stage, setStage] = useState(INTERVIEW_STAGES.PREPARATION); // start, recording, end
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [customQuestions, setCustomQuestions] = useState([]);
  const [transcript, setTranscript] = useState("");
  const [transcriptData, setTranscriptData] = useState([]);
  const [selectedRecording, setSelectedRecording] = useState(null);

  const currentInterviewComponent = useMemo(() => {
    switch (stage) {
      case INTERVIEW_STAGES.PREPARATION:
        return <InterviewPreparation setStage={setStage} setQuestions={setCustomQuestions} />;
      case INTERVIEW_STAGES.SESSION:
        return (
          <InterviewSession
            setStage={setStage}
            setRecordedVideo={setRecordedVideo}
            setRecordedAudio={setRecordedAudio}
            setTranscriptData={setTranscriptData}
            customQuestions={customQuestions}
          />
        );
      case INTERVIEW_STAGES.ANALYTICS:
        return (
          <InterviewEnd 
            recordedBlob={recordedVideo} 
            recordedAudio={recordedAudio} 
            transcriptData={transcriptData}
            setStage={setStage} 
          />
        );
      case INTERVIEW_STAGES.SPEECH_ANALYTICS:
        return (
          <InterviewAnalytics 
            setStage={setStage} 
            recordedAudio={recordedAudio} 
            transcript={transcript}
            transcriptData={transcriptData}
          />
        );
      case INTERVIEW_STAGES.RECORDINGS:
        return <InterviewRecordings setStage={setStage} setSelectedRecording={setSelectedRecording} />;
      case INTERVIEW_STAGES.PLAYBACK:
        return <InterviewPlayback setStage={setStage} selectedRecording={selectedRecording} />;
      default:
        return null;
    }
  }, [recordedVideo, recordedAudio, stage, customQuestions, transcript, transcriptData, selectedRecording]);

  return <div className="h-screen bg-theme-bg-container flex p-8 justify-center">{currentInterviewComponent}</div>;
}
