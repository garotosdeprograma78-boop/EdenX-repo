const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME
} = process.env;

async function migrateDatabase() {
  console.log('🔄 Iniciando migração do banco de dados...\n');

  try {
    const connection = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT ? Number(DB_PORT) : 3306,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME
    });

    console.log('✓ Conectado ao banco de dados MySQL\n');

    // Verificar se as colunas já existem
    const [rows] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'messages' AND TABLE_SCHEMA = ?`,
      [DB_NAME]
    );

    const columnNames = rows.map(row => row.COLUMN_NAME);
    const hasMediaUrl = columnNames.includes('media_url');
    const hasMediaType = columnNames.includes('media_type');
    const hasIsRead = columnNames.includes('is_read');

    console.log('📋 Colunas atuais na tabela messages:');
    columnNames.forEach(col => console.log(`   - ${col}`));
    console.log();

    // Adicionar colunas faltantes
    if (!hasMediaUrl) {
      console.log('➕ Adicionando coluna media_url...');
      await connection.query(
        `ALTER TABLE messages ADD COLUMN media_url VARCHAR(500) DEFAULT NULL`
      );
      console.log('✓ Coluna media_url adicionada\n');
    } else {
      console.log('✓ Coluna media_url já existe\n');
    }

    if (!hasMediaType) {
      console.log('➕ Adicionando coluna media_type...');
      await connection.query(
        `ALTER TABLE messages ADD COLUMN media_type VARCHAR(50) DEFAULT NULL`
      );
      console.log('✓ Coluna media_type adicionada\n');
    } else {
      console.log('✓ Coluna media_type já existe\n');
    }

    if (!hasIsRead) {
      console.log('➕ Adicionando coluna is_read...');
      await connection.query(
        `ALTER TABLE messages ADD COLUMN is_read BOOLEAN DEFAULT 0`
      );
      console.log('✓ Coluna is_read adicionada\n');
    } else {
      console.log('✓ Coluna is_read já existe\n');
    }

    // Verificar schema final
    const [finalRows] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'messages' AND TABLE_SCHEMA = ?`,
      [DB_NAME]
    );

    console.log('📊 Esquema final da tabela messages:');
    finalRows.forEach(row => console.log(`   - ${row.COLUMN_NAME}`));
    console.log();

    await connection.end();

    console.log('✅ Migração concluída com sucesso!');
    console.log('\n🎯 A tabela messages agora possui os campos:');
    console.log('   ✓ id (PRIMARY KEY, AUTO_INCREMENT)');
    console.log('   ✓ sender_id (ID do usuário que enviou)');
    console.log('   ✓ recipient_id (ID do usuário que recebeu)');
    console.log('   ✓ message_text (Mensagem de texto)');
    console.log('   ✓ media_url (URL da mídia, opcional)');
    console.log('   ✓ media_type (Tipo de mídia: image/video, opcional)');
    console.log('   ✓ is_read (Status de leitura)');
    console.log('   ✓ created_at (Data da criação)\n');

  } catch (error) {
    console.error('❌ Erro durante migração:', error.message);
    process.exit(1);
  }
}

migrateDatabase();
