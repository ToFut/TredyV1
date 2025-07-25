import axios from 'axios';
import API_BASE_URL from '../config/api.js';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Check if API is configured
export const isAPIConfigured = () => {
  return true; // For now, always return true since we're using the backend
};

// Chat API
export const chatAPI = {
  // Generic GET request
  get: async (url) => {
    const response = await api.get(url);
    return response.data;
  },

  // Generic POST request
  post: async (url, data) => {
    const response = await api.post(url, data);
    return response.data;
  },

  // Send message and get AI response
  sendMessage: async (data) => {
    const response = await api.post('/chat/simple', data);
    return response.data;
  },

  // Send message with streaming response
  sendStreamingMessage: async (data, onChunk, onComplete, onError) => {
    try {
        const response = await fetch(`${API_BASE_URL}/chat/stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        if (data.type === 'start') { /* ... */ }
                        else if (data.type === 'chunk') { if (onChunk) { onChunk(data.content, data.messageId); } }
                        else if (data.type === 'complete') { if (onComplete) { onComplete({ message: 'Streaming completed', model: data.model || 'gpt-4o', success: true, usage: data.usage }); } return; }
                        else if (data.type === 'error') { if (onError) { onError(new Error(data.error)); } return; }
                    } catch (parseError) { console.error('Error parsing streaming data:', parseError); }
                }
            }
        }
    } catch (error) { if (onError) { onError(error); } }
  },

  // Send message with streaming (alternative method)
  sendMessageStream: async (data) => {
    const response = await api.post('/chat/send', { ...data, stream: true });
    return response.data;
  },

  // Get conversation messages
  getConversationMessages: async (conversationId, options = {}) => {
    const params = new URLSearchParams(options);
    const response = await api.get(`/chat/conversation/${conversationId}?${params}`);
    return response.data;
  },

  // Get thread messages
  getThreadMessages: async (threadId, options = {}) => {
    const params = new URLSearchParams(options);
    const response = await api.get(`/chat/thread/${threadId}?${params}`);
    return response.data;
  },

  // Search messages
  searchMessages: async (conversationId, searchTerm, options = {}) => {
    const params = new URLSearchParams({ q: searchTerm, ...options });
    const response = await api.get(`/chat/search/${conversationId}?${params}`);
    return response.data;
  },

  // Get conversation stats
  getConversationStats: async (conversationId) => {
    const response = await api.get(`/chat/stats/${conversationId}`);
    return response.data;
  },

  // Get recent messages
  getRecentMessages: async (conversationId, limit = 10) => {
    const response = await api.get(`/chat/recent/${conversationId}?limit=${limit}`);
    return response.data;
  },

  // Generate content
  generateContent: async (data) => {
    const response = await api.post('/chat/generate-content', data);
    return response.data;
  },

  // Get conversation context
  getConversationContext: async (conversationId, limit = 20) => {
    const response = await api.get(`/chat/context/${conversationId}?limit=${limit}`);
    return response.data;
  },

  // Get thread context
  getThreadContext: async (threadId, limit = 10) => {
    const response = await api.get(`/chat/context/thread/${threadId}?limit=${limit}`);
    return response.data;
  },
};

// Threads API
export const threadsAPI = {
  // Create new thread
  createThread: async (data) => {
    const response = await api.post('/threads', data);
    return response.data;
  },

  // Get thread by ID
  getThread: async (threadId) => {
    const response = await api.get(`/threads/${threadId}`);
    return response.data;
  },

  // Get thread hierarchy
  getThreadHierarchy: async (conversationId) => {
    const response = await api.get(`/threads/hierarchy/${conversationId}`);
    return response.data;
  },

  // Get conversation threads
  getConversationThreads: async (conversationId) => {
    const response = await api.get(`/threads/conversation/${conversationId}`);
    return response.data;
  },

  // Get thread children
  getThreadChildren: async (threadId) => {
    const response = await api.get(`/threads/${threadId}/children`);
    return response.data;
  },

  // Get thread siblings
  getThreadSiblings: async (threadId) => {
    const response = await api.get(`/threads/${threadId}/siblings`);
    return response.data;
  },

  // Update thread
  updateThread: async (threadId, data) => {
    const response = await api.put(`/threads/${threadId}`, data);
    return response.data;
  },

  // Delete thread
  deleteThread: async (threadId) => {
    const response = await api.delete(`/threads/${threadId}`);
    return response.data;
  },

  // Search threads
  searchThreads: async (conversationId, searchTerm) => {
    const response = await api.get(`/threads/search/${conversationId}?q=${encodeURIComponent(searchTerm)}`);
    return response.data;
  },

  // Get thread stats
  getThreadStats: async (conversationId) => {
    const response = await api.get(`/threads/stats/${conversationId}`);
    return response.data;
  },

  // Get thread with messages
  getThreadWithMessages: async (threadId, options = {}) => {
    const params = new URLSearchParams(options);
    const response = await api.get(`/threads/${threadId}/with-messages?${params}`);
    return response.data;
  },

  // Get thread path
  getThreadPath: async (threadId) => {
    const response = await api.get(`/threads/${threadId}/path`);
    return response.data;
  },

  // Get thread context
  getThreadContext: async (threadId) => {
    const response = await api.get(`/threads/${threadId}/context`);
    return response.data;
  },
};

// Collaboration API
export const collaborationAPI = {
  // Invite collaborator
  inviteCollaborator: async (data) => {
    const response = await api.post('/collaboration/invite', data);
    return response.data;
  },

  // Get thread collaborators
  getThreadCollaborators: async (threadId) => {
    const response = await api.get(`/collaboration/thread/${threadId}/collaborators`);
    return response.data;
  },

  // Update collaborator role
  updateCollaboratorRole: async (collaborationId, data) => {
    const response = await api.put(`/collaboration/collaborator/${collaborationId}`, data);
    return response.data;
  },

  // Remove collaborator
  removeCollaborator: async (collaborationId) => {
    const response = await api.delete(`/collaboration/collaborator/${collaborationId}`);
    return response.data;
  },

  // Get user collaborations
  getUserCollaborations: async (userId) => {
    const response = await api.get(`/collaboration/user/${userId}/collaborations`);
    return response.data;
  },

  // Get thread activity
  getThreadActivity: async (threadId) => {
    const response = await api.get(`/collaboration/thread/${threadId}/activity`);
    return response.data;
  },
};

// Health API
export const healthAPI = {
  // Basic health check
  checkHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  // Detailed health check
  checkDetailedHealth: async () => {
    const response = await api.get('/health/detailed');
    return response.data;
  },

  // Database health check
  checkDatabaseHealth: async () => {
    const response = await api.get('/health/database');
    return response.data;
  },

  // System info
  getSystemInfo: async () => {
    const response = await api.get('/health/system');
    return response.data;
  },

  // API status
  getAPIStatus: async () => {
    const response = await api.get('/health/api');
    return response.data;
  },
};

// Socket.io connection (disabled for now)
export const socketAPI = {
  connect: (token) => {
    // const io = require('socket.io-client');
    // return io(SOCKET_URL, {
    //   auth: { token },
    //   transports: ['websocket', 'polling'],
    // });
    console.warn('Socket.io functionality is currently disabled');
    return null;
  },
};

// Error handling utility
export const handleAPIError = (error) => {
  if (error.response) {
    // Server responded with error status
    return {
      message: error.response.data?.message || 'An error occurred',
      status: error.response.status,
      data: error.response.data,
    };
  } else if (error.request) {
    // Network error
    return {
      message: 'Network error - please check your connection',
      status: 0,
    };
  } else {
    // Other error
    return {
      message: error.message || 'An unexpected error occurred',
      status: 0,
    };
  }
};

export default api; 