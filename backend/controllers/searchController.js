const pool = require('../config/database');

exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    let searchQuery;
    let params;

    if (!query || query.trim().length === 0) {
      // Retorna todos os usuários (até 100) quando não passa query
      searchQuery = `SELECT id, username, avatar_url, bio FROM users ORDER BY created_at DESC LIMIT 100`;
      params = [];
    } else if (query.length < 2) {
      return res.status(400).json({ message: 'Digite pelo menos 2 caracteres' });
    } else {
      searchQuery = `
        SELECT id, username, avatar_url, bio FROM users
        WHERE username LIKE ? OR bio LIKE ?
        LIMIT 100
      `;
      params = [`%${query}%`, `%${query}%`];
    }

    const { rows } = await pool.query(searchQuery, params);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar usuários' });
  }
};

exports.searchPosts = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({ message: 'Digite pelo menos 2 caracteres' });
    }

    const searchQuery = `
      SELECT p.*, u.username, u.avatar_url,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.caption LIKE ? OR u.username LIKE ?
      ORDER BY p.created_at DESC
      LIMIT 50
    `;

    const { rows } = await pool.query(searchQuery, [
      `%${query}%`,
      `%${query}%`
    ]);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar posts' });
  }
};

exports.searchTags = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({ message: 'Digite pelo menos 2 caracteres' });
    }

    const searchQuery = `
      SELECT DISTINCT SUBSTRING_INDEX(SUBSTRING(caption, LOCATE('#', caption)), ' ', 1) as tag,
        COUNT(*) as count
      FROM posts
      WHERE caption LIKE ?
      GROUP BY tag
      ORDER BY count DESC
      LIMIT 20
    `;

    const { rows } = await pool.query(searchQuery, [`%${query}%`]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar tags' });
  }
};
