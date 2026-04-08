const pool = require('../config/database');

class Reel {
  static async create(userId, videoUrl, caption, thumbnail) {
    const query = `
      INSERT INTO reels (user_id, video_url, caption, thumbnail_url, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;
    try {
      const result = await pool.execute(query, [userId, videoUrl, caption, thumbnail]);
      return result.insertId;
    } catch (error) {
      console.error('Erro ao criar reel:', error);
      throw error;
    }
  }

  static async getReels(limit = 20, offset = 0) {
    const query = `
      SELECT r.*, u.username, u.avatar_url,
        (SELECT COUNT(*) FROM reel_likes WHERE reel_id = r.id) as likes_count,
        (SELECT COUNT(*) FROM reel_comments WHERE reel_id = r.id) as comments_count
      FROM reels r
      JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `;
    try {
      const result = await pool.query(query, []);
      return result.rows || [];
    } catch (error) {
      console.error('Erro ao buscar reels:', error);
      return [];
    }
  }

  static async getReelsByUser(userId, limit = 20, offset = 0) {
    const query = `
      SELECT r.*, u.username, u.avatar_url,
        (SELECT COUNT(*) FROM reel_likes WHERE reel_id = r.id) as likes_count,
        (SELECT COUNT(*) FROM reel_comments WHERE reel_id = r.id) as comments_count
      FROM reels r
      JOIN users u ON r.user_id = u.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `;
    try {
      const result = await pool.query(query, [userId]);
      return result.rows || [];
    } catch (error) {
      console.error('Erro ao buscar reels do usuário:', error);
      return [];
    }
  }

  static async getReel(reelId) {
    const query = `
      SELECT r.*, u.username, u.avatar_url,
        (SELECT COUNT(*) FROM reel_likes WHERE reel_id = r.id) as likes_count,
        (SELECT COUNT(*) FROM reel_comments WHERE reel_id = r.id) as comments_count
      FROM reels r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `;
    try {
      const result = await pool.query(query, [reelId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erro ao buscar reel:', error);
      return null;
    }
  }

  static async likeReel(reelId, userId) {
    const query = `INSERT INTO reel_likes (reel_id, user_id) VALUES (?, ?)`;
    try {
      await pool.execute(query, [reelId, userId]);
      return true;
    } catch (err) {
      console.error('Erro ao curtir reel:', err);
      return false;
    }
  }

  static async unlikeReel(reelId, userId) {
    const query = `DELETE FROM reel_likes WHERE reel_id = ? AND user_id = ?`;
    try {
      await pool.execute(query, [reelId, userId]);
    } catch (error) {
      console.error('Erro ao descurtir reel:', error);
      throw error;
    }
  }
}

module.exports = Reel;
