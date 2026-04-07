const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function resetMessages() {
  console.log('🔄 Resetando tabela de mensagens\n');

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('✓ Conectado ao banco de dados\n');

    // Verificar quantidade antes
    const [countBefore] = await connection.query('SELECT COUNT(*) as total FROM messages');
    const beforeCount = countBefore[0].total;
    console.log(`📊 Mensagens antes: ${beforeCount}`);

    // Limpar a tabela
    console.log('\n🗑️  Limpando tabela messages...');
    await connection.query('DELETE FROM messages');
    console.log('✓ Tabela limpa');

    // Resetar AUTO_INCREMENT
    console.log('🔢 Resetando contador de ID...');
    await connection.query('ALTER TABLE messages AUTO_INCREMENT = 1');
    console.log('✓ Contador resetado\n');

    // Verificar quantidade depois
    const [countAfter] = await connection.query('SELECT COUNT(*) as total FROM messages');
    const afterCount = countAfter[0].total;
    console.log(`📊 Mensagens depois: ${afterCount}`);

    await connection.end();

    console.log('\n✅ Reset concluído com sucesso!');
    console.log('\n💡 Agora você pode testar o envio de mensagens do zero.\n');

  } catch (error) {
    console.error('❌ Erro ao resetar:', error.message);
    process.exit(1);
  }
}

resetMessages();
