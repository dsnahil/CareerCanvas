const API_BASE = 'http://localhost:3001';

export const uploadResume = async (file, jobDescription) => {
  try {
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobDescription', jobDescription);

    console.log('Uploading resume:', {
      fileName: file.name,
      fileSize: file.size,
      jobDescriptionLength: jobDescription?.length
    });

    const response = await fetch(`${API_BASE}/api/resume/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload failed:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || 'Failed to upload resume');
      } catch (e) {
        throw new Error('Failed to upload resume: ' + errorText);
      }
    }

    const data = await response.json();
    console.log('Upload successful:', data);
    return data;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

export const getSubmissions = async () => {
  try {
    console.log('Fetching resume submissions');
    const response = await fetch(`${API_BASE}/api/resume/submissions`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fetch submissions failed:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || 'Failed to fetch submissions');
      } catch (e) {
        throw new Error('Failed to fetch submissions: ' + errorText);
      }
    }

    const data = await response.json();
    console.log('Fetched submissions:', data);
    return data;
  } catch (error) {
    console.error('Fetch submissions error:', error);
    throw error;
  }
};

export const downloadResume = async (id) => {
  try {
    console.log('Downloading resume:', id);
    const response = await fetch(`${API_BASE}/api/resume/download/${id}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Download failed:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || 'Failed to download resume');
      } catch (e) {
        throw new Error('Failed to download resume: ' + errorText);
      }
    }

    const blob = await response.blob();
    console.log('Download successful');
    return blob;
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
};

export const extractResumeText = async (id) => {
  try {
    const response = await fetch(`${API_BASE}/api/resume/extract/${id}`);
    if (!response.ok) {
      throw new Error('Failed to extract text from resume');
    }
    return await response.json();
  } catch (error) {
    console.error('Error extracting text from resume:', error);
    throw error;
  }
}; 