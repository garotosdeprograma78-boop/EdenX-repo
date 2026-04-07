const pool = require('../config/database');

class Message {
  static async create(senderId, recipientId, messageText, mediaUrl = null, mediaType = null) {
    const query = `
      INSERT INTO messages (sender_id, recipient_id, message_text, media_url, media_type, created_at, is_read)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 0)
    `;
    try {
      const result = await pool.execute(query, [senderId, recipientId, messageText || null, mediaUrl, mediaType]);
      return result.insertId;
    } catch (error) {
      console.error('Erro ao criar mensagem:', error);
      throw error;
    }
  }

  static async getConversation(userId1, userId2, limit = 50, offset = 0) {
    const query = `
      SELECT m.*, 
        u1.username as sender_username, u1.avatar_url as sender_avatar,
        u2.username as recipient_username, u2.avatar_url as recipient_avatar
      FROM messages m
      JOIN users u1 ON m.sender_id = u1.id
      JOIN users u2 ON m.recipient_id = u2.id
      WHERE (m.sender_id = ? AND m.recipient_id = ?) 
        OR (m.sender_id = ? AND m.recipient_id = ?)
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `;
    try {
      const result = await pool.query(query, [userId1, userId2, userId2, userId1, limit, offset]);
      return (result.rows || []).reverse();
    } catch (error) {
      console.error('Erro ao buscar conversa:', error);
      return [];
    }
  }

  static async getUserConversations(userId, limit = 20) {
    const query = `
      SELECT 
        CASE 
          WHEN m.sender_id = ? THEN m.recipient_id 
          ELSE m.sender_id 
        END as other_user_id,
<<<<<<< HEAD
        u.username, u.avatar_url,
        m.message_text as last_message,
        m.created_at as last_message_time
=======
        u.id as user_id, u.username, u.avatar_url,
        (SELECT message_text FROM messages 
         WHERE (sender_id = ? AND recipient_id = u.id) 
           OR (sender_id = u.id AND recipient_id = ?)
         ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages 
         WHERE (sender_id = ? AND recipient_id = u.id) 
           OR (sender_id = u.id AND recipient_id = ?)
         ORDER BY created_at DESC LIMIT 1) as last_message_time
>>>>>>> 3aec31e56ffe2c4b1c2204f3b2812c660d4947a5
      FROM messages m
      JOIN users u ON (
        (m.sender_id = ? AND m.recipient_id = u.id) OR 
        (m.recipient_id = ? AND m.sender_id = u.id)
      )
      WHERE m.sender_id = ? OR m.recipient_id = ?
<<<<<<< HEAD
      ORDER BY m.created_at DESC
=======
      GROUP BY other_user_id, user_id, u.username, u.avatar_url, last_message, last_message_time
      ORDER BY last_message_time DESC
>>>>>>> 3aec31e56ffe2c4b1c2204f3b2812c660d4947a5
      LIMIT ?
    `;
    try {
      const result = await pool.query(query, [
        userId, userId, userId, userId, userId, limit
      ]);
      const rows = result.rows || [];

      const seen = new Set();
      const conversations = [];
      for (const row of rows) {
        if (!seen.has(row.other_user_id)) {
          seen.add(row.other_user_id);
          conversations.push(row);
        }
      }

      return conversations;
    } catch (error) {
      console.error('Erro ao buscar conversas do usuário:', error);
      return [];
    }
  }

  static async markAsRead(userId, senderId) {
    const query = `
      UPDATE messages 
      SET is_read = 1 
      WHERE recipient_id = ? AND sender_id = ? AND is_read = 0
    `;
    try {
      await pool.execute(query, [userId, senderId]);
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
      throw error;
    }
  }

  static async getUnreadCount(userId) {
    const query = `SELECT COUNT(*) as unread FROM messages WHERE recipient_id = ? AND is_read = 0`;
    try {
      const result = await pool.query(query, [userId]);
      return result.rows[0].unread || 0;
    } catch (error) {
      console.error('Erro ao contar mensagens não lidas:', error);
      return 0;
    }
  }
}

module.exports = Message;
