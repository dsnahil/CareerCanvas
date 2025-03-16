import React, { useEffect, useRef, useState } from "react";
import { Play, Plus, Trash, VideoCamera } from "@phosphor-icons/react";
import { INTERVIEW_STAGES } from "./index.jsx";

export default function InterviewPreparation({ setStage, setQuestions }) {
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [customQuestions, setCustomQuestions] = useState(["Tell me about yourself"]);
  const videoRef = useRef(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    });
  }, []);

  const addQuestion = () => {
    if (newQuestion.trim()) {
      setCustomQuestions([...customQuestions, newQuestion.trim()]);
      setNewQuestion("");
    }
  };

  const removeQuestion = (index) => {
    const updatedQuestions = [...customQuestions];
    updatedQuestions.splice(index, 1);
    setCustomQuestions(updatedQuestions);
  };

  const handleStartInterview = () => {
    setQuestions([...customQuestions]);
    setStage(INTERVIEW_STAGES.SESSION);
  };
  
  const handleViewRecordings = () => {
    setStage(INTERVIEW_STAGES.RECORDINGS);
  };

  return (
    <div className="flex flex-col w-full h-full">
      <h1 className="flex justify-center w-full text-3xl font-bold text-theme-text-primary mb-4">
        Welcome to Interview Practice
      </h1>
      <p className="flex justify-center text-lg text-theme-text-secondary mb-6">
        Practice your interview skills in a safe environment
      </p>
      <div className="flex w-full h-0 flex-1 gap-8">
        <div className="flex flex-col w-full">
          <div className="flex flex-col bg-theme-bg-container p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold text-theme-text-primary mb-4">Personalize Your Interview</h2>
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex flex-col flex-1">
                <label htmlFor="role" className="text-left text-theme-text-secondary mb-1">
                  Position/Role
                </label>
                <input
                  id="role"
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Software Engineer"
                  className="p-2 rounded border border-theme-border bg-theme-bg-secondary text-theme-text-primary"
                />
              </div>
              <div className="flex flex-col flex-1">
                <label htmlFor="company" className="text-left text-theme-text-secondary mb-1">
                  Company (Optional)
                </label>
                <input
                  id="company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Google"
                  className="p-2 rounded border border-theme-border bg-theme-bg-secondary text-theme-text-primary"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col bg-theme-bg-container p-6 rounded-lg shadow-md flex-1 h-0 object-fill">
            <h2 className="text-xl font-semibold text-theme-text-primary mb-4">Interview Practice Questions</h2>
            <div className="overflow-y-scroll">
              {customQuestions.length > 0 && (
                <ul className="space-y-2 text-left mb-4">
                  {customQuestions.map((question, index) => (
                    <li key={index} className="flex items-center justify-between p-2 rounded bg-theme-bg-secondary">
                      <span className="text-theme-text-primary">{question}</span>
                      <button onClick={() => removeQuestion(index)} className="text-red-500 hover:text-red-700">
                        <Trash size={18} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Enter a custom interview question"
                  className="flex-1 p-2 rounded border border-theme-border bg-theme-bg-secondary text-theme-text-primary"
                  onKeyPress={(e) => e.key === "Enter" && addQuestion()}
                />
                <button
                  onClick={addQuestion}
                  className="p-2 bg-primary-button hover:bg-primary-button-hover text-white rounded-md"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center w-full gap-8">
          <div className="w-full bg-black rounded-lg overflow-hidden shadow-lg">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover scale-x-[-1]"
              id="webcam-preview"
            />
          </div>
          <div className="flex flex-col gap-4 w-full">
            <button
              onClick={handleStartInterview}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-button hover:bg-primary-button-hover text-white font-medium rounded-lg transition-colors"
            >
              <Play weight="bold" size={20} />
              Start Interview
            </button>
            <button
              onClick={handleViewRecordings}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-theme-bg-container hover:bg-theme-bg-primary text-theme-text-primary font-medium rounded-lg transition-colors border border-theme-border"
            >
              <VideoCamera weight="bold" size={20} />
              View My Recordings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
