const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_USE_SQLITE
} = process.env;

let pool;

if (DB_USE_SQLITE === 'true' || !DB_HOST || !DB_NAME) {
  // Fallback para SQLite (se MySQL não estiver configurado)
  const dbPath = path.join(__dirname, '..', 'edenx.db');
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('✗ Erro ao conectar ao banco de dados SQLite:', err.message);
    } else {
      console.log('✓ Conexão com banco de dados SQLite estabelecida com sucesso');
    }
  });

  pool = {
    query: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) {
            console.error('Erro na query SQLite:', sql, err);
            reject(err);
          } else {
            resolve({ rows });
          }
        });
      });
    },
    getConnection: () => Promise.resolve(db),
    execute: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
          if (err) {
            console.error('Erro no execute SQLite:', sql, err);
            reject(err);
          } else {
            resolve({ insertId: this.lastID, affectedRows: this.changes });
          }
        });
      });
    }
  };
} else {
  const connectionPool = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT ? Number(DB_PORT) : 3306,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    namedPlaceholders: false,
    multipleStatements: false
  });

  console.log('✓ Conexão com banco de dados MySQL estabelecida com sucesso:', DB_NAME);

  pool = {
    query: async (sql, params = []) => {
      const [rows] = await connectionPool.query(sql, params);
      return { rows };
    },
    getConnection: () => connectionPool.getConnection(),
    execute: async (sql, params = []) => {
      const [result] = await connectionPool.execute(sql, params);
      return { insertId: result.insertId, affectedRows: result.affectedRows };
    }
  };
}

module.exports = pool;
