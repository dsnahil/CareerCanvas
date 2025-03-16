/**
 * Generates a cover letter based on a job description and resume
 * @param {string} jobDescription - The job description
 * @param {string} resume - The user's resume
 * @returns {Promise<string>} - The generated cover letter
 */
export async function generateCoverLetter(jobDescription, resume) {
  try {
    // In a real implementation, this would call an API endpoint
    // that would use an LLM to generate a cover letter
    // For now, we'll return a mock response
    
    // Extract some basic information from the resume (this is a simplified example)
    const nameMatch = resume.match(/([A-Z][a-z]+ [A-Z][a-z]+)/);
    const name = nameMatch ? nameMatch[0] : "[Your Name]";
    
    // Extract job title from job description (simplified)
    const titleMatch = jobDescription.match(/(Software Engineer|Developer|Designer|Manager|Analyst|Consultant|Director)/i);
    const jobTitle = titleMatch ? titleMatch[0] : "position";
    
    // Extract company name (simplified)
    const companyMatch = jobDescription.match(/at ([A-Z][a-z]+ (?:[A-Z][a-z]+)?)/i);
    const company = companyMatch ? companyMatch[1] : "your company";
    
    // Generate a simple cover letter
    return `Dear Hiring Manager,

I am writing to express my interest in the ${jobTitle} position at ${company}. After reviewing the job description, I am confident that my skills and experiences align well with your requirements.

${jobDescription.length > 100 ? "The job description mentions several key requirements that match my background. " : ""}Based on my resume, you'll see that I have relevant experience in ${resume.includes("React") ? "React development" : "software development"} and ${resume.includes("team") ? "team collaboration" : "project management"}.

I am particularly excited about the opportunity to ${jobDescription.includes("team") ? "work with your team" : "contribute to your organization"} because ${jobDescription.includes("innovative") ? "of your innovative approach" : "of the challenging projects you work on"}.

I would welcome the opportunity to discuss how my background, skills, and experiences would be beneficial to your organization. Thank you for considering my application.

Sincerely,
${name}`;
  } catch (error) {
    console.error("Error generating cover letter:", error);
    throw error;
  }
} 