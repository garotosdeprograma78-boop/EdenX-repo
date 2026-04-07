# 💬 Sistema de Mensagens EdenX - Guia Completo

## ✅ Status Atual

- ✅ **Banco de Dados**: Funcionando e persistindo mensagens
- ✅ **API REST**: Salvando com todos os campos (id, sender_id, recipient_id, message_text)
- ✅ **WebSocket**: Entregando mensagens em tempo real
- ✅ **Frontend**: Com logs detalhados para debug

## 🚀 Passo 1: Iniciar o Sistema

### 1.1 Abra um terminal na pasta `backend`:
```bash
cd backend
npm start
```

**Você deve ver:**
```
✓ Conexão com banco de dados MySQL estabelecida com sucesso: edenx_db
🚀 Servidor EdenX rodando em http://localhost:3001
📱 WebSocket ativo para mensagens em tempo real
```

### 1.2 Em outro terminal, rode o verificador de status:
```bash
cd backend
node check-status.js
```

**Você deve ver:**
```
✅ Servidor está rodando
✅ Banco de dados conectado
✅ Todas as colunas obrigatórias existem
```

## 🎯 Passo 2: Testar o Envio de Mensagens

### 2.1 Abra a aplicação no navegador:
- Acesse `http://localhost` (ou conforme configurado)
- Faça login com suas credenciais

### 2.2 Abra o Console do Navegador:
- Pressione `F12` ou `Ctrl+Shift+I`
- Vá para a aba **Console**

### 2.3 Envie uma mensagem:
1. Vá para a seção **Direct/Mensagens**
2. Selecione um usuário
3. Digite uma mensagem
4. Clique em **Enviar**

### 2.4 Verifique os logs:
No Console, você deve ver algo como:

```
📝 handleSendMessage chamado
   - Texto: "Olá!"
   - Chat ativo com user: 2
   - Arquivo: nenhum
   - Autenticado: true

🔐 Enviando mensagem via API...

🌐 apiRequest: POST http://localhost:3001/api/messages
   Headers: {Content-Type: "application/json", Authorization: "Bearer eyJ..."}
   Status: 201
   ✓ Sucesso

📊 Resposta da API:
{success: true, data: Object}

✓ Mensagem salva no banco com sucesso!
   - ID da mensagem: 123
```

## 🔍 Verificar se Mensagens Foram Salvas

### Opção 1: Verificar no Console
```javascript
// No Console do navegador, após enviar uma mensagem
console.log('Mensagem salva com sucesso')
```

### Opção 2: Executar teste automático
```bash
cd backend
node test-complete-flow.js
```

**Resultado esperado:**
```
✓ Mensagem inserida com sucesso!
   📍 ID da mensagem inserida: 7
✓ Mensagem recuperada do banco
```

### Opção 3: Verificar diretamente no banco

```bash
cd backend
node diagnostic-db.js
```

**Mostra:**
```
✓ Total de mensagens no banco: 8

📝 Últimas 5 mensagens:
   1. ID: 8 | De: neon_nina → cyber_punk
      "Olá, tudo bem?"
```

## 🛠️ Scripts Disponíveis

| Script | Comando | O que faz |
|--------|---------|----------|
| **Verificar Status** | `node check-status.js` | Verifica se servidor e BD estão OK |
| **Diagnóstico BD** | `node diagnostic-db.js` | Mostra esquema e mensagens no BD |
| **Teste Completo** | `node test-complete-flow.js` | Simula fluxo completo de inserção |
| **Teste de Mensagens** | `node test-messages.js` | Testa criação e recuperação de mensagens |
| **Reset de Mensagens** | `node reset-messages.js` | Limpa todas as mensagens (para testes) |

## 📊 Estrutura do Banco de Dados

### Tabela: `messages`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT (PK, AUTO_INCREMENT) | ID único da mensagem |
| `sender_id` | INT (FK) | ID do usuário que enviou |
| `recipient_id` | INT (FK) | ID do usuário que recebeu |
| `message_text` | TEXT | Conteúdo da mensagem |
| `media_url` | VARCHAR(500) | URL da mídia (se houver) |
| `media_type` | VARCHAR(50) | Tipo: 'image' ou 'video' |
| `is_read` | BOOLEAN | Status de leitura |
| `created_at` | TIMESTAMP | Data de criação |

