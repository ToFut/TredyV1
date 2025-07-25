const express = require('express');
const { body, validationResult } = require('express-validator');
const winston = require('winston');
const Thread = require('../models/Thread');
const Message = require('../models/Message');

const router = express.Router();

// Validation middleware
const validateThread = [
  body('conversationId').isUUID().withMessage('Invalid conversation ID'),
  body('title').optional().isLength({ min: 1, max: 500 }).withMessage('Title must be between 1 and 500 characters'),
  body('selectedText').optional().isLength({ min: 1, max: 1000 }).withMessage('Selected text must be between 1 and 1000 characters'),
  body('parentThreadId').optional().isUUID().withMessage('Invalid parent thread ID'),
  body('contextSummary').optional().isLength({ min: 1, max: 2000 }).withMessage('Context summary must be between 1 and 2000 characters'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Create new thread
router.post('/', validateThread, async (req, res) => {
  try {
    const { conversationId, title, selectedText, parentThreadId, contextSummary } = req.body;
    const creatorId = req.user?.id || 'demo-user'; // In production, get from auth middleware

    const thread = await Thread.create({
      conversationId,
      parentThreadId,
      selectedText,
      creatorId,
      title,
      contextSummary
    });

    res.status(201).json({
      success: true,
      thread
    });

  } catch (error) {
    winston.error('Error creating thread:', error);
    res.status(500).json({ 
      error: 'Failed to create thread',
      message: error.message 
    });
  }
});

// Get thread by ID
router.get('/:threadId', async (req, res) => {
  try {
    const { threadId } = req.params;

    const thread = await Thread.findById(threadId);
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    res.json({
      success: true,
      thread
    });

  } catch (error) {
    winston.error('Error fetching thread:', error);
    res.status(500).json({ 
      error: 'Failed to fetch thread',
      message: error.message 
    });
  }
});

// Get thread hierarchy for conversation
router.get('/hierarchy/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;

    const hierarchy = await Thread.findHierarchy(conversationId);

    res.json({
      success: true,
      hierarchy
    });

  } catch (error) {
    winston.error('Error fetching thread hierarchy:', error);
    res.status(500).json({ 
      error: 'Failed to fetch thread hierarchy',
      message: error.message 
    });
  }
});

// Get all threads for conversation
router.get('/conversation/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;

    const threads = await Thread.findByConversation(conversationId);

    res.json({
      success: true,
      threads
    });

  } catch (error) {
    winston.error('Error fetching conversation threads:', error);
    res.status(500).json({ 
      error: 'Failed to fetch conversation threads',
      message: error.message 
    });
  }
});

// Get thread children
router.get('/:threadId/children', async (req, res) => {
  try {
    const { threadId } = req.params;

    const children = await Thread.findChildren(threadId);

    res.json({
      success: true,
      children
    });

  } catch (error) {
    winston.error('Error fetching thread children:', error);
    res.status(500).json({ 
      error: 'Failed to fetch thread children',
      message: error.message 
    });
  }
});

// Get thread siblings
router.get('/:threadId/siblings', async (req, res) => {
  try {
    const { threadId } = req.params;

    const siblings = await Thread.findSiblings(threadId);

    res.json({
      success: true,
      siblings
    });

  } catch (error) {
    winston.error('Error fetching thread siblings:', error);
    res.status(500).json({ 
      error: 'Failed to fetch thread siblings',
      message: error.message 
    });
  }
});

// Update thread
router.put('/:threadId', [
  body('title').optional().isLength({ min: 1, max: 500 }).withMessage('Title must be between 1 and 500 characters'),
  body('selectedText').optional().isLength({ min: 1, max: 1000 }).withMessage('Selected text must be between 1 and 1000 characters'),
  body('contextSummary').optional().isLength({ min: 1, max: 2000 }).withMessage('Context summary must be between 1 and 2000 characters'),
  body('status').optional().isIn(['active', 'resolved', 'archived']).withMessage('Invalid status'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
], async (req, res) => {
  try {
    const { threadId } = req.params;
    const updates = req.body;

    const thread = await Thread.update(threadId, updates);
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    res.json({
      success: true,
      thread
    });

  } catch (error) {
    winston.error('Error updating thread:', error);
    res.status(500).json({ 
      error: 'Failed to update thread',
      message: error.message 
    });
  }
});

// Delete thread (soft delete)
router.delete('/:threadId', async (req, res) => {
  try {
    const { threadId } = req.params;

    const thread = await Thread.delete(threadId);
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    res.json({
      success: true,
      message: 'Thread deleted successfully'
    });

  } catch (error) {
    winston.error('Error deleting thread:', error);
    res.status(500).json({ 
      error: 'Failed to delete thread',
      message: error.message 
    });
  }
});

// Search threads
router.get('/search/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { q: searchTerm } = req.query;

    if (!searchTerm) {
      return res.status(400).json({ error: 'Search term is required' });
    }

    const threads = await Thread.search(conversationId, searchTerm);

    res.json({
      success: true,
      threads,
      searchTerm
    });

  } catch (error) {
    winston.error('Error searching threads:', error);
    res.status(500).json({ 
      error: 'Failed to search threads',
      message: error.message 
    });
  }
});

// Get thread stats
router.get('/stats/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;

    const stats = await Thread.getStats(conversationId);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    winston.error('Error fetching thread stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch thread stats',
      message: error.message 
    });
  }
});

// Get thread with messages
router.get('/:threadId/with-messages', async (req, res) => {
  try {
    const { threadId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const thread = await Thread.findById(threadId);
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const messages = await Message.findByThread(threadId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      thread,
      messages,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: messages.length
      }
    });

  } catch (error) {
    winston.error('Error fetching thread with messages:', error);
    res.status(500).json({ 
      error: 'Failed to fetch thread with messages',
      message: error.message 
    });
  }
});

// Get thread path (breadcrumb navigation)
router.get('/:threadId/path', async (req, res) => {
  try {
    const { threadId } = req.params;

    const thread = await Thread.findById(threadId);
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    // Build breadcrumb path
    const path = [];
    let currentThread = thread;

    while (currentThread) {
      path.unshift({
        id: currentThread.id,
        title: currentThread.title || currentThread.selected_text || `Thread #${currentThread.id.slice(-4)}`,
        depth: currentThread.depth
      });

      if (currentThread.parent_thread_id) {
        currentThread = await Thread.findById(currentThread.parent_thread_id);
      } else {
        currentThread = null;
      }
    }

    res.json({
      success: true,
      path
    });

  } catch (error) {
    winston.error('Error fetching thread path:', error);
    res.status(500).json({ 
      error: 'Failed to fetch thread path',
      message: error.message 
    });
  }
});

// Get thread context summary
router.get('/:threadId/context', async (req, res) => {
  try {
    const { threadId } = req.params;

    const thread = await Thread.findById(threadId);
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const messages = await Message.findByThread(threadId, { limit: 10 });
    const stats = await Message.getThreadStats(threadId);

    const context = {
      thread,
      recentMessages: messages,
      stats,
      summary: {
        totalMessages: stats.total_messages,
        userMessages: stats.user_messages,
        aiMessages: stats.ai_messages,
        avgMessageLength: Math.round(stats.avg_message_length || 0),
        lastActivity: stats.last_message_at
      }
    };

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