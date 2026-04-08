const Story = require('../models/Story');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/stories';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, 'story-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

exports.createStory = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : req.body.userId || null;
    let imageUrl = req.body.image_url;

    if (req.file) {
      imageUrl = `/uploads/stories/${req.file.filename}`;
    }

    if (!imageUrl) {
      return res.status(400).json({ message: 'Imagem é obrigatória' });
    }

    const storyId = await Story.create(userId, imageUrl, 'image');

    res.status(201).json({
      message: 'Story criado com sucesso',
      storyId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao criar story' });
  }
};

exports.getActiveStories = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const stories = await Story.getActiveStories(parseInt(limit));

    res.json(stories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao carregar stories' });
  }
};

exports.getUserStories = async (req, res) => {
  try {
    const { userId } = req.params;

    const stories = await Story.getUserStories(userId);

    res.json(stories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao carregar stories do usuário' });
  }
};

exports.getFollowersStories = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50 } = req.query;

    const stories = await Story.getFollowersStories(userId, parseInt(limit));

    res.json(stories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao carregar stories dos seguidores' });
  }
};

exports.markStoryViewed = async (req, res) => {
  try {
    const userId = req.user.id;
    const { storyId } = req.params;

    await Story.markStoryViewed(storyId, userId);

    res.json({ message: 'Story marcado como visualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao marcar story como visualizado' });
  }
};

exports.getStoryViews = async (req, res) => {
  try {
    const { storyId } = req.params;

    const views = await Story.getStoryViews(storyId);

    res.json(views);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao carregar visualizações do story' });
  }
};

exports.uploadMulter = upload.single('image');
