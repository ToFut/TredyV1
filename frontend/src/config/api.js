// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://your-vercel-app.vercel.app/api' 
    : 'http://localhost:5001/api');

export default API_BASE_URL;

// Check if API key is configured
export const isAPIConfigured = () => {
  // Since we're using the backend API, we don't need to check the frontend API key
  // The backend handles the OpenAI API key configuration
  return true;
};

// Get API key with validation
export const getAPIKey = () => {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    throw new Error('OpenAI API key not configured. Please add your API key to the .env file.');
  }
  
  if (!apiKey.startsWith('sk-')) {
    throw new Error('Invalid OpenAI API key format. API key should start with "sk-".');
  }
  
  return apiKey.trim();
}; 