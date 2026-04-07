#!/usr/bin/env node

const http = require('http');
const net = require('net');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function checkStatus() {
  console.log('\n🔍 Status da Aplicação EdenX\n');
  console.log('═'.repeat(50));

  // 1. Verificar servidor na porta 3001
  console.log('\n1️⃣  Verificando servidor na porta 3001...');
  const serverRunning = await checkPort(3001);
  if (serverRunning) {
    console.log('   ✅ Servidor está rodando');
  } else {
    console.log('   ❌ Servidor NÃO está rodando');
    console.log('   💡 Inicie com: npm start (na pasta backend)');
  }

  // 2. Verificar conexão MySQL
  console.log('\n2️⃣  Verificando conexão com MySQL...');
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('   ✅ Banco de dados conectado');

    // Contar mensagens
    const [result] = await connection.query('SELECT COUNT(*) as total FROM messages');
    const messageCount = result[0].total;
    console.log(`   ✅ Total de mensagens: ${messageCount}`);

    // Verificar tabela
    const [schema] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'messages' AND TABLE_SCHEMA = ?
    `, [process.env.DB_NAME]);

    console.log(`   ✅ Tabela messages tem ${schema.length} colunas`);

    const requiredCols = ['id', 'sender_id', 'recipient_id', 'message_text'];
    let allCols = true;
    requiredCols.forEach(col => {
      const exists = schema.some(r => r.COLUMN_NAME === col);
      if (!exists) {
        console.log(`   ⚠️  Coluna faltando: ${col}`);
        allCols = false;
      }
    });

    if (allCols) {
      console.log(`   ✅ Todas as colunas obrigatórias existem`);
    }

    await connection.end();

  } catch (error) {
    console.log('   ❌ Erro ao conectar no banco de dados');
    console.log(`   📝 ${error.message}`);
  }

  // 3. Verificar configuração
  console.log('\n3️⃣  Verificando configuração...');
  console.log(`   📍 API_URL: http://localhost:3001/api`);
  console.log(`   📍 DB_HOST: ${process.env.DB_HOST}`);
  console.log(`   📍 DB_NAME: ${process.env.DB_NAME}`);
  console.log(`   📍 JWT_SECRET: ${ process.env.JWT_SECRET ? '✅ Configurado' : '❌ Não configurado'}`);

  // 4. Resumo
  console.log('\n' + '═'.repeat(50));
  console.log('\n📊 Resumo:\n');

  if (serverRunning) {
    console.log('✅ Sistema pronto para uso!');
    console.log('\n💡 Próximos passos:');
    console.log('   1. Abra http://localhost (ou conforme configurado)');
    console.log('   2. Faça login com suas credenciais');
    console.log('   3. Vá para Mensagens e selecione um usuário');
    console.log('   4. Envie uma mensagem');
    console.log('   5. Abra DevTools (F12) → Console para ver logs de debug');
  } else {
    console.log('❌ Sistema não está completamente operacional');
    console.log('\n💡 Como resolver:');
    console.log('   1. Inicie o servidor: cd backend && npm start');
    console.log('   2. Verifique a conexão MySQL em .env');
    console.log('   3. Rode: node backend/diagnostic-db.js');
  }

  console.log('\n' + '═'.repeat(50) + '\n');
}

function checkPort(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection(port, 'localhost');
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => {
      resolve(false);
    });
  });
}

checkStatus();
