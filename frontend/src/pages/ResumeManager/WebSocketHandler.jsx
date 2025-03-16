import { useState, useCallback, useEffect } from "react";
import {
  websocketURI,
  AGENT_SESSION_END,
  AGENT_SESSION_START,
} from "@/utils/chat/agent";
import { ABORT_STREAM_EVENT } from "@/utils/chat";
import { v4 } from "uuid";
import handleSocketResponse from "@/utils/chat/agent";

export default function useWebSocketHandler() {
  const [socketId, setSocketId] = useState(null);
  const [websocket, setWebsocket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  // Store resume and job description in state
  const [resumeContent, setResumeContent] = useState(null);
  const [jobDescription, setJobDescription] = useState(null);

  // Generate a system prompt for resume tailoring
  const generateSystemPrompt = (resume, jobDesc) => {
    return `You are an expert resume tailoring assistant. Your task is to analyze the provided resume and job description, then provide specific, actionable suggestions to improve the resume for this particular job.

RESUME:
${resume}

JOB DESCRIPTION:
${jobDesc}

Provide detailed, personalized suggestions for improving this resume to better match the job description. Focus on:
1. Identifying key skills and requirements from the job description
2. Highlighting missing keywords and skills that should be added
3. Suggesting specific sections or bullet points that could be improved
4. Recommending format and structure changes if needed
5. Providing 2-3 examples of rewritten bullet points that better highlight relevant experience

Be specific and actionable in your suggestions. Use the actual content from the resume and job description.`;
  };

  // Enhanced implementation for resume tailoring
  const tailorResume = useCallback((resume, jobDesc) => {
    console.log("Tailoring resume with extracted content");
    
    // Set a timeout to simulate processing
    setTimeout(() => {
      // Generate system prompt
      const systemPrompt = generateSystemPrompt(resume, jobDesc);
      
      // Extract keywords from job description
      const keywords = extractKeywords(jobDesc);
      
      // Generate tailored resume suggestions
      const suggestions = generateEnhancedSuggestions(resume, jobDesc, keywords);
      
      // Update chat history with results
      setChatHistory([
        {
          uuid: v4(),
          content: "I've analyzed your resume against the job description. Here are my suggestions:",
          role: "assistant",
          sources: [],
          closed: true,
          error: null,
          animate: false,
          pending: false,
        },
        {
          uuid: v4(),
          content: `**Key Skills Identified in Job Description:**\n${keywords.join(", ")}`,
          role: "assistant",
          sources: [],
          closed: true,
          error: null,
          animate: false,
          pending: false,
        },
        {
          uuid: v4(),
          content: suggestions,
          role: "assistant",
          sources: [],
          closed: true,
          error: null,
          animate: false,
          pending: false,
        },
        {
          uuid: v4(),
          content: "**System Prompt for LLM:**\n```\n" + systemPrompt + "\n```\n\nYou can use this prompt with any LLM to get more detailed, personalized suggestions.",
          role: "assistant",
          sources: [],
          closed: true,
          error: null,
          animate: false,
          pending: false,
        },
        {
          uuid: v4(),
          type: "statusResponse",
          content: "Resume tailoring session complete.",
          role: "assistant",
          sources: [],
          closed: true,
          error: null,
          animate: false,
          pending: false,
        }
      ]);
      
      // Set loading to false
      setLoading(false);
    }, 3000);
  }, []);
  
  // Helper function to extract keywords from job description
  const extractKeywords = (jobDesc) => {
    if (!jobDesc) return [];
    
    // Common technical skills and keywords
    const commonKeywords = [
      "JavaScript", "React", "Node.js", "TypeScript", "HTML", "CSS", 
      "Python", "Java", "C++", "SQL", "NoSQL", "MongoDB", "PostgreSQL",
      "AWS", "Azure", "Docker", "Kubernetes", "CI/CD", "Git", "Agile",
      "Scrum", "Project Management", "Leadership", "Communication",
      "Problem Solving", "Critical Thinking", "Team Player", "Detail-oriented"
    ];
    
    // Find keywords in job description
    return commonKeywords.filter(keyword => 
      jobDesc.toLowerCase().includes(keyword.toLowerCase())
    );
  };
  
  // Enhanced helper function to generate better suggestions
  const generateEnhancedSuggestions = (resume, jobDesc, keywords) => {
    if (!resume || !jobDesc) {
      return "I couldn't identify specific improvements for your resume. Please ensure both your resume and job description contain sufficient information.";
    }
    
    // Check if we have actual resume content or just a filename
    const hasActualResumeContent = !resume.startsWith("PDF Resume:") && !resume.startsWith("Resume:") && !resume.startsWith("Document:");
    
    let suggestions = "**Tailored Resume Suggestions:**\n\n";
    
    if (!hasActualResumeContent) {
      suggestions += "⚠️ **Limited Analysis**: I'm working with limited resume information. For better results, please ensure the resume content is properly extracted.\n\n";
    }
    
    // Check if keywords are in resume
    const missingKeywords = keywords.filter(keyword => 
      !resume.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (missingKeywords.length > 0) {
      suggestions += "1. **Add Missing Keywords:**\n";
      suggestions += "   Consider adding these keywords from the job description that are missing in your resume:\n";
      suggestions += `   - ${missingKeywords.join("\n   - ")}\n\n`;
    } else {
      suggestions += "1. **Great Keyword Coverage:**\n";
      suggestions += "   Your resume already includes all the key skills mentioned in the job description.\n\n";
    }
    
    // General suggestions
    suggestions += "2. **Quantify Achievements:**\n";
    suggestions += "   Add specific metrics and numbers to demonstrate your impact.\n";
    suggestions += "   Example: Instead of 'Improved system performance', use 'Improved system performance by 40%, reducing load times from 3s to 1.8s'\n\n";
    
    suggestions += "3. **Use Action Verbs:**\n";
    suggestions += "   Begin bullet points with strong action verbs like 'Implemented', 'Developed', 'Led', etc.\n";
    suggestions += "   Example: Instead of 'Was responsible for database optimization', use 'Optimized database queries, reducing report generation time by 60%'\n\n";
    
    suggestions += "4. **Match Job Requirements:**\n";
    suggestions += "   Reorganize your experience to prioritize skills and experiences most relevant to this position.\n";
    suggestions += "   Consider creating a 'Key Skills' or 'Core Competencies' section at the top of your resume.\n\n";
    
    suggestions += "5. **Optimize Format:**\n";
    suggestions += "   Ensure your resume is easy to scan with clear headings and bullet points.\n";
    suggestions += "   Use a clean, professional template with consistent formatting throughout.\n\n";
    
    // Add a sample tailored bullet point
    if (keywords.length > 0) {
      suggestions += "**Sample Tailored Bullet Points:**\n";
      
      // Generate 2-3 sample bullet points using keywords from the job description
      const bulletPoints = [
        `• Implemented ${keywords[0] || "relevant technology"} solutions that resulted in a 30% improvement in ${keywords[1] || "relevant metric"}, demonstrating strong ${keywords[2] || "relevant skill"} capabilities.`,
        `• Led a team of developers to deliver ${keywords[0] || "relevant"} projects on time and under budget, utilizing ${keywords[1] || "relevant skill"} and ${keywords[2] || "relevant methodology"} to ensure quality.`,
        `• Collaborated with cross-functional teams to design and develop ${keywords[0] || "relevant"} features, resulting in a 25% increase in user engagement and positive feedback from stakeholders.`
      ];
      
      suggestions += bulletPoints.join("\n") + "\n\n";
    }
    
    // Add ATS optimization tips
    suggestions += "**ATS Optimization Tips:**\n";
    suggestions += "• Use standard section headings (Experience, Education, Skills)\n";
    suggestions += "• Avoid using tables, headers/footers, or complex formatting\n";
    suggestions += "• Include keywords from the job description naturally throughout your resume\n";
    suggestions += "• Use a standard, readable font like Arial, Calibri, or Times New Roman\n\n";
    
    return suggestions;
  };

  // Function to initiate the resume tailoring session
  const initiateSession = (resume, jobDesc) => {
    console.log("Initiating session with:", { resume, jobDesc });
    setLoading(true);
    setResumeContent(resume);
    setJobDescription(jobDesc);
    setChatHistory([
      {
        content: "Processing resume and job description...",
        role: "assistant",
        pending: true,
        animate: true,
      },
    ]);
    
    // Use the enhanced implementation
    tailorResume(resume, jobDesc);
  };

  return {
    loading,
    chatHistory,
    initiateSession,
    socketId,
  };
}
