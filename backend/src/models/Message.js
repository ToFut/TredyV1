const db = require('../lib/database');
const { v4: uuidv4 } = require('uuid');

class Message {
  static async create(data) {
    const {
      threadId,
      conversationId,
      userId,
      content,
      messageType = 'user',
      aiModel = null,
      tokensUsed = null,
      costUsd = null,
      metadata = {}
    } = data;

    try {
      const messageId = uuidv4();
      const query = `
        INSERT INTO messages (
          id, thread_id, conversation_id, user_id, content, 
          message_type, ai_model, tokens_used, cost_usd, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const result = await db.query(query, [
        messageId,
        threadId,
        conversationId,
        userId,
        content,
        messageType,
        aiModel,
        tokensUsed,
        costUsd,
        JSON.stringify(metadata)
      ]);

      // Update thread activity
      if (threadId) {
        await this.updateThreadActivity(threadId);
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create message: ${error.message}`);
    }
  }

  static async findById(messageId) {
    const query = `
      SELECT m.*, 
             u.name as user_name,
             u.email as user_email,
             t.title as thread_title
      FROM messages m
      LEFT JOIN users u ON m.user_id = u.id
      LEFT JOIN threads t ON m.thread_id = t.id
      WHERE m.id = $1
    `;

    const result = await db.query(query, [messageId]);
    return result.rows[0] || null;
  }

  static async findByThread(threadId, options = {}) {
    const { limit = 50, offset = 0, orderBy = 'created_at DESC' } = options;

    const query = `
      SELECT m.*, 
             u.name as user_name,
             u.email as user_email
      FROM messages m
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.thread_id = $1
      ORDER BY m.${orderBy}
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [threadId, limit, offset]);
    return result.rows;
  }

  static async findByConversation(conversationId, options = {}) {
    const { limit = 100, offset = 0, threadId = null } = options;

    let query = `
      SELECT m.*, 
             u.name as user_name,
             u.email as user_email,
             t.title as thread_title
      FROM messages m
      LEFT JOIN users u ON m.user_id = u.id
      LEFT JOIN threads t ON m.thread_id = t.id
      WHERE m.conversation_id = $1
    `;

    const params = [conversationId];
    let paramCount = 2;

    if (threadId) {
      query += ` AND m.thread_id = $${paramCount}`;
      params.push(threadId);
      paramCount++;
    }

    query += ` ORDER BY m.created_at ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return result.rows;
  }

  static async search(conversationId, searchTerm, options = {}) {
    const { limit = 50, offset = 0 } = options;

    const query = `
      SELECT m.*, 
             u.name as user_name,
             u.email as user_email,
             t.title as thread_title,
             ts_rank(m.search_vector, plainto_tsquery('english', $2)) as rank
      FROM messages m
      LEFT JOIN users u ON m.user_id = u.id
      LEFT JOIN threads t ON m.thread_id = t.id
      WHERE m.conversation_id = $1
        AND m.search_vector @@ plainto_tsquery('english', $2)
      ORDER BY rank DESC, m.created_at DESC
      LIMIT $3 OFFSET $4
    `;

    const result = await db.query(query, [conversationId, searchTerm, limit, offset]);
    return result.rows;
  }

  static async update(messageId, updates) {
    const allowedFields = ['content', 'metadata'];
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    for (const [field, value] of Object.entries(updates)) {
      if (allowedFields.includes(field)) {
        if (field === 'metadata') {
          updateFields.push(`${field} = $${paramCount}`);
          values.push(JSON.stringify(value));
        } else {
          updateFields.push(`${field} = $${paramCount}`);
          values.push(value);
        }
        paramCount++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(messageId);

    const query = `
      UPDATE messages 
      SET ${updateFields.join(', ')},
          updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async delete(messageId) {
    const query = `
      DELETE FROM messages 
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(query, [messageId]);
    return result.rows[0];
  }

  static async getStats(conversationId) {
    const query = `
      SELECT 
        COUNT(*) as total_messages,
        COUNT(CASE WHEN message_type = 'user' THEN 1 END) as user_messages,
        COUNT(CASE WHEN message_type = 'ai' THEN 1 END) as ai_messages,
        COUNT(CASE WHEN message_type = 'system' THEN 1 END) as system_messages,
        SUM(tokens_used) as total_tokens,
        SUM(cost_usd) as total_cost,
        AVG(LENGTH(content)) as avg_message_length,
        MAX(created_at) as last_message_at
      FROM messages
      WHERE conversation_id = $1
    `;

    const result = await db.query(query, [conversationId]);
    return result.rows[0];
  }

  static async getThreadStats(threadId) {
    const query = `
      SELECT 
        COUNT(*) as total_messages,
        COUNT(CASE WHEN message_type = 'user' THEN 1 END) as user_messages,
        COUNT(CASE WHEN message_type = 'ai' THEN 1 END) as ai_messages,
        SUM(tokens_used) as total_tokens,
        SUM(cost_usd) as total_cost,
        AVG(LENGTH(content)) as avg_message_length,
        MAX(created_at) as last_message_at
      FROM messages
      WHERE thread_id = $1
    `;

    const result = await db.query(query, [threadId]);
    return result.rows[0];
  }

  static async getAIUsageStats(conversationId, timeRange = '30 days') {
    const query = `
      SELECT 
        DATE(created_at) as date,
        ai_model,
        COUNT(*) as message_count,
        SUM(tokens_used) as total_tokens,
        SUM(cost_usd) as total_cost
      FROM messages
      WHERE conversation_id = $1
        AND message_type = 'ai'
        AND created_at >= NOW() - INTERVAL '${timeRange}'
      GROUP BY DATE(created_at), ai_model
      ORDER BY date DESC, total_cost DESC
    `;

    const result = await db.query(query, [conversationId]);
    return result.rows;
  }

  static async getRecentMessages(conversationId, limit = 10) {
    const query = `
      SELECT m.*, 
             u.name as user_name,
             u.email as user_email,
             t.title as thread_title
      FROM messages m
      LEFT JOIN users u ON m.user_id = u.id
      LEFT JOIN threads t ON m.thread_id = t.id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at DESC
      LIMIT $2
    `;

    const result = await db.query(query, [conversationId, limit]);
    return result.rows;
  }

  static async updateThreadActivity(threadId) {
    const query = `
      UPDATE threads 
      SET last_activity_at = NOW(),
          message_count = (
            SELECT COUNT(*) FROM messages WHERE thread_id = $1
          )
      WHERE id = $1
    `;

    await db.query(query, [threadId]);
  }

  static async getConversationContext(conversationId, limit = 20) {
    const query = `
      SELECT m.content, m.message_type, m.created_at
      FROM messages m
      WHERE m.conversation_id = $1
        AND m.thread_id IS NULL
      ORDER BY m.created_at DESC
      LIMIT $2
    `;

    const result = await db.query(query, [conversationId, limit]);
    return result.rows.reverse(); // Return in chronological order
  }

  static async getThreadContext(threadId, limit = 10) {
    const query = `
      SELECT m.content, m.message_type, m.created_at
      FROM messages m
      WHERE m.thread_id = $1
      ORDER BY m.created_at DESC
      LIMIT $2
    `;

    const result = await db.query(query, [threadId, limit]);
    return result.rows.reverse(); // Return in chronological order
  }
}

module.exports = Message; 