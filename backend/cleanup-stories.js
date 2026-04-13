const pool = require('./config/database');
const fs = require('fs');
const path = require('path');

async function cleanupExpiredStories() {
  try {
    // Buscar stories expiradas com seus URLs de imagem
    const selectQuery = `
      SELECT id, image_url
      FROM stories
      WHERE expires_at <= CURRENT_TIMESTAMP
    `;
    
    const expiredStories = await pool.query(selectQuery);
    
    if (expiredStories.rows && expiredStories.rows.length > 0) {
      console.log(`🧹 Iniciando limpeza de ${expiredStories.rows.length} stories expiradas...`);
      
      // Deletar arquivos físicos de imagens
      expiredStories.rows.forEach(story => {
        if (story.image_url && story.image_url.includes('/uploads/')) {
          // Extrair caminho relativo
          const filePath = path.join(__dirname, story.image_url.replace(/^\//, ''));
          
          fs.unlink(filePath, (err) => {
            if (err) {
              console.warn(`⚠️ Erro ao deletar arquivo: ${filePath}`, err.message);
            } else {
              console.log(`✓ Arquivo deletado: ${filePath}`);
            }
          });
        }
      });
      
      // Deletar registros do banco de dados
      const deleteQuery = `
        DELETE FROM stories
        WHERE expires_at <= CURRENT_TIMESTAMP
      `;
      
      const result = await pool.execute(deleteQuery);
      console.log(`✓ ${result.affectedRows} stories expiradas removidas do banco de dados`);
      console.log(`✓ Limpeza concluída`);
    } else {
      console.log('✓ Nenhuma story expirada para limpar');
    }
  } catch (error) {
    console.error('❌ Erro ao limpar stories expiradas:', error);
  }
}

// Executar a limpeza a cada 30 minutos (ao invés de 1 hora para ser mais responsivo)
setInterval(cleanupExpiredStories, 30 * 60 * 1000);

// Executar imediatamente na inicialização
cleanupExpiredStories();

module.exports = cleanupExpiredStories;