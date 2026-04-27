const Story = require('../models/Story');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

function makeAbsoluteUrl(req, url) {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
}

function normalizeStory(story, req) {
  return {
    ...story,
    image_url: makeAbsoluteUrl(req, story.image_url),
    avatar_url: makeAbsoluteUrl(req, story.avatar_url)
  };
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/stories';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, 'story-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Aceitar apenas imagens
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Apenas imagens são permitidas (JPEG, PNG, GIF, WebP)'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

exports.createStory = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : req.body.userId || null;
    let imageUrl = req.body.image_url;

    if (req.file) {
      imageUrl = `/uploads/stories/${req.file.filename}`;
    }

    if (!imageUrl) {
      return res.status(400).json({ message: 'Imagem é obrigatória', code: 'NO_IMAGE' });
    }

    const storyId = await Story.create(userId, imageUrl, 'image');
    const responseImageUrl = makeAbsoluteUrl(req, imageUrl);

    res.status(201).json({
      message: 'Story criado com sucesso 🎉',
      storyId,
      imageUrl: responseImageUrl,
      expiresIn: '24 horas'
    });
  } catch (error) {
    console.error('Erro ao criar story:', error);
    // Se houver arquivo, deletá-lo em caso de erro
    if (req.file) {
      fs.unlink(`./uploads/stories/${req.file.filename}`, (err) => {
        if (err) console.error('Erro ao deletar arquivo:', err);
      });
    }
    res.status(500).json({ message: 'Erro ao criar story', error: error.message });
  }
};

exports.getActiveStories = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const stories = await Story.getActiveStories(parseInt(limit));
    const normalizedStories = stories.map(story => normalizeStory(story, req));

    res.json({ success: true, data: normalizedStories, count: normalizedStories.length });
  } catch (error) {
    console.error('Erro ao carregar stories:', error);
    res.status(500).json({ message: 'Erro ao carregar stories', success: false });
  }
};

exports.getUserStories = async (req, res) => {
  try {
    const { userId } = req.params;

    const stories = await Story.getUserStories(userId);
    const normalizedStories = stories.map(story => normalizeStory(story, req));

    res.json({ success: true, data: normalizedStories, count: normalizedStories.length });
  } catch (error) {
    console.error('Erro ao carregar stories do usuário:', error);
    res.status(500).json({ message: 'Erro ao carregar stories do usuário', success: false });
  }
};

exports.getFollowersStories = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50 } = req.query;

    const stories = await Story.getFollowersStories(userId, parseInt(limit));
    const normalizedStories = stories.map(story => normalizeStory(story, req));

    res.json({ success: true, data: normalizedStories, count: normalizedStories.length });
  } catch (error) {
    console.error('Erro ao carregar stories dos seguidores:', error);
    res.status(500).json({ message: 'Erro ao carregar stories dos seguidores', success: false });
  }
};

exports.markStoryViewed = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const { storyId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    await Story.markStoryViewed(storyId, userId);

    res.json({ message: 'Story marcado como visualizado ✓', success: true });
  } catch (error) {
    console.error('Erro ao marcar story como visualizado:', error);
    res.status(500).json({ message: 'Erro ao marcar story como visualizado', success: false });
  }
};

exports.getStoryViews = async (req, res) => {
  try {
    const { storyId } = req.params;

    const views = await Story.getStoryViews(storyId);

    res.json({ success: true, data: views, count: views.length });
  } catch (error) {
    console.error('Erro ao carregar visualizações do story:', error);
    res.status(500).json({ message: 'Erro ao carregar visualizações do story', success: false });
  }
};

exports.deleteStory = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const { storyId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado', success: false });
    }

    const deleted = await Story.deleteStory(storyId, userId);

    if (deleted) {
      res.json({ message: 'Story deletada com sucesso', success: true });
    } else {
      res.status(404).json({ message: 'Story não encontrada ou você não tem permissão', success: false });
    }
  } catch (error) {
    console.error('Erro ao deletar story:', error);
    res.status(500).json({ message: 'Erro ao deletar story', success: false });
  }
};

exports.uploadMulter = upload.single('image');
