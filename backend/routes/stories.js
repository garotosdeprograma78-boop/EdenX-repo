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
router.post('/create', upload.single('image'), async (req, res) => {
    try {
        const { type = 'image', userId } = req.body;
        // Corrigido: Uso de template literals (crases)
        const imageUrl = req.file ? `/uploads/stories/${req.file.filename}` : null;

        if (!imageUrl) {
            return res.status(400).json({ error: 'Imagem é obrigatória' });
        }

        const storyId = await Story.create(userId || null, imageUrl, type);
        res.status(201).json({
            message: 'Story criada com sucesso',
            storyId,
            imageUrl,
            userId: userId || null
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

module.exports = router;
