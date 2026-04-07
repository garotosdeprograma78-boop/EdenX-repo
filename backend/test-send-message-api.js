const http = require('http');
const dotenv = require('dotenv');

dotenv.config();

async function testSendMessage() {
  console.log('🧪 Testando envio de mensagem via API de um usuário autenticado\n');

  try {
    // Passo 1: Fazer login para obter token
    console.log('📝 Passo 1: Fazendo login com usuário de teste...');
    
    const loginData = JSON.stringify({
      email: 'neon@edenx.com',
      password: 'senha123'
    });

    const loginResponse = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/users/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': loginData.length
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        });
      });

      req.on('error', reject);
      req.write(loginData);
      req.end();
    });

    if (loginResponse.status !== 200) {
      console.log(`❌ Erro no login: ${loginResponse.status}`);
      console.log(JSON.stringify(loginResponse.data, null, 2));
      process.exit(1);
    }

    const token = loginResponse.data.token;
    console.log(`✓ Login realizado com sucesso`);
    console.log(`✓ Token obtido: ${token.substring(0, 20)}...\n`);

    // Passo 2: Enviar mensagem
    console.log('📝 Passo 2: Enviando mensagem...');
    
    const messageData = JSON.stringify({
      recipientId: 2,
      message: 'Testando envio de mensagem! ' + new Date().toISOString()
    });

    const messageResponse = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Length': messageData.length
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, data: data });
          }
        });
      });

      req.on('error', reject);
      req.write(messageData);
      req.end();
    });

    console.log(`✓ Resposta do servidor: ${messageResponse.status}`);
    console.log('Dados retornados:');
    console.log(JSON.stringify(messageResponse.data, null, 2));

    if (messageResponse.status === 201) {
      console.log('\n✅ Mensagem enviada com sucesso!');
      console.log(`   📍 ID da mensagem: ${messageResponse.data.data?.id || 'N/A'}`);
      console.log(`   👤 De: ${messageResponse.data.data?.sender_id || 'N/A'}`);
      console.log(`   👥 Para: ${messageResponse.data.data?.recipient_id || 'N/A'}`);
      console.log(`   💬 Texto: ${messageResponse.data.data?.message_text || 'N/A'}`);
    } else {
      console.log('\n❌ Erro ao enviar mensagem');
    }

  } catch (error) {
    console.error('❌ Erro na execução:', error.message);
    process.exit(1);
  }
}

testSendMessage();
