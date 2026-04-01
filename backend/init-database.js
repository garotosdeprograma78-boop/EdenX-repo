const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
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

async function initializeDatabase() {
  if (DB_HOST && DB_NAME) {
    // Criar DB MySQL usando schema.sql
    try {
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');

      const connection = await mysql.createConnection({
        host: DB_HOST,
        port: DB_PORT ? Number(DB_PORT) : 3306,
        user: DB_USER,
        password: DB_PASSWORD,
        multipleStatements: true
      });

      await connection.query(schemaSql);
      await connection.end();

      console.log('✓ Banco de dados MySQL inicializado com sucesso (schema.sql)');
      return;
    } catch (err) {
      console.error('✗ Erro ao inicializar MySQL:', err.message || err);
      throw err;
    }
  }

  // fallback SQLite
  const dbPath = path.join(__dirname, 'edenx.db');

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('✗ Erro ao conectar ao banco de dados SQLite:', err.message);
        reject(err);
        return;
      }

      console.log('✓ Conectado ao SQLite');

      // Schema adaptado para SQLite
      const schema = `
        -- Tabela de Usuários
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          avatar_url TEXT,
          bio TEXT,
          followers INTEGER DEFAULT 0,
          following INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Tabela de Seguidores
        CREATE TABLE IF NOT EXISTS followers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          follower_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(user_id, follower_id)
        );

        -- Tabela de Posts
        CREATE TABLE IF NOT EXISTS posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          caption TEXT,
          image_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        -- Tabela de Curtidas em Posts
        CREATE TABLE IF NOT EXISTS likes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          post_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(post_id, user_id)
        );

        -- Tabela de Comentários
        CREATE TABLE IF NOT EXISTS comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          post_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          comment_text TEXT NOT NULL,
          parent_comment_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE
        );

        -- Tabela de Stories
        CREATE TABLE IF NOT EXISTS stories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          image_url TEXT NOT NULL,
          story_type TEXT DEFAULT 'image',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        -- Tabela de Visualizações de Stories
        CREATE TABLE IF NOT EXISTS story_views (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          story_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(story_id, user_id)
        );

        -- Tabela de Mensagens
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sender_id INTEGER NOT NULL,
          recipient_id INTEGER NOT NULL,
          message_text TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
        );

        -- Tabela de Reels
        CREATE TABLE IF NOT EXISTS reels (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          video_url TEXT,
          thumbnail_url TEXT,
          caption TEXT,
          likes_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `;

      // Executar schema
      db.exec(schema, (err) => {
        if (err) {
          console.error('✗ Erro ao executar schema:', err.message);
          reject(err);
        } else {
          console.log('✓ Banco de dados inicializado com sucesso!');
          console.log('  Arquivo: edenx.db');
          db.close((err) => {
            if (err) {
              console.error('Erro ao fechar DB:', err);
            }
            resolve();
          });
        }
      });
    });
  });
}

initializeDatabase();
