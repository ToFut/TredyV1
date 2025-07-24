import React, { useState } from 'react';
import { chatGPTService } from '../services/chatgpt';
import { isAPIConfigured } from '../config/api';

const ChatGPTIntegration = ({ onMessage, onError }) => {
  const [isConfigured, setIsConfigured] = useState(isAPIConfigured());
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (text, threadId = null, model = 'gpt-4') => {
    if (!text.trim()) return;

    setIsLoading(true);

    try {
      if (!isConfigured) {
        throw new Error('OpenAI API key not configured. Please add your API key to the .env file.');
      }

      const response = await chatGPTService.generateResponse(text, threadId, model);
      
      onMessage({
        id: `msg-${Date.now()}`,
        content: response,
        sender: 'AI',
        model: model,
        timestamp: new Date(),
        threadId: threadId
      });

    } catch (error) {
      console.error('ChatGPT API Error:', error);
      onError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const generateContent = async (prompt, contentType, threadId = null) => {
    if (!isConfigured) {
      onError('OpenAI API key not configured');
      return;
    }

    setIsLoading(true);

    try {
      const content = await chatGPTService.generateContent(prompt, contentType, threadId);
      
      onMessage({
        id: `content-${Date.now()}`,
        content: content,
        sender: 'AI',
        type: contentType,
        timestamp: new Date(),
        threadId: threadId
      });

    } catch (error) {
      console.error('Content generation error:', error);
      onError('Failed to generate content');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          🤖 ChatGPT Not Configured
        </h3>
        <p className="text-yellow-700 mb-3">
          To use real ChatGPT responses, you need to configure your OpenAI API key.
        </p>
        <div className="space-y-2 text-sm text-yellow-600">
          <p>1. Get an API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI Platform</a></p>
          <p>2. Create a <code>.env</code> file in your project root</p>
          <p>3. Add: <code>REACT_APP_OPENAI_API_KEY=sk-your-key-here</code></p>
          <p>4. Restart the app</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <h3 className="text-lg font-semibold text-green-800 mb-2">
        ✅ ChatGPT Connected
      </h3>
      <p className="text-green-700 mb-3">
        Your FlowChat is now powered by real ChatGPT!
      </p>
      {isLoading && (
        <div className="flex items-center space-x-2 text-green-600">
          <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Generating response...</span>
        </div>
      )}
    </div>
  );
};

export default ChatGPTIntegration; 