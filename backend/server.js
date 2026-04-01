const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

// Carregar variáveis de ambiente
dotenv.config();

// Importar banco de dados (testa conexão)
const db = require('./config/database');

// Inicializar Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/uploads', express.static('uploads'));

// Socket.IO para mensagens em tempo real
const activeUsers = {};

io.on('connection', (socket) => {
  console.log('Novo usuário conectado:', socket.id);

  // Usuário entra
  socket.on('user-online', (userId) => {
    activeUsers[userId] = socket.id;
    io.emit('users-online', Object.keys(activeUsers));
  });

  // Receber mensagem
  socket.on('send-message', (data) => {
    const recipientSocket = activeUsers[data.recipientId];
    if (recipientSocket) {
      io.to(recipientSocket).emit('receive-message', {
        senderId: data.senderId,
        message: data.message,
        timestamp: new Date()
      });
    }
  });

  // Notificação em tempo real
  socket.on('new-post', (postData) => {
    io.emit('post-created', postData);
  });

  socket.on('new-story', (storyData) => {
    io.emit('story-created', storyData);
  });

  // Desconectar
  socket.on('disconnect', () => {
    Object.keys(activeUsers).forEach(userId => {
      if (activeUsers[userId] === socket.id) {
        delete activeUsers[userId];
      }
    });
    io.emit('users-online', Object.keys(activeUsers));
    console.log('Usuário desconectado:', socket.id);
  });
});

// Importar rotas
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const storyRoutes = require('./routes/stories');
const messageRoutes = require('./routes/messages');
const searchRoutes = require('./routes/search');
const reelRoutes = require('./routes/reels');

// Usar rotas
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/reels', reelRoutes);

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend EdenX rodando ✓' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Porta ${PORT} já está em uso. ` +
      'Pare o processo que a usa ou altere a porta em .env para evitar o conflito.');
    process.exit(1);
  }
  console.error('Erro no servidor:', err);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`\n🚀 Servidor EdenX rodando em http://localhost:${PORT}`);
  console.log(`📱 WebSocket ativo para mensagens em tempo real`);
});

module.exports = { app, io };
