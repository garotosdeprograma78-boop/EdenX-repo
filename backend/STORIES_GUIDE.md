# 📱 Sistema de Stories com Expiração de 24 Horas - Guia Completo

## 🎯 Visão Geral

O sistema de stories do **ÉdenX** foi implementado com suporte total a expiração automática em 24 horas, assim como em redes sociais modernas (Instagram, WhatsApp, etc.).

---

## 🏗️ Arquitetura do Sistema

### Componentes Principais

```
┌─────────────────┐
│   Frontend      │  (app.js, api-client.js)
│  Visualização   │
│  Timer dinâmico │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Backend       │  (server.js, routes/stories.js)
│   API REST      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Banco de      │  (schema.sql)
│   Dados MySQL   │  - Tabela 'stories'
│                 │  - Tabela 'story_views'
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  File System    │  (/uploads/stories/)
│  Armazenamento  │
│  de Imagens     │
└─────────────────┘
```

---

## 📊 Estrutura do Banco de Dados

### Tabela: `stories`

```sql
CREATE TABLE stories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,                          -- ID do usuário que criou
  image_url VARCHAR(500) NOT NULL,      -- URL da imagem
  story_type VARCHAR(50) DEFAULT 'image', -- Tipo (image, video, etc)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Criado em
  expires_at TIMESTAMP,                 -- Expira em (24h depois)
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)     -- Índice para cleanup rápido
);
```

### Tabela: `story_views`

```sql
CREATE TABLE story_views (
  id INT PRIMARY KEY AUTO_INCREMENT,
  story_id INT NOT NULL,
  user_id INT NOT NULL,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_view (story_id, user_id),
  INDEX idx_story_id (story_id)
);
```

---

## 🔄 Fluxo Completo de uma Story

### 1️⃣ Criação da Story

**Endpoint:** `POST /stories/create`

```javascript
// Frontend (app.js)
async function openStoryUploader() {
  const file = selecionadoDoInput; // Usuário seleciona imagem
  
  // Validações
  - Tipo: JPEG, PNG, GIF, WebP
  - Tamanho máximo: 10MB
  
  const result = await createStory(null, file);
  // Mostra loading toast
  // Após sucesso: recarrega stories
}
```

**Backend (storyController.js):**
```javascript
exports.createStory = async (req, res) => {
  // 1. Upload do arquivo via multer
  // 2. Validação do arquivo
  // 3. Salva em ./uploads/stories/
  // 4. Cria registro no BD com expires_at = NOW() + 24 HOURS
  
  const storyId = await Story.create(userId, imageUrl, 'image');
  
  res.status(201).json({
    message: 'Story criado com sucesso',
    storyId,
    imageUrl,
    expiresIn: '24 horas'
  });
}
```

**Modelo (Story.js):**
```javascript
static async create(userId, imageUrl, type = 'image') {
  const query = `
    INSERT INTO stories (user_id, image_url, story_type, created_at, expires_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, datetime('now', '+24 hours'))
  `;
  return await pool.execute(query, [userId, imageUrl, type]);
}
```

---

### 2️⃣ Visualização da Story

**Endpoint:** `GET /stories/active`

```javascript
// Frontend - Carrega stories ativos
async function loadHeadStories() {
  const result = await getActiveStories();
  
  // Para cada story:
  // 1. Calcula tempo restante
  // 2. Exibe com badge de tempo (5h, 2m, etc)
  // 3. Exibe no carrossel superior
}
```

**Backend (Story.js):**
```javascript
static async getActiveStories(limit = 50) {
  const query = `
    SELECT s.*, u.username, u.avatar_url,
      CASE WHEN s.expires_at > CURRENT_TIMESTAMP THEN 1 ELSE 0 END as is_active
    FROM stories s
    LEFT JOIN users u ON s.user_id = u.id
    WHERE s.expires_at > CURRENT_TIMESTAMP  -- ⭐ Filtra apenas ativas!
    ORDER BY s.created_at DESC
    LIMIT ?
  `;
}
```

---

### 3️⃣ Exibição com Timer de Expiração

**Frontend (app.js - openStoryViewer):**

