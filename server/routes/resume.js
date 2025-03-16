const express = require('express');
const router = express.Router();
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { PDFDocument } = require('pdf-lib');
const pdfParse = require('pdf-parse');

const prisma = new PrismaClient();
const upload = multer();

// Upload resume and job description
router.post('/upload', upload.single('resume'), async (req, res) => {
  console.log('Upload request received:', {
    hasFile: !!req.file,
    fileName: req.file?.originalname,
    hasJobDesc: !!req.body.jobDescription
  });

  try {
    if (!req.file) {
      console.log('No file provided in request');
      return res.status(400).json({ success: false, error: 'No resume file provided' });
    }

    if (!req.body.jobDescription) {
      console.log('No job description provided in request');
      return res.status(400).json({ success: false, error: 'No job description provided' });
    }

    const submission = await prisma.resumeSubmission.create({
      data: {
        resumeFileName: req.file.originalname,
        resumeData: Buffer.from(req.file.buffer),
        jobDescription: req.body.jobDescription,
      },
    });

    console.log('Resume submission created:', {
      id: submission.id,
      fileName: submission.resumeFileName
    });

    return res.status(200).json({
      success: true,
      id: submission.id,
      fileName: submission.resumeFileName,
      createdAt: submission.createdAt,
    });
  } catch (error) {
    console.error('Error uploading resume:', error);
    return res.status(500).json({ success: false, error: 'Failed to upload resume' });
  }
});

// Get all resume submissions
router.get('/submissions', async (req, res) => {
  console.log('Fetching all resume submissions');
  try {
    const submissions = await prisma.ResumeSubmission.findMany({
      select: {
        id: true,
        resumeFileName: true,
        jobDescription: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    console.log(`Found ${submissions.length} submissions`);
    return res.status(200).json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Get a specific resume by ID
router.get('/download/:id', async (req, res) => {
  console.log('Download request for resume:', req.params.id);
  try {
    const submission = await prisma.ResumeSubmission.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
    });

    if (!submission) {
      console.log('Resume not found:', req.params.id);
      return res.status(404).json({ error: 'Resume not found' });
    }

    console.log('Sending resume file:', submission.resumeFileName);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${submission.resumeFileName}"`);
    return res.send(submission.resumeData);
  } catch (error) {
    console.error('Error downloading resume:', error);
    return res.status(500).json({ error: 'Failed to download resume' });
  }
});

// Extract text content from a PDF resume
router.get('/extract/:id', async (req, res) => {
  console.log('Extract text request for resume:', req.params.id);
  try {
    const submission = await prisma.ResumeSubmission.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
    });

    if (!submission) {
      console.log('Resume not found:', req.params.id);
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Create a temporary file to store the PDF
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `resume-${submission.id}.pdf`);
    
    try {
      // Write the PDF data to the temporary file
      await fs.writeFile(tempFilePath, submission.resumeData);
      
      // Extract text from the PDF
      const pdfBuffer = await fs.readFile(tempFilePath);
      const pdfData = await pdfParse(pdfBuffer);
      const extractedText = pdfData.text;
      
      // Clean up the temporary file
      await fs.unlink(tempFilePath);
      
      return res.status(200).json({ 
        success: true, 
        text: extractedText,
        fileName: submission.resumeFileName
      });
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      // Clean up the temporary file if it exists
      try {
        await fs.access(tempFilePath);
        await fs.unlink(tempFilePath);
      } catch (e) {
        // File doesn't exist or can't be accessed, ignore
      }
      return res.status(500).json({ error: 'Failed to extract text from PDF' });
    }
  } catch (error) {
    console.error('Error extracting text from resume:', error);
    return res.status(500).json({ error: 'Failed to extract text from resume' });
  }
});

module.exports = router; 