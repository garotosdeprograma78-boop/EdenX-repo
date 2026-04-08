-- Banco de Dados EdenX

-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS edenx_db;
USE edenx_db;

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(255),
  display_name VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  bio TEXT,
  location VARCHAR(255),
  link VARCHAR(500),
  anniversary DATE,
  followers INT DEFAULT 0,
  following INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email)
);

-- Tabela de Seguidores
CREATE TABLE IF NOT EXISTS followers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  follower_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_follow (user_id, follower_id),
  INDEX idx_user_id (user_id),
  INDEX idx_follower_id (follower_id)
);

-- Tabela de Posts
CREATE TABLE IF NOT EXISTS posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  caption TEXT,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);

-- Tabela de Curtidas em Posts
CREATE TABLE IF NOT EXISTS likes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_like (post_id, user_id),
  INDEX idx_post_id (post_id),
  INDEX idx_user_id (user_id)
);

-- Tabela de Comentários
CREATE TABLE IF NOT EXISTS comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_post_id (post_id),
  INDEX idx_user_id (user_id)
);

-- Tabela de Stories
CREATE TABLE IF NOT EXISTS stories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  image_url VARCHAR(500) NOT NULL,
  story_type VARCHAR(50) DEFAULT 'image',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);

-- Tabela de Visualizações de Stories
CREATE TABLE IF NOT EXISTS story_views (
  id INT PRIMARY KEY AUTO_INCREMENT,
  story_id INT NOT NULL,
  user_id INT NOT NULL,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_view (story_id, user_id),
  INDEX idx_story_id (story_id)
);

-- Tabela de Mensagens
CREATE TABLE IF NOT EXISTS messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sender_id INT NOT NULL,
  recipient_id INT NOT NULL,
  message_text TEXT,
  media_url VARCHAR(500),
  media_type VARCHAR(50),
  is_read BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sender_id (sender_id),
  INDEX idx_recipient_id (recipient_id),
  INDEX idx_conversation (sender_id, recipient_id),
  INDEX idx_created_at (created_at)
);

-- Tabela de Reels
CREATE TABLE IF NOT EXISTS reels (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  video_url VARCHAR(500) NOT NULL,
  caption TEXT,
  thumbnail_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);

-- Tabela de Curtidas em Reels
CREATE TABLE IF NOT EXISTS reel_likes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  reel_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reel_id) REFERENCES reels(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_reel_like (reel_id, user_id),
  INDEX idx_reel_id (reel_id)
);

-- Tabela de Comentários em Reels
CREATE TABLE IF NOT EXISTS reel_comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  reel_id INT NOT NULL,
  user_id INT NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reel_id) REFERENCES reels(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reel_id (reel_id)
);

-- Inserir alguns usuários de exemplo (senhas são hashs)
INSERT INTO users (username, email, password, avatar_url, bio) VALUES
('neon_nina', 'nina@edenx.com', '$2a$08$SJJ8SYQ3r9gVQwWG1zVg9uXQ0hQ0hQ0hQ0hQ0hQ0hQ', 'https://i.pravatar.cc/150?u=neon_nina', 'Neon vibes 💎'),
('cyber_punk', 'cyber@edenx.com', '$2a$08$SJJ8SYQ3r9gVQwWG1zVg9uXQ0hQ0hQ0hQ0hQ0hQ0hQ', 'https://i.pravatar.cc/150?u=cyber_punk', 'Cyberpunk artist'),
('dexter_dev', 'dexter@edenx.com', '$2a$08$SJJ8SYQ3r9gVQwWG1zVg9uXQ0hQ0hQ0hQ0hQ0hQ0hQ', 'https://i.pravatar.cc/150?u=dexter_dev', 'Developer'),
('pixie_art', 'pixie@edenx.com', '$2a$08$SJJ8SYQ3r9gVQwWG1zVg9uXQ0hQ0hQ0hQ0hQ0hQ0hQ', 'https://i.pravatar.cc/150?u=pixie_art', 'Digital artist'),
('glitch_girl', 'glitch@edenx.com', '$2a$08$SJJ8SYQ3r9gVQwWG1zVg9uXQ0hQ0hQ0hQ0hQ0hQ0hQ', 'https://i.pravatar.cc/150?u=glitch_girl', 'Glitch aesthetics'),
('orbital_x', 'orbital@edenx.com', '$2a$08$SJJ8SYQ3r9gVQwWG1zVg9uXQ0hQ0hQ0hQ0hQ0hQ0hQ', 'https://i.pravatar.cc/150?u=orbital_x', 'Space explorer'),
('tech_lord', 'tech@edenx.com', '$2a$08$SJJ8SYQ3r9gVQwWG1zVg9uXQ0hQ0hQ0hQ0hQ0hQ0hQ', 'https://i.pravatar.cc/150?u=tech_lord', 'Tech enthusiast');
