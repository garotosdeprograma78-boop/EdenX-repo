# 📚 Documentação Completa - EdenX

## 🎯 Visão Geral

O **EdenX** é uma rede social com tema cyberpunk neon, desenvolvida como projeto educacional. Combina um frontend responsivo em HTML5/CSS3/JavaScript com um backend robusto em Node.js/Express.js, utilizando MySQL como banco de dados e WebSocket para funcionalidades em tempo real.

### ✨ Funcionalidades Principais
- **Autenticação JWT** com registro e login
- **Feed de Posts** com sistema de curtidas e comentários
- **Stories** que expiram em 24 horas
- **Mensagens em Tempo Real** via WebSocket
- **Reels** com lazy loading para vídeos curtos
- **Sistema de Busca** para usuários e posts
- **Upload de Imagens** para posts, stories e reels

## 🏗️ Arquitetura do Sistema

### Diagrama de Fluxo
```
┌─────────────────┐
│   FRONTEND      │
│  (HTML/CSS/JS)  │
└────────┬────────┘
         │
         │ HTTP + WebSocket
         │
┌────────▼──────────────────┐
│   API GATEWAY (Port 3001)  │
│   Express.js + Socket.IO   │
└────────┬──────────────────┘
         │
    ┌────┴────┬─────────────┬──────────┬──────────┐
    │          │             │          │          │
┌───▼──┐  ┌───▼──┐  ┌───────▼──┐  ┌──▼──────┐  ┌▼──────┐
│Users │  │Posts │  │ Messages │  │Stories  │  │Reels  │
│(Auth)│  │(Feed)│  │(Real-tm) │  │(24h)    │  │(Video)│
└───┬──┘  └───┬──┘  └───────┬──┘  └──┬──────┘  └┬──────┘
    │         │             │         │         │
    └─────────┴─────────────┴─────────┴─────────┘
              │
    ┌─────────▼──────────┐
    │  MySQL Database    │
    │  (InnoDB)          │
    └────────────────────┘
```

### Componentes Técnicos

#### Frontend
- **HTML5/CSS3**: Interface responsiva com tema cyberpunk
- **JavaScript ES6+**: Lógica de aplicação e integração com APIs
- **Socket.IO**: Comunicação em tempo real
- **Font Awesome**: Ícones vetoriais

#### Backend
- **Node.js + Express.js**: Servidor web e APIs RESTful
- **Socket.IO**: WebSocket para mensagens em tempo real
- **JWT**: Autenticação baseada em tokens
- **bcryptjs**: Hash seguro de senhas
- **Multer**: Upload de arquivos
- **MySQL2**: Conexão com banco de dados

#### Banco de Dados
- **MySQL 5.7+**: Sistema de gerenciamento de banco de dados
- **InnoDB**: Engine com integridade referencial
- **Tabelas**: users, posts, stories, messages, reels, likes, comments, followers

## 📋 Pré-requisitos

- **Node.js** v14 ou superior
- **MySQL** 5.7 ou superior
- **Navegador moderno** (Chrome, Firefox, Edge)
- **Git** para controle de versão

## 🚀 Instalação e Configuração

### 1. Clonagem do Repositório
```bash
git clone <url-do-repositorio>
cd EdenX
```

### 2. Configuração do Backend
```bash
cd backend
npm install
```

### 3. Configuração do Banco de Dados
```bash
# Criar banco de dados
mysql -u root -p < schema.sql

# Ou executar manualmente os comandos SQL
mysql -u root -p
CREATE DATABASE edenx_db;
USE edenx_db;
SOURCE schema.sql;
```

### 4. Variáveis de Ambiente
Copie o arquivo de exemplo e configure:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha_mysql
DB_NAME=edenx_db

# Server
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=sua_chave_super_secreta_aqui

# Uploads
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

### 5. Inicialização do Servidor
```bash
# Desenvolvimento (com auto-reload)
npm run dev

# Produção
npm start
```

### 6. Acesso ao Frontend
Abra `index.html` no navegador ou use um servidor estático:
- **Live Server** (extensão VS Code)
- **http-server**: `npx http-server -p 3000`

## 🔌 API RESTful

### Base URL
```
http://localhost:3001/api
```

### Autenticação
Todas as requisições autenticadas requerem o header:
```
Authorization: Bearer <token_jwt>
```

### Endpoints Principais