```javascript
function openStoryViewer(story) {
  // Modal com:
  // 1. Progress bar animada (0% → 100% em 24h)
  // 2. Header com info do usuário
  // 3. Tempo restante (ex: "2h 30m restante")
  // 4. Footer com "Expira em X"
  
  // Atualiza progress bar a cada segundo
  let updateInterval = setInterval(() => {
    const now = new Date();
    const expiresDate = new Date(story.expires_at);
    const createdDate = new Date(story.created_at);
    const totalDuration = expiresDate - createdDate;
    const timeElapsed = now - createdDate;
    const progressPercent = (timeElapsed / totalDuration) * 100;
    
    // Atualiza visualmente
    progressBar.style.width = newProgressPercent + '%';
  }, 1000);
}
```

---

### 4️⃣ Marcação de Visualização

**Endpoint:** `POST /stories/:storyId/view`

```javascript
// Frontend
if (SESSION.isAuthenticated) {
  markStoryViewed(story.id);
}

// Registra que usuário viu a story
// INSERT INTO story_views (story_id, user_id, viewed_at)
```

---

### 5️⃣ Limpeza Automática (Cleanup)

**Arquivo: `backend/cleanup-stories.js`**

O sistema roda a cada **30 minutos**:

```javascript
async function cleanupExpiredStories() {
  // 1. Busca todas as stories com expires_at <= CURRENT_TIMESTAMP
  SELECT id, image_url FROM stories WHERE expires_at <= CURRENT_TIMESTAMP
  
  // 2. Deleta arquivos de imagem do servidor
  fs.unlink(filePath, ...)  // Ex: /uploads/stories/story-1234.jpg
  
  // 3. Remove registros do banco de dados
  DELETE FROM stories WHERE expires_at <= CURRENT_TIMESTAMP
  
  // 4. Logs detalhados
  console.log('✓ 5 stories expiradas removidas');
  console.log('✓ 5 arquivos deletados do servidor');
}

// Executa:
// - Imediatamente na inicialização
// - A cada 30 minutos
setInterval(cleanupExpiredStories, 30 * 60 * 1000);
```

---

## 📡 Endpoints da API

### Criar Story
```
POST /stories/create
Content-Type: multipart/form-data

Body:
- image: (arquivo)
- userId: (opcional)

Response:
{
  "message": "Story criado com sucesso",
  "storyId": 123,
  "imageUrl": "/uploads/stories/story-1234.jpg",
  "expiresIn": "24 horas"
}
```

### Obter Stories Ativas
```
GET /stories/active?limit=50

Response:
{
  "success": true,
  "data": [
    {
      "id": 123,
      "user_id": 1,
      "username": "neon_nina",
      "avatar_url": "...",
      "image_url": "/uploads/stories/...",
      "created_at": "2026-04-13T10:00:00Z",
      "expires_at": "2026-04-14T10:00:00Z",
      "is_active": 1
    },
    ...
  ],
  "count": 5
}
```

### Marcar Como Visualizada
```
POST /stories/:storyId/view

Response:
{
  "message": "Story marcada como visualizada ✓",
  "success": true
}
```

### Obter Visualizações
```
GET /stories/:storyId/views

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 2,
      "username": "cyber_punk",
      "avatar_url": "...",
      "viewed_at": "2026-04-13T10:30:00Z"
    },
    ...
  ],
  "count": 3
}
```

### Obter Info de Expiração
```
GET /stories/:storyId/expiration

Response:
{
  "id": 123,
  "created_at": "2026-04-13T10:00:00Z",
  "expires_at": "2026-04-14T10:00:00Z",
  "minutes_remaining": 1440,
  "hours_remaining": 24,
  "is_active": 1
}
```

---

## 🎨 Interface de Usuário

### Carrossel de Stories

```
┌─────────────────────────────────────────┐
│  ➕     👤      👤      👤      👤     │
│  Seu    5h     2h    Expirando  23h   │
│ story   Nina   Cyber             Alice │
└─────────────────────────────────────────┘
```

### Visualização de Story

