// API Configuration
export const API_CONFIG = {
  // OpenAI Configuration
  OPENAI_API_KEY: process.env.REACT_APP_OPENAI_API_KEY || 'your_openai_api_key_here',
  
  // Claude Configuration (for future use)
  CLAUDE_API_KEY: process.env.REACT_APP_CLAUDE_API_KEY || 'your_claude_api_key_here',
  
  // Gemini Configuration (for future use)
  GEMINI_API_KEY: process.env.REACT_APP_GEMINI_API_KEY || 'your_gemini_api_key_here',
  
  // API Endpoints
  OPENAI_BASE_URL: 'https://api.openai.com/v1',
  
  // Model configurations
  MODELS: {
    'GPT-4': {
      id: 'gpt-4o',
      name: 'GPT-4o',
      description: 'Most capable model',
      color: 'bg-green-100 text-green-800',
      type: 'text',
      maxTokens: 4000
    },
    'GPT-3.5': {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      description: 'Fast and efficient',
      color: 'bg-blue-100 text-blue-800',
      type: 'text',
      maxTokens: 4000
    },
    'Claude-3.5': {
      id: 'claude-3.5-sonnet',
      name: 'Claude 3.5 Sonnet',
      description: 'Excellent reasoning',
      color: 'bg-purple-100 text-purple-800',
      type: 'text',
      maxTokens: 4000
    }
  }
};

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