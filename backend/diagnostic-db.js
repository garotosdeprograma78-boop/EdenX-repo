const pool = require('./config/database');
const dotenv = require('dotenv');

dotenv.config();

async function diagnosticDatabase() {
  console.log('🔍 Diagnóstico do Banco de Dados\n');

  try {
    // Teste 1: Verificar conexão
    console.log('📋 Teste 1: Verificando conexão com banco...');
    const healthResult = await pool.query('SELECT 1 as health');
    console.log('✓ Conexão estabelecida\n');

    // Teste 2: Verificar esquema da tabela messages
    console.log('📋 Teste 2: Verificando esquema da tabela messages...');
    const schemaResult = await pool.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'messages'
      AND TABLE_SCHEMA = DATABASE()
    `);

    if (schemaResult.rows.length === 0) {
      console.log('❌ Tabela messages não encontrada ou sem colunas\n');
    } else {
      console.log('✓ Colunas da tabela messages:');
      schemaResult.rows.forEach(col => {
        console.log(`   - ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'} ${col.COLUMN_KEY ? `[${col.COLUMN_KEY}]` : ''}`);
      });
      console.log();
    }

    // Teste 3: Verificar registros existentes
    console.log('📋 Teste 3: Contando registros na tabela messages...');
    const countResult = await pool.query('SELECT COUNT(*) as total FROM messages');
    console.log(`✓ Total de mensagens no banco: ${countResult.rows[0].total}\n`);

    // Teste 4: Listar últimas mensagens
    console.log('📋 Teste 4: Últimas 5 mensagens:');
    const recentResult = await pool.query(`
      SELECT m.id, m.sender_id, m.recipient_id, m.message_text, m.created_at,
             u1.username as sender_username, u2.username as recipient_username
      FROM messages m
      LEFT JOIN users u1 ON m.sender_id = u1.id
      LEFT JOIN users u2 ON m.recipient_id = u2.id
      ORDER BY m.created_at DESC
      LIMIT 5
    `);

    if (recentResult.rows.length === 0) {
      console.log('   (nenhuma mensagem encontrada)\n');
    } else {
      recentResult.rows.forEach((msg, idx) => {
        console.log(`   ${idx + 1}. ID: ${msg.id} | De: ${msg.sender_username}(${msg.sender_id}) → Para: ${msg.recipient_username}(${msg.recipient_id})`);
        console.log(`      Texto: "${msg.message_text?.substring(0, 50) || '(sem texto)'}${ msg.message_text?.length > 50 ? '...' : ''}" `);
        console.log(`      Data: ${msg.created_at}\n`);
      });
    }

    // Teste 5: Verificar usuários
    console.log('📋 Teste 5: Usuários no banco:');
    const usersResult = await pool.query('SELECT id, username, email FROM users LIMIT 5');
    usersResult.rows.forEach(user => {
      console.log(`   - ${user.id}: ${user.username} (${user.email})`);
    });
    console.log();

    console.log('✅ Diagnóstico concluído\n');
    console.log('📊 Resumo:');
    console.log(`   ✓ Banco de dados conectado`);
    console.log(`   ✓ Tabela messages existe com ${schemaResult.rows.length} colunas`);
    console.log(`   ✓ Total de mensagens: ${countResult.rows[0].total}`);

  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error.message);
    console.error('\nDetalhes:');
    console.error(error);
    process.exit(1);
  }
}

diagnosticDatabase();
