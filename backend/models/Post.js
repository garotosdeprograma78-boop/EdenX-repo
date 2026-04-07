const pool = require('../config/database');

class Post {
  static async create(userId, caption, imageUrl) {
    const query = `
      INSERT INTO posts (user_id, caption, image_url, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `;
    try {
      const result = await pool.execute(query, [userId, caption, imageUrl]);
      return result.insertId;
    } catch (error) {
      console.error('Erro ao criar post:', error);
      throw error;
    }
  }

  static async findById(id) {
    const query = `
      SELECT p.*, u.username, u.avatar_url,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `;
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erro ao buscar post:', error);
      return null;
    }
  }

  static async getFeed(userId, limit = 20, offset = 0) {
    const query = `
      SELECT p.*, u.username, u.avatar_url,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
        CASE WHEN l.id IS NOT NULL THEN 1 ELSE 0 END as liked_by_user
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN followers f ON p.user_id = f.user_id AND f.follower_id = ?
      LEFT JOIN likes l ON p.id = l.post_id AND l.user_id = ?
      WHERE f.id IS NOT NULL OR p.user_id = ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;
    try {
      const result = await pool.query(query, [userId, userId, userId, Number(limit), Number(offset)]);
      return result.rows || [];
    } catch (error) {
      console.error('Erro ao buscar feed:', error);
      return [];
    }
  }

  static async getUserPosts(userId, limit = 20, offset = 0) {
    const query = `
      SELECT p.*, u.username, u.avatar_url,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;
    try {
      const result = await pool.query(query, [userId, Number(limit), Number(offset)]);
      return result.rows || [];
    } catch (error) {
      console.error('Erro ao buscar posts do usuário:', error);
      return [];
    }
  }

  static async likePost(postId, userId) {
    const query = `INSERT INTO likes (post_id, user_id) VALUES (?, ?)`;
    try {
      await pool.execute(query, [postId, userId]);
      return true;
    } catch (err) {
      console.error('Erro ao curtir post:', err);
      return false;
    }
  }

  static async unlikePost(postId, userId) {
    const query = `DELETE FROM likes WHERE post_id = ? AND user_id = ?`;
    try {
      await pool.execute(query, [postId, userId]);
    } catch (error) {
      console.error('Erro ao descurtir post:', error);
      throw error;
    }
  }

  static async addComment(postId, userId, comment, parentCommentId = null) {
    let query;
    let params;

    if (parentCommentId) {
      query = `
        INSERT INTO comments (post_id, user_id, comment_text, parent_comment_id, created_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
      params = [postId, userId, comment, parentCommentId];
    } else {
      query = `
        INSERT INTO comments (post_id, user_id, comment_text, created_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `;
      params = [postId, userId, comment];
    }

    try {
      const result = await pool.execute(query, params);
      return result.insertId;
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      throw error;
    }
  }

  static async getComments(postId, limit = 50) {
    const query = `
      SELECT c.*, u.username, u.avatar_url
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
      LIMIT ?
    `;
    try {
      const result = await pool.query(query, [postId, limit]);
      return result.rows || [];
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
      return [];
    }
  }

  static async updateComment(commentId, userId, commentText) {
    const query = `
      UPDATE comments
      SET comment_text = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `;
    try {
      const result = await pool.execute(query, [commentText, commentId, userId]);
      return result[0].affectedRows > 0;
    } catch (error) {
      console.error('Erro ao atualizar comentário:', error);
      return false;
    }
  }

  static async deleteComment(commentId, userId) {
    const query = `
      DELETE FROM comments
      WHERE id = ? AND user_id = ?
    `;
    try {
      const result = await pool.execute(query, [commentId, userId]);
      return result[0].affectedRows > 0;
    } catch (error) {
      console.error('Erro ao deletar comentário:', error);
      return false;
    }
  }

  static async countByUserId(userId) {
    const query = `SELECT COUNT(*) as count FROM posts WHERE user_id = ?`;
    try {
      const result = await pool.query(query, [userId]);
      return result.rows[0].count || 0;
    } catch (error) {
      console.error('Erro ao contar posts:', error);
      return 0;
    }
  }

  static async updatePost(postId, userId, caption) {
    const query = `
      UPDATE posts
      SET caption = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `;

    try {
      const result = await pool.execute(query, [caption, postId, userId]);
      return result[0].affectedRows > 0;
    } catch (error) {
      console.error('Erro ao atualizar post:', error);
      return false;
    }
  }

  static async deletePost(postId, userId) {
    const deleteLikesQuery = `DELETE FROM likes WHERE post_id = ?`;
    const deleteCommentsQuery = `DELETE FROM comments WHERE post_id = ?`;
    const deletePostQuery = `DELETE FROM posts WHERE id = ? AND user_id = ?`;

    try {
      await pool.execute(deleteLikesQuery, [postId]);
      await pool.execute(deleteCommentsQuery, [postId]);
      const result = await pool.execute(deletePostQuery, [postId, userId]);
      return result[0].affectedRows > 0;
    } catch (error) {
      console.error('Erro ao deletar post:', error);
      return false;
    }
  }
}

module.exports = Post;
