# 🔍 Guia de Debug - Sistema de Mensagens

## 📊 Status Atual

✅ **Banco de Dados**: Funcionando corretamente
✅ **API de Mensagens**: Salvando no banco
✅ **WebSocket**: Conectando em tempo real

## 🚀 Como Testar

### 1. Iniciar o Servidor Backend

```bash
cd backend
npm start
```

Você deve ver:
```
✓ Conexão com banco de dados MySQL estabelecida com sucesso: edenx_db
🚀 Servidor EdenX rodando em http://localhost:3001
📱 WebSocket ativo para mensagens em tempo real
```

### 2. Abrir a Aplicação

1. Abra `http://localhost:3000` (ou conforme configurado)
2. Faça login com um usuário
3. Abra o **Developer Console** (F12 ou Ctrl+Shift+I)
4. Vá para a aba **Console**

### 3. Enviar uma Mensagem

1. Vá para a seção **Mensagens** (Direct)
2. Selecione um usuário para conversar
3. Digite uma mensagem
4. Clique em **Enviar**

### 4. Verificar os Logs

No Console do Developer, você deve ver:

```
📝 handleSendMessage chamado
   - Texto: "Sua mensagem"
   - Chat ativo com user: 2
   - Arquivo: nenhum
   - Autenticado: true

🔐 Enviando mensagem via API...

🌐 apiRequest: POST http://localhost:3001/api/messages
   Headers: {Content-Type: "application/json", Authorization: "Bearer eyJ..."}
   Status: 201
   ✓ Sucesso

📊 Resposta da API:
{success: true, data: {...}}

✓ Mensagem salva no banco com sucesso!
   - ID da mensagem: 123
```

## 🔧 Scripts de Teste

### Teste de Banco de Dados

```bash
cd backend
node diagnostic-db.js
```

Verifica:
- Conexão ao MySQL
- Estrutura da tabela messages
- Quantas mensagens existem
- Últimas mensagens salvas

### Teste Completo de Fluxo

```bash
cd backend
node test-complete-flow.js
```

Simula:
1. Inserção de mensagem de texto
2. Inserção de mensagem com mídia
3. Recuperação de mensagens
4. Listagem de conversas

### Teste de API

```bash
cd backend
node test-messages.js
```

Testa:
1. Criação de mensagens
2. Recuperação de conversa
3. Listagem de conversas do usuário
4. Contagem de mensagens não lidas

## 📋 Checklist de Debug

### Se as mensagens NÃO estão sendo salvas:

- [ ] **Servidor está rodando?**
  ```bash
  netstat -ano | findstr :3001
  ```

- [ ] **Autenticação OK?**
  Verifique no Console: `SESSION.token` deve ter um valor
  
- [ ] **Erro na requisição?**
  Procure por `❌ Erro na requisição` no Console

- [ ] **CORS bloqueando?**
  Procure por erros de CORS no Network tab

- [ ] **Banco de dados conectão?**
  Abra `diagnostic-db.js`

### Se as mensagens estão salvando mas não aparecem:

- [ ] **Frontend carregando as mensagens?**
  Verifique `loadChatList()` no Console

- [ ] **Socket.io conectado?**
  Verifique `✓ API Client carregado` no Console

- [ ] **WebSocket events chegando?**
  Procure por `Mensagem recebida (WebSocket)` no Console

## 🗄️ Verificar Banco Diretamente

```sql
SELECT * FROM messages ORDER BY created_at DESC LIMIT 5;
```

Deve retornar algo como:

```
| id | sender_id | recipient_id | message_text           | media_url | created_at          |
|----|-----------|--------------|------------------------|-----------|---------------------|
| 8  | 1         | 2            | Teste de mensagem      | NULL      | 2026-04-07 08:35:56 |
| 7  | 2         | 1            | Veja esta imagem!      | /uploads/ | 2026-04-07 08:24:09 |
```

## 🎯 Fluxo Esperado

```
Frontend (handleSendMessage)
    ↓
apiRequest POST /api/messages
    ↓
Backend (messageController.sendMessage)
    ↓
Database (INSERT into messages)
    ↓
Retorna ID e dados
    ↓
sendMessageViaSocket
    ↓
WebSocket emit 'send-message'
    ↓
Backend salva no BD (via socket)
    ↓
Destinatário recebe via WebSocket
```

## 📞 Comandos Úteis

**Resetar banco de dados (remover todas as mensagens):**
```bash
cd backend
node reset-database.js
```

**Contar mensagens no banco:**
```sql
SELECT COUNT(*) FROM messages;
```

**Ver mensagens de um usuário:**
```sql
SELECT * FROM messages 
WHERE sender_id = 1 OR recipient_id = 1
ORDER BY created_at DESC;
```

**Deletar uma mensagem:**
```sql
DELETE FROM messages WHERE id = 123;
```

## ⚠️ Possíveis Erros

### Erro: "Unknown column 'media_url'"
- Execute: `node backend/migrate-database.js`

### Erro: "Port 3001 already in use"
- Altere a PORT em .env
- Ou encontre o processo: `netstat -ano | findstr :3001`

### Erro: "Token inválido"
- Faça login novamente
- Verifique se JWT_SECRET em .env está correto

### Erro: "Destinatário inválido"
- recipient_id deve ser um user_id válido
- Verifique em: `SELECT id FROM users`

## ✅ Confirmação de Sucesso

Quando uma mensagem é enviada com sucesso, você deve ver:

1. ✓ Log no Console do Frontend
2. ✓ Nova linha em `messages` table
3. ✓ Mensagem aparecendo na conversa
4. ✓ WebSocket entregando em tempo real
