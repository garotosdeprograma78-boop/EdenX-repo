const Message = require('../models/Message');

exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { recipientId, message, media_url, media_type } = req.body;

    if (!recipientId || (!message && !media_url)) {
      return res.status(400).json({ message: 'Destinatário e mensagem ou mídia são obrigatórios' });
    }

    const messageId = await Message.create(senderId, recipientId, message, media_url, media_type);

    res.status(201).json({
      message: 'Mensagem enviada',
      data: {
        id: messageId,
        sender_id: senderId,
        recipient_id: recipientId,
        message_text: message || null,
        media_url: media_url || null,
        media_type: media_type || null,
        created_at: new Date()
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao enviar mensagem' });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otherUserId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const messages = await Message.getConversation(
      userId,
      otherUserId,
      parseInt(limit),
      parseInt(offset)
    );

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao carregar conversa' });
  }
};

exports.getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;

    const conversations = await Message.getUserConversations(userId, parseInt(limit));

    res.json(conversations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao carregar conversas' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { senderId } = req.params;

    await Message.markAsRead(userId, senderId);

    res.json({ message: 'Mensagens marcadas como lidas' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao marcar mensagens como lidas' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await Message.getUnreadCount(userId);

    res.json({ unreadCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao contar mensagens não lidas' });
  }
};

exports.uploadMessageMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo de mídia enviado' });
    }

    const mediaUrl = `/uploads/messages/${req.file.filename}`;
    const mediaType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';

    res.json({ message: 'Mídia enviada com sucesso', mediaUrl, mediaType });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao enviar mídia de mensagem' });
  }
};
