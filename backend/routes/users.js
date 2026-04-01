const express = require('express');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// Configurar multer para upload de arquivos
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos'));
    }
  }
});

const router = express.Router();

// Autenticação
router.post('/register', userController.register);
router.post('/login', userController.login);

// Listar usuários (requer autenticação)
router.get('/', auth, userController.listUsers);

// Perfil (requer autenticação)
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);
router.post('/upload-avatar', auth, upload.single('avatar'), userController.uploadAvatar);

// Perfil público
router.get('/profile/:username', userController.getUserProfile);

// Seguidores
router.get('/:userId/followers', userController.getFollowers);
router.get('/:userId/following', userController.getFollowing);
router.post('/:followId/follow', auth, userController.addFollower);
router.delete('/:followId/unfollow', auth, userController.removeFollower);

// Posts do usuário
router.get('/:userId/posts', userController.getUserPosts);

module.exports = router;
