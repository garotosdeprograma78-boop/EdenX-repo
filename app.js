// ====================================================
// SISTEMA DE LAZY LOADING PARA REELS
// ====================================================

class LazyLoadManager {
  constructor(containerId, itemSelector, loadMoreFn, initialLoad = 20) {
    this.container = document.getElementById(containerId);
    this.itemSelector = itemSelector;
    this.loadMoreFn = loadMoreFn;
    this.offset = 0;
    this.limit = initialLoad;
    this.isLoading = false;
    this.hasMore = true;

    if (this.container) {
      this.container.addEventListener('scroll', () => this.handleScroll());
    }
  }

  handleScroll() {
    if (!this.hasMore || this.isLoading) return;

    const scrollPercentage = (this.container.scrollTop + this.container.clientHeight) / this.container.scrollHeight;
    
    if (scrollPercentage > 0.8) {
      this.loadMore();
    }
  }

  async loadMore() {
    this.isLoading = true;
    
    const result = await this.loadMoreFn(this.limit, this.offset);
    
    if (result && result.data && result.data.length > 0) {
      this.offset += result.data.length;
      this.render(result.data);
    } else {
      this.hasMore = false;
    }

    this.isLoading = false;
  }

  render(items) {
    items.forEach(item => {
      const element = this.createItemElement(item);
      this.container.appendChild(element);
    });
  }

  createItemElement(item) {
    const div = document.createElement('div');
    div.className = 'reel-video dark-box';
    div.innerHTML = `
      <div class="reel-content">
        <img src="${item.thumbnail_url || item.video_url}" alt="Reel" loading="lazy">
        <div class="reel-overlay">
          <h3>@${item.username}</h3>
          <p>${item.caption || 'Confira este reel!'}</p>
        </div>
      </div>
      <div class="reel-sidebar">
        <i class="fa-${item.likes_count > 0 ? 'solid' : 'regular'} fa-heart" onclick="likeReelUI(${item.id}, this)" title="Curtir"></i>
        <span style="font-size: 0.8rem; color: var(--text-gray);">${item.likes_count || 0}</span>
        <i class="fa-regular fa-comment" onclick="commentReelUI(${item.id})" title="Comentar"></i>
        <i class="fa-regular fa-share" onclick="shareReelUI(${item.id})" title="Compartilhar"></i>
      </div>
    `;
    return div;
  }
}

let reelsLazyLoader = null;

// ====================================================
// FUNÇÕES AUXILIARES
// ====================================================

function showView(viewId) {
  // Remove classe 'active' de todos os nav-items e views
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
  
  // Adiciona classe 'active' ao nav-item correspondente e à view
  const navItem = document.querySelector(`[data-target="${viewId}"]`);
  if (navItem) navItem.classList.add('active');
  
  const view = document.getElementById(viewId);
  if (view) view.classList.add('active');
  
  // Carregar conteúdo específico da view
  if (viewId === 'view-messages') {
    if (typeof loadChatList === 'function') loadChatList();
  }
}

// ====================================================
// INITIALIZATION - CARREGA NA PÁGINA
// ====================================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 EdenX loading...');

  // Verificar autenticação
  if (!SESSION.isAuthenticated) {
    console.log('ℹ Usuário não autenticado. Redirecionando para login...');
    window.location.href = 'login/index.html';
    return;
  } else {
    console.log(`✓ Autenticado como: ${SESSION.username}`);
  }

  // Inicializar reels com lazy loading
  initializeReelsLazyLoad();

  // Carregar stories
  await loadHeadStories();

  // Carregar conversa de chat
  await loadChatList();

  // Carregar usuários seguidos
  await loadFollowingUsers();

  // Carregar perfil do usuário atual
  if (SESSION.isAuthenticated) {
    await loadUserProfile();
  }

  // Listeners para busca funcional
  setupSearchListener();

  // Listeners para stories
  setupStoriesListeners();

  // WebSocket listeners
  setupWebSocketListeners();

  const attachBtn = document.getElementById('chat-attach-btn');
  const mediaInput = document.getElementById('chat-media-input');

  if (attachBtn && mediaInput) {
    attachBtn.addEventListener('click', () => {
      mediaInput.click();
    });
  }
});

