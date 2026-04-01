const express = require('express');
const searchController = require('../controllers/searchController');
const auth = require('../middleware/auth');

const router = express.Router();

// Busca
// /users pode ser usado sem token para ver usuários existentes
router.get('/users', searchController.searchUsers);
router.get('/posts', auth, searchController.searchPosts);
router.get('/tags', auth, searchController.searchTags);

module.exports = router;
