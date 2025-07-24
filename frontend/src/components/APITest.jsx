import React, { useState } from 'react';
import { chatGPTService } from '../services/chatgpt';
import { isAPIConfigured } from '../config/api';

const APITest = () => {
  const [testMessage, setTestMessage] = useState('Hello, how are you?');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const testAPI = async () => {
    setIsLoading(true);
    setError('');
    setResponse('');

    try {
      if (!isAPIConfigured()) {
        throw new Error('API key not configured properly');
      }

      const result = await chatGPTService.generateResponse(testMessage);
      setResponse(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">🤖 ChatGPT API Test</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Test Message:</label>
          <input
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Enter a test message..."
          />
        </div>

        <button
          onClick={testAPI}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test ChatGPT API'}
        </button>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">❌ Error: {error}</p>
          </div>
        )}

        {response && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm font-medium">✅ Response:</p>
            <p className="text-green-700 text-sm mt-2">{response}</p>
          </div>
        )}

        <div className="text-xs text-gray-600">
          <p>API Status: {isAPIConfigured() ? '✅ Configured' : '❌ Not Configured'}</p>
          <p>Service Status: {chatGPTService.isConfigured() ? '✅ Available' : '❌ Not Available'}</p>
        </div>
      </div>
    </div>
  );
};

export default APITest; 