const db = require('../lib/database');
const { v4: uuidv4 } = require('uuid');

class Thread {
  static async create(data) {
    const {
      conversationId,
      parentThreadId,
      selectedText,
      creatorId,
      title,
      contextSummary
    } = data;

    try {
      // Generate thread path using LTREE
      const threadPath = await this.generateThreadPath(parentThreadId);
      const depth = threadPath.split('.').length - 1;

      const query = `
        INSERT INTO threads (
          id, conversation_id, parent_thread_id, creator_id, 
          title, selected_text, context_summary, thread_path, depth
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const threadId = uuidv4();
      const result = await db.query(query, [
        threadId,
        conversationId,
        parentThreadId,
        creatorId,
        title,
        selectedText,
        contextSummary,
        threadPath,
        depth
      ]);

      // Update parent thread message count if it exists
      if (parentThreadId) {
        await this.incrementMessageCount(parentThreadId);
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create thread: ${error.message}`);
    }
  }

  static async generateThreadPath(parentThreadId) {
    if (!parentThreadId) {
      // Root thread - generate new path
      const result = await db.query(
        'SELECT COUNT(*) as count FROM threads WHERE parent_thread_id IS NULL'
      );
      const count = parseInt(result.rows[0].count) + 1;
      return count.toString().padStart(3, '0');
    } else {
      // Sub-thread - append to parent path
      const parentResult = await db.query(
        'SELECT thread_path FROM threads WHERE id = $1',
        [parentThreadId]
      );

      if (parentResult.rows.length === 0) {
        throw new Error('Parent thread not found');
      }

      const parentPath = parentResult.rows[0].thread_path;
      const siblingCount = await this.getSiblingCount(parentThreadId);
      const newPath = `${parentPath}.${(siblingCount + 1).toString().padStart(3, '0')}`;
      
      return newPath;
    }
  }

  static async getSiblingCount(parentThreadId) {
    const result = await db.query(
      'SELECT COUNT(*) as count FROM threads WHERE parent_thread_id = $1',
      [parentThreadId]
    );
    return parseInt(result.rows[0].count);
  }

  static async findById(threadId) {
    const query = `
      SELECT t.*, 
             u.name as creator_name,
             u.email as creator_email,
             COUNT(m.id) as message_count
      FROM threads t
      LEFT JOIN users u ON t.creator_id = u.id
      LEFT JOIN messages m ON t.id = m.thread_id
      WHERE t.id = $1
      GROUP BY t.id, u.name, u.email
    `;

    const result = await db.query(query, [threadId]);
    return result.rows[0] || null;
  }

  static async findByConversation(conversationId) {
    const query = `
      SELECT t.*, 
             u.name as creator_name,
             u.email as creator_email,
             COUNT(m.id) as message_count
      FROM threads t
      LEFT JOIN users u ON t.creator_id = u.id
      LEFT JOIN messages m ON t.id = m.thread_id
      WHERE t.conversation_id = $1
      GROUP BY t.id, u.name, u.email
      ORDER BY t.thread_path
    `;

    const result = await db.query(query, [conversationId]);
    return result.rows;
  }

  static async findHierarchy(conversationId) {
    const query = `
      SELECT t.*, 
             u.name as creator_name,
             u.email as creator_email,
             COUNT(m.id) as message_count,
             nlevel(t.thread_path) as level
      FROM threads t
      LEFT JOIN users u ON t.creator_id = u.id
      LEFT JOIN messages m ON t.id = m.thread_id
      WHERE t.conversation_id = $1
      GROUP BY t.id, u.name, u.email
      ORDER BY t.thread_path
    `;

    const result = await db.query(query, [conversationId]);
    return this.buildHierarchyTree(result.rows);
  }

  static buildHierarchyTree(flatThreads) {
    const threadMap = new Map();
    const rootThreads = [];

    // Create thread objects with children arrays
    flatThreads.forEach(thread => {
      threadMap.set(thread.id, { ...thread, children: [] });
    });

    // Build hierarchy
    flatThreads.forEach(thread => {
      if (thread.parent_thread_id) {
        const parent = threadMap.get(thread.parent_thread_id);
        if (parent) {
          parent.children.push(threadMap.get(thread.id));
        }
      } else {
        rootThreads.push(threadMap.get(thread.id));
      }
    });

    return rootThreads;
  }

  static async findChildren(threadId) {
    const query = `
      SELECT t.*, 
             u.name as creator_name,
             u.email as creator_email,
             COUNT(m.id) as message_count
      FROM threads t
      LEFT JOIN users u ON t.creator_id = u.id
      LEFT JOIN messages m ON t.id = m.thread_id
      WHERE t.parent_thread_id = $1
      GROUP BY t.id, u.name, u.email
      ORDER BY t.thread_path
    `;

    const result = await db.query(query, [threadId]);
    return result.rows;
  }

  static async findSiblings(threadId) {
    const query = `
      SELECT t.*, 
             u.name as creator_name,
             u.email as creator_email,
             COUNT(m.id) as message_count
      FROM threads t
      LEFT JOIN users u ON t.creator_id = u.id
      LEFT JOIN messages m ON t.id = m.thread_id
      WHERE t.parent_thread_id = (
        SELECT parent_thread_id FROM threads WHERE id = $1
      )
      AND t.id != $1
      GROUP BY t.id, u.name, u.email
      ORDER BY t.thread_path
    `;

    const result = await db.query(query, [threadId]);
    return result.rows;
  }

  static async update(threadId, updates) {
    const allowedFields = ['title', 'selected_text', 'context_summary', 'status'];
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    for (const [field, value] of Object.entries(updates)) {
      if (allowedFields.includes(field)) {
        updateFields.push(`${field} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    updateFields.push('updated_at = NOW()');
    values.push(threadId);

    const query = `
      UPDATE threads 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async incrementMessageCount(threadId) {
    const query = `
      UPDATE threads 
      SET message_count = message_count + 1,
          last_activity_at = NOW()
      WHERE id = $1
    `;

    await db.query(query, [threadId]);
  }

  static async delete(threadId) {
    // Soft delete - mark as deleted
    const query = `
      UPDATE threads 
      SET deleted_at = NOW(),
          status = 'deleted'
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(query, [threadId]);
    return result.rows[0];
  }

  static async search(conversationId, searchTerm) {
    const query = `
      SELECT t.*, 
             u.name as creator_name,
             u.email as creator_email,
             COUNT(m.id) as message_count
      FROM threads t
      LEFT JOIN users u ON t.creator_id = u.id
      LEFT JOIN messages m ON t.id = m.thread_id
      WHERE t.conversation_id = $1
        AND (t.title ILIKE $2 OR t.selected_text ILIKE $2 OR t.context_summary ILIKE $2)
        AND t.deleted_at IS NULL
      GROUP BY t.id, u.name, u.email
      ORDER BY t.last_activity_at DESC
    `;

    const result = await db.query(query, [conversationId, `%${searchTerm}%`]);
    return result.rows;
  }

  static async getStats(conversationId) {
    const query = `
      SELECT 
        COUNT(*) as total_threads,
        COUNT(CASE WHEN parent_thread_id IS NULL THEN 1 END) as root_threads,
        COUNT(CASE WHEN parent_thread_id IS NOT NULL THEN 1 END) as sub_threads,
        AVG(depth) as avg_depth,
        MAX(depth) as max_depth,
        SUM(message_count) as total_messages
      FROM threads
      WHERE conversation_id = $1 AND deleted_at IS NULL
    `;

    const result = await db.query(query, [conversationId]);
    return result.rows[0];
  }
}

module.exports = Thread; 