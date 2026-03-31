const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

async function resetDatabase() {
  try {
    const dbPath = path.join(__dirname, 'edenx.db');
    
    // Deletar banco existente se houver
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      console.log('✓ Banco de dados antigo removido');
    }

    // Criar novo banco e executar schema
    const db = new sqlite3.Database(dbPath, async (err) => {
      if (err) {
        console.error('✗ Erro ao criar banco de dados:', err.message);
        process.exit(1);
      }

      console.log('✓ Conectado ao SQLite');

      const schema = `
        -- Tabela de Usuários
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT,
          display_name TEXT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          avatar_url TEXT,
          bio TEXT,
          location TEXT,
          link TEXT,
          anniversary DATE,
          followers INTEGER DEFAULT 0,
          following INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Tabela de Seguidores
        CREATE TABLE followers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          follower_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(user_id, follower_id)
        );

        -- Tabela de Posts
        CREATE TABLE posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          caption TEXT,
          image_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        -- Tabela de Curtidas em Posts
        CREATE TABLE likes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          post_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(post_id, user_id)
        );

        -- Tabela de Comentários
        CREATE TABLE comments (
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
        CREATE TABLE stories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          image_url TEXT NOT NULL,
          story_type TEXT DEFAULT 'image',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        -- Tabela de Visualizações de Stories
        CREATE TABLE story_views (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          story_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(story_id, user_id)
        );

        -- Tabela de Mensagens
        CREATE TABLE messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sender_id INTEGER NOT NULL,
          receiver_id INTEGER NOT NULL,
          message_text TEXT NOT NULL,
          is_read INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `;

      db.exec(schema, (err) => {
        if (err) {
          console.error('✗ Erro ao executar schema:', err.message);
          process.exit(1);
        }
        console.log('✓ Banco de dados reinicializado com sucesso!');
        db.close();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('✗ Erro:', error.message);
    process.exit(1);
  }
}

resetDatabase();
