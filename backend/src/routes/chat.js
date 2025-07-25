const express = require('express');
const { body, validationResult } = require('express-validator');
const winston = require('winston');
const aiService = require('../services/aiService');
const Message = require('../models/Message');
const Thread = require('../models/Thread');

const router = express.Router();

// Minimal test route
router.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

// Validation middleware
const validateMessage = [
  body('content').isLength({ min: 1, max: 10000 }).trim().withMessage('Message must be between 1 and 10000 characters'),
  body('conversationId').optional().isString().withMessage('Invalid conversation ID'),
  body('threadId').optional().isString().withMessage('Invalid thread ID'),
  body('model').optional().isString().withMessage('Invalid model name'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Test endpoint for multi-modal functionality (bypasses database)
router.post('/test', async (req, res) => {
  try {
    const { content, model = 'gpt-4o', displayModel = null } = req.body;
    
    // Generate AI response without database
    const aiResult = await aiService.generateResponse(content, null, model, 'test-conversation', displayModel);

    res.json({
      success: true,
      aiMessage: aiResult.message,
      usage: {
        tokensUsed: aiResult.tokensUsed,
        costUsd: aiResult.costUsd,
        model: aiResult.model
      },
      contextUsed: aiResult.contextUsed
    });

  } catch (error) {
    winston.error('Error in test endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to generate response',
      message: error.message 
    });
  }
});

// Simple test endpoint without validation
router.post('/simple', async (req, res) => {
  try {
    const { content, model = 'gpt-4o' } = req.body;
    
    // Generate real AI response with proper UUID
    const aiResult = await aiService.generateResponse(content, null, model, '22222222-2222-2222-2222-222222222222', null);

    res.json({
      success: true,
      message: aiResult.message.content,
      model: aiResult.model
    });

  } catch (error) {
    console.error('Error in simple endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to generate response',
      message: error.message 
    });
  }
});

// Send message and get AI response
router.post('/send', validateMessage, async (req, res) => {
  try {
    const { content, conversationId, threadId, model = 'gpt-4o', stream = false, displayModel = null } = req.body;
    const userId = req.user?.id || '11111111-1111-1111-1111-111111111111'; // In production, get from auth middleware

    // Save user message (mock for now)
    const userMessage = {
      id: 'msg-' + Date.now(),
      threadId,
      conversationId,
      userId,
      content,
      messageType: 'user',
      created_at: new Date()
    };

    // If streaming is requested, handle differently
    if (stream) {
      return handleStreamingResponse(req, res, content, threadId, model, conversationId, userMessage);
    }

    // Generate real AI response
    const aiResult = await aiService.generateResponse(content, threadId, model, conversationId, displayModel);

    // Save AI message to database (mock for now)
    const aiMessage = {
      id: 'ai-' + Date.now(),
      threadId,
      conversationId,
      userId: '11111111-1111-1111-1111-111111111111', // System user ID for AI
      content: aiResult.message.content,
      messageType: 'ai',
      aiModel: aiResult.model,
      tokensUsed: aiResult.tokensUsed,
      costUsd: aiResult.costUsd,
      created_at: new Date()
    };

    // Generate real thread suggestions
    const suggestions = await aiService.generateThreadSuggestions(content, aiResult.message.content, threadId, conversationId);

    res.json({
      success: true,
      userMessage,
      aiMessage: {
        id: aiMessage.id,
        content: aiMessage.content,
        model: aiMessage.aiModel,
        created_at: aiMessage.created_at
      },
      suggestions,
      usage: {
        tokensUsed: aiMessage.tokensUsed,
        costUsd: aiMessage.costUsd,
        model: aiMessage.aiModel
      },
      contextUsed: aiResult.contextUsed
    });

  } catch (error) {
    console.error('Error in send endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to generate response',
      message: error.message 
    });
  }
});

