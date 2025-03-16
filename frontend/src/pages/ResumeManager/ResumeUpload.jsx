import React, { useState, useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import { uploadResume, getSubmissions, downloadResume, extractResumeText } from "../../services/resume";

export default function ResumeUpload({ onSubmit, loading }) {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [resumeContent, setResumeContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);

  // Load saved files when component mounts
  useEffect(() => {
    loadSavedFiles();
  }, []);

  const loadSavedFiles = async () => {
    try {
      const submissions = await getSubmissions();
      setUploadedFiles(submissions);
    } catch (error) {
      console.error("Failed to load submissions:", error);
      toast.error("Failed to load saved resumes");
    }
  };

  const handleFile = (selectedFile) => {
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (selectedFile && validTypes.includes(selectedFile.type)) {
      setFile(selectedFile);
      
      // For PDF files, we'll just pass the file name since we can't extract text directly
      if (selectedFile.type === "application/pdf") {
        const fileInfo = `PDF Resume: ${selectedFile.name}`;
        setResumeContent(fileInfo);
        onSubmit(fileInfo); // Update parent state
      } else {
        // For DOC/DOCX, try to read the text
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const text = e.target.result;
            setResumeContent(text);
            onSubmit(text); // Update parent state
          } catch (error) {
            console.error("Error reading file:", error);
            const fileInfo = `Document: ${selectedFile.name}`;
            setResumeContent(fileInfo);
            onSubmit(fileInfo); // Update parent state with fallback
          }
        };
        reader.readAsText(selectedFile);
      }
    } else {
      toast.error("Please upload a valid resume file (PDF, DOC, or DOCX)");
    }
  };

  const handleFileChange = (event) => {
    handleFile(event.target.files[0]);
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    try {
      const jobDescription = localStorage.getItem("jobDescription") || "";
      const result = await uploadResume(file, jobDescription);
      if (result.success) {
        toast.success("Resume uploaded successfully!");
        setFile(null);
        setUploadProgress(0);
        loadSavedFiles(); // Refresh the list
      } else {
        throw new Error(result.error || "Failed to upload resume");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload resume");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (id, fileName) => {
    try {
      setDownloadingFileId(id);
      const blob = await downloadResume(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download resume");
    } finally {
      setDownloadingFileId(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      setResumeContent(text);
      onSubmit(text); // Call onSubmit when file is loaded
    };
    reader.readAsText(file);
  };

  // Also update parent when text is edited manually
  const handleTextChange = (e) => {
    const text = e.target.value;
    setResumeContent(text);
    onSubmit(text); // Call onSubmit when text changes
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm overflow-auto max-h-full" style={{ overflowY: 'auto' }}>
      <h2 className="text-xl font-bold mb-6">Upload Resume</h2>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center mb-4 transition-colors
          ${dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}
          ${!file ? "hover:border-blue-500 hover:bg-blue-50" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          className="hidden"
          id="resume-upload"
        />
        <label
          htmlFor="resume-upload"
          className="cursor-pointer text-blue-600 hover:text-blue-700"
        >
          Click to upload
        </label>
        <span className="text-gray-600"> or drag and drop</span>
        <p className="text-sm text-gray-500 mt-2">
          Supported formats: PDF, DOC, DOCX
        </p>
      </div>

      {file && (
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded mb-4">
          <div className="flex items-center">
            <svg
              className="w-4 h-4 mr-2 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="text-sm text-gray-600">{file.name}</span>
          </div>
          <button
            onClick={() => setFile(null)}
            className="text-red-500 hover:text-red-700"
          >
            Remove
          </button>
        </div>
      )}

      {isUploading && (
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || isUploading || loading}
        className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg
          hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed
          transition duration-200 flex items-center justify-center mb-6"
      >
        {isUploading ? (
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
            Uploading... {uploadProgress}%
          </>
        ) : loading ? (
          "Processing..."
        ) : (
          "Upload Resume"
        )}
      </button>

      {/* Uploaded Files Section */}
      {uploadedFiles.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Uploaded Resumes</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2" style={{ overflowY: 'auto' }}>
            {uploadedFiles.map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                className="flex flex-col md:items-start justify-between bg-gray-50 p-4 rounded-lg"
              >
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-gray-500 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span className="font-medium truncate">{uploadedFile.resumeFileName}</span>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    <span>{formatDate(uploadedFile.createdAt)}</span>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    <span className="font-medium">Job Description:</span>
                    <div className="mt-1 max-h-32 overflow-y-auto pr-2 whitespace-pre-wrap break-words" style={{ overflowY: 'auto' }}>
                      {uploadedFile.jobDescription}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 mt-3 md:mt-0 md:ml-4 flex-shrink-0">
                  <button
                    onClick={() => handleDownload(uploadedFile.id, uploadedFile.resumeFileName)}
                    disabled={downloadingFileId === uploadedFile.id || isUploading || loading}
                    className="text-blue-500 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {downloadingFileId === uploadedFile.id ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4"
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
                        Downloading...
                      </span>
                    ) : (
                      "Download"
                    )}
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        // If it's a PDF, extract the text content
                        if (uploadedFile.resumeFileName.toLowerCase().endsWith('.pdf')) {
                          setIsExtracting(true);
                          const result = await extractResumeText(uploadedFile.id);
                          if (result.success) {
                            setResumeContent(result.text);
                            onSubmit(result.text);
                            toast.success("Resume content extracted for tailoring");
                          } else {
                            throw new Error(result.error || 'Failed to extract resume content');
                          }
                        } else {
                          // For non-PDF files, use the filename as before
                          const content = `Resume: ${uploadedFile.resumeFileName}`;
                          setResumeContent(content);
                          onSubmit(content);
                          toast.success("Resume selected for tailoring");
                        }
                      } catch (error) {
                        console.error("Error extracting resume content:", error);
                        toast.error(error.message || "Failed to extract resume content");
                        // Fallback to using just the filename
                        const content = `Resume: ${uploadedFile.resumeFileName}`;
                        setResumeContent(content);
                        onSubmit(content);
                      } finally {
                        setIsExtracting(false);
                      }
                    }}
                    disabled={isUploading || loading || isExtracting}
                    className="text-green-500 hover:text-green-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {isExtracting ? "Extracting..." : "Select for Tailoring"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {resumeContent && (
        <textarea
          className="w-full h-64 p-4 border border-gray-300 rounded-lg bg-theme-bg-secondary text-theme-text-primary overflow-auto"
          style={{ overflowY: 'auto', overflowWrap: 'break-word' }}
          placeholder="Paste your resume content here..."
          value={resumeContent}
          onChange={handleTextChange}
          disabled={isUploading || loading}
        />
      )}
    </div>
  );
}
