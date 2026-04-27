const fetch = require('node-fetch');

// Simulação do SESSION
let SESSION = {
  token: null,
  userId: null,
  isAuthenticated: false
};

// Função para fazer login
async function login(username, password) {
  try {
    const response = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();
    if (result.success) {
      SESSION.token = result.data.token;
      SESSION.userId = result.data.user.id;
      SESSION.isAuthenticated = true;
      console.log('✅ Login bem-sucedido');
      return true;
    } else {
      console.log('❌ Falha no login:', result.error);
      return false;
    }
  } catch (error) {
    console.error('Erro no login:', error);
    return false;
  }
}

// Função para buscar stories
async function getStories() {
  try {
    const url = SESSION.isAuthenticated
      ? 'http://localhost:3002/api/stories/followers'
      : 'http://localhost:3002/api/stories/active';

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': SESSION.token ? `Bearer ${SESSION.token}` : undefined,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Erro ao buscar stories:', error);
    return { success: false, error: error.message };
  }
}

// Teste da funcionalidade de stories para seguidores
async function testStoriesFollowers() {
  console.log('🧪 Testando stories para seguidores...\n');

  try {
    // 1. Login de um usuário
    console.log('1. Fazendo login...');
    const loginSuccess = await login('gabriel_victor', '123456');
    if (!loginSuccess) return;

    // 2. Buscar stories dos seguidores
    console.log('2. Buscando stories dos seguidores...');
    const storiesResult = await getStories();
    console.log('Resultado:', JSON.stringify(storiesResult, null, 2));

    if (storiesResult.success && storiesResult.data) {
      console.log(`✅ ${storiesResult.data.length} stories encontradas para seguidores`);
      storiesResult.data.forEach(story => {
        console.log(`   - ${story.username}: ${story.image_url}`);
      });
    } else {
      console.log('❌ Erro ao buscar stories:', storiesResult.error);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testStoriesFollowers();