// Configuração da API
const API_BASE_URL = 'http://localhost:3001/api';
const WS_URL = 'http://localhost:3001';

// Objeto global para armazenar dados da sessão
const SESSION = {
  token: localStorage.getItem('edenx_token') || null,
  userId: localStorage.getItem('edenx_userId') || null,
  username: localStorage.getItem('edenx_username') || null,
  displayName: localStorage.getItem('edenx_displayName') || null,
  avatarUrl: localStorage.getItem('edenx_avatarUrl') || null,
  bio: localStorage.getItem('edenx_bio') || null,
  location: localStorage.getItem('edenx_location') || null,
  link: localStorage.getItem('edenx_link') || null,
  anniversary: localStorage.getItem('edenx_anniversary') || null,
  followers: parseInt(localStorage.getItem('edenx_followers')) || 0,
  following: parseInt(localStorage.getItem('edenx_following')) || 0,
  isAuthenticated: !!localStorage.getItem('edenx_token')
};

function normalizeAvatarUrl(avatarUrl) {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) return avatarUrl;

  const base = API_BASE_URL.replace(/\/api$/, '');
  if (avatarUrl.startsWith('/')) {
    return `${base}${avatarUrl}`;
  }

  return `${base}/${avatarUrl}`;
}

// ====================================================
// ROTAS DE BUSCA
// ====================================================

async function searchUsersApi(query) {
  try {
      // Chama a rota do seu backend que aciona o searchController.searchUsers
      const response = await apiRequest(`/search/users?query=${encodeURIComponent(query)}`);
      
      // Como o seu controller usa res.json(results), isso deve retornar o array direto
      return response || []; 
  } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      return [];
  }
}

// ====================================================
// FUNÇÕES UTILITÁRIAS DE REQUISIÇÃO
// ====================================================

