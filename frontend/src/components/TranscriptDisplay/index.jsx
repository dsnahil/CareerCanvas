import React from "react";
import { Clock, User, Robot, ThumbsUp, ThumbsDown, Copy } from "@phosphor-icons/react";
import showToast from "@/utils/toast";

/**
 * TranscriptDisplay component for showing conversation transcripts
 * @param {Object} props
 * @param {Array} props.messages - Array of message objects with role, content, timestamp
 * @param {Object} props.analytics - Analytics data for the conversation
 * @param {Function} props.onCopyTranscript - Function to call when copying transcript
 */
export default function TranscriptDisplay({ messages = [], analytics = {}, onCopyTranscript }) {
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleCopyTranscript = () => {
    const transcriptText = messages
      .map(msg => `[${formatTime(msg.timestamp)}] ${msg.role === 'user' ? 'You' : 'Interviewer'}: ${msg.content}`)
      .join('\n\n');
    
    navigator.clipboard.writeText(transcriptText)
      .then(() => showToast("Transcript copied to clipboard", "success"))
      .catch(err => showToast("Failed to copy transcript", "error"));
    
    if (onCopyTranscript) onCopyTranscript();
  };

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-theme-text-primary">Conversation Transcript</h2>
        <button 
          onClick={handleCopyTranscript}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-theme-bg-container hover:bg-theme-bg-primary text-theme-text-primary font-medium rounded-lg transition-colors border border-theme-border"
        >
          <Copy size={16} />
          Copy transcript
        </button>
      </div>

      <div className="bg-theme-bg-secondary p-4 rounded-lg shadow-md">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-theme-text-secondary">
            No transcript available
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((message, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                  {message.role === 'user' ? (
                    <div className="bg-indigo-600 w-full h-full flex items-center justify-center">
                      <User size={20} weight="bold" className="text-white" />
                    </div>
                  ) : (
                    <div className="bg-slate-700 w-full h-full flex items-center justify-center">
                      <Robot size={20} weight="bold" className="text-white" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-theme-text-primary">
                      {message.role === 'user' ? 'You' : 'Interviewer'}
                    </span>
                    <span className="text-xs text-theme-text-secondary flex items-center gap-1">
                      <Clock size={12} />
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  
                  <div className="text-theme-text-primary">
                    {message.content}
                  </div>
                  
                  {message.role === 'user' && message.feedback && (
                    <div className="mt-2 text-sm text-theme-text-secondary bg-theme-bg-container p-2 rounded border border-theme-border">
                      <div className="flex items-center gap-1 mb-1 font-medium">
                        Feedback:
                      </div>
                      {message.feedback}
                    </div>
                  )}
                </div>
                
                {message.role === 'user' && (
                  <div className="flex-shrink-0 flex flex-col items-center gap-1">
                    <button className="text-green-500 hover:text-green-600 transition-colors">
                      <ThumbsUp size={16} weight="fill" />
                    </button>
                    <button className="text-red-500 hover:text-red-600 transition-colors">
                      <ThumbsDown size={16} weight="fill" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {analytics && Object.keys(analytics).length > 0 && (
        <div className="mt-6 bg-theme-bg-secondary p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-theme-text-primary mb-3">Conversation Analytics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.score !== undefined && (
              <div className="bg-theme-bg-container p-3 rounded-md">
                <div className="text-sm text-theme-text-secondary mb-1">Overall Score</div>
                <div className="text-xl font-semibold text-theme-text-primary">{analytics.score}%</div>
              </div>
            )}
            
            {analytics.duration !== undefined && (
              <div className="bg-theme-bg-container p-3 rounded-md">
                <div className="text-sm text-theme-text-secondary mb-1">Duration</div>
                <div className="text-xl font-semibold text-theme-text-primary">{formatTime(analytics.duration)}</div>
              </div>
            )}
            
            {analytics.userSpeakingTime !== undefined && (
              <div className="bg-theme-bg-container p-3 rounded-md">
                <div className="text-sm text-theme-text-secondary mb-1">Your Speaking Time</div>
                <div className="text-xl font-semibold text-theme-text-primary">{formatTime(analytics.userSpeakingTime)}</div>
              </div>
            )}
            
            {analytics.fillerWords !== undefined && (
              <div className="bg-theme-bg-container p-3 rounded-md">
                <div className="text-sm text-theme-text-secondary mb-1">Filler Words</div>
                <div className="text-xl font-semibold text-theme-text-primary">{analytics.fillerWords.count} ({analytics.fillerWords.percentage}%)</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 