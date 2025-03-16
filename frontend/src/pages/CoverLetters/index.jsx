import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "@/components/Sidebar";
import { isMobile } from "react-device-detect";
import { FileDoc, PaperPlaneRight, Plus } from "@phosphor-icons/react";
import UserMenu from "@/components/UserMenu";
import { generateCoverLetter } from "@/utils/coverLetterGenerator";

export default function CoverLetters() {
  const { t } = useTranslation();
  const [coverLetters, setCoverLetters] = useState([]);
  const [selectedCoverLetter, setSelectedCoverLetter] = useState(null);
  const [newCoverLetterContent, setNewCoverLetterContent] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeContent, setResumeContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateCoverLetter = async () => {
    if (!jobDescription || !resumeContent) return;

    setIsGenerating(true);

    try {
      const generatedContent = await generateCoverLetter(jobDescription, resumeContent);

      const newLetter = {
        id: Date.now().toString(),
        title: `Cover Letter ${coverLetters.length + 1}`,
        content: generatedContent,
        createdAt: new Date().toISOString(),
      };

      setCoverLetters([...coverLetters, newLetter]);
      setSelectedCoverLetter(newLetter);
      setNewCoverLetterContent(newLetter.content);
    } catch (error) {
      console.error("Error generating cover letter:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveCoverLetter = () => {
    if (selectedCoverLetter) {
      const updatedLetters = coverLetters.map(letter =>
        letter.id === selectedCoverLetter.id
          ? { ...letter, content: newCoverLetterContent }
          : letter
      );
      setCoverLetters(updatedLetters);
    }
  };

  const createNewCoverLetter = () => {
    setJobDescription("");
    setResumeContent("");
    setSelectedCoverLetter(null);
    setNewCoverLetterContent("");
  };

  return (
    <div className="h-screen overflow-hidden bg-theme-bg-container flex">
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-theme-sidebar-border">
          <div className="flex items-center gap-2">
            <FileDoc size={24} className="text-indigo-400" />
            <h1 className="text-xl font-semibold text-theme-text-primary">
              {t("coverLetters.title", "Cover Letters")}
            </h1>
          </div>
          <UserMenu />
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar with cover letter list */}
          <div className="w-64 border-r border-theme-sidebar-border overflow-y-auto p-4">
            <button
              onClick={createNewCoverLetter}
              className="w-full flex items-center justify-center gap-2 p-2 mb-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
            >
              <Plus size={18} />
              <span>{t("coverLetters.new", "New Cover Letter")}</span>
            </button>

            <div className="space-y-2">
              {coverLetters.map(letter => (
                <div
                  key={letter.id}
                  onClick={() => {
                    setSelectedCoverLetter(letter);
                    setNewCoverLetterContent(letter.content);
                  }}
                  className={`p-3 rounded-md cursor-pointer transition-colors ${
                    selectedCoverLetter?.id === letter.id
                      ? "bg-indigo-600/20 border-l-4 border-indigo-500"
                      : "hover:bg-theme-sidebar-item-hover"
                  }`}
                >
                  <h3 className="font-medium text-theme-text-primary">{letter.title}</h3>
                  <p className="text-xs text-theme-text-secondary">
                    {new Date(letter.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Main editor area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedCoverLetter ? (
              <div className="flex-1 flex flex-col p-4 overflow-auto">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-theme-text-primary mb-2">
                    {selectedCoverLetter.title}
                  </h2>
                  <textarea
                    value={newCoverLetterContent}
                    onChange={(e) => setNewCoverLetterContent(e.target.value)}
                    className="w-full h-[calc(100vh-200px)] p-4 bg-theme-settings-input-bg text-theme-text-primary border border-theme-sidebar-border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={saveCoverLetter}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
                  >
                    {t("coverLetters.save", "Save Changes")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 p-4 overflow-auto">
                <div className="max-w-3xl mx-auto">
                  <h2 className="text-xl font-semibold text-theme-text-primary mb-4">
                    {t("coverLetters.generate", "Generate a Cover Letter")}
                  </h2>

                  <div className="mb-4">
                    <label className="block text-theme-text-primary mb-2">
                      {t("coverLetters.jobDescription", "Job Description")}
                    </label>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder={t("coverLetters.jobDescriptionPlaceholder", "Paste the job description here...")}
                      className="w-full h-40 p-3 bg-theme-settings-input-bg text-theme-text-primary border border-theme-sidebar-border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-theme-text-primary mb-2">
                      {t("coverLetters.resume", "Your Resume")}
                    </label>
                    <textarea
                      value={resumeContent}
                      onChange={(e) => setResumeContent(e.target.value)}
                      placeholder={t("coverLetters.resumePlaceholder", "Paste your resume content here...")}
                      className="w-full h-40 p-3 bg-theme-settings-input-bg text-theme-text-primary border border-theme-sidebar-border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    onClick={handleGenerateCoverLetter}
                    disabled={isGenerating || !jobDescription || !resumeContent}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-md transition-colors"
                  >
                    {isGenerating ? (
                      <span>{t("coverLetters.generating", "Generating...")}</span>
                    ) : (
                      <>
                        <PaperPlaneRight size={18} />
                        <span>{t("coverLetters.generateButton", "Generate Cover Letter")}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
