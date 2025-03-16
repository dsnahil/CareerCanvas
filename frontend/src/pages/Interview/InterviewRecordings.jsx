import React, { useState, useEffect } from "react";
import { ArrowLeft, MagnifyingGlass, CaretUp, CaretDown, Play, Trash } from "@phosphor-icons/react";
import { INTERVIEW_STAGES } from "./index.jsx";
import { getRecordings, deleteRecording } from "@/utils/recordingStorage";
import showToast from "@/utils/toast";
import { ensureAbsoluteUrl } from "@/utils/api";

export default function InterviewRecordings({ setStage, setSelectedRecording, isStandalone = false }) {
  const [recordings, setRecordings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "created",
    direction: "desc",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load recordings from local storage
    const loadRecordings = async () => {
      setIsLoading(true);
      try {
        const storedRecordings = getRecordings();
        setRecordings(storedRecordings);
      } catch (error) {
        console.error("Error loading recordings:", error);
        showToast("Failed to load recordings", "error");
      } finally {
        setIsLoading(false);
      }
    };

    loadRecordings();
  }, []);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === "asc" ? (
      <CaretUp size={16} className="ml-1" />
    ) : (
      <CaretDown size={16} className="ml-1" />
    );
  };

  const sortedRecordings = [...recordings].sort((a, b) => {
    if (a[sortConfig.key] === null) return 1;
    if (b[sortConfig.key] === null) return -1;
    
    if (sortConfig.key === "created") {
      return sortConfig.direction === "asc"
        ? new Date(a[sortConfig.key]) - new Date(b[sortConfig.key])
        : new Date(b[sortConfig.key]) - new Date(a[sortConfig.key]);
    }
    
    if (typeof a[sortConfig.key] === "string") {
      return sortConfig.direction === "asc"
        ? a[sortConfig.key].localeCompare(b[sortConfig.key])
        : b[sortConfig.key].localeCompare(a[sortConfig.key]);
    }
    
    return sortConfig.direction === "asc"
      ? a[sortConfig.key] - b[sortConfig.key]
      : b[sortConfig.key] - a[sortConfig.key];
  });

  const filteredRecordings = sortedRecordings.filter((recording) =>
    recording.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePlayRecording = (recording) => {
    setSelectedRecording(recording);
    setStage(INTERVIEW_STAGES.PLAYBACK);
  };

  const handleDeleteRecording = (id) => {
    try {
      deleteRecording(id);
      setRecordings(recordings.filter((recording) => recording.id !== id));
      showToast("Recording deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting recording:", error);
      showToast("Failed to delete recording", "error");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = date.toLocaleString('default', { month: 'short' });
    return `${month} ${date.getDate()}`;
  };

  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto">
      <div className="flex items-center mb-6">
        {!isStandalone && (
          <button
            onClick={() => setStage(INTERVIEW_STAGES.PREPARATION)}
            className="mr-4 p-2 rounded-full hover:bg-theme-bg-secondary"
          >
            <ArrowLeft size={24} className="text-theme-text-primary" />
          </button>
        )}
        <h1 className="text-2xl font-bold text-theme-text-primary">My Recordings</h1>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          <button
            className="px-4 py-2 text-primary-button border-b-2 border-primary-button font-medium"
          >
            My Recordings
          </button>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => isStandalone ? window.location.href = "/interview" : setStage(INTERVIEW_STAGES.PREPARATION)}
            className="px-6 py-2 bg-primary-button hover:bg-primary-button-hover text-white font-medium rounded-full"
          >
            New Interview
          </button>
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-full border border-theme-border bg-theme-bg-secondary text-theme-text-primary w-64"
            />
            <MagnifyingGlass
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-text-secondary"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary-button border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredRecordings.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-theme-text-secondary">
          <Play size={48} className="mb-4 opacity-50" />
          <p className="text-xl font-medium mb-2">No recordings found</p>
          <p className="mb-6">Complete an interview practice session to see recordings here</p>
          <button
            onClick={() => isStandalone ? window.location.href = "/interview" : setStage(INTERVIEW_STAGES.PREPARATION)}
            className="px-6 py-2 bg-primary-button hover:bg-primary-button-hover text-white font-medium rounded-lg"
          >
            Start New Interview
          </button>
        </div>
      ) : (
        <>
          <div className="bg-theme-bg-container rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-theme-border">
                  <th className="px-6 py-3 text-left text-sm font-medium text-theme-text-secondary">
                    <button
                      className="flex items-center focus:outline-none"
                      onClick={() => handleSort("title")}
                    >
                      Title
                      {getSortIcon("title")}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-theme-text-secondary">
                    <button
                      className="flex items-center focus:outline-none"
                      onClick={() => handleSort("created")}
                    >
                      Created
                      {getSortIcon("created")}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-theme-text-secondary">
                    <button
                      className="flex items-center focus:outline-none"
                      onClick={() => handleSort("type")}
                    >
                      Type
                      {getSortIcon("type")}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-theme-text-secondary">
                    <button
                      className="flex items-center focus:outline-none"
                      onClick={() => handleSort("duration")}
                    >
                      Total Time
                      {getSortIcon("duration")}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-theme-text-secondary">
                    <button
                      className="flex items-center focus:outline-none"
                      onClick={() => handleSort("score")}
                    >
                      Score
                      {getSortIcon("score")}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-theme-text-secondary">
                    <button
                      className="flex items-center focus:outline-none"
                      onClick={() => handleSort("pacing")}
                    >
                      Pacing
                      {getSortIcon("pacing")}
                    </button>
                  </th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredRecordings.map((recording) => (
                  <tr
                    key={recording.id}
                    className="border-b border-theme-border hover:bg-theme-bg-secondary cursor-pointer"
                    onClick={() => handlePlayRecording(recording)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-12 w-16 bg-theme-bg-secondary rounded overflow-hidden mr-3 flex-shrink-0">
                          {recording.videoUrl ? (
                            <video
                              src={ensureAbsoluteUrl(recording.videoUrl)}
                              className="h-full w-full object-cover"
                              preload="metadata"
                              crossOrigin="anonymous"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-theme-text-secondary">
                              <Play size={24} />
                            </div>
                          )}
                        </div>
                        <span className="text-theme-text-primary">{recording.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-theme-text-primary">
                      {formatDate(recording.created)}
                    </td>
                    <td className="px-6 py-4 text-theme-text-primary">{recording.type || "Interview"}</td>
                    <td className="px-6 py-4 text-theme-text-primary">{recording.duration || "—"}</td>
                    <td className="px-6 py-4 text-theme-text-primary">
                      {recording.score !== null ? recording.score : "—"}
                    </td>
                    <td className="px-6 py-4 text-theme-text-primary">
                      {recording.pacing !== null ? (
                        <span className={recording.pacing > 100 ? "text-red-500" : "text-green-500"}>
                          {recording.pacing}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRecording(recording.id);
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-sm text-theme-text-secondary">
            Displaying items 1 - {filteredRecordings.length} of {filteredRecordings.length}
          </div>
        </>
      )}
    </div>
  );
} 