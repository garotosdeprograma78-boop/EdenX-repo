const pool = require('./config/database');

async function cleanupExpiredStories() {
  const query = `
    DELETE FROM stories
    WHERE expires_at <= CURRENT_TIMESTAMP
  `;
  try {
    const result = await pool.execute(query);
    console.log(`Stories expiradas deletadas: ${result.affectedRows}`);
  } catch (error) {
    console.error('Erro ao limpar stories expiradas:', error);
  }
}

// Executar a limpeza a cada hora
setInterval(cleanupExpiredStories, 60 * 60 * 1000);

// Executar imediatamente na inicialização
cleanupExpiredStories();

module.exports = cleanupExpiredStories;