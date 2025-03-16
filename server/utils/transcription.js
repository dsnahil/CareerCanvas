const fs = require('fs');
const path = require('path');
const { getLLMProvider } = require('./helpers');

/**
 * Transcribe audio using the configured transcription provider
 * @param {string} audioFilePath - Path to the audio file
 * @returns {Promise<string>} - The transcribed text
 */
async function transcribeAudio(audioFilePath) {
  try {
    const provider = process.env.WHISPER_PROVIDER || 'openai';
    
    switch (provider) {
      case 'openai':
        return await transcribeWithOpenAI(audioFilePath);
      case 'local':
        return await transcribeWithLocalWhisper(audioFilePath);
      default:
        throw new Error(`Unsupported transcription provider: ${provider}`);
    }
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
}

/**
 * Transcribe audio using OpenAI's Whisper API
 * @param {string} audioFilePath - Path to the audio file
 * @returns {Promise<string>} - The transcribed text
 */
async function transcribeWithOpenAI(audioFilePath) {
  try {
    if (!process.env.OPEN_AI_KEY) {
      throw new Error('OpenAI API key not set');
    }
    
    const { OpenAI } = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPEN_AI_KEY,
    });
    
    const audioStream = fs.createReadStream(audioFilePath);
    
    const response = await openai.audio.transcriptions.create({
      file: audioStream,
      model: 'whisper-1',
    });
    
    return response.text;
  } catch (error) {
    console.error('Error transcribing with OpenAI:', error);
    throw error;
  }
}

/**
 * Transcribe audio using local Whisper model
 * @param {string} audioFilePath - Path to the audio file
 * @returns {Promise<string>} - The transcribed text
 */
async function transcribeWithLocalWhisper(audioFilePath) {
  // This is a placeholder for local Whisper implementation
  // In a real implementation, you would use a local Whisper model
  // For now, we'll just return a mock transcription
  return 'This is a mock transcription from the local Whisper model.';
}

/**
 * Process a transcript with an LLM to extract structured data
 * @param {string} transcript - The raw transcript text
 * @returns {Promise<Object>} - Structured transcript data
 */
async function processTranscriptWithLLM(transcript) {
  try {
    const llmProvider = getLLMProvider();
    
    const prompt = `
      You are an expert speech analyst. Analyze the following interview transcript and extract structured data.
      
      Transcript:
      ${transcript}
      
      Extract the following information:
      1. Identify different speakers and label them as "Interviewer" or "You" (the interviewee)
      2. Add timestamps if they can be inferred from the context
      3. Format the transcript as a JSON array with the following structure:
      
      [
        {
          "id": 1,
          "timestamp": "00:00",
          "speaker": "Interviewer",
          "text": "..."
        },
        {
          "id": 2,
          "timestamp": "00:15",
          "speaker": "You",
          "text": "..."
        },
        ...
      ]
      
      Only include the JSON in your response, no other text.
    `;
    
    const response = await llmProvider.sendChat({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    });
    
    try {
      return JSON.parse(response.text);
    } catch (error) {
      console.error('Error parsing processed transcript:', error);
      
      // Fallback to simple processing if LLM response is not valid JSON
      return simpleTranscriptProcessing(transcript);
    }
  } catch (error) {
    console.error('Error processing transcript with LLM:', error);
    return simpleTranscriptProcessing(transcript);
  }
}

/**
 * Simple transcript processing without LLM
 * @param {string} transcript - The raw transcript text
 * @returns {Array} - Structured transcript data
 */
function simpleTranscriptProcessing(transcript) {
  if (!transcript) return [];
  
  const lines = transcript.split('\n').filter(line => line.trim());
  
  return lines.map((line, index) => {
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
  });
}

module.exports = {
  transcribeAudio,
  processTranscriptWithLLM,
  simpleTranscriptProcessing,
}; 