async function apiRequest(endpoint, method = 'GET', body = null, isFormData = false) {
  const options = {
    method,
    headers: {
      'Content-Type': isFormData ? 'application/json' : 'application/json'
    }
  };

  if (SESSION.token) {
    options.headers['Authorization'] = `Bearer ${SESSION.token}`;
  }

  if (body && !isFormData) {
    options.body = JSON.stringify(body);
  } else if (body && isFormData) {
    options.body = body;
    delete options.headers['Content-Type'];
  }

  console.log(`🌐 apiRequest: ${method} ${API_BASE_URL}${endpoint}`);
  console.log(`   Headers:`, options.headers);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    console.log(`   Status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`   Erro HTTP ${response.status}:`, errorData);
      throw new Error(`HTTP ${response.status}: ${errorData.substring(0, 100)}`);
    }

    const data = await response.json();
    console.log(`   ✓ Sucesso`);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
    return { success: false, error: error.message };
  }
}

// ====================================================
// AUTENTICAÇÃO
// ====================================================

async function register(username, email, password, passwordConfirm) {
  const result = await apiRequest('/users/register', 'POST', {
    username,
    email,
    password,
    passwordConfirm
  });

  if (result.success) {
    SESSION.token = result.data.token;
    SESSION.userId = result.data.user.id;
    SESSION.isAuthenticated = true;

    // Armazenar somente token + userId para sessão. Dados de perfil devem vir do backend.
    localStorage.setItem('edenx_token', result.data.token);
    localStorage.setItem('edenx_userId', result.data.user.id);
    localStorage.setItem('edenx_username', result.data.user.username);
    localStorage.setItem('edenx_displayName', result.data.user.display_name || result.data.user.username || '');
  }

  return result;
}

async function login(email, password) {
  const result = await apiRequest('/users/login', 'POST', {
    email,
    password
  });

  if (result.success) {
    const normalizedAvatar = normalizeAvatarUrl(result.data.user.avatar_url);

    SESSION.token = result.data.token;
    SESSION.userId = result.data.user.id;
    SESSION.username = result.data.user.username;
    SESSION.displayName = result.data.user.display_name;
    SESSION.avatarUrl = normalizedAvatar;
    SESSION.bio = result.data.user.bio;
    SESSION.location = result.data.user.location;
    SESSION.link = result.data.user.link;
    SESSION.anniversary = result.data.user.anniversary;
    SESSION.followers = result.data.user.followers;
    SESSION.following = result.data.user.following;
    SESSION.isAuthenticated = true;

    localStorage.setItem('edenx_token', result.data.token);
    localStorage.setItem('edenx_userId', result.data.user.id);
    localStorage.setItem('edenx_username', result.data.user.username);
    localStorage.setItem('edenx_displayName', result.data.user.display_name || result.data.user.username || '');
    // Não armazenar outros campos de perfil permanentemente em localStorage.
    // Aplicativo deve sempre consultar /users/profile para dados atuais.
  }

  return result;
}

function logout() {
  SESSION.token = null;
  SESSION.userId = null;
  SESSION.username = null;
  SESSION.avatarUrl = null;
  SESSION.bio = null;
  SESSION.followers = 0;
  SESSION.following = 0;
  SESSION.isAuthenticated = false;

  localStorage.removeItem('edenx_token');
  localStorage.removeItem('edenx_userId');
  localStorage.removeItem('edenx_username');
  localStorage.removeItem('edenx_avatarUrl');
  localStorage.removeItem('edenx_bio');
  localStorage.removeItem('edenx_followers');
  localStorage.removeItem('edenx_following');

  // Redirecionar para a página de login
  window.location.href = 'login/index.html';
}

// ====================================================
// POSTS
// ====================================================

async function getFeed(limit = 20, offset = 0) {
  return apiRequest(`/posts/feed?limit=${limit}&offset=${offset}`);
}

async function getUserPosts(userId, limit = 20, offset = 0) {
  return apiRequest(`/users/${userId}/posts?limit=${limit}&offset=${offset}`);
}

async function createPost(caption, imageUrl = null, file = null) {
  if (file) {
    const formData = new FormData();
    formData.append('caption', caption);
    formData.append('image', file);
    
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SESSION.token}`
      },
      body: formData
    };

    try {
      const response = await fetch(`${API_BASE_URL}/posts`, options);
      const data = await response.json();
      return { success: response.ok, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  return apiRequest('/posts', 'POST', { caption, image_url: imageUrl });
}

async function likePost(postId) {
  return apiRequest(`/posts/${postId}/like`, 'POST');
}

async function unlikePost(postId) {
  return apiRequest(`/posts/${postId}/like`, 'DELETE');
}

async function deletePost(postId) {
  return apiRequest(`/posts/${postId}`, 'DELETE');
}

async function getComments(postId, limit = 20) {
  return apiRequest(`/posts/${postId}/comments?limit=${limit}`);
}

async function addComment(postId, comment, parentCommentId = null) {
  return apiRequest(`/posts/${postId}/comments`, 'POST', { comment, parent_comment_id: parentCommentId });
}

async function editComment(postId, commentId, comment) {
  return apiRequest(`/posts/${postId}/comments/${commentId}`, 'PUT', { comment });
}

async function deleteComment(postId, commentId) {
  return apiRequest(`/posts/${postId}/comments/${commentId}`, 'DELETE');
}

// ====================================================
// STORIES
// ====================================================

async function getActiveStories() {
  return apiRequest('/stories/active');
}

async function createStory(imageUrl = null, file = null) {
  if (file) {
    const formData = new FormData();
    formData.append('image', file);
    
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SESSION.token}`
      },
      body: formData
    };

    try {
      const response = await fetch(`${API_BASE_URL}/stories`, options);
      const data = await response.json();
      return { success: response.ok, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  return apiRequest('/stories', 'POST', { image_url: imageUrl });
}

async function markStoryViewed(storyId) {
  return apiRequest(`/stories/${storyId}/view`, 'POST');
}

async function getUserStories(userId) {
  return apiRequest(`/stories/user/${userId}`);
}

async function getFollowersStories() {
  return apiRequest('/stories/followers/list');
}

// ====================================================
// MENSAGENS
// ====================================================

async function getConversations() {
  return apiRequest('/messages/list');
}

async function getConversation(otherUserId, limit = 50, offset = 0) {
  return apiRequest(`/messages/conversation/${otherUserId}?limit=${limit}&offset=${offset}`);
}

async function uploadMessageMedia(file) {
  const formData = new FormData();
  formData.append('media', file);

  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SESSION.token}`
    },
    body: formData
  };

  try {
    const response = await fetch(`${API_BASE_URL}/messages/upload`, options);
    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function sendMessage(recipientId, message, mediaUrl = null, mediaType = null) {
  const body = { recipientId };
  if (message) body.message = message;
  if (mediaUrl) body.media_url = mediaUrl;
  if (mediaType) body.media_type = mediaType;
  
  console.log('📨 sendMessage - Enviando requisição para /api/messages');
  console.log('   Payload:', JSON.stringify(body));
  console.log('   Token:', SESSION.token ? SESSION.token.substring(0, 20) + '...' : 'NONE');
  
  const result = await apiRequest('/messages', 'POST', body);
  
  console.log('📨 sendMessage - Resposta recebida:');
  console.log('   Sucesso:', result.success);
  console.log('   Dados:', result.data);
  
  return result;
}

async function getUnreadCount() {
  return apiRequest('/messages/unread/count');
}

// ====================================================
// REELS
// ====================================================

async function getReels(limit = 20, offset = 0) {
  return apiRequest(`/reels?limit=${limit}&offset=${offset}`);
}

async function createReel(caption, videoFile = null, thumbnailUrl = null) {
  if (videoFile) {
    const formData = new FormData();
    formData.append('caption', caption);
    formData.append('video', videoFile);
    if (thumbnailUrl) formData.append('thumbnail_url', thumbnailUrl);
    
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SESSION.token}`
      },
      body: formData
    };

    try {
      const response = await fetch(`${API_BASE_URL}/reels`, options);
      const data = await response.json();
      return { success: response.ok, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  return apiRequest('/reels', 'POST', { caption, video_url: videoFile, thumbnail_url: thumbnailUrl });
}

async function likeReel(reelId) {
  return apiRequest(`/reels/${reelId}/like`, 'POST');
}

async function unlikeReel(reelId) {
  return apiRequest(`/reels/${reelId}/like`, 'DELETE');
}

// ====================================================
// BUSCA
// ====================================================

async function searchUsers(query) {
  return apiRequest(`/search/users?query=${encodeURIComponent(query)}`);
}

async function searchPosts(query) {
  return apiRequest(`/search/posts?query=${encodeURIComponent(query)}`);
}

// ====================================================
// PERFIL
// ====================================================

async function getProfile() {
  const result = await apiRequest('/users/profile');
  
  if (result.success) {
    // Atualizar SESSION com dados completos
    const normalizedAvatar = normalizeAvatarUrl(result.data.avatar_url);

    SESSION.username = result.data.username;
    SESSION.avatarUrl = normalizedAvatar;
    SESSION.bio = result.data.bio;
    SESSION.followers = result.data.followers;
    SESSION.following = result.data.following;
    
    localStorage.setItem('edenx_username', result.data.username);
    localStorage.setItem('edenx_avatarUrl', normalizedAvatar || '');
    localStorage.setItem('edenx_bio', result.data.bio);
    localStorage.setItem('edenx_followers', result.data.followers);
    localStorage.setItem('edenx_following', result.data.following);
  }
  
  return result;
}

async function updateProfile(displayName, username, bio, location, link, anniversary, avatarUrl) {
  const payload = {
    display_name: displayName,
    username,
    bio,
    location,
    link,
    anniversary
  };

  if (avatarUrl) {
    payload.avatar_url = avatarUrl;
  }

  return apiRequest('/users/profile', 'PUT', payload);
}

async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('avatar', file);

  const options = {
    method: 'POST',
    body: formData
  };

  if (SESSION.token) {
    options.headers = {
      'Authorization': `Bearer ${SESSION.token}`
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/upload-avatar`, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const normalizedUrl = normalizeAvatarUrl(data.url);
    return { success: true, data: { ...data, url: normalizedUrl } };
  } catch (error) {
    console.error('Erro no upload do avatar:', error);
    return { success: false, error: error.message };
  }
}