// ====================================================
// REELS COM LAZY LOADING
// ====================================================

function initializeReelsLazyLoad() {
  const reelsContainer = document.querySelector('.reels-container');
  
  if (reelsContainer) {
    // Limpar conteúdo inicial
    reelsContainer.innerHTML = '';

    reelsLazyLoader = new LazyLoadManager(
      'view-reels',
      '.reel-video',
      async (limit, offset) => {
        const result = await getReels(limit, offset);
        return result;
      },
      20
    );

    // Carregar reels iniciais
    reelsLazyLoader.loadMore();
  }
}

async function likeReelUI(reelId, element) {
  if (!SESSION.isAuthenticated) {
    alert('Você precisa estar logado');
    return;
  }

  const result = await likeReel(reelId);
  
  if (result.success) {
    element.classList.toggle('fa-regular');
    element.classList.toggle('fa-solid');
    element.classList.toggle('active');
  }
}

function commentReelUI(reelId) {
  alert('Funcionalidade de comentários em reels em breve!');
}

function shareReelUI(reelId) {
  if (socket) {
    socket.emit('reel-shared', { reelId, userId: SESSION.userId });
  }
  alert('Reel compartilhado!');
}

// ====================================================
// STORIES FUNCIONAIS
// ====================================================

async function loadHeadStories() {
  try {
    const result = await getActiveStories();
    
    if (result.success && result.data) {
      const storiesWrapper = document.getElementById('stories-wrapper');
      storiesWrapper.innerHTML = ''; // Limpar stories demo

      // Adicionar botão para criar story próprio
      const createStoryBtn = document.createElement('div');
      createStoryBtn.className = 'story-item';
      createStoryBtn.style.cssText = 'text-align:center; cursor:pointer; position: relative;';
      createStoryBtn.innerHTML = `
        <div class="story-ring" style="background: linear-gradient(45deg, var(--cyan-primary), var(--pink-primary));">
          <div class="story-inner" style="display: flex; align-items: center; justify-content: center; background: var(--dark-bg);">
            <i class="fa-solid fa-plus" style="color: var(--cyan-primary); font-size: 1.5rem;"></i>
          </div>
        </div>
        <p style="font-size:0.65rem; margin-top:5px; color:var(--text-gray);">Seu story</p>
      `;
      
      createStoryBtn.addEventListener('click', () => openStoryUploader());
      storiesWrapper.appendChild(createStoryBtn);

      // Carregar stories ativos
      result.data.forEach(story => {
        const storyEl = document.createElement('div');
        storyEl.className = 'story-item';
        storyEl.style.cssText = 'text-align:center; cursor:pointer;';
        storyEl.innerHTML = `
          <div class="story-ring">
            <div class="story-inner">
              <img src="${story.avatar_url || 'https://i.pravatar.cc/150?u=' + story.username}">
            </div>
          </div>
          <p style="font-size:0.65rem; margin-top:5px; color:var(--text-gray)">${story.username}</p>
        `;

        storyEl.addEventListener('click', () => openStoryViewer(story));
        storiesWrapper.appendChild(storyEl);
      });
    }
  } catch (error) {
    console.error('Erro ao carregar stories:', error);
  }
}

function openStoryUploader() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const result = await createStory(null, file);
    
    if (result.success) {
      alert('Story postado com sucesso! 🎉');
      loadHeadStories(); // Recarregar stories
    } else {
      alert('Erro ao postar story');
    }
  });

  input.click();
}

