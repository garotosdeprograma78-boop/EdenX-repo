const express = require('express');
const router = express.Router();
const Story = require('../models/Story');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads/stories/'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'story-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage, 
    limits: { fileSize: 10 * 1024 * 1024 } 
});

// Rota para criar uma story
router.post('/create', auth, upload.single('image'), async (req, res) => {
    try {
        const { type = 'image' } = req.body;
        const userId = req.user.id;
        const imageUrl = req.file ? `/uploads/stories/${req.file.filename}` : null;

        if (!imageUrl) {
            return res.status(400).json({ error: 'Imagem é obrigatória' });
        }

        if (!userId) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }

        const storyId = await Story.create(userId, imageUrl, type);
        res.status(201).json({
            message: 'Story criada com sucesso',
            storyId,
            imageUrl,
            userId
        });
    } catch (error) {
        console.error('Erro ao criar story:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para obter stories ativas
router.get('/active', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const stories = await Story.getActiveStories(limit);
        res.json(stories);
    } catch (error) {
        console.error('Erro ao obter stories ativas:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para obter stories de um usuário específico
router.get('/user/:userId', auth, async (req, res) => {
    try {
        const userId = req.params.userId;
        const stories = await Story.getUserStories(userId);
        res.json(stories);
    } catch (error) {
        console.error('Erro ao obter stories do usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para obter stories dos seguidores
router.get('/followers', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 50;
        const stories = await Story.getFollowersStories(userId, limit);
        res.json(stories);
    } catch (error) {
        console.error('Erro ao obter stories dos seguidores:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para marcar story como visualizada
router.post('/:storyId/view', auth, async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;
        const { storyId } = req.params;
        
        if (!userId) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }

        await Story.markStoryViewed(storyId, userId);
        res.json({ message: 'Story marcada como visualizada' });
    } catch (error) {
        console.error('Erro ao marcar story como visualizada:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para obter visualizações de uma story
router.get('/:storyId/views', async (req, res) => {
    try {
        const { storyId } = req.params;
        const views = await Story.getStoryViews(storyId);
        res.json(views);
    } catch (error) {
        console.error('Erro ao obter visualizações da story:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para obter info de expiração de uma story
router.get('/:storyId/expiration', async (req, res) => {
    try {
        const { storyId } = req.params;
        const pool = require('../config/database');
        
        const query = `
            SELECT id, created_at, expires_at,
                   TIMESTAMPDIFF(MINUTE, NOW(), expires_at) as minutes_remaining,
                   TIMESTAMPDIFF(HOUR, NOW(), expires_at) as hours_remaining,
                   CASE WHEN expires_at > NOW() THEN 1 ELSE 0 END as is_active
            FROM stories
            WHERE id = ?
        `;
        
        const result = await pool.query(query, [storyId]);
        
        if (result.rows && result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Story não encontrada' });
        }
    } catch (error) {
        console.error('Erro ao obter informações de expiração:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;
