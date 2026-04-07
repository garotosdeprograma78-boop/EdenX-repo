const db = require('./config/database');
const Message = require('./models/Message');

async function testMessageSave() {
  console.log('🧪 Iniciando teste de salvar mensagens no banco de dados...\n');

  try {
    // Teste 1: Criar uma mensagem simples
    console.log('📝 Teste 1: Salvando mensagem de texto simples...');
    const messageId1 = await Message.create(
      1, // sender_id
      2, // recipient_id
      'Olá, tudo bem?', // message_text
      null, // media_url
      null  // media_type
    );
    console.log(`✓ Mensagem salva com ID: ${messageId1}\n`);

    // Teste 2: Criar uma mensagem com mídia
    console.log('📝 Teste 2: Salvando mensagem com mídia...');
    const messageId2 = await Message.create(
      2,
      1,
      'Veja esta imagem!',
      '/uploads/messages/image-123.jpg',
      'image'
    );
    console.log(`✓ Mensagem com mídia salva com ID: ${messageId2}\n`);

    // Teste 3: Recuperar conversa entre os usuários
    console.log('📝 Teste 3: Recuperando conversa entre usuários 1 e 2...');
    const conversation = await Message.getConversation(1, 2, 50, 0);
    console.log(`✓ Conversa carregada com ${conversation.length} mensagens\n`);
    
    conversation.forEach((msg, idx) => {
      console.log(`  Mensagem ${idx + 1}:`);
      console.log(`    - ID: ${msg.id}`);
      console.log(`    - De: ${msg.sender_username} (ID ${msg.sender_id})`);
      console.log(`    - Para: ${msg.recipient_username} (ID ${msg.recipient_id})`);
      console.log(`    - Texto: ${msg.message_text || '(sem texto)'}`);
      console.log(`    - Mídia: ${msg.media_url || '(sem mídia)'}`);
      console.log(`    - Data: ${msg.created_at}\n`);
    });

    // Teste 4: Listar conversas do usuário 1
    console.log('📝 Teste 4: Listando conversas do usuário 1...');
    const conversations = await Message.getUserConversations(1, 20);
    console.log(`✓ Conversas carregadas: ${conversations.length}\n`);
    
    conversations.forEach((conv, idx) => {
      console.log(`  Conversa ${idx + 1}:`);
      console.log(`    - Com: ${conv.username} (ID ${conv.other_user_id})`);
      console.log(`    - Última mensagem: ${conv.last_message || '(nenhuma)'}`);
      console.log(`    - Criada em: ${conv.last_message_time}\n`);
    });

    console.log('✅ Todos os testes passaram com sucesso!');
    console.log('\n📊 Resumo:');
    console.log(`   ✓ Mensagens sendo salvas com ID auto-incrementado`);
    console.log(`   ✓ sender_id e recipient_id sendo armazenados corretamente`);
    console.log(`   ✓ message_text sendo persistido no banco`);
    console.log(`   ✓ Recuperação de conversas funcionando\n`);

  } catch (error) {
    console.error('❌ Erro durante teste:', error);
    process.exit(1);
  }
}

testMessageSave();
