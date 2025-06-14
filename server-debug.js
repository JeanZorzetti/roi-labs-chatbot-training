const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

console.log('🚀 [DEBUG] Iniciando servidor...');
console.log('📍 [DEBUG] PORT:', PORT);
console.log('📍 [DEBUG] HOST:', HOST);
console.log('📍 [DEBUG] NODE_ENV:', process.env.NODE_ENV);

// Middleware básico
app.use(cors());
app.use(express.json());

// Health check simples
app.get('/health', (req, res) => {
  console.log('🏥 [DEBUG] Health check chamado');
  res.status(200).send('OK');
});

app.get('/api/health', (req, res) => {
  console.log('🏥 [DEBUG] API Health check chamado');
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Root
app.get('/', (req, res) => {
  console.log('🏠 [DEBUG] Root endpoint chamado');
  res.send('<h1>🤖 ROI Labs Chatbot - DEBUG VERSION</h1><p>Servidor funcionando!</p>');
});

// Catch errors
app.use((err, req, res, next) => {
  console.error('❌ [DEBUG] Erro:', err);
  res.status(500).json({ error: 'Erro interno' });
});

// Start server
console.log('🔄 [DEBUG] Tentando iniciar servidor...');
const server = app.listen(PORT, HOST, () => {
  console.log('✅ [DEBUG] Servidor iniciado com sucesso!');
  console.log(`🌐 [DEBUG] Endereço: http://${HOST}:${PORT}`);
  console.log('🎉 [DEBUG] Pronto para receber requisições!');
});

server.on('error', (err) => {
  console.error('❌ [DEBUG] Erro do servidor:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ [DEBUG] Porta ${PORT} já está em uso!`);
  }
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ [DEBUG] Exceção não capturada:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ [DEBUG] Promise rejeitada:', err);
  process.exit(1);
});
