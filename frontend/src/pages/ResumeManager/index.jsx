import { useState, useEffect, useRef } from "react";
import ResumeUpload from "./ResumeUpload";
import JobDescription from "./JobDescription";
import useWebSocketHandler from "./WebSocketHandler";

export default function ResumeManager() {
  const [resumeContent, setResumeContent] = useState(null);
  const [jobDescription, setJobDescription] = useState(null);
  const { loading, chatHistory, initiateSession } = useWebSocketHandler();
  const chatHistoryRef = useRef(null);

  // Debug state values
  useEffect(() => {
    console.log("Resume Content:", resumeContent ? "Provided" : "Not provided");
    console.log("Job Description:", jobDescription ? "Provided" : "Not provided");
    console.log("Loading:", loading);
  }, [resumeContent, jobDescription, loading]);

  // Auto-scroll to bottom when chat history updates
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSubmission = () => {
    if (resumeContent && jobDescription) {
      initiateSession(resumeContent, jobDescription);
    } else {
      console.error("Missing required content:", {
        resumeContent: Boolean(resumeContent),
        jobDescription: Boolean(jobDescription)
      });
    }
  };

  return (
    <div className="flex flex-col space-y-6 p-6 overflow-hidden h-full">
      <h1 className="text-2xl font-bold text-white">Resume Tailor</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-auto max-h-[40vh] p-1">
        <ResumeUpload onSubmit={setResumeContent} loading={loading} />
        <JobDescription onSubmit={setJobDescription} loading={loading} />
      </div>

      <button
        onClick={handleSubmission}
        disabled={loading || !resumeContent || !jobDescription}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-theme-primary-hover disabled:opacity-50"
      >
        {loading ? "Processing..." : "Tailor Resume"}
      </button>

      <div 
        ref={chatHistoryRef}
        className="space-y-4 overflow-y-auto max-h-[40vh] pr-2 flex-grow border border-gray-700 rounded-lg p-4"
        style={{ overflowY: 'auto', scrollBehavior: 'smooth' }}
      >
        {chatHistory.map((message, index) => (
          <div
            key={message.uuid || index}
            className={`p-4 rounded-lg ${
              message.role === "assistant"
                ? "bg-theme-bg-secondary"
                : "bg-theme-bg-tertiary"
            }`}
          >
            <pre className="whitespace-pre-wrap text-theme-text-primary overflow-x-auto" style={{ overflowWrap: 'break-word' }}>
              {message.content}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
