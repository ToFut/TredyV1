const { Server } = require('socket.io');
const Redis = require('ioredis');
const winston = require('winston');
const db = require('./database');

class SocketManager {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true
      }
      // Temporarily disabled Redis adapter to get backend running
      // adapter: require('socket.io-redis')({
      //   host: process.env.REDIS_HOST || 'redis',
      //   port: process.env.REDIS_PORT || 6379
      // })
    });

    // Temporarily disable Redis connection to get backend running
    // this.redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379');
    this.redis = null;
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // In a real app, you'd verify JWT here
        // For now, we'll use a simple token check
        const user = await this.verifyToken(token);
        if (!user) {
          return next(new Error('Invalid token'));
        }

        socket.userId = user.id;
        socket.user = user;
        next();
      } catch (error) {
        winston.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  async verifyToken(token) {
    // Simple token verification - in production, use JWT
    try {
      // For demo purposes, accept any token
      // In production, verify JWT signature
      return {
        id: 'user-' + Math.random().toString(36).substr(2, 9),
        name: 'Demo User',
        email: 'demo@flowchat.com'
      };
    } catch (error) {
      return null;
    }
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      winston.info(`User connected: ${socket.userId}`);

      // Join user to their personal room
      socket.join(`user_${socket.userId}`);

      socket.on('join_conversation', async (conversationId) => {
        try {
          // Check permissions
          const hasAccess = await this.checkConversationAccess(socket.userId, conversationId);
          if (!hasAccess) {
            socket.emit('error', { message: 'Access denied to conversation' });
            return;
          }

          socket.join(`conversation_${conversationId}`);
          
          // Update presence
          await this.updateUserPresence(socket.userId, conversationId, 'online');
          
          // Broadcast user joined
          socket.to(`conversation_${conversationId}`).emit('user_joined', {
            userId: socket.userId,
            user: socket.user,
            timestamp: Date.now()
          });

          winston.info(`User ${socket.userId} joined conversation ${conversationId}`);
        } catch (error) {
          winston.error('Error joining conversation:', error);
          socket.emit('error', { message: 'Failed to join conversation' });
        }
      });

      socket.on('join_thread', async (threadId) => {
        try {
          const hasAccess = await this.checkThreadAccess(socket.userId, threadId);
          if (!hasAccess) {
            socket.emit('error', { message: 'Access denied to thread' });
            return;
          }

          socket.join(`thread_${threadId}`);
          
          // Send current thread participants
          const participants = await this.getThreadParticipants(threadId);
          socket.emit('thread_participants', participants);

          winston.info(`User ${socket.userId} joined thread ${threadId}`);
        } catch (error) {
          winston.error('Error joining thread:', error);
          socket.emit('error', { message: 'Failed to join thread' });
        }
      });

      socket.on('typing', (data) => {
        try {
          socket.to(`thread_${data.threadId}`).emit('user_typing', {
            userId: socket.userId,
            user: socket.user,
            isTyping: data.isTyping,
            timestamp: Date.now()
          });
        } catch (error) {
          winston.error('Error handling typing event:', error);
        }
      });

      socket.on('message_sent', async (data) => {
        try {
          // Broadcast to thread participants
          socket.to(`thread_${data.threadId}`).emit('new_message', {
            messageId: data.messageId,
            threadId: data.threadId,
            content: data.content,
            sender: socket.user,
            timestamp: Date.now()
          });

          // Update thread activity
          await this.updateThreadActivity(data.threadId);
        } catch (error) {
          winston.error('Error handling message sent:', error);
        }
      });

      socket.on('thread_created', async (data) => {
        try {
          // Broadcast to conversation participants
          socket.to(`conversation_${data.conversationId}`).emit('thread_created', {
            threadId: data.threadId,
            title: data.title,
            creator: socket.user,
            timestamp: Date.now()
          });
        } catch (error) {
          winston.error('Error handling thread created:', error);
        }
      });

      socket.on('disconnect', async () => {
        try {
          // Update presence to offline
          await this.updateUserPresence(socket.userId, null, 'offline');
          
          // Broadcast user left to all their conversations
          const userConversations = await this.getUserConversations(socket.userId);
          userConversations.forEach(convId => {
            socket.to(`conversation_${convId}`).emit('user_left', {
              userId: socket.userId,
              user: socket.user,
              timestamp: Date.now()
            });
          });

          winston.info(`User disconnected: ${socket.userId}`);
        } catch (error) {
          winston.error('Error handling disconnect:', error);
        }
      });
    });
  }

  async checkConversationAccess(userId, conversationId) {
    try {
      // In a real app, check database permissions
      // For demo, allow all access
      return true;
    } catch (error) {
      winston.error('Error checking conversation access:', error);
      return false;
    }
  }

  async checkThreadAccess(userId, threadId) {
    try {
      // In a real app, check database permissions
      // For demo, allow all access
      return true;
    } catch (error) {
      winston.error('Error checking thread access:', error);
      return false;
    }
  }

  async updateUserPresence(userId, conversationId, status) {
    try {
      // Temporarily disabled Redis operations
      // const presenceKey = `presence:user:${userId}`;
      // await this.redis.hset(presenceKey, {
      //   status,
      //   conversationId: conversationId || '',
      //   lastSeen: Date.now()
      // });
      
      // // Expire after 5 minutes of inactivity
      // await this.redis.expire(presenceKey, 300);
    } catch (error) {
      winston.error('Error updating user presence:', error);
    }
  }

  async getThreadParticipants(threadId) {
    try {
      // In a real app, query database for thread participants
      // For demo, return mock data
      return [
        {
          id: 'user-1',
          name: 'Demo User 1',
          status: 'online',
          lastSeen: Date.now()
        },
        {
          id: 'user-2', 
          name: 'Demo User 2',
          status: 'away',
          lastSeen: Date.now() - 300000
        }
      ];
    } catch (error) {
      winston.error('Error getting thread participants:', error);
      return [];
    }
  }

  async getUserConversations(userId) {
    try {
      // In a real app, query database for user conversations
      // For demo, return mock data
      return ['conversation-1', 'conversation-2'];
    } catch (error) {
      winston.error('Error getting user conversations:', error);
      return [];
    }
  }

  async updateThreadActivity(threadId) {
    try {
      // Update thread last activity in database
      await db.query(
        'UPDATE threads SET last_activity_at = NOW() WHERE id = $1',
        [threadId]
      );
    } catch (error) {
      winston.error('Error updating thread activity:', error);
    }
  }

  // Broadcast to all connected clients
  broadcast(event, data) {
    this.io.emit(event, data);
  }

  // Broadcast to specific room
  broadcastToRoom(room, event, data) {
    this.io.to(room).emit(event, data);
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.io.engine.clientsCount;
  }

  // Get room participants
  getRoomParticipants(room) {
    const roomSockets = this.io.sockets.adapter.rooms.get(room);
    return roomSockets ? roomSockets.size : 0;
  }
}

module.exports = SocketManager; 