#### 👤 Usuários (Users)
- `POST /users/register` - Registrar novo usuário
- `POST /users/login` - Autenticar usuário
- `GET /users/profile` - Obter perfil do usuário logado
- `PUT /users/profile` - Atualizar perfil
- `GET /users/:id` - Obter perfil público
- `POST /users/:id/follow` - Seguir usuário
- `DELETE /users/:id/follow` - Deixar de seguir

#### 📝 Posts
- `GET /posts/feed` - Feed personalizado (posts dos seguidos)
- `POST /posts` - Criar novo post
- `GET /posts/:id` - Detalhes do post
- `PUT /posts/:id` - Editar post (apenas autor)
- `DELETE /posts/:id` - Excluir post (apenas autor)
- `POST /posts/:id/like` - Curtir post
- `DELETE /posts/:id/like` - Remover curtida
- `POST /posts/:id/comments` - Adicionar comentário
- `GET /posts/:id/comments` - Listar comentários

#### 📖 Stories
- `GET /stories/active` - Stories ativos (não expirados)
- `POST /stories` - Criar novo story
- `GET /stories/user/:userId` - Stories de um usuário
- `POST /stories/:id/view` - Marcar story como visto

#### 💬 Mensagens
- `GET /messages/list` - Listar conversas
- `GET /messages/conversation/:userId` - Histórico da conversa
- `POST /messages` - Enviar mensagem
- `GET /messages/unread/count` - Contar mensagens não lidas

#### 🎥 Reels
- `GET /reels` - Listar reels (com paginação)
- `POST /reels` - Criar novo reel
- `GET /reels/:id` - Detalhes do reel
- `POST /reels/:id/like` - Curtir reel
- `DELETE /reels/:id/like` - Remover curtida

#### 🔍 Busca
- `GET /search/users?query=...` - Buscar usuários
- `GET /search/posts?query=...` - Buscar posts

## 🔄 WebSocket (Tempo Real)

### Conexão
```javascript
const socket = io('http://localhost:3001');
```

### Eventos Principais

#### Envio
```javascript
socket.emit('send-message', {
  senderId: userId,
  recipientId: destinatarioId,
  message: 'Conteúdo da mensagem'
});

socket.emit('user-online', { userId });
```

#### Recebimento
```javascript
socket.on('receive-message', (data) => {
  console.log('Nova mensagem:', data);
});

socket.on('new-post', (data) => {
  console.log('Novo post:', data);
});

socket.on('new-story', (data) => {
  console.log('Novo story:', data);
});
```

## 🧪 Testes

### Pré-requisitos para Testes
- Backend rodando na porta 3001
- MySQL conectado e schema importado
- Navegador com DevTools (F12)

### Teste Básico da API
```bash
# Registrar usuário
curl -X POST http://localhost:3001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@test.com","password":"123456","passwordConfirm":"123456"}'

# Fazer login
curl -X POST http://localhost:3001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

### Teste no Navegador
Abra o console do navegador (F12) e execute:
```javascript
// Registrar
await register('testuser', 'test@test.com', '123456', '123456');

// Login
await login('test@test.com', '123456');

// Criar post
await createPost('Meu primeiro post!', 'https://picsum.photos/800/1000');

// Listar feed
const feed = await getFeed(10, 0);
console.log(feed.data);
```

### Teste de WebSocket
```javascript
// Conectar
initWebSocket();

// Enviar mensagem
socket.emit('send-message', {
  senderId: SESSION.userId,
  recipientId: 2,
  message: 'Olá via WebSocket!'
});
```

## 🔧 Desenvolvimento

### Estrutura de Arquivos
```
EdenX/
├── index.html              # Interface principal
├── styles.css              # Estilos CSS
├── script.js              # Scripts de compatibilidade
├── api-client.js          # Cliente HTTP para APIs
├── app.js                 # Lógica de aplicação
├── images/                # Recursos estáticos
└── backend/               # Servidor Node.js
    ├── server.js          # Ponto de entrada
    ├── package.json       # Dependências
    ├── .env               # Variáveis de ambiente
    ├── schema.sql         # Schema do banco
    ├── config/
    │   └── database.js    # Configuração MySQL
    ├── models/            # Modelos de dados
    ├── controllers/       # Lógica de negócio
    ├── routes/            # Definições de rotas
    ├── middleware/        # Middlewares Express
    └── uploads/           # Arquivos enviados
```

### Scripts Disponíveis
```bash
cd backend

# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Executar em produção
npm start

