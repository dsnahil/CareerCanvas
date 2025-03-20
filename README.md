<a name="readme-top"></a>

<div align='center'>
  
# Career Canvas - AI-Powered Job Search & Application Toolkit

## Qualcomm Technologies x Northeastern University Hackathon Project

<p><strong>Snapdragon Optimized 100% Local Edge AI</strong></p>

</div>

<p align="center">
  <a href="https://github.com/javienc/careercanvas" target="_blank">
      <img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat" alt="License">
  </a>
</p>

<div align="center">
  <img src="images/product_showcase.gif" alt="Career Canvas Demo" width="100%">
</div>

## 📖 Description

Welcome to Career Canvas – where crafting your dream career becomes a creative experience. Imagine opening the app and instantly having powerful AI tools at your fingertips to transform your job search journey. With just a few clicks, you can generate a resume tailored to your target position, create a compelling cover letter that highlights your unique skills, and prepare for interviews through realistic practice sessions.

As you use Career Canvas, you'll experience a seamless workflow where your professional history transforms into employer-ready documents through our intuitive drag-and-drop interface. The keyword optimization feature automatically identifies and incorporates industry-specific terms that help your resume pass ATS screening systems. When interview day approaches, practice with our AI-powered interview simulator that provides real-time feedback on your responses. Review your performance analytics to track improvement and receive suggestions to strengthen your application materials. With multi-format export options, you'll always have your polished documents ready to share in the format employers prefer. Career Canvas doesn't just help you apply for jobs – it empowers you to strategically craft your professional narrative for career success.

## ✨ Features

- 📝 **Custom Resume Generator** - Create professional, ATS-friendly resumes tailored to specific job descriptions
- ✉️ **Cover Letter Creator** - Generate personalized cover letters that highlight your relevant experience and skills
- 🎯 **Job-Specific Tailoring** - Customize all documents to match specific job requirements and keywords
- 🗣️ **Mock Interview Practice** - Prepare for interviews with AI-powered simulation and feedback
- 💼 **Resume Management** - Store, organize, and update multiple resume versions in one place
- 📊 **Performance Analytics** - Receive insights and improvement suggestions for your application materials
- 🔄 **Intuitive User Interface** - Easy-to-use platform with drag-and-drop functionality
- 🤖 **AI-Powered Feedback** - Get real-time suggestions to improve your resume and cover letter content
- 🔍 **Keyword Optimization** - Ensure your documents contain relevant industry keywords for better visibility
- 🌐 **Multi-format Export** - Download your documents in various formats (PDF, DOCX, etc.)

![_- visual selection (3)](https://github.com/user-attachments/assets/c48781ce-ae88-4b2e-82dd-69b6bc4fe8bd)


## 👨‍💻 Developers

- Jiawen Chen - [LinkedIn](https://www.linkedin.com/in/tjc321/)
- Yunxi LI - [LinkedIn](https://www.linkedin.com/in/jade-yunxili/)
- Snahil Singh Dasawat - [LinkedIn](https://www.linkedin.com/in/snahildasawat/)
- Steven Hu - [LinkedIn](https://www.linkedin.com/in/stevenwdhu/)
- Chantelle Wu - [LinkedIn](https://www.linkedin.com/in/chantelle-wu/)

## 🚀 Setup Instructions

### Prerequisites

- Node.js (v22 or higher)
- Yarn package manager (Use 'npm install yarn -g' to install yarn)
- LM Studio (for local language model support)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/javienc/careercanvas
   cd careercanvas
   ```

### Setup for development

1. Install dependencies and setup everything:
   ```bash
   yarn setup
   ```

## 🤖 Setting Up LM Studio

Career Canvas requires a running LM Studio model for optimal performance. Follow these steps to set it up:

### Installing LM Studio

1. Download LM Studio from the [official website](https://lmstudio.ai/):
   - For Windows/macOS: Download the appropriate installer
   - For Snapdragon computers: Download the ARM-compatible version (LM Studio 0.3.10 or newer supports Snapdragon X Elite)

2. Install LM Studio following the on-screen instructions.

### Configuring LM Studio for Career Canvas

1. Launch LM Studio.

2. Download a compatible model:
   - For Snapdragon computers, we recommend smaller models like Mistral 7B or Llama 3 8B for optimal performance
   - Models with 8-16GB RAM requirements work best on Snapdragon systems

3. Load your chosen model in LM Studio.

4. Enable the local API server:
   - Go to Settings > API Server
   - Toggle "Enable local API server"
   - Note the API URL (typically http://localhost:1234)

5. Connecting the local llm by click the setting icon on the bottom left and select LM Studio as the LLM provider

6. Keep LM Studio running while using Career Canvas.

### Snapdragon-Specific Optimizations
On a Snapdragon computer:

1. Ensure you're using LM Studio 0.3.10 or newer which has specific ARM/Snapdragon optimizations.

2. In LM Studio settings:
   - Reduce the number of CPU threads to 6-8 for better stability
   - Set GPU layers to "Auto" or a lower value (4-8) to balance performance and resource usage
   - Enable "Low VRAM mode" if available

3. Monitor system performance and adjust settings as needed.

## 🏃‍♂️ Running the Application

### Development Mode (Run all from the root folder)

1. Start the server: (To boot the server locally)
   ```bash
   yarn dev:server
   ```

2. Start the frontend: (To boot the frontend locally)
   ```bash
   yarn dev:frontend
   ```

3. Start the document collector: (To then run the document collector)
   ```bash
   yarn dev:collector
   ```

### Verifying LM Studio Connection

1. After starting the server, check the console logs for successful connection to LM Studio.

2. If you encounter connection issues:
   - Ensure LM Studio is running and the API server is enabled
   - Check that your model is properly loaded in LM Studio
   - For Snapdragon systems, try restarting LM Studio with fewer CPU threads

## 📚 Additional Notes

- The application is designed to run primarily on the edge, with hybrid edge/cloud capabilities.
- For optimal performance, ensure your vector database is properly configured.
- Check the documentation for more advanced configuration options.
- On Snapdragon systems, monitor CPU and memory usage to ensure stable performance.

## 🔗 References

### Technologies Powering Career Canvas

- [LangChain Documentation](https://js.langchain.com/docs/)
- [LanceDB Vector Database](https://github.com/lancedb/lancedb)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [LM Studio Documentation](https://lmstudio.ai/docs/)
- [Prisma ORM Documentation](https://www.prisma.io/docs)
- [Vite Build Tool](https://vitejs.dev/guide/)
- [Tailwind CSS Framework](https://tailwindcss.com/docs)
- [Recharts Visualization Library](https://recharts.org/en-US/)
- [Express.js Framework](https://expressjs.com/)
- [Puppeteer Web Scraping](https://pptr.dev/)
- [Node.js Runtime](https://nodejs.org/en/docs/)
- [OpenAI API Documentation](https://platform.openai.com/docs/)
- [Yarn Package Manager](https://yarnpkg.com/getting-started)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="right">
  <a href="#readme-top">Back to top</a>
</div>

Copyright © 2024 Career Canvas
