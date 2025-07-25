import { chatAPI } from './api';

class CollaborationService {
  constructor() {
    this.socket = null;
    this.activeUsers = new Map();
    this.collaborators = new Map();
    this.invitations = new Map();
    this.presenceInterval = null;
  }

  // Initialize collaboration service
  async initialize(userId, userName) {
    this.userId = userId;
    this.userName = userName;
    
    // Start presence updates
    this.startPresenceUpdates();
    
    // Initialize WebSocket connection for real-time collaboration
    this.initializeWebSocket();
  }

  // Initialize WebSocket connection
  initializeWebSocket() {
    try {
      // In a real implementation, you'd connect to your WebSocket server
      // For now, we'll simulate real-time updates
      console.log('Collaboration WebSocket initialized');
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }

  // Start presence updates
  startPresenceUpdates() {
    // Temporarily disable presence updates to prevent infinite loops
    console.log('Presence updates interval disabled');
    return;
    
    // Original code (commented out):
    // this.presenceInterval = setInterval(() => {
    //   this.updatePresence();
    // }, 30000); // Update every 30 seconds
  }

  // Update user presence
  async updatePresence(threadId = null) {
    try {
      // Temporarily disable presence updates to prevent infinite loops
      console.log('Presence updates temporarily disabled');
      return;
      
      // Original code (commented out):
      // await chatAPI.post('/collaboration/presence/update', {
      //   userId: this.userId,
      //   userName: this.userName,
      //   threadId,
      //   status: 'active'
      // });
    } catch (error) {
      console.error('Failed to update presence:', error);
    }
  }

  // Send invitation
  async sendInvitation(invitationData) {
    try {
      const response = await chatAPI.post('/collaboration/invitations/send', {
        email: invitationData.email,
        name: invitationData.name,
        role: invitationData.role,
        threadId: invitationData.threadId,
        invitedBy: this.userName,
        message: invitationData.message
      });

      if (response.success) {
        // Store invitation locally
        this.invitations.set(response.invitation.id, response.invitation);
        return response.invitation;
      }
    } catch (error) {
      console.error('Failed to send invitation:', error);
      throw new Error('Failed to send invitation');
    }
  }

  // Get thread collaborators
  async getThreadCollaborators(threadId) {
    try {
      // Temporarily disable collaborator fetching to prevent infinite loops
      console.log('Collaborator fetching temporarily disabled');
      return [];
      
      // Original code (commented out):
      // const response = await chatAPI.get(`/collaboration/threads/${threadId}/collaborators`);
      // return response.collaborators;
    } catch (error) {
      console.error('Failed to get collaborators:', error);
      return [];
    }
  }

  // Get active users for a thread
  async getActiveUsers(threadId) {
    try {
      // Temporarily disable active users fetching to prevent infinite loops
      console.log('Active users fetching temporarily disabled');
      return [];
      
      // Original code (commented out):
      // const response = await chatAPI.get(`/collaboration/threads/${threadId}/active-users`);
      // return response.activeUsers;
    } catch (error) {
      console.error('Failed to get active users:', error);
      return [];
    }
  }

  // Accept invitation
  async acceptInvitation(invitationId) {
    try {
      const response = await chatAPI.put(`/collaboration/invitations/${invitationId}/accept`, {
        userId: this.userId,
        userName: this.userName
      });

      if (response.success) {
        // Add to local collaborators
        this.collaborators.set(response.collaborator.id, response.collaborator);
        return response.collaborator;
      }
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      throw new Error('Failed to accept invitation');
    }
  }

  // Get invitation details
  async getInvitation(invitationId) {
    try {
      const response = await chatAPI.get(`/collaboration/invitations/${invitationId}`);
      return response.invitation;
    } catch (error) {
      console.error('Failed to get invitation:', error);
      return null;
    }
  }

  // Remove collaborator
  async removeCollaborator(threadId, collaboratorId) {
    try {
      await chatAPI.delete(`/collaboration/threads/${threadId}/collaborators/${collaboratorId}`);
      
      // Remove from local storage
      this.collaborators.delete(collaboratorId);
      
      return true;
    } catch (error) {
      console.error('Failed to remove collaborator:', error);
      return false;
    }
  }

  // Send real-time message to collaborators
  async sendCollaborationMessage(threadId, message) {
    try {
      // In a real implementation, this would send via WebSocket
      console.log('Sending collaboration message:', { threadId, message });
      
      // Simulate real-time update
      setTimeout(() => {
        this.onCollaborationMessage?.(threadId, message);
      }, 100);
      
      return true;
    } catch (error) {
      console.error('Failed to send collaboration message:', error);
      return false;
    }
  }

  // Set up collaboration message handler
  onCollaborationMessage(threadId, message) {
    // This will be called when collaboration messages are received
    console.log('Collaboration message received:', { threadId, message });
  }

  // Cleanup
  cleanup() {
    if (this.presenceInterval) {
      clearInterval(this.presenceInterval);
    }
    
    if (this.socket) {
      this.socket.close();
    }
  }
}

export const collaborationService = new CollaborationService(); 