# Executar testes
npm test
```

### Desenvolvimento Frontend
- Use Live Server do VS Code para desenvolvimento
- Os arquivos estão modularizados para fácil manutenção
- `api-client.js` gerencia todas as chamadas HTTP
- `app.js` contém a lógica de integração

## 🚀 Deploy

### Frontend (Vercel/Netlify)
```bash
npm install -g vercel
vercel
```

### Backend (Heroku/AWS)
```bash
heroku login
heroku create seu-app-edenx
git push heroku main
```

### Banco de Dados (Produção)
- AWS RDS
- Google Cloud SQL
- PlanetScale
- Railway

## 🐛 Troubleshooting

### Problemas Comuns

| Problema | Solução |
|----------|---------|
| `ECONNREFUSED` | Verifique se MySQL está rodando |
| `Table doesn't exist` | Execute `schema.sql` novamente |
| `Port 3001 in use` | Mude a porta no `.env` |
| `401 Unauthorized` | Token JWT inválido/expirado |
| `CORS error` | Verifique URL no `api-client.js` |
| `Upload falha` | Verifique permissões da pasta `uploads` |

### Logs e Debug
- Backend: Verifique console do terminal
- Frontend: Use DevTools (F12) > Console
- Database: Verifique logs do MySQL

### Limpeza de Dados
```bash
# Resetar banco de dados
cd backend
node reset-database.js

# Limpar uploads
rm -rf uploads/*
```

## 🔒 Segurança

### Implementado
- Hash de senhas com bcryptjs
- JWT com expiração configurável
- Validação de inputs
- Proteção contra SQL Injection
- CORS configurado
- Sanitização de HTML

### Recomendações para Produção
- HTTPS/TLS obrigatório
- Rate limiting
- CSRF protection
- Content Security Policy (CSP)
- Helmet.js para headers seguros
- 2FA opcional
- Logs de auditoria

## 📊 Performance

### Otimizações
- Lazy loading nos reels (20 por vez)
- Índices otimizados no MySQL
- Paginação em todos os endpoints
- Compressão de imagens
- Caching de queries frequentes

### Métricas Esperadas
- Tempo de resposta API: < 200ms
- Lazy loading: 2-3 segundos por lote
- WebSocket: < 100ms para mensagens

## 🔄 Escalabilidade

### Horizontal
- Múltiplos workers Node.js
- Load balancer (Nginx/HAProxy)
- Redis para cache compartilhado
- Message queue para uploads pesados

### Vertical
- Connection pooling MySQL
- CDN para assets estáticos
- Database read replicas

## 📈 Roadmap

### Próximas Funcionalidades
- [ ] Notificações push
- [ ] Sistema de recomendações
- [ ] Filtros em stories
- [ ] Grupos e comunidades
- [ ] Streaming ao vivo
- [ ] Sistema de moeda interna
- [ ] Analytics para criadores
- [ ] Moderação de conteúdo

### Melhorias Técnicas
- [ ] GraphQL API
- [ ] Microserviços
- [ ] Containerização (Docker)
- [ ] CI/CD pipeline
- [ ] Testes automatizados
- [ ] Monitoramento (Prometheus)

## 👥 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

### Padrões de Código
- Use ESLint para JavaScript
- Siga convenções de nomenclatura camelCase
- Documente funções importantes
- Escreva testes para novas funcionalidades

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## �‍💻 Sobre o Projeto

### Equipe de Desenvolvimento
Este projeto foi desenvolvido por:
- **Gabriel Victor Ribeiro Ferreira**
- **Arthur Custódio do Nascimento**

**Turma**: 3º ano integral  
**Professora Orientadora**: Nadya

### Ajuda e Recursos
- **Inteligência Artificial**: Utilizada para auxiliar no desenvolvimento de código, resolução de problemas e documentação

### Dificuldades Encontradas
Durante o desenvolvimento, enfrentamos diversos desafios técnicos:

- **Integração ao Banco de Dados**: Dificuldades na configuração e conexão com MySQL, incluindo problemas de schema e queries
- **Aplicação de Estilos CSS**: Complexidades na implementação de determinados estilos, especialmente com layouts responsivos e tema cyberpunk
- **Falhas de Renderização no Backend**: Problemas constantes de má renderização de código no servidor, afetando a estabilidade da API
- **Erros de Conexão com Servidor**: Instabilidades nas conexões entre frontend e backend, incluindo problemas de CORS e WebSocket

Estes desafios foram superados através de pesquisa, testes iterativos e utilização de ferramentas de debug.

---

**Desenvolvido com ❤️ para a comunidade de desenvolvedores**