```
┌──────────────────────────┐
│ ════════════════════ 80% │  ← Progress bar
├──────────────────────────┤
│  👤 @neon_nina           │
│     2h 30m restante      │  ← Header
├──────────────────────────┤
│                          │
│       [  IMAGEM  ]       │  ← Story
│                          │
│        (autoplay)        │
│                          │
├──────────────────────────┤
│  👁️ Story expira em 2h   │  ← Footer
└──────────────────────────┘
```

---

## ⚙️ Configurações do Sistema

### Tempo de Expiração
- **Padrão:** 24 horas
- **Local:** `backend/models/Story.js`
- Modificar: `datetime('now', '+24 hours')`

### Frequência de Limpeza
- **Padrão:** A cada 30 minutos
- **Local:** `backend/cleanup-stories.js`
- Modificar: `setInterval(cleanupExpiredStories, 30 * 60 * 1000)`

### Tamanho Máximo de Arquivo
- **Padrão:** 10MB
- **Local:** `backend/controllers/storyController.js`
- Modificar: `limits: { fileSize: 10 * 1024 * 1024 }`

---

## 🧪 Testando o Sistema

### Rodar Testes Completos
```bash
cd backend
node test-stories-flow.js
```

### Testar via cURL

#### 1. Criar story
```bash
curl -X POST http://localhost:3000/stories/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg" \
  -F "userId=1"
```

#### 2. Ver stories ativas
```bash
curl http://localhost:3000/stories/active?limit=10
```

#### 3. Marcar como visualizado
```bash
curl -X POST http://localhost:3000/stories/123/view \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🚀 Performance & Otimizações

### Índices do Banco de Dados
- `expires_at` indexado para queries rápidas de cleanup
- `user_id` indexado para queries por usuário
- `story_id` em `story_views` para queries de visualizações

### Lazy Loading
- Stories carregadas sob demanda
- Recarregamento a cada 30 segundos
- Progress bar animada em tempo real

### Cleanup Eficiente
- Executa em background
- Não bloqueia aplicação
- Deleta arquivo + registro em uma transação

---

## 🛡️ Segurança

### Validações
- ✅ Apenas imagens permitidas (JPEG, PNG, GIF, WebP)
- ✅ Limite de tamanho (10MB)
- ✅ Nomes de arquivo aleatórios
- ✅ Validação de token JWT

### Proteção de Dados
- ✅ Chaves estrangeiras para integridade
- ✅ Cascade delete automático
- ✅ Limpeza de arquivos órfãos

---

## 📋 Checklist de Funcionalidades

- [x] Criação de stories com upload de imagem
- [x] Expiração automática em 24 horas
- [x] Visualização com timer dinâmico
- [x] Progress bar animada
- [x] Rastreamento de visualizações
- [x] Limpeza automática (arquivo + BD)
- [x] Interface responsiva
- [x] Validação de arquivos
- [x] Tratamento de erros
- [x] Logs detalhados

---

## 🔗 Arquivos Relacionados

```
backend/
├── models/Story.js                 ← Lógica da story
├── controllers/storyController.js  ← Controle de requisições
├── routes/stories.js               ← Definição de rotas
├── cleanup-stories.js              ← Limpeza automática
├── test-stories-flow.js            ← Testes
├── schema.sql                       ← BD schema
└── uploads/stories/                ← Armazenagem de imagens

frontend/
├── app.js                          ← Carregamento de stories
├── api-client.js                   ← Requisições da API
├── styles.css                      ← Estilos
└── index.html                      ← HTML principal
```

---

## ✅ Status do Sistema

**Estado:** ✅ **PRONTO PARA USO**

- ✅ Backend totalmente implementado
- ✅ Frontend com interface responsiva
- ✅ Banco de dados otimizado
- ✅ Limpeza automática funcionando
- ✅ Tratamento de erros robusto
- ✅ Documentação completa

---

## 📞 Suporte

Para bugs ou melhorias, reporte em:
- **Backend:** `backend/DEBUG_GUIDE.md`
- **Frontend:** Console do navegador (F12)
- **BD:** `backend/DATABASE_SETUP.md`

---

**Última atualização:** 13 de abril de 2026  
**Versão:** 1.0.0 - Stories com Expiração 24h