// Handle streaming response
async function handleStreamingResponse(req, res, content, threadId, model, conversationId, userMessage) {
  try {
    // Set headers for streaming
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    let fullResponse = '';
    let messageId = null;

    // Generate streaming AI response
    const stream = await aiService.generateStreamingResponse(content, threadId, model, conversationId);
    
    // Send initial message ID
    res.write(`data: ${JSON.stringify({ type: 'start', messageId: null })}\n\n`);

    // Stream the response
    for await (const chunk of stream) {
      if (chunk.choices?.[0]?.delta?.content) {
        const content = chunk.choices[0].delta.content;
        fullResponse += content;
        
        // Send chunk to client
        res.write(`data: ${JSON.stringify({ 
          type: 'chunk', 
          content: content,
          messageId: messageId 
        })}\n\n`);
        
        // Add a small delay to make typing effect more visible
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      
      // Get message ID from first chunk if available
      if (!messageId && chunk.choices?.[0]?.delta?.content) {
        messageId = `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
    }

    // Try to save complete AI message to database
    let aiMessage = null;
    try {
      aiMessage = await Message.create({
        threadId,
        conversationId,
        userId: '11111111-1111-1111-1111-111111111111',
        content: fullResponse,
        messageType: 'ai',
        aiModel: model,
        tokensUsed: stream.usage?.total_tokens || 0,
        costUsd: aiService.calculateCost(stream.usage?.total_tokens || 0, model)
      });
    } catch (dbError) {
      console.log('Database not available for AI message, proceeding without saving');
      aiMessage = { id: `ai-temp-${Date.now()}` };
    }

    // Generate thread suggestions
    const suggestions = await aiService.generateThreadSuggestions(content, fullResponse, threadId, conversationId);

    // Send completion signal
    res.write(`data: ${JSON.stringify({ 
      type: 'complete', 
      messageId: aiMessage.id,
      suggestions,
      usage: {
        tokensUsed: stream.usage?.total_tokens || 0,
        costUsd: aiService.calculateCost(stream.usage?.total_tokens || 0, model),
        model: model
      }
    })}\n\n`);

    res.end();

  } catch (error) {
    winston.error('Error in streaming response:', error);
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      error: error.message 
    })}\n\n`);
    res.end();
  }
}

// Streaming endpoint
router.post('/stream', validateMessage, async (req, res) => {
  try {
    const { content, conversationId, threadId, model = 'gpt-4o' } = req.body;
    const userId = req.user?.id || '11111111-1111-1111-1111-111111111111';

    let userMessage = null;
    
    // Try to save user message, but continue if database is unavailable
    try {
      userMessage = await Message.create({
        threadId,
        conversationId,
        userId,
        content,
        messageType: 'user'
      });
    } catch (dbError) {
      console.log('Database not available for user message, proceeding without saving');
      userMessage = { id: `temp-${Date.now()}` };
    }

    await handleStreamingResponse(req, res, content, threadId, model, conversationId, userMessage);

  } catch (error) {
    winston.error('Error in streaming endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to start streaming',
      message: error.message 
    });
  }
});

// Get conversation messages
router.get('/conversation/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 100, offset = 0, threadId } = req.query;

    const messages = await Message.findByConversation(conversationId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      threadId: threadId || null
    });

    res.json({
      success: true,
      messages,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: messages.length
      }
    });

  } catch (error) {
    winston.error('Error fetching conversation messages:', error);
    res.status(500).json({ 
      error: 'Failed to fetch messages',
      message: error.message 
    });
  }
});

// Get thread messages
router.get('/thread/:threadId', async (req, res) => {
  try {
    const { threadId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const messages = await Message.findByThread(threadId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const thread = await Thread.findById(threadId);

    res.json({
      success: true,
      messages,
      thread,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: messages.length
      }
    });

  } catch (error) {
    winston.error('Error fetching thread messages:', error);
    res.status(500).json({ 
      error: 'Failed to fetch thread messages',
      message: error.message 
    });
  }
});

// Search messages
router.get('/search/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { q: searchTerm, limit = 50, offset = 0 } = req.query;

    if (!searchTerm) {
      return res.status(400).json({ error: 'Search term is required' });
    }

    const messages = await Message.search(conversationId, searchTerm, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      messages,
      searchTerm,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: messages.length
      }
    });

  } catch (error) {
    winston.error('Error searching messages:', error);
    res.status(500).json({ 
      error: 'Failed to search messages',
      message: error.message 
    });
  }
});

// Get conversation stats
router.get('/stats/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;

    const stats = await Message.getStats(conversationId);
    const threadStats = await Thread.getStats(conversationId);
    const aiUsage = await Message.getAIUsageStats(conversationId);

    res.json({
      success: true,
      stats: {
        ...stats,
        threads: threadStats,
        aiUsage
      }
    });

  } catch (error) {
    winston.error('Error fetching conversation stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch stats',
      message: error.message 
    });
  }
});

// Get recent messages
router.get('/recent/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 10 } = req.query;

    const messages = await Message.getRecentMessages(conversationId, parseInt(limit));

    res.json({
      success: true,
      messages
    });

  } catch (error) {
    winston.error('Error fetching recent messages:', error);
    res.status(500).json({ 
      error: 'Failed to fetch recent messages',
      message: error.message 
    });
  }
});

// Generate content
router.post('/generate-content', [
  body('prompt').isLength({ min: 1, max: 5000 }).withMessage('Prompt must be between 1 and 5000 characters'),
  body('contentType').isIn(['code', 'video', 'audio', 'research', 'presentation']).withMessage('Invalid content type'),
  body('threadId').optional().isUUID().withMessage('Invalid thread ID'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
], async (req, res) => {
  try {
    const { prompt, contentType, threadId } = req.body;

    const content = await aiService.generateContent(prompt, contentType, threadId);

    res.json({
      success: true,
      content,
      contentType
    });

  } catch (error) {
    winston.error('Error generating content:', error);
    res.status(500).json({ 
      error: 'Failed to generate content',
      message: error.message 
    });
  }
});

// Get conversation context
router.get('/context/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 20 } = req.query;

    const context = await Message.getConversationContext(conversationId, parseInt(limit));

    res.json({
      success: true,
      context
    });

  } catch (error) {
    winston.error('Error fetching conversation context:', error);
    res.status(500).json({ 
      error: 'Failed to fetch context',
      message: error.message 
    });
  }
});

// Get thread context
router.get('/context/thread/:threadId', async (req, res) => {
  try {
    const { threadId } = req.params;
    const { limit = 10 } = req.query;

    const context = await Message.getThreadContext(threadId, parseInt(limit));

    res.json({
      success: true,
      context
    });

  } catch (error) {
    winston.error('Error fetching thread context:', error);
    res.status(500).json({ 
      error: 'Failed to fetch thread context',
      message: error.message 
    });
  }
});

module.exports = router; 