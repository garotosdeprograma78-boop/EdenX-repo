// --- CONFIGURAÇÃO GLOBAL DO CANVAS ---
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');

let width, height, particles;

function normalizeAvatarUrl(avatarUrl) {
    if (!avatarUrl) return null;
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) return avatarUrl;
    const base = 'http://localhost:3001';
    if (avatarUrl.startsWith('/')) {
        return `${base}${avatarUrl}`;
    }
    return `${base}/${avatarUrl}`;
}

// Verificar se usuário já está logado
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('edenx_token');
    if (token && window.location.pathname.includes('login/index.html')) {
        // Já logado, redirecionar para a app
        window.location.href = '../index.html';
    }
});

// Inicializa ou redimensiona o fundo animado
function init() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    particles = [];
    
    // Cria 100 partículas para formar a rede/onda
    for (let i = 0; i < 100; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 2
        });
    }
}

// Loop de animação
function animate() {
    ctx.clearRect(0, 0, width, height);
    
    // Cor das partículas e das linhas (Ciano EdenX)
    ctx.fillStyle = '#5CE1E6';
    
    particles.forEach((p, index) => {
        // Movimentação
        p.x += p.vx;
        p.y += p.vy;
        
        // Efeito "Portal": se sair de um lado, volta pelo outro
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
        
        // Desenha a partícula
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Desenha linhas entre pontos próximos (Efeito de Rede Neural)
        for (let j = index + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
            
            if (dist < 150) {
                ctx.strokeStyle = `rgba(92, 225, 230, ${1 - dist / 150})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    });
    
    requestAnimationFrame(animate);
}

// Ouvintes do Canvas
window.addEventListener('resize', init);
init();
animate();

// --- CONFIGURAÇÃO GLOBAL DO CANVAS ---
// ... (código anterior permanece)

// --- LÓGICA DE FORMULÁRIOS (LOGIN, CADASTRO, RECUPERAÇÃO) ---
document.addEventListener('submit', async (e) => {
    const targetId = e.target.id;
    e.preventDefault();

    if (targetId === 'loginForm') {
        const user = document.getElementById('user').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('http://localhost:3001/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user, password })
            });
            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('edenx_token', data.token);
                localStorage.setItem('edenx_userId', data.user.id);
                localStorage.setItem('edenx_username', data.user.username);
                localStorage.setItem('edenx_displayName', data.user.display_name || data.user.username || '');
                // não armazenar dados sensíveis de profile no localstorage além do mínimo necessário para sessão
                alert('Login bem-sucedido!');
                window.location.href = '../index.html'; // Redirecionar para a app principal
            } else {
                alert(data.message || 'Erro no login');
            }
        } catch (error) {
            alert('Erro de conexão com o servidor');
        }
    }

    else if (targetId === 'signupForm') {
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            document.getElementById('confirmPassword').classList.add('input-error');
            alert("As senhas não coincidem!");
            return;
        } else {
            document.getElementById('confirmPassword').classList.remove('input-error');
        }

        try {
            // Gerar username a partir do email ou nome
            const username = name.trim().replace(/\s+/g, '_').toLowerCase() || email.split('@')[0];
            
            const response = await fetch('http://localhost:3001/api/users/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username,
                    email,
                    password,
                    passwordConfirm: confirmPassword
                })
            });
            const data = await response.json();

            if (response.ok) {
                // Usar api-client para gravar apenas sessão mínima (token + userId)
                localStorage.setItem('edenx_token', data.token);
                localStorage.setItem('edenx_userId', data.user.id);
                localStorage.setItem('edenx_username', data.user.username);
                localStorage.setItem('edenx_displayName', data.user.display_name || data.user.username || '');
                alert('Conta criada com sucesso!');
                window.location.href = '../index.html'; // Redirecionar para a app principal
            } else {
                alert(data.message || 'Erro no cadastro');
            }
        } catch (error) {
            alert('Erro de conexão com o servidor');
        }
    }

    else if (targetId === 'forgotForm') {
        const email = e.target.querySelector('input[type="email"]').value;
        alert(`Se o e-mail ${email} estiver cadastrado, você receberá as instruções em breve.`);
        // Aqui poderia implementar a lógica de recuperação, mas por enquanto apenas alert
    }
});