## 🔗 Fluxo de Envio de Mensagem

```
1. Usuário digita mensagem
   ↓
2. Clica em "Enviar"
   ↓
3. handleSendMessage() é chamado
   ↓
4. Requisição POST /api/messages
   ↓
5. Backend recebe e valida
   ↓
6. INSERT na tabela messages
   ↓
7. Retorna ID + dados
   ↓
8. Emite via WebSocket
   ↓
9. Destinatário recebe em tempo real
   ↓
10. Mensagem aparece na conversa
```

## ⚠️ Troubleshooting

### Problema: "Mensagem não está sendo salva"

**Verificação 1: Servidor está rodando?**
```bash
node check-status.js
```
Se retornar "servidor NÃO está rodando":
```bash
cd backend && npm start
```

**Verificação 2: Banco conectado?**
```bash
node diagnostic-db.js
```
Se retornar erro de conexão, verifique `.env`

**Verificação 3: Autenticação OK?**
- Abra DevTools (F12)
- Console: `console.log(SESSION.token)`
- Se for `null`, você não está autenticado

**Verificação 4: CORS ou erro HTTP?**
- DevTools → Network tab
- Envie uma mensagem
- Procure por POST `/api/messages`
- Verifique status e resposta

### Problema: "Erro 401 Unauthorized"

- Sua sessão expirou
- Faça logout e login novamente
- Ou verifique JWT_SECRET em .env

### Problema: "Erro 500 Internal Server Error"

- Backend está com erro
- Verifique logs do servidor (terminal onde rodou `npm start`)
- Rode `node diagnostic-db.js`

### Problema: "Porta 3001 já está em uso"

```bash
# Encontre o processo
netstat -ano | findstr :3001

# Mate o processo (Se for 1234)
taskkill /PID 1234 /F

# Ou mude a PORT em .env
PORT=3002
```

## ✨ Recursos Implementados

- ✅ Envio de mensagens de texto
- ✅ Envio de mensagens com mídia (imagens/vídeos)
- ✅ Persistência completa no banco
- ✅ Entrega em tempo real via WebSocket
- ✅ Autenticação via JWT
- ✅ Histórico de conversas
- ✅ Status de leitura
- ✅ Logs detalhados para debug

## 📝 Exemplos de Queries SQL

**Ver todas as mensagens:**
```sql
SELECT * FROM messages ORDER BY created_at DESC;
```

**Ver conversa entre dois usuários:**
```sql
SELECT * FROM messages 
WHERE (sender_id = 1 AND recipient_id = 2) 
   OR (sender_id = 2 AND recipient_id = 1)
ORDER BY created_at;
```

**Contar mensagens por usuário:**
```sql
SELECT sender_id, COUNT(*) as enviadas FROM messages GROUP BY sender_id;
```

**Mensagens não lidas:**
```sql
SELECT * FROM messages WHERE is_read = 0;
```

## 🎓 Como Usar os Logs de Debug

### No Console do Navegador:

1. Envie uma mensagem
2. Você verá uma sequência de logs:
   - 📝 handleSendMessage chamado
   - 🔐 Enviando mensagem via API
   - 🌐 apiRequest (requisição)
   - 📊 Resposta da API
   - ✓ Mensagem salva com sucesso

3. Se algo falhar, você verá:
   - ❌ Erro com descrição
   - 📋 Dados que foram enviados
   - 🔗 Endpoint que foi chamado

## 🚦 Next Steps

1. ✅ Sistema está funcionando
2. ✅ Mensagens estão sendo salvas
3. 🎯 Próximo: Implementar notificações de mensagens não lidas
4. 🎯 Depois: Adicionar busca de mensagens
5. 🎯 Depois: Adicionar reações a mensagens

---

**Sistema criado com ❤️ para EdenX - Rede Social**
