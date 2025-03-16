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


## 📚 Additional Notes

- The application is designed to run primarily on the edge, with hybrid edge/cloud capabilities.
- For optimal performance, ensure your vector database is properly configured.
- Check the documentation for more advanced configuration options.

## 🔗 References

- [LangChain Documentation](https://js.langchain.com/docs/)
- [Vector Database Resources](https://github.com/lancedb/lancedb)
- [React Documentation](https://reactjs.org/docs/getting-started.html)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="right">
  <a href="#readme-top">Back to top</a>
</div>

Copyright © 2024 Career Canvas
