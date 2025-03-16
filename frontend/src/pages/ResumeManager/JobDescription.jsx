import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

export default function JobDescription({ onSubmit, loading }) {
  const [jobDescription, setJobDescription] = useState("");

  // Load saved job description when component mounts
  useEffect(() => {
    const savedDescription = localStorage.getItem("jobDescription");
    if (savedDescription) {
      setJobDescription(savedDescription);
      // Also update parent state with the saved description
      onSubmit(savedDescription);
    }
  }, [onSubmit]);

  const handleChange = (e) => {
    const text = e.target.value;
    setJobDescription(text);
    onSubmit(text); // Call onSubmit whenever text changes
  };

  const handleSubmit = () => {
    if (!jobDescription.trim()) {
      toast.error("Please enter a job description");
      return;
    }

    try {
      // Save to localStorage
      localStorage.setItem("jobDescription", jobDescription);
      // Ensure parent state is updated
      onSubmit(jobDescription);
      toast.success("Job description saved successfully!");
    } catch (error) {
      toast.error("Failed to save job description. Please try again.");
    }
  };

  return (
    <div className="p-4 bg-theme-bg-secondary rounded-lg overflow-auto max-h-full" style={{ overflowY: 'auto' }}>
      <h2 className="text-xl font-semibold text-white mb-4">Job Description</h2>
      <textarea
        className="w-full h-48 p-2 bg-theme-bg-tertiary text-theme-text-primary rounded-lg overflow-auto"
        style={{ overflowY: 'auto', overflowWrap: 'break-word' }}
        value={jobDescription}
        onChange={handleChange}
        placeholder="Paste the job description here..."
        disabled={loading}
      />

      <div className="mt-4 text-sm text-gray-500 overflow-y-auto max-h-48" style={{ overflowY: 'auto' }}>
        <h3 className="font-semibold mb-2">Tips:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Copy and paste the entire job description</li>
          <li>Include all requirements and qualifications</li>
          <li>
            Make sure to include any specific skills or experience needed
          </li>
          <li>Add any additional context that might be relevant</li>
        </ul>
      </div>

      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => {
            setJobDescription("");
            localStorage.removeItem("jobDescription");
            toast.success("Job description cleared");
          }}
          className="text-gray-500 hover:text-gray-700 transition duration-200"
          disabled={loading || !jobDescription}
        >
          Clear
        </button>

        <button
          onClick={handleSubmit}
          disabled={loading || !jobDescription.trim()}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg
            hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed
            transition duration-200 flex items-center"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Saving...
            </>
          ) : (
            "Save Job Description"
          )}
        </button>
      </div>
    </div>
  );
}
