const Post = require('../models/Post');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/posts';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, 'post-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

exports.createPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { caption } = req.body;
    let imageUrl = req.body.image_url;

    if (req.file) {
      imageUrl = `/uploads/posts/${req.file.filename}`;
    }

    const postId = await Post.create(userId, caption, imageUrl);
    const post = await Post.findById(postId);

    res.status(201).json({
      message: 'Post criado com sucesso',
      post: post || { id: postId, user_id: userId, caption, image_url: imageUrl }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao criar post' });
  }
};

exports.getFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    const posts = await Post.getFeed(userId, parseInt(limit), parseInt(offset));

    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao carregar feed' });
  }
};

exports.getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const posts = await Post.getUserPosts(userId, parseInt(limit), parseInt(offset));

    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao carregar posts do usuário' });
  }
};

exports.getPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post não encontrado' });
    }

    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar post' });
  }
};

exports.likePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;

    const success = await Post.likePost(postId, userId);

    if (success) {
      res.json({ message: 'Post curtido' });
    } else {
      res.status(400).json({ message: 'Você já curtiu este post' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao curtir post' });
  }
};

exports.unlikePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;

    await Post.unlikePost(postId, userId);

    res.json({ message: 'Curtida removida' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao remover curtida' });
  }
};

exports.addComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;
    const { comment, parent_comment_id } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: 'Comentário não pode estar vazio' });
    }

    const commentId = await Post.addComment(postId, userId, comment.trim(), parent_comment_id || null);

    res.status(201).json({
      message: 'Comentário adicionado',
      commentId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao adicionar comentário' });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { limit = 50 } = req.query;

    const comments = await Post.getComments(postId, parseInt(limit));

    res.json({ success: true, data: comments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao carregar comentários' });
  }
};

exports.editComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId, commentId } = req.params;
    const { comment } = req.body;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ message: 'Comentário não pode estar vazio' });
    }

    const updated = await Post.updateComment(commentId, userId, comment);

    if (!updated) {
      return res.status(403).json({ message: 'Você não pode editar este comentário' });
    }

    res.json({ success: true, message: 'Comentário atualizado com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao editar comentário' });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId, commentId } = req.params;

    const deleted = await Post.deleteComment(commentId, userId);
    if (!deleted) {
      return res.status(403).json({ message: 'Você não pode deletar este comentário' });
    }

    res.json({ success: true, message: 'Comentário excluído' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao deletar comentário' });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;
    const { caption } = req.body;

    if (!caption || !caption.trim()) {
      return res.status(400).json({ message: 'O conteúdo do post não pode estar vazio.' });
    }

    const updated = await Post.updatePost(postId, userId, caption.trim());
    if (!updated) {
      return res.status(403).json({ message: 'Você não pode editar este post ou ele não existe.' });
    }

    res.json({ success: true, message: 'Post atualizado com sucesso.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao atualizar post' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;

    const deleted = await Post.deletePost(postId, userId);
    if (!deleted) {
      return res.status(403).json({ message: 'Você não tem permissão para excluir este post ou ele não existe.' });
    }

    res.json({ message: 'Post excluído com sucesso.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao excluir post' });
  }
};

exports.uploadMulter = upload.single('image');
