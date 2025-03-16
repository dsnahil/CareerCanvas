import axios from 'axios';

/**
 * Service for handling interview-related API calls
 */
const InterviewService = {
  /**
   * Upload an interview recording
   * @param {File|Blob} audioFile - The audio file to upload
   * @returns {Promise<Object>} - The response from the server
   */
  uploadRecording: async (audioFile) => {
    if (!audioFile || !(audioFile instanceof Blob || audioFile instanceof File)) {
      console.error('Invalid recording file:', audioFile);
      return Promise.reject(new Error('Invalid recording file'));
    }

    const formData = new FormData();
    
    // Use a unique filename with timestamp
    const filename = `recording-${Date.now()}.webm`;
    
    // Append the file with the correct name
    formData.append('recording', audioFile, filename);
    
    try {
      console.log(`Uploading recording file (${audioFile.size} bytes) as ${filename}`);
      
      const response = await axios.post('/api/recordings/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout for large files
      });
      
      console.log('Upload response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error uploading recording:', error);
      throw error;
    }
  },
  
  /**
   * Get a recording by its filename
   * @param {string} fileName - The filename of the recording
   * @returns {Promise<string>} - The URL of the recording
   */
  getRecording: async (fileName) => {
    try {
      return `/api/recordings/video/${fileName}`;
    } catch (error) {
      console.error('Error getting recording:', error);
      throw error;
    }
  },
  
  /**
   * Transcribe a recording
   * @param {string} fileName - The filename of the recording
   * @returns {Promise<Object>} - The transcription results
   */
  transcribeRecording: async (fileName) => {
    try {
      const response = await axios.post('/api/recordings/transcribe', {
        fileName,
      });
      
      if (response.data.success) {
        return response.data.transcript;
      } else {
        throw new Error(response.data.error || 'Failed to transcribe recording');
      }
    } catch (error) {
      console.error('Error transcribing recording:', error);
      throw error;
    }
  },
  
  /**
   * Analyze an interview recording
   * @param {string} fileName - The filename of the recording
   * @param {string} transcript - The transcript of the recording
   * @returns {Promise<Object>} - The analysis results
   */
  analyzeInterview: async (fileName, transcript) => {
    if (!fileName || !transcript) {
      console.error('Missing required parameters for analyzeInterview:', { fileName, transcript });
      return Promise.reject(new Error('Missing required parameters'));
    }
    
    try {
      const response = await axios.post('/api/recordings/analyze', {
        fileName,
        transcript,
      }, {
        timeout: 30000, // 30 second timeout
      });
      
      if (response.data.success) {
        return response.data.analysis;
      } else {
        throw new Error(response.data.error || 'Failed to analyze interview');
      }
    } catch (error) {
      console.error('Error analyzing interview:', error);
      // Rethrow the error to be handled by the caller
      throw error;
    }
  },
  
  /**
   * Process a recording: transcribe and analyze in one step
   * @param {string} fileName - The filename of the recording
   * @returns {Promise<Object>} - The processed results with transcript and analysis
   */
  processRecording: async (fileName) => {
    try {
      // First transcribe the recording
      const transcriptionResult = await InterviewService.transcribeRecording(fileName);
      
      // Then analyze the transcript
      const analysisResult = await InterviewService.analyzeInterview(
        fileName, 
        transcriptionResult.raw
      );
      
      return {
        transcript: transcriptionResult,
        analysis: analysisResult
      };
    } catch (error) {
      console.error('Error processing recording:', error);
      throw error;
    }
  },
  
  /**
   * Process a transcript to extract insights
   * @param {string} transcript - The raw transcript text
   * @returns {Object} - Processed transcript data with timestamps, speakers, etc.
   */
  processTranscript: (transcript) => {
    // This is a simple implementation that could be enhanced
    // to handle more complex transcript formats
    if (!transcript) return [];
    
    try {
      // Ensure transcript is a string
      const transcriptStr = String(transcript);
      const lines = transcriptStr.split('\n').filter(line => line.trim());
      
      return lines.map((line, index) => {
        try {
          // Try to extract timestamp if available (format: [00:00:00])
          const timestampMatch = line.match(/\[(\d{2}:\d{2}:\d{2})\]/);
          const timestamp = timestampMatch ? timestampMatch[1] : null;
          
          // Try to extract speaker if available (format: Speaker: text)
          const speakerMatch = line.match(/^([^:]+):(.*)/);
          const speaker = speakerMatch ? speakerMatch[1].trim() : 'Unknown';
          const text = speakerMatch ? speakerMatch[2].trim() : line.trim();
          
          return {
            id: index,
            timestamp,
            speaker,
            text,
          };
        } catch (lineError) {
          console.error('Error processing transcript line:', lineError, line);
          // Return a default object for this line to avoid breaking the whole transcript
          return {
            id: index,
            timestamp: null,
            speaker: 'Unknown',
            text: line.trim() || 'Error processing line',
          };
        }
      });
    } catch (error) {
      console.error('Error processing transcript:', error);
      return [];
    }
  }
};

export default InterviewService; 