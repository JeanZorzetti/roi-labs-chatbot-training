const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

console.log('🚀 Iniciando ROI Labs Chatbot Training...');
console.log('📁 Diretório:', __dirname);
console.log('🌍 Ambiente:', process.env.NODE_ENV || 'development');
console.log('🔌 Porta:', PORT);
console.log('🌐 Host:', HOST);

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check - MAIS SIMPLES POSSÍVEL
app.get('/health', (req, res) => {
  console.log('Health check acessado');
  res.status(200).send('OK');
});

app.get('/api/health', (req, res) => {
  console.log('API Health check acessado');
  res.status(200).json({ 
    status: 'healthy',
    message: 'ROI Labs Chatbot Training API está funcionando',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  console.log('Root endpoint acessado');
  res.send(`
    <html>
      <head><title>ROI Labs Chatbot Training</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>🤖 ROI Labs Chatbot Training</h1>
        <p>API funcionando corretamente!</p>
        <div>
          <a href="/api/health">Health Check</a> |
          <a href="/api/info">API Info</a>
        </div>
        <p><small>Versão: 1.0.0 | Ambiente: ${process.env.NODE_ENV || 'development'}</small></p>
      </body>
    </html>
  `);
});

// API Info
app.get('/api/info', (req, res) => {
  console.log('API Info acessado');
  res.json({
    name: 'ROI Labs Chatbot Training API',
    version: '1.0.0',
    description: 'Sistema de treinamento de chatbot por crawling de sites com IA',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/api/health',
      info: '/api/info',
      root: '/'
    }
  });
});

// Catch all other routes
app.get('*', (req, res) => {
  console.log('Route não encontrada:', req.path);
  res.status(404).json({ 
    error: 'Endpoint não encontrado',
    path: req.path,
    message: 'Verifique a documentação da API'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: err.message 
  });
});

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log('🚀 ROI Labs Chatbot Training API iniciada!');
  console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Servidor: http://${HOST}:${PORT}`);
  console.log(`🏥 Health check: http://${HOST}:${PORT}/api/health`);
  console.log(`ℹ️  API info: http://${HOST}:${PORT}/api/info`);
  console.log('✅ API pronta para receber requisições!');
});

// Handle server errors
server.on('error', (err) => {
  console.error('❌ Erro do servidor:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Porta ${PORT} já está em uso!`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Recebido SIGTERM, fechando servidor...');
  server.close(() => {
    console.log('✅ Servidor fechado graciosamente');
  });
});
