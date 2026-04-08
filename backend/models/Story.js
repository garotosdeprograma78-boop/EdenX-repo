const pool = require('../config/database');

class Story {
  static async create(userId, imageUrl, type = 'image') {
    const query = `
      INSERT INTO stories (user_id, image_url, story_type, created_at, expires_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, datetime('now', '+24 hours'))
    `;
    try {
      const result = await pool.execute(query, [userId, imageUrl, type]);
      return result.insertId;
    } catch (error) {
      console.error('Erro ao criar story:', error);
      throw error;
    }
  }

  static async getActiveStories(limit = 50) {
    const query = `
      SELECT s.*, u.username, u.avatar_url,
        CASE WHEN s.expires_at > CURRENT_TIMESTAMP THEN 1 ELSE 0 END as is_active
      FROM stories s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.expires_at > CURRENT_TIMESTAMP
      ORDER BY s.created_at DESC
      LIMIT ?
    `;
    try {
      const result = await pool.query(query, [limit]);
      return result.rows || [];
    } catch (error) {
      console.error('Erro ao buscar stories ativas:', error);
      return [];
    }
  }

  static async getUserStories(userId) {
    const query = `
      SELECT s.*, u.username, u.avatar_url
      FROM stories s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = ? AND s.expires_at > CURRENT_TIMESTAMP
      ORDER BY s.created_at DESC
    `;
    try {
      const result = await pool.query(query, [userId]);
      return result.rows || [];
    } catch (error) {
      console.error('Erro ao buscar stories do usuário:', error);
      return [];
    }
  }

  static async getFollowersStories(userId, limit = 50) {
    const query = `
      SELECT s.*, u.username, u.avatar_url
      FROM stories s
      JOIN users u ON s.user_id = u.id
      JOIN followers f ON s.user_id = f.user_id
      WHERE f.follower_id = ? AND s.expires_at > CURRENT_TIMESTAMP
      ORDER BY s.created_at DESC
      LIMIT ?
    `;
    try {
      const result = await pool.query(query, [userId, limit]);
      return result.rows || [];
    } catch (error) {
      console.error('Erro ao buscar stories de seguidores:', error);
      return [];
    }
  }

  static async markStoryViewed(storyId, userId) {
    const query = `
      INSERT OR REPLACE INTO story_views (story_id, user_id, viewed_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `;
    try {
      await pool.execute(query, [storyId, userId]);
      return true;
    } catch (err) {
      console.error('Erro ao marcar story como visualizado:', err);
      return false;
    }
  }

  static async getStoryViews(storyId) {
    const query = `
      SELECT sv.*, u.username, u.avatar_url
      FROM story_views sv
      JOIN users u ON sv.user_id = u.id
      WHERE sv.story_id = ?
      ORDER BY sv.viewed_at DESC
    `;
    try {
      const result = await pool.query(query, [storyId]);
      return result.rows || [];
    } catch (error) {
      console.error('Erro ao buscar visualizações da story:', error);
      return [];
    }
  }

  static async deleteExpiredStories() {
    const query = `DELETE FROM stories WHERE expires_at < CURRENT_TIMESTAMP`;
    try {
      await pool.execute(query);
    } catch (error) {
      console.error('Erro ao deletar stories expiradas:', error);
    }
  }

  static async countByUserId(userId) {
    const query = `SELECT COUNT(*) as count FROM stories WHERE user_id = ? AND expires_at > CURRENT_TIMESTAMP`;
    try {
      const result = await pool.query(query, [userId]);
      return result.rows[0].count || 0;
    } catch (error) {
      console.error('Erro ao contar stories:', error);
      return 0;
    }
  }
}

module.exports = Story;
