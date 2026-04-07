const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function completeTestFlow() {
  console.log('🔧 Teste Completo de Fluxo de Mensagem\n');
  console.log('Este teste verifica:');
  console.log('  1. Conexão ao banco de dados');
  console.log('  2. Salvamento de mensagem no banco\n');

  let connection;

  try {
    // Conectar ao banco
    console.log('📝 Passo 1: Conectando ao banco de dados...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    console.log('✓ Conectado ao banco\n');

    // Verificar usuários
    console.log('📝 Passo 2: Verificando usuários disponíveis...');
    const [users] = await connection.query(
      'SELECT id, username, email FROM users LIMIT 5'
    );
    console.log(`✓ ${users.length} usuários encontrados:`);
    users.forEach(u => console.log(`   - ID ${u.id}: ${u.username} (${u.email})`));
    console.log();

    // Testar inserção de mensagem
    console.log('📝 Passo 3: Testando inserção de mensagem...');
    
    const senderId = 1; // neon_nina
    const recipientId = 2; // cyber_punk
    const messageText = `Teste de mensagem - ${new Date().toISOString()}`;
    
    console.log(`   - De: usuário ID ${senderId}`);
    console.log(`   - Para: usuário ID ${recipientId}`);
    console.log(`   - Mensagem: "${messageText}"\n`);

    const insertQuery = `
      INSERT INTO messages (sender_id, recipient_id, message_text, created_at, is_read)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, 0)
    `;

    const [result] = await connection.query(insertQuery, [
      senderId,
      recipientId,
      messageText
    ]);

    console.log('✓ Mensagem inserida com sucesso!');
    console.log(`   📍 ID da mensagem inserida: ${result.insertId}`);
    console.log(`   ✓ Linhas afetadas: ${result.affectedRows}\n`);

    // Verificar se a mensagem foi salva
    console.log('📝 Passo 4: Verificando se a mensagem foi salva...');
    const [verifyResult] = await connection.query(
      `SELECT * FROM messages WHERE id = ?`,
      [result.insertId]
    );

    if (verifyResult.length === 0) {
      console.log('❌ ERRO: Mensagem não foi encontrada no banco!\n');
      process.exit(1);
    }

    const savedMessage = verifyResult[0];
    console.log('✓ Mensagem recuperada do banco:');
    console.log(`   - ID: ${savedMessage.id}`);
    console.log(`   - sender_id: ${savedMessage.sender_id}`);
    console.log(`   - recipient_id: ${savedMessage.recipient_id}`);
    console.log(`   - message_text: "${savedMessage.message_text}"`);
    console.log(`   - created_at: ${savedMessage.created_at}`);
    console.log(`   - is_read: ${savedMessage.is_read}\n`);

    // Testar com mídia
    console.log('📝 Passo 5: Testando inserção com mídia...');
    const mediaQuery = `
      INSERT INTO messages (sender_id, recipient_id, message_text, media_url, media_type, created_at, is_read)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 0)
    `;

    const [mediaResult] = await connection.query(mediaQuery, [
      2,
      1,
      'Veja esta imagem incrível!',
      '/uploads/messages/image-12345.jpg',
      'image'
    ]);

    console.log('✓ Mensagem com mídia inserida com sucesso!');
    console.log(`   📍 ID da mensagem: ${mediaResult.insertId}\n`);

    // Recuperar última mensagem
    console.log('📝 Passo 6: Recuperando últimas mensagens...');
    const [lastMessages] = await connection.query(
      `SELECT m.*, u1.username as sender_username, u2.username as recipient_username
       FROM messages m
       LEFT JOIN users u1 ON m.sender_id = u1.id
       LEFT JOIN users u2 ON m.recipient_id = u2.id
       ORDER BY m.created_at DESC
       LIMIT 3`
    );

    console.log('✓ Últimas 3 mensagens:');
    lastMessages.forEach((msg, idx) => {
      console.log(`   ${idx + 1}. ID: ${msg.id} | ${msg.sender_username} → ${msg.recipient_username}`);
      console.log(`      "${msg.message_text || '(sem texto)'}"`);
      console.log(`      ${msg.media_url ? '📸 Mídia: ' + msg.media_url : ''}`);
    });
    console.log();

    // Contar total de mensagens
    console.log('📝 Passo 7: Contando total de mensagens...');
    const [countResult] = await connection.query(
      'SELECT COUNT(*) as total FROM messages'
    );
    console.log(`✓ Total de mensagens no banco: ${countResult[0].total}\n`);

    console.log('✅ TESTE COMPLETO CONCLUÍDO COM SUCESSO!\n');
    console.log('📊 Resumo Final:');
    console.log('   ✓ Mensagens estão sendo salvas no banco');
    console.log('   ✓ Todos os campos (id, sender_id, recipient_id, message_text) estão sendo armazenados');
    console.log('   ✓ Suporte a mídia funcionando');
    console.log('   ✓ Timestamps sendo registrados automaticamente\n');
    console.log('💡 Se as mensagens não aparecem na interface, o problema pode ser:');
    console.log('   1. Frontend não está enviando requisições para /api/messages');
    console.log('   2. Erro de autenticação (token inválido)');
    console.log('   3. CORS não permitindo requisições\n');

    await connection.end();

  } catch (error) {
    console.error('❌ Erro durante teste:', error.message);
    console.error('\nDetalhes do erro:');
    console.error(error);
    process.exit(1);
  }
}

completeTestFlow();
