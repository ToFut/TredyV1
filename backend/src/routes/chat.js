const express = require('express');
const { body, validationResult } = require('express-validator');
const winston = require('winston');
const aiService = require('../services/aiService');
const Message = require('../models/Message');
const Thread = require('../models/Thread');

const router = express.Router();

// Validation middleware
const validateMessage = [
  body('content').isLength({ min: 1, max: 10000 }).trim().withMessage('Message must be between 1 and 10000 characters'),
  body('conversationId').isUUID().withMessage('Invalid conversation ID'),
  body('threadId').optional().isUUID().withMessage('Invalid thread ID'),
  body('model').optional().isString().withMessage('Invalid model name'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Send message and get AI response
router.post('/send', validateMessage, async (req, res) => {
  try {
    const { content, conversationId, threadId, model = 'gpt-4o' } = req.body;
    const userId = req.user?.id || '11111111-1111-1111-1111-111111111111'; // In production, get from auth middleware

    // Save user message
    const userMessage = await Message.create({
      threadId,
      conversationId,
      userId,
      content,
      messageType: 'user'
    });

    // Generate AI response
    const aiResult = await aiService.generateResponse(content, threadId, model, conversationId);

    // Save AI message to database
    const aiMessage = await Message.create({
      threadId,
      conversationId,
      userId: '11111111-1111-1111-1111-111111111111', // System user ID for AI
      content: aiResult.message.content,
      messageType: 'ai',
      aiModel: aiResult.model,
      tokensUsed: aiResult.tokensUsed,
      costUsd: aiResult.costUsd
    });

    // Generate thread suggestions
    const suggestions = await aiService.generateThreadSuggestions(content, aiResult.message.content, threadId, conversationId);

    res.json({
      success: true,
      userMessage,
      aiMessage: {
        ...aiResult.message,
        id: aiMessage.id,
        created_at: aiMessage.created_at
      },
      suggestions,
      usage: {
        tokensUsed: aiResult.tokensUsed,
        costUsd: aiResult.costUsd,
        model: aiResult.model
      },
      contextUsed: aiResult.contextUsed
    });

  } catch (error) {
    winston.error('Error sending message:', error);
    res.status(500).json({ 
      error: 'Failed to send message',
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