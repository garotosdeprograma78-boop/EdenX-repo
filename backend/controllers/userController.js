const User = require('../models/User');
const Post = require('../models/Post');
const Story = require('../models/Story');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { username, email, password, passwordConfirm } = req.body;

    if (!email || !password || !passwordConfirm) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({ message: 'As senhas não correspondem' });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    // Gerar username automático a partir do email se não fornecido
    let finalUsername = username || email.split('@')[0];
    
    // Garantir que o username seja único adicionando timestamp se necessário
    let usernameExists = await User.findByUsername(finalUsername);
    if (usernameExists) {
      finalUsername = finalUsername + '_' + Date.now();
    }

    const hashedPassword = await bcrypt.hash(password, 8);

    const result = await User.create(finalUsername, email, hashedPassword);
    const userId = result.insertId;

    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '24h'
    });

    // Buscar o usuário criado para retornar os dados completos
    const newUser = await User.findById(userId);

    return res.status(201).json({
      message: 'Usuário registrado com sucesso',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        display_name: newUser.display_name,
        email: newUser.email,
        avatar_url: newUser.avatar_url,
        bio: newUser.bio,
        location: newUser.location,
        link: newUser.link,
        anniversary: newUser.anniversary,
        followers: newUser.followers,
        following: newUser.following
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao registrar usuário' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Email ou senha incorretos' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Email ou senha incorretos' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '24h'
    });

    res.json({
      message: 'Login bem-sucedido',
      token,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        email: user.email,
        avatar_url: user.avatar_url,
        bio: user.bio,
        location: user.location,
        link: user.link,
        anniversary: user.anniversary,
        followers: user.followers,
        following: user.following
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao fazer login' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar perfil' });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    const offset = parseInt(req.query.offset, 10) || 0;

    const users = await User.findAll(limit, offset);
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao listar usuários' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { display_name, username, bio, location, link, anniversary, avatar_url } = req.body;

    const currentUser = await User.findById(userId);
    const avatarUrlToSave = (typeof avatar_url === 'string' && avatar_url.trim().length > 0)
      ? avatar_url
      : currentUser.avatar_url;

    await User.updateProfile(userId, {
      displayName: display_name,
      username,
      bio,
      location,
      link,
      anniversary,
      avatarUrl: avatarUrlToSave
    });

    const updatedUser = await User.findById(userId);
    res.json({
      message: 'Perfil atualizado com sucesso',
      user: updatedUser
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao atualizar perfil' });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado' });
    }

    const userId = req.user.id;
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Atualizar o avatar do usuário no banco
    await User.updateAvatar(userId, avatarUrl);

    res.json({
      message: 'Avatar enviado com sucesso',
      url: avatarUrl
    });
  } catch (error) {
    console.error('Erro ao fazer upload do avatar:', error);
    res.status(500).json({ message: 'Erro ao fazer upload do avatar' });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findByUsername(username);

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Buscar contadores
    const postsCount = await Post.countByUserId(user.id);
    const storiesCount = await Story.countByUserId(user.id);

    res.json({
      ...user,
      posts_count: postsCount,
      stories_count: storiesCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar usuário' });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const followers = await User.getFollowers(userId);

    res.json(followers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar seguidores' });
  }
};

exports.getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const following = await User.getFollowing(userId);

    res.json({ success: true, data: following });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar seguindo' });
  }
};

exports.addFollower = async (req, res) => {
  try {
    const userId = req.user.id;
    const { followId } = req.params;

    await User.addFollower(followId, userId);
    const followedUser = await User.findById(followId);

    res.json({ message: 'Seguindo este usuário', followedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao seguir usuário' });
  }
};

exports.removeFollower = async (req, res) => {
  try {
    const userId = req.user.id;
    const { followId } = req.params;

    await User.removeFollower(followId, userId);
    const followedUser = await User.findById(followId);

    res.json({ message: 'Deixou de seguir este usuário', followedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao deixar de seguir' });
  }
};

exports.getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = req.query.limit || 20;
    const offset = req.query.offset || 0;

    const posts = await Post.getUserPosts(userId, limit, offset);
    res.json({ success: true, data: posts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar posts' });
  }
};
