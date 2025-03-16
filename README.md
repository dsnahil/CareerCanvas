<a name="readme-top"></a>

<div align='center'>
  
# Career Canvas

### Your Job Delivery App

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

Welcome to Career Canvas – your all-in-one AI-driven platform that revolutionizes the job application experience. Struggling with resume writing, cover letter creation, or interview preparation? Career Canvas eliminates these challenges by harnessing cutting-edge language models to transform your professional journey.

Our platform serves as your personal career assistant, converting your work history and qualifications into compelling, employer-focused documents. The sophisticated interview simulator goes beyond basic preparation, offering dynamic practice environments that mirror real-world scenarios, helping you refine your responses and build the confidence needed to excel in actual interviews. With Career Canvas, you're not just applying for jobs – you're strategically positioning yourself for career success.

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

## 👨‍💻 Developers

- Jiawen Chen - [LinkedIn](https://www.linkedin.com/in/tjc321/)
- Yunxi LI - [LinkedIn](https://www.linkedin.com/in/jade-yunxili/)
- Snahil Singh Dasawat - [LinkedIn](https://www.linkedin.com/in/snahildasawat/)
- Steven Hu - [LinkedIn](https://www.linkedin.com/in/stevenwdhu/)
- Chantelle Wu - [LinkedIn](https://www.linkedin.com/in/chantelle-wu/)

## 🚀 Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- Yarn package manager
- LM Studio (for local language model support)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/javienc/careercanvas
   cd careercanvas
   ```

2. Set up environment variables:
   ```bash
   yarn setup
   ```
   This will create the necessary `.env` files in each application section. Make sure to fill them out before proceeding.

3. Install dependencies:
   ```bash
   cd server && yarn
   cd ../collector && yarn
   cd ../frontend && yarn
   cd ..
   ```

4. Set up the database:
   ```bash
   yarn prisma:setup
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

5. Update your Career Canvas environment variables:
   - In your server's `.env` file, add:
     ```
     LMSTUDIO_BASE_PATH=http://localhost:1234
     LMSTUDIO_MODEL_PREF=<your-loaded-model-name>
     LMSTUDIO_MODEL_TOKEN_LIMIT=<model-context-window-size>
     ```
   - For Snapdragon computers, set a conservative token limit (e.g., 4096) to optimize performance

6. Keep LM Studio running while using Career Canvas.

### Snapdragon-Specific Optimizations

If you're running on a Snapdragon computer:

1. Ensure you're using LM Studio 0.3.10 or newer which has specific ARM/Snapdragon optimizations.

2. In LM Studio settings:
   - Reduce the number of CPU threads to 6-8 for better stability
   - Set GPU layers to "Auto" or a lower value (4-8) to balance performance and resource usage
   - Enable "Low VRAM mode" if available

3. Monitor system performance and adjust settings as needed.

## 🏃‍♂️ Running the Application

### Development Mode

1. Start the server:
   ```bash
   yarn dev:server
   ```

2. Start the frontend:
   ```bash
   yarn dev:frontend
   ```

3. Start the document collector:
   ```bash
   yarn dev:collector
   ```

### Production Mode

1. Build the frontend:
   ```bash
   yarn prod:frontend
   ```

2. Start the server:
   ```bash
   yarn prod:server
   ```

### Verifying LM Studio Connection

1. After starting the server, check the console logs for successful connection to LM Studio.

2. If you encounter connection issues:
   - Ensure LM Studio is running and the API server is enabled
   - Verify the API URL in your `.env` file matches the one in LM Studio
   - Check that your model is properly loaded in LM Studio
   - For Snapdragon systems, try restarting LM Studio with fewer CPU threads

## 📚 Additional Notes

- The application is designed to run primarily on the edge, with hybrid edge/cloud capabilities.
- For optimal performance, ensure your vector database is properly configured.
- Check the documentation for more advanced configuration options.
- On Snapdragon systems, monitor CPU and memory usage to ensure stable performance.

## 🔗 References

- [LangChain Documentation](https://js.langchain.com/docs/)
- [Vector Database Resources](https://github.com/lancedb/lancedb)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [LM Studio Documentation](https://lmstudio.ai/docs/)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="right">
  <a href="#readme-top">Back to top</a>
</div>

Copyright © 2024 Career Canvas