function openStoryViewer(story) {
  const modal = document.createElement('div');
  modal.className = 'story-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  `;

  modal.innerHTML = `
    <div style="position: relative; width: 100%; max-width: 400px; height: 100vh; max-height: 100vh;">
      <img src="${story.image_url}" alt="Story" style="width: 100%; height: 100%; object-fit: contain;">
      <button onclick="this.parentElement.parentElement.remove()" style="
        position: absolute; top: 20px; right: 20px;
        background: rgba(0,0,0,0.5); border: none;
        color: white; font-size: 1.5rem;
        cursor: pointer; padding: 10px 15px; border-radius: 50%;
      "><i class="fa-solid fa-xmark"></i></button>
      <div style="position: absolute; bottom: 20px; left: 20px; color: white;">
        <p><strong>@${story.username}</strong></p>
        <p style="font-size: 0.8rem; opacity: 0.8;">Postado há pouco</p>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Marcar como visualizado
  if (SESSION.isAuthenticated) {
    markStoryViewed(story.id);
  }

  // Fechar ao clicar
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  // Fechar com ESC
  const closeHandler = (e) => {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', closeHandler);
    }
  };
  document.addEventListener('keydown', closeHandler);
}

function setupStoriesListeners() {
  // Auto-reload stories a cada 30 segundos
  setInterval(() => {
    loadHeadStories();
  }, 30000);
}

// ====================================================
// BUSCA FUNCIONAL
// ====================================================

function setupSearchListener() {
  const searchInput = document.getElementById('main-search');
  const searchResults = document.getElementById('search-results');

  if (!searchInput) return;

  searchInput.addEventListener('input', async (e) => {
    const query = e.target.value.trim();

    if (query.length < 2) {
      searchResults.innerHTML = '';
      return;
    }

    // Buscar usuários
    const userResult = await searchUsers(query);
    searchResults.innerHTML = '';

    if (userResult.success && Array.isArray(userResult.data)) {
      if (userResult.data.length === 0) {
        searchResults.innerHTML = '<p style="padding: 20px; text-align: center; color: var(--text-gray);">Nenhum usuário encontrado.</p>';
      } else {
        userResult.data.forEach(user => {
          const userEl = document.createElement('div');
          userEl.className = 'search-item dark-box';
          userEl.style.cssText = 'padding: 10px; display:flex; align-items:center; gap:10px; cursor: pointer;';

          const avatarImg = document.createElement('img');
          avatarImg.src = user.avatar_url || 'https://i.pravatar.cc/100?u=' + user.username;
          avatarImg.style.cssText = 'width:50px; border-radius:50%;';

          const infoWrapper = document.createElement('div');
          infoWrapper.style.flex = '1';
          infoWrapper.innerHTML = `
            <p><strong>${user.username}</strong></p>
            <p style="font-size:0.8rem; color:gray">${user.bio || 'Sem bio'}</p>
          `;

          const actionsWrapper = document.createElement('div');
          actionsWrapper.style.cssText = 'display:flex; gap: 8px;';

          const followBtn = document.createElement('button');
          followBtn.className = 'btn btn-outline';
          followBtn.style.cssText = 'padding: 5px 15px;';
          followBtn.textContent = 'Seguir';
          followBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            followUserUI(user.id);
          });

          const messageBtn = document.createElement('button');
          messageBtn.className = 'btn btn-primary';
          messageBtn.style.cssText = 'padding: 5px 15px;';
          messageBtn.textContent = 'Mensagem';
          messageBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            const avatar = user.avatar_url || 'https://i.pravatar.cc/100?u=' + user.username;
            openChat(user.id, user.username, avatar);
          });

          actionsWrapper.appendChild(followBtn);
          actionsWrapper.appendChild(messageBtn);
          userEl.appendChild(avatarImg);
          userEl.appendChild(infoWrapper);
          userEl.appendChild(actionsWrapper);

          userEl.addEventListener('click', () => {
            // Abrir perfil do usuário
            openUserProfile(user.username);
          });

          searchResults.appendChild(userEl);
        });
      }
    } else if (!userResult.success) {
      searchResults.innerHTML = '<p style="padding: 20px; text-align: center; color: var(--text-gray);">Erro ao buscar usuários. Tente novamente.</p>';
    }
  });
}

async function followUserUI(userId) {
  if (!SESSION.isAuthenticated) {
    alert('Você precisa estar logado');
    return;
  }

  const result = await followUser(userId);
  if (result.success) {
    alert('Seguindo usuário!');
  }
}

// ====================================================
// CHAT / MENSAGENS
// ====================================================

async function loadChatList() {
  try {
    const result = await getConversations();

    const chatList = document.getElementById('chat-list');
    if (!chatList || !result.success) return;

    chatList.innerHTML = '';

    if (result.data && result.data.length > 0) {
      result.data.forEach(conv => {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        chatItem.innerHTML = `
          <img src="${conv.avatar_url || 'https://i.pravatar.cc/150?u=' + conv.username}" class="chat-avatar">
          <div class="chat-info">
            <span class="user-name">${conv.username}</span>
            <span class="last-message">${conv.last_message || 'Nova conversa'}</span>
          </div>
        `;

        chatItem.onclick = () => openChat(conv.other_user_id, conv.username, conv.avatar_url);
        chatList.appendChild(chatItem);
      });
    } else {
      chatList.innerHTML = '<p style="padding: 20px; text-align: center; color: var(--text-gray);">Nenhuma conversa ainda</p>';
    }
  } catch (error) {
    console.error('Erro ao carregar chat list:', error);
  }
}

async function loadFollowingUsers() {
  try {
    const result = await getFollowing(SESSION.userId);

    const followingList = document.getElementById('following-users');
    if (!followingList || !result.success) return;

    followingList.innerHTML = '';

    if (result.data && result.data.length > 0) {
      result.data.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'chat-item following-user-item';
        userItem.innerHTML = `
          <div class="following-user-content" onclick="openChat(${user.id}, '${user.username}', '${user.avatar_url || 'https://i.pravatar.cc/150?u=' + user.username}')">
            <img src="${user.avatar_url || 'https://i.pravatar.cc/150?u=' + user.username}" class="chat-avatar">
            <div class="chat-info">
              <span class="user-name">${user.username}</span>
            </div>
          </div>
          <button class="btn-message" onclick="event.stopPropagation(); openChat(${user.id}, '${user.username}', '${user.avatar_url || 'https://i.pravatar.cc/150?u=' + user.username}')">
            <i class="fa-regular fa-paper-plane"></i>Mensagem
          </button>
        `;
        followingList.appendChild(userItem);
      });
    } else {
      followingList.innerHTML = '<p style="padding: 20px; text-align: center; color: var(--text-gray);">Você não segue ninguém ainda</p>';
    }
  } catch (error) {
    console.error('Erro ao carregar usuários seguidos:', error);
  }
}

async function openChat(userId, username, avatarUrl) {
  document.getElementById('chat-list-container').style.display = 'none';
  const chatWindow = document.getElementById('active-chat-view');
  chatWindow.style.display = 'flex';

  document.getElementById('active-chat-name').innerText = username;
  document.getElementById('active-chat-avatar').src = avatarUrl;

  // Carregar mensagens da conversa
  const result = await getConversation(userId, 50, 0);
  const messagesArea = document.getElementById('chat-messages-area');
  messagesArea.innerHTML = '';

  if (result.success && result.data) {
    result.data.forEach(msg => {
      const isOwn = msg.sender_id === SESSION.userId;
      const msgEl = document.createElement('div');
      msgEl.className = `message-bubble ${isOwn ? 'sent' : 'received'}`;

      if (msg.media_url) {
        const baseUrl = API_BASE_URL.replace(/\/api$/, '');
        if (msg.media_type === 'video') {
          msgEl.innerHTML = `<video controls style="max-width: 240px; max-height: 180px;"><source src="${baseUrl}${msg.media_url}" type="video/mp4" /></video>`;
        } else {
          msgEl.innerHTML = `<img src="${baseUrl}${msg.media_url}" alt="Mídia" style="max-width: 240px; max-height: 180px;">`;
        }
        if (msg.message_text) {
          const textEl = document.createElement('p');
          textEl.textContent = msg.message_text;
          msgEl.appendChild(textEl);
        }
      } else {
        msgEl.textContent = msg.message_text;
      }

      messagesArea.appendChild(msgEl);
    });

    messagesArea.scrollTop = messagesArea.scrollHeight;
  }

  // Armazenar ID da conversa ativa
  window.activeChatUserId = userId;
}

function closeChat() {
  document.getElementById('chat-list-container').style.display = 'block';
  document.getElementById('active-chat-view').style.display = 'none';
  window.activeChatUserId = null;
}

async function handleSendMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  const mediaInput = document.getElementById('chat-media-input');
  const mediaFile = mediaInput ? mediaInput.files[0] : null;

  console.log('📝 handleSendMessage chamado');
  console.log(`   - Texto: "${text}"`);
  console.log(`   - Chat ativo com user: ${window.activeChatUserId}`);
  console.log(`   - Arquivo: ${mediaFile ? mediaFile.name : 'nenhum'}`);
  console.log(`   - Autenticado: ${SESSION.isAuthenticated}`);

  if (!window.activeChatUserId || (!text && !mediaFile)) {
    console.log('❌ Validação falhou - faltam dados obrigatórios');
    return;
  }

  let mediaUrl = null;
  let mediaType = null;

  if (mediaFile) {
    console.log('📤 Fazendo upload de mídia...');
    const uploadRes = await uploadMessageMedia(mediaFile);
    if (uploadRes.success) {
      mediaUrl = uploadRes.data.mediaUrl;
      mediaType = uploadRes.data.mediaType;
      console.log(`✓ Mídia salva em: ${mediaUrl}`);
    } else {
      console.log('❌ Erro no upload: ' + uploadRes.error);
      alert('Falha ao enviar mídia: ' + (uploadRes.error || 'Erro desconhecido'));
      return;
    }
  }

  if (SESSION.isAuthenticated) {
    console.log('🔐 Enviando mensagem via API...');
    const result = await sendMessage(window.activeChatUserId, text, mediaUrl, mediaType);

    console.log('📊 Resposta da API:');
    console.log(result);

    if (result.success) {
      console.log('✓ Mensagem salva no banco com sucesso!');
      console.log(`   - ID da mensagem: ${result.data?.id || 'N/A'}`);
      
      sendMessageViaSocket(window.activeChatUserId, text, mediaUrl, mediaType, result.data?.id || null);

      const messagesArea = document.getElementById('chat-messages-area');
      const msgEl = document.createElement('div');
      msgEl.className = 'message-bubble sent';

      if (mediaUrl) {
        const baseUrl = API_BASE_URL.replace(/\/api$/, '');
        if (mediaType === 'video') {
          msgEl.innerHTML = `<video controls style="max-width: 240px; max-height: 180px;"><source src="${baseUrl}${mediaUrl}" type="video/mp4" /></video>`;
        } else {
          msgEl.innerHTML = `<img src="${baseUrl}${mediaUrl}" alt="Mídia" style="max-width: 240px; max-height: 180px;">`;
        }
        if (text) {
          const textEl = document.createElement('p');
          textEl.textContent = text;
          msgEl.appendChild(textEl);
        }
      } else {
        msgEl.textContent = text;
      }

      messagesArea.appendChild(msgEl);
      messagesArea.scrollTop = messagesArea.scrollHeight;
      await loadChatList();
    } else {
      console.error('❌ Erro ao enviar mensagem:', result);
      alert('Erro ao enviar mensagem: ' + (result.message || 'Erro desconhecido'));
    }
  } else {
    console.error('❌ Usuário não autenticado');
    alert('Você precisa estar logado para enviar mensagens');
    return;
  }

  input.value = '';
  if (mediaInput) {
    mediaInput.value = '';
  }
}

// ====================================================
// WEBSOCKET LISTENERS
// ====================================================

function setupWebSocketListeners() {
  window.addEventListener('new-message', (e) => {
    const { senderId, message, mediaUrl, mediaType, timestamp } = e.detail;
    console.log('Mensagem recebida (WebSocket):', message || mediaUrl);

    // Atualizar chat se estiver aberto
    if (window.activeChatUserId === senderId) {
      const messagesArea = document.getElementById('chat-messages-area');
      const msgEl = document.createElement('div');
      msgEl.className = 'message-bubble received';

      if (mediaUrl) {
        const baseUrl = API_BASE_URL.replace(/\/api$/, '');
        if (mediaType === 'video') {
          msgEl.innerHTML = `<video controls style="max-width: 240px; max-height: 180px;"><source src="${baseUrl}${mediaUrl}" type="video/mp4" /></video>`;
        } else {
          msgEl.innerHTML = `<img src="${baseUrl}${mediaUrl}" alt="Mídia" style="max-width: 240px; max-height: 180px;">`;
        }
        if (message) {
          const textEl = document.createElement('p');
          textEl.textContent = message;
          msgEl.appendChild(textEl);
        }
      } else {
        msgEl.textContent = message;
      }

      messagesArea.appendChild(msgEl);
      messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    loadChatList(); // Atualizar lista
  });

  window.addEventListener('new-post', (e) => {
    console.log('Novo post criado:', e.detail);
    // Recarregar feed
  });

  window.addEventListener('new-story', (e) => {
    console.log('Novo story criado:', e.detail);
    loadHeadStories();
  });
}

// ====================================================
// PERFIL DINÂMICO
// ====================================================

async function loadUserProfile() {
  if (!SESSION.isAuthenticated) {
    return;
  }

  const result = await getProfile();
  if (!result.success) return;

  await renderProfileDetails(result.data, true);
}

async function openUserProfile(username) {
  if (!username) return;

  // Mudar view para perfil
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
  document.querySelector('[data-target="view-profile"]').classList.add('active');
  document.getElementById('view-profile').classList.add('active');

  const result = await getPublicUserProfile(username);
  if (!result.success) {
    alert('Usuário não encontrado.');
    return;
  }

  await renderProfileDetails(result.data, (SESSION.username === result.data.username));
}

async function renderProfileDetails(user, isSelf) {
  const followBtn = document.getElementById('profile-follow-btn');
  const messageBtn = document.getElementById('profile-message-btn');
  const editBtn = document.getElementById('btn-edit-profile');
  const settingsBtn = document.getElementById('open-settings-btn');

  document.getElementById('profile-name').textContent = user.display_name || user.username;
  document.getElementById('profile-username').textContent = '@' + user.username;
  document.getElementById('profile-bio').textContent = user.bio || 'Sem bio';
  document.getElementById('profile-avatar').src = normalizeAvatarUrl(user.avatar_url) || 'https://i.pravatar.cc/150?u=' + user.username;
  document.getElementById('profile-followers').textContent = user.followers || 0;
  document.getElementById('profile-following').textContent = user.following || 0;

  const locationElem = document.getElementById('location-text');
  const linkElem = document.getElementById('link-url');
  const anniversaryElem = document.getElementById('anniversary-text');

  if(locationElem) locationElem.textContent = user.location || '-';
  if(linkElem) {
    linkElem.textContent = user.link ? 'Link' : '-';
    linkElem.href = user.link || '#';
  }
  if(anniversaryElem) {
    if (user.anniversary) {
      const date = new Date(user.anniversary + 'T00:00:00');
      anniversaryElem.textContent = date.toLocaleDateString('pt-BR');
    } else {
      anniversaryElem.textContent = '-';
    }
  }

  if (isSelf) {
    if (followBtn) followBtn.style.display = 'none';
    if (messageBtn) messageBtn.style.display = 'none';
    if (editBtn) editBtn.style.display = 'inline-block';
    if (settingsBtn) settingsBtn.style.display = 'inline-block';
  } else {
    if (followBtn) {
      followBtn.style.display = 'inline-block';
      followBtn.textContent = 'Seguir';
      followBtn.onclick = async () => {
        const res = await followUser(user.id);
        if (res.success) {
          followBtn.textContent = 'Seguindo';
          document.getElementById('profile-followers').textContent = (parseInt(document.getElementById('profile-followers').textContent, 10) || 0) + 1;
        }
      };
    }
    if (messageBtn) {
      messageBtn.style.display = 'inline-block';
      messageBtn.onclick = () => {
        // Redirecionar para a seção de mensagens
        showView('view-messages');
        
        // Abrir o chat com o usuário
        if (typeof openChat === 'function') {
          const avatar = normalizeAvatarUrl(user.avatar_url) || (SESSION.avatarUrl || 'https://i.pravatar.cc/150?u=anon');
          openChat(user.id, user.username ? '@' + user.username : 'Chat', avatar);
        } else {
          alert('Abra o chat com @' + user.username + ' (implemente conversa multimídia).');
        }
      };
    }
    if (editBtn) editBtn.style.display = 'none';
    if (settingsBtn) settingsBtn.style.display = 'none';
  }

  // Atualiza sessão com dados se próprio perfil
  if (isSelf) {
    SESSION.username = user.username;
    SESSION.avatarUrl = normalizeAvatarUrl(user.avatar_url);
    SESSION.bio = user.bio;
    SESSION.location = user.location;
    SESSION.link = user.link;
    SESSION.anniversary = user.anniversary;
    localStorage.setItem('edenx_username', user.username);
    localStorage.setItem('edenx_avatarUrl', SESSION.avatarUrl);
    localStorage.setItem('edenx_bio', user.bio || '');
  }

  // Preenche feed e abas
  await loadProfilePosts(user.id, user.username);
  if (typeof renderLikedAndSaved === 'function') {
    renderLikedAndSaved();
  }
  // Atualiza contadores de sessão
  document.getElementById('profile-followers').textContent = user.followers || 0;
  document.getElementById('profile-following').textContent = user.following || 0;
}

async function loadProfilePosts(userId, username) {
  const result = await getUserPosts(userId);
  const serverBase = API_BASE_URL.replace(/\/api$/, '');

  const postsContainer = document.getElementById('tab-posts');
  const mediaContainer = document.getElementById('tab-midia');
  const highlightsContainer = document.getElementById('tab-destaques');

  postsContainer.innerHTML = '';
  mediaContainer.innerHTML = '';
  highlightsContainer.innerHTML = '';

  if (result.success && Array.isArray(result.data) && result.data.length > 0) {
    result.data.forEach(post => {
      const formattedPost = typeof formatPostItem === 'function'
        ? formatPostItem(post)
        : {
            id: post.id,
            author: username,
            avatar: post.avatar_url || '',
            time: post.created_at ? new Date(post.created_at).toLocaleString('pt-BR') : 'Agora',
            text: post.caption || '',
            image: post.image_url || '',
            location: post.location || '',
            likes: post.likes_count || 0,
            comments: [],
            shares: post.shares || 0,
            user_id: post.user_id || userId
          };

      const card = createPostCard(formattedPost);
      if (card) {
        postsContainer.appendChild(card);
      }

      if (post.image_url) {
        const mediaEl = document.createElement('div');
        mediaEl.className = 'feed-post dark-box';
        mediaEl.innerHTML = `
          <div class="post-image"><img src="${post.image_url.startsWith('http') ? post.image_url : serverBase + post.image_url}" alt="Mídia"></div>
          <div class="post-info"><p><strong>@${username}</strong> ${post.caption || ''}</p></div>
        `;
        mediaContainer.appendChild(mediaEl);
      }
    });
  } else {
    postsContainer.innerHTML = '<p style="padding:20px;color:white;text-align:center;">Nenhum post encontrado.</p>';
    mediaContainer.innerHTML = '<p style="padding:20px;color:white;text-align:center;">Nenhuma mídia disponível.</p>';
  }

  const storiesResult = await getUserStories(userId);
  if (storiesResult.success && Array.isArray(storiesResult.data) && storiesResult.data.length > 0) {
    storiesResult.data.forEach(story => {
      const storyEl = document.createElement('div');
      storyEl.className = 'feed-post dark-box';
      storyEl.innerHTML = `
        <div class="post-header"><span class="username">@${username}</span><small>Story</small></div>
        <div class="post-container">
          <div class="post-image"><img src="${story.image_url}" alt="Story"></div>
          <div class="post-info"><p>Postado em: ${formatPostTime ? formatPostTime(story.created_at) : new Date(story.created_at).toLocaleString('pt-BR')}</p></div>
        </div>
      `;
      highlightsContainer.appendChild(storyEl);
    });
  } else {
    highlightsContainer.innerHTML = '<p style="padding:20px;color:white;text-align:center;">Nenhuma história ativa agora.</p>';
  }
}

console.log('✓ App.js carregado com sucesso');
