const pool = require('../config/database');

class UserFollows {
  static async checkFollow(followerId, followedId) {
    const query = `
      SELECT COUNT(*) as count
      FROM user_follows
      WHERE follower_id = ? AND followed_id = ?
    `;
    try {
      const [result] = await pool.query(query, [followerId, followedId]);
      return result.count > 0;
    } catch (error) {
      console.error('Erro ao verificar follow:', error);
      throw error;
    }
  }
}

module.exports = UserFollows;