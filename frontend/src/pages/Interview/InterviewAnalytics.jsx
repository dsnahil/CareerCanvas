import React, { useState, useEffect } from "react";
import { ArrowLeft, ChartLine, Microphone, Clock, TextT, ThumbsUp } from "@phosphor-icons/react";
import { INTERVIEW_STAGES } from "./index.jsx";
import TranscriptDisplay from "@/components/TranscriptDisplay";

export default function InterviewAnalytics({ setStage, recordedAudio, transcript, transcriptData = [], isStandalone = false }) {
  const [analytics, setAnalytics] = useState({
    fillerWords: {
      count: 0,
      words: [],
      percentage: 0,
    },
    pace: {
      wpm: 0,
      isOptimal: false,
      recommendation: "",
    },
    clarity: {
      weakWords: [],
      nonInclusiveTerms: [],
      score: 0,
    },
    tone: {
      variation: 0,
      isMonotone: false,
      recommendation: "",
    },
    summary: {
      keyPoints: [],
      strengths: [],
      improvements: [],
    }
  });
  
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to analyze speech
    // In a real implementation, this would send the audio to a backend service
    setTimeout(() => {
      // Mock analytics data
      setAnalytics({
        fillerWords: {
          count: 24,
          words: [
            { word: "um", count: 12 },
            { word: "like", count: 8 },
            { word: "you know", count: 4 },
          ],
          percentage: 8.5,
        },
        pace: {
          wpm: 175,
          isOptimal: false,
          recommendation: "Try slowing down to around 160 WPM for better clarity.",
        },
        clarity: {
          weakWords: ["maybe", "sort of", "I think", "kind of"],
          nonInclusiveTerms: [],
          score: 85,
        },
        tone: {
          variation: 65,
          isMonotone: false,
          recommendation: "Good vocal variety. Try emphasizing key points more.",
        },
        summary: {
          keyPoints: [
            "Discussed previous experience with web development",
            "Highlighted teamwork and collaboration skills",
            "Explained approach to problem-solving",
          ],
          strengths: [
            "Clear articulation of technical concepts",
            "Good examples to support points",
            "Maintained positive tone throughout",
          ],
          improvements: [
            "Reduce filler words like 'um' and 'like'",
            "Speak slightly slower for better clarity",
            "Use more confident language instead of phrases like 'I think' or 'sort of'",
          ],
        }
      });
      setIsLoading(false);
    }, 2000);
  }, [recordedAudio]);

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="bg-theme-bg-secondary p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-theme-text-primary mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-theme-bg-container rounded-md">
            <div className="bg-blue-100 p-2 rounded-full">
              <Microphone size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-theme-text-secondary text-sm">Filler Words</p>
              <p className="text-theme-text-primary font-medium">{analytics.fillerWords.percentage}% of speech</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-theme-bg-container rounded-md">
            <div className="bg-green-100 p-2 rounded-full">
              <Clock size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-theme-text-secondary text-sm">Speaking Pace</p>
              <p className="text-theme-text-primary font-medium">{analytics.pace.wpm} words per minute</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-theme-bg-container rounded-md">
            <div className="bg-purple-100 p-2 rounded-full">
              <TextT size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-theme-text-secondary text-sm">Clarity Score</p>
              <p className="text-theme-text-primary font-medium">{analytics.clarity.score}/100</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-theme-bg-container rounded-md">
            <div className="bg-yellow-100 p-2 rounded-full">
              <ChartLine size={24} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-theme-text-secondary text-sm">Tone Variation</p>
              <p className="text-theme-text-primary font-medium">{analytics.tone.variation}/100</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-theme-bg-secondary p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-theme-text-primary mb-4">Summary</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-theme-text-primary font-medium mb-2">Key Points Covered</h4>
            <ul className="list-disc pl-5 text-theme-text-secondary">
              {analytics.summary.keyPoints.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-theme-text-primary font-medium mb-2">Strengths</h4>
            <ul className="list-disc pl-5 text-theme-text-secondary">
              {analytics.summary.strengths.map((strength, index) => (
                <li key={index}>{strength}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-theme-text-primary font-medium mb-2">Areas for Improvement</h4>
            <ul className="list-disc pl-5 text-theme-text-secondary">
              {analytics.summary.improvements.map((improvement, index) => (
                <li key={index}>{improvement}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFillerWords = () => (
    <div className="bg-theme-bg-secondary p-6 rounded-lg">
      <h3 className="text-xl font-semibold text-theme-text-primary mb-4">Filler Words Analysis</h3>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-theme-text-secondary">Overall Filler Word Rate</p>
          <p className="text-theme-text-primary font-medium">{analytics.fillerWords.percentage}%</p>
        </div>
        <div className="w-full bg-theme-bg-container rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${
              analytics.fillerWords.percentage < 5 ? 'bg-green-500' : 
              analytics.fillerWords.percentage < 10 ? 'bg-yellow-500' : 'bg-red-500'
            }`} 
            style={{ width: `${Math.min(analytics.fillerWords.percentage * 5, 100)}%` }}
          ></div>
        </div>
        <p className="text-sm text-theme-text-secondary mt-2">
          {analytics.fillerWords.percentage < 5 
            ? 'Excellent! Your filler word usage is minimal.' 
            : analytics.fillerWords.percentage < 10 
            ? 'Good, but try to reduce filler words slightly for more polished delivery.' 
            : 'Try to reduce filler words by pausing instead of using fillers.'}
        </p>
      </div>
      
      <div>
        <h4 className="text-theme-text-primary font-medium mb-3">Most Common Filler Words</h4>
        <div className="space-y-3">
          {analytics.fillerWords.words.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-theme-bg-container rounded-md">
              <span className="text-theme-text-primary">"{item.word}"</span>
              <span className="text-theme-text-secondary">{item.count} times</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-6">
        <h4 className="text-theme-text-primary font-medium mb-3">Tips to Reduce Filler Words</h4>
        <ul className="list-disc pl-5 text-theme-text-secondary space-y-2">
          <li>Practice pausing instead of using fillers when you need time to think</li>
          <li>Record yourself speaking and identify patterns of filler word usage</li>
          <li>Slow down your overall speaking pace to give yourself time to formulate thoughts</li>
          <li>Prepare key talking points in advance to reduce the need for fillers</li>
        </ul>
      </div>
    </div>
  );

  const renderPaceAnalysis = () => (
    <div className="bg-theme-bg-secondary p-6 rounded-lg">
      <h3 className="text-xl font-semibold text-theme-text-primary mb-4">Speaking Pace Analysis</h3>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-theme-text-secondary">Your Speaking Pace</p>
          <p className="text-theme-text-primary font-medium">{analytics.pace.wpm} WPM</p>
        </div>
        <div className="w-full bg-theme-bg-container rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${
              (analytics.pace.wpm >= 140 && analytics.pace.wpm <= 170) ? 'bg-green-500' : 
              (analytics.pace.wpm < 140 || analytics.pace.wpm > 180) ? 'bg-red-500' : 'bg-yellow-500'
            }`} 
            style={{ width: `${Math.min(Math.max(analytics.pace.wpm / 2, 50), 100)}%` }}
          ></div>
        </div>
        <p className="text-sm text-theme-text-secondary mt-2">
          {analytics.pace.recommendation}
        </p>
      </div>
      
      <div className="mt-6">
        <h4 className="text-theme-text-primary font-medium mb-3">Optimal Speaking Pace</h4>
        <p className="text-theme-text-secondary mb-4">
          The ideal speaking pace for clear communication is between 140-170 words per minute. 
          Speaking too quickly can make it difficult for listeners to follow, while speaking too 
          slowly might cause them to lose interest.
        </p>
        
        <h4 className="text-theme-text-primary font-medium mb-3 mt-6">Tips for Improving Pace</h4>
        <ul className="list-disc pl-5 text-theme-text-secondary space-y-2">
          <li>Practice with a metronome set to your target pace</li>
          <li>Mark pauses in your speaking notes to remind yourself to slow down</li>
          <li>Record yourself and listen for sections where you speed up (often during complex topics)</li>
          <li>Take deliberate breaths between major points</li>
        </ul>
      </div>
    </div>
  );

  const renderClarityAnalysis = () => (
    <div className="bg-theme-bg-secondary p-6 rounded-lg">
      <h3 className="text-xl font-semibold text-theme-text-primary mb-4">Clarity & Word Choice Analysis</h3>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-theme-text-secondary">Clarity Score</p>
          <p className="text-theme-text-primary font-medium">{analytics.clarity.score}/100</p>
        </div>
        <div className="w-full bg-theme-bg-container rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${
              analytics.clarity.score >= 85 ? 'bg-green-500' : 
              analytics.clarity.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
            }`} 
            style={{ width: `${analytics.clarity.score}%` }}
          ></div>
        </div>
      </div>
      
      {analytics.clarity.weakWords.length > 0 && (
        <div className="mb-6">
          <h4 className="text-theme-text-primary font-medium mb-3">Weak Words & Phrases Detected</h4>
          <div className="flex flex-wrap gap-2">
            {analytics.clarity.weakWords.map((word, index) => (
              <span key={index} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                {word}
              </span>
            ))}
          </div>
          <p className="text-sm text-theme-text-secondary mt-3">
            These words and phrases can weaken your message or make you sound less confident.
            Try replacing them with more direct and assertive language.
          </p>
        </div>
      )}
      
      {analytics.clarity.nonInclusiveTerms.length > 0 ? (
        <div className="mb-6">
          <h4 className="text-theme-text-primary font-medium mb-3">Non-Inclusive Terms Detected</h4>
          <div className="flex flex-wrap gap-2">
            {analytics.clarity.nonInclusiveTerms.map((term, index) => (
              <span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                {term}
              </span>
            ))}
          </div>
          <p className="text-sm text-theme-text-secondary mt-3">
            These terms may unintentionally exclude or alienate certain groups.
            Consider using more inclusive alternatives.
          </p>
        </div>
      ) : (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center gap-2">
            <ThumbsUp size={20} className="text-green-600" />
            <p className="text-green-800 font-medium">Great job!</p>
          </div>
          <p className="text-sm text-green-700 mt-1">
            No non-inclusive language was detected in your speech.
          </p>
        </div>
      )}
      
      <div className="mt-6">
        <h4 className="text-theme-text-primary font-medium mb-3">Tips for Improving Clarity</h4>
        <ul className="list-disc pl-5 text-theme-text-secondary space-y-2">
          <li>Replace hedge words ("sort of", "kind of") with more direct statements</li>
          <li>Use concrete examples to illustrate abstract concepts</li>
          <li>Structure your responses with clear beginning, middle, and end</li>
          <li>Avoid jargon unless you're certain the interviewer understands it</li>
        </ul>
      </div>
    </div>
  );

  const renderToneAnalysis = () => (
    <div className="bg-theme-bg-secondary p-6 rounded-lg">
      <h3 className="text-xl font-semibold text-theme-text-primary mb-4">Vocal Tone Analysis</h3>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-theme-text-secondary">Tone Variation Score</p>
          <p className="text-theme-text-primary font-medium">{analytics.tone.variation}/100</p>
        </div>
        <div className="w-full bg-theme-bg-container rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${
              analytics.tone.variation >= 70 ? 'bg-green-500' : 
              analytics.tone.variation >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`} 
            style={{ width: `${analytics.tone.variation}%` }}
          ></div>
        </div>
        <p className="text-sm text-theme-text-secondary mt-2">
          {analytics.tone.isMonotone 
            ? 'Your speech tends to be monotone. Try varying your pitch and emphasis more.' 
            : analytics.tone.recommendation}
        </p>
      </div>
      
      <div className="mt-6">
        <h4 className="text-theme-text-primary font-medium mb-3">Why Tone Matters</h4>
        <p className="text-theme-text-secondary mb-4">
          Vocal variety keeps listeners engaged and helps emphasize important points.
          A monotone delivery can make even the most interesting content seem boring,
          while appropriate variation in tone conveys enthusiasm and confidence.
        </p>
        
        <h4 className="text-theme-text-primary font-medium mb-3 mt-6">Tips for Improving Vocal Variety</h4>
        <ul className="list-disc pl-5 text-theme-text-secondary space-y-2">
          <li>Practice emphasizing key words in sentences</li>
          <li>Vary your volume slightly for emphasis (but avoid shouting)</li>
          <li>Use strategic pauses before important points</li>
          <li>Record yourself reading the same text with different emotions</li>
          <li>Avoid uptalk (raising pitch at the end of statements)</li>
        </ul>
      </div>
    </div>
  );

  const renderTranscript = () => {
    // If we have structured transcript data, use the TranscriptDisplay component
    if (transcriptData && transcriptData.length > 0) {
      return (
        <TranscriptDisplay 
          messages={transcriptData} 
          analytics={{
            score: analytics.clarity.score,
            fillerWords: analytics.fillerWords,
            duration: transcriptData[transcriptData.length - 1]?.timestamp || 0
          }}
        />
      );
    }
    
    // Otherwise, fall back to the simple text display
    return (
      <div className="bg-theme-bg-secondary p-6 rounded-lg">
        <h3 className="text-xl font-semibold text-theme-text-primary mb-4">Interview Transcript</h3>
        <div className="bg-theme-bg-container p-4 rounded-md max-h-96 overflow-y-auto">
          <p className="text-theme-text-primary whitespace-pre-line">
            {transcript || "Thank you for the opportunity to interview for this position. I'm excited to share my experience and skills with you today. [Transcript would appear here in a real implementation]"}
          </p>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview();
      case "fillerWords":
        return renderFillerWords();
      case "pace":
        return renderPaceAnalysis();
      case "clarity":
        return renderClarityAnalysis();
      case "tone":
        return renderToneAnalysis();
      case "transcript":
        return renderTranscript();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto">
      <div className="flex items-center mb-6">
        <button
          onClick={() => {
            if (typeof setStage === 'function') {
              if (isStandalone) {
                setStage(false);
              } else {
                setStage(INTERVIEW_STAGES.PLAYBACK);
              }
            }
          }}
          className="mr-4 p-2 rounded-full hover:bg-theme-bg-secondary"
        >
          <ArrowLeft size={24} className="text-theme-text-primary" />
        </button>
        <h1 className="text-2xl font-bold text-theme-text-primary">Speech Analytics</h1>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-primary-button border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-theme-text-secondary">Analyzing your speech patterns...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
          <div className="md:w-64 flex-shrink-0">
            <div className="bg-theme-bg-secondary rounded-lg p-4">
              <h3 className="text-lg font-medium text-theme-text-primary mb-4">Analysis Categories</h3>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center ${
                    activeTab === "overview" 
                      ? "bg-primary-button text-white" 
                      : "text-theme-text-secondary hover:bg-theme-bg-primary"
                  }`}
                >
                  <ChartLine size={18} className="mr-2" />
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("fillerWords")}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center ${
                    activeTab === "fillerWords" 
                      ? "bg-primary-button text-white" 
                      : "text-theme-text-secondary hover:bg-theme-bg-primary"
                  }`}
                >
                  <Microphone size={18} className="mr-2" />
                  Filler Words
                </button>
                <button
                  onClick={() => setActiveTab("pace")}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center ${
                    activeTab === "pace" 
                      ? "bg-primary-button text-white" 
                      : "text-theme-text-secondary hover:bg-theme-bg-primary"
                  }`}
                >
                  <Clock size={18} className="mr-2" />
                  Speaking Pace
                </button>
                <button
                  onClick={() => setActiveTab("clarity")}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center ${
                    activeTab === "clarity" 
                      ? "bg-primary-button text-white" 
                      : "text-theme-text-secondary hover:bg-theme-bg-primary"
                  }`}
                >
                  <TextT size={18} className="mr-2" />
                  Clarity & Word Choice
                </button>
                <button
                  onClick={() => setActiveTab("tone")}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center ${
                    activeTab === "tone" 
                      ? "bg-primary-button text-white" 
                      : "text-theme-text-secondary hover:bg-theme-bg-primary"
                  }`}
                >
                  <ChartLine size={18} className="mr-2" />
                  Vocal Tone
                </button>
                <button
                  onClick={() => setActiveTab("transcript")}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center ${
                    activeTab === "transcript" 
                      ? "bg-primary-button text-white" 
                      : "text-theme-text-secondary hover:bg-theme-bg-primary"
                  }`}
                >
                  <TextT size={18} className="mr-2" />
                  Transcript
                </button>
              </nav>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {renderTabContent()}
          </div>
        </div>
      )}
    </div>
  );
} 