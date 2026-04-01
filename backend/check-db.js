const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME
} = process.env;

async function check() {
  if (DB_HOST && DB_NAME) {
    try {
      const conn = await mysql.createConnection({
        host: DB_HOST,
        port: DB_PORT ? Number(DB_PORT) : 3306,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME
      });

      const [rows] = await conn.execute('SELECT COUNT(*) as count FROM users');
      console.log('Usuários no banco MySQL:', rows[0].count);
      await conn.end();
      return;
    } catch (err) {
      console.error('Falha no MySQL:', err.message || err);
      // Continua para SQLite fallback
    }
  }

  const dbPath = path.join(__dirname, 'edenx.db');
  const db = new sqlite3.Database(dbPath);
  db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
    if (err) {
      console.error('Erro no banco SQLite:', err);
    } else {
      console.log('Usuários no banco SQLite:', row.count);
    }
    db.close();
  });
}

check();