async function getFollowers(userId) {
  return apiRequest(`/users/${userId}/followers`);
}

async function getFollowing(userId) {
  return apiRequest(`/users/${userId}/following`);
}

async function getPublicUserProfile(username) {
  return apiRequest(`/users/profile/${encodeURIComponent(username)}`);
}

async function updatePost(postId, caption) {
  return apiRequest(`/posts/${postId}`, 'PUT', { caption });
}

async function followUser(userId) {
  return apiRequest(`/users/${userId}/follow`, 'POST');
}

async function unfollowUser(userId) {
  return apiRequest(`/users/${userId}/unfollow`, 'DELETE');
}

// ====================================================
// WEBSOCKET PARA MENSAGENS EM TEMPO REAL
// ====================================================

let socket = null;

function initWebSocket() {
  if (SESSION.isAuthenticated && !socket) {
    socket = io(WS_URL);

    socket.emit('user-online', SESSION.userId);

    socket.on('receive-message', (data) => {
      console.log('Mensagem recebida:', data);
      // Dispatch custom event para o frontend usar
      window.dispatchEvent(new CustomEvent('new-message', { detail: data }));
    });

    socket.on('post-created', (data) => {
      console.log('Novo post:', data);
      window.dispatchEvent(new CustomEvent('new-post', { detail: data }));
    });

    socket.on('story-created', (data) => {
      console.log('Novo story:', data);
      window.dispatchEvent(new CustomEvent('new-story', { detail: data }));
    });

    socket.on('disconnect', () => {
      console.log('Desconectado do servidor');
    });
  }
}

function sendMessageViaSocket(recipientId, message, mediaUrl = null, mediaType = null, messageId = null) {
  if (socket) {
    socket.emit('send-message', {
      senderId: SESSION.userId,
      recipientId,
      message,
      mediaUrl,
      mediaType,
      timestamp: new Date(),
      persisted: true,
      messageId
    });
  }
}

// Inicializar WebSocket se autenticado
if (SESSION.isAuthenticated) {
  initWebSocket();
}

console.log('✓ API Client carregado com sucesso');
