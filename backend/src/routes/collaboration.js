const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');

// In-memory storage for invitations and collaborators (in production, use database)
const invitations = new Map();
const collaborators = new Map();
const activeUsers = new Map();

// Email configuration (you'll need to set up your email service)
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send invitation email
const sendInvitationEmail = async (invitation) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: invitation.email,
    subject: `You've been invited to collaborate on FlowChat`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">FlowChat Collaboration Invitation</h2>
        <p>Hello ${invitation.name},</p>
        <p>You've been invited to collaborate on a FlowChat thread.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Thread Details:</h3>
          <p><strong>Thread ID:</strong> ${invitation.threadId}</p>
          <p><strong>Role:</strong> ${invitation.role}</p>
          <p><strong>Invited by:</strong> ${invitation.invitedBy}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/accept-invitation/${invitation.id}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          This invitation will expire in 7 days.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

// Send invitation
router.post('/invitations/send', async (req, res) => {
  try {
    const { email, name, role, threadId, invitedBy, message } = req.body;

    if (!email || !threadId) {
      return res.status(400).json({ error: 'Email and threadId are required' });
    }

    const invitationId = uuidv4();
    const invitation = {
      id: invitationId,
      email,
      name: name || email.split('@')[0],
      role: role || 'contributor',
      threadId,
      invitedBy: invitedBy || 'Anonymous',
      message: message || '',
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };

    invitations.set(invitationId, invitation);

    // Send email invitation
    const emailSent = await sendInvitationEmail(invitation);
    
    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send invitation email' });
    }

    res.json({
      success: true,
      invitation: {
        id: invitationId,
        email: invitation.email,
        name: invitation.name,
        role: invitation.role,
        status: invitation.status,
        createdAt: invitation.createdAt
      }
    });
  } catch (error) {
    console.error('Send invitation error:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

// Get thread collaborators
router.get('/threads/:threadId/collaborators', (req, res) => {
  try {
    const { threadId } = req.params;
    const threadCollaborators = Array.from(collaborators.values())
      .filter(c => c.threadId === threadId);

    res.json({
      collaborators: threadCollaborators,
      count: threadCollaborators.length
    });
  } catch (error) {
    console.error('Get collaborators error:', error);
    res.status(500).json({ error: 'Failed to get collaborators' });
  }
});

// Accept invitation
router.put('/invitations/:invitationId/accept', (req, res) => {
  try {
    const { invitationId } = req.params;
    const { userId, userName } = req.body;

    const invitation = invitations.get(invitationId);
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: 'Invitation already processed' });
    }

    if (new Date() > invitation.expiresAt) {
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    // Create collaborator
    const collaboratorId = uuidv4();
    const collaborator = {
      id: collaboratorId,
      userId: userId || uuidv4(),
      email: invitation.email,
      name: invitation.name,
      role: invitation.role,
      threadId: invitation.threadId,
      permissions: {
        canInvite: invitation.role === 'moderator',
        canModerate: invitation.role === 'moderator',
        canExport: true
      },
      joinedAt: new Date(),
      status: 'active'
    };

    collaborators.set(collaboratorId, collaborator);
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();

    res.json({
      success: true,
      collaborator: {
        id: collaboratorId,
        name: collaborator.name,
        role: collaborator.role,
        threadId: collaborator.threadId,
        joinedAt: collaborator.joinedAt
      }
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

// Get invitation details
router.get('/invitations/:invitationId', (req, res) => {
  try {
    const { invitationId } = req.params;
    const invitation = invitations.get(invitationId);

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    res.json({ invitation });
  } catch (error) {
    console.error('Get invitation error:', error);
    res.status(500).json({ error: 'Failed to get invitation' });
  }
});

// Update user presence
router.post('/presence/update', (req, res) => {
  try {
    const { userId, userName, threadId, status } = req.body;
    
    const userKey = `${userId}-${threadId}`;
    activeUsers.set(userKey, {
      userId,
      userName,
      threadId,
      status: status || 'active',
      lastSeen: new Date()
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Update presence error:', error);
    res.status(500).json({ error: 'Failed to update presence' });
  }
});

// Get active users for a thread
router.get('/threads/:threadId/active-users', (req, res) => {
  try {
    const { threadId } = req.params;
    const threadActiveUsers = Array.from(activeUsers.values())
      .filter(user => user.threadId === threadId && user.status === 'active');

    res.json({ activeUsers: threadActiveUsers });
  } catch (error) {
    console.error('Get active users error:', error);
    res.status(500).json({ error: 'Failed to get active users' });
  }
});

// Remove collaborator
router.delete('/threads/:threadId/collaborators/:collaboratorId', (req, res) => {
  try {
    const { threadId, collaboratorId } = req.params;
    
    const collaborator = collaborators.get(collaboratorId);
    if (!collaborator || collaborator.threadId !== threadId) {
      return res.status(404).json({ error: 'Collaborator not found' });
    }

    collaborators.delete(collaboratorId);
    res.json({ success: true });
  } catch (error) {
    console.error('Remove collaborator error:', error);
    res.status(500).json({ error: 'Failed to remove collaborator' });
  }
});

module.exports = router; 