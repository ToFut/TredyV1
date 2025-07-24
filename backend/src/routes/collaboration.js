const express = require('express');
const { body, validationResult } = require('express-validator');
const winston = require('winston');

const router = express.Router();

// Validation middleware
const validateCollaboration = [
  body('threadId').isUUID().withMessage('Invalid thread ID'),
  body('userId').isUUID().withMessage('Invalid user ID'),
  body('role').isIn(['viewer', 'editor', 'admin']).withMessage('Invalid role'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Add collaborator to thread
router.post('/invite', validateCollaboration, async (req, res) => {
  try {
    const { threadId, userId, role = 'viewer', permissions = {} } = req.body;
    const invitedBy = req.user?.id || 'demo-user';

    // In a real app, you'd save this to the database
    const collaboration = {
      id: 'collab-' + Math.random().toString(36).substr(2, 9),
      threadId,
      userId,
      role,
      permissions: {
        read: true,
        write: role === 'editor' || role === 'admin',
        invite: role === 'admin',
        ...permissions
      },
      invitedBy,
      joinedAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      collaboration
    });

  } catch (error) {
    winston.error('Error adding collaborator:', error);
    res.status(500).json({ 
      error: 'Failed to add collaborator',
      message: error.message 
    });
  }
});

// Get thread collaborators
router.get('/thread/:threadId/collaborators', async (req, res) => {
  try {
    const { threadId } = req.params;

    // Mock data - in real app, query database
    const collaborators = [
      {
        id: 'user-1',
        name: 'Demo User 1',
        email: 'user1@example.com',
        role: 'admin',
        joinedAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      },
      {
        id: 'user-2',
        name: 'Demo User 2', 
        email: 'user2@example.com',
        role: 'editor',
        joinedAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      collaborators
    });

  } catch (error) {
    winston.error('Error fetching collaborators:', error);
    res.status(500).json({ 
      error: 'Failed to fetch collaborators',
      message: error.message 
    });
  }
});

// Update collaborator role
router.put('/collaborator/:collaborationId', [
  body('role').isIn(['viewer', 'editor', 'admin']).withMessage('Invalid role'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
], async (req, res) => {
  try {
    const { collaborationId } = req.params;
    const { role, permissions } = req.body;

    // Mock update - in real app, update database
    const collaboration = {
      id: collaborationId,
      role,
      permissions: {
        read: true,
        write: role === 'editor' || role === 'admin',
        invite: role === 'admin',
        ...permissions
      },
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      collaboration
    });

  } catch (error) {
    winston.error('Error updating collaborator:', error);
    res.status(500).json({ 
      error: 'Failed to update collaborator',
      message: error.message 
    });
  }
});

// Remove collaborator
router.delete('/collaborator/:collaborationId', async (req, res) => {
  try {
    const { collaborationId } = req.params;

    // Mock deletion - in real app, delete from database
    res.json({
      success: true,
      message: 'Collaborator removed successfully'
    });

  } catch (error) {
    winston.error('Error removing collaborator:', error);
    res.status(500).json({ 
      error: 'Failed to remove collaborator',
      message: error.message 
    });
  }
});

// Get user's collaborations
router.get('/user/:userId/collaborations', async (req, res) => {
  try {
    const { userId } = req.params;

    // Mock data - in real app, query database
    const collaborations = [
      {
        threadId: 'thread-1',
        threadTitle: 'Machine Learning Basics',
        role: 'admin',
        joinedAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      },
      {
        threadId: 'thread-2',
        threadTitle: 'Neural Networks Deep Dive',
        role: 'editor',
        joinedAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      collaborations
    });

  } catch (error) {
    winston.error('Error fetching user collaborations:', error);
    res.status(500).json({ 
      error: 'Failed to fetch collaborations',
      message: error.message 
    });
  }
});

// Get thread activity
router.get('/thread/:threadId/activity', async (req, res) => {
  try {
    const { threadId } = req.params;

    // Mock activity data - in real app, query database
    const activity = [
      {
        type: 'message_sent',
        userId: 'user-1',
        userName: 'Demo User 1',
        timestamp: new Date().toISOString(),
        details: 'Sent a message'
      },
      {
        type: 'thread_created',
        userId: 'user-2',
        userName: 'Demo User 2',
        timestamp: new Date().toISOString(),
        details: 'Created a sub-thread'
      }
    ];

    res.json({
      success: true,
      activity
    });

  } catch (error) {
    winston.error('Error fetching thread activity:', error);
    res.status(500).json({ 
      error: 'Failed to fetch thread activity',
      message: error.message 
    });
  }
});

module.exports = router; 