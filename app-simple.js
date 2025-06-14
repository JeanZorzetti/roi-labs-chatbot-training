// Versão de teste sem dependências externas
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health check simples
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API funcionando',
    timestamp: new Date().toISOString()
  });
});

// Info básica
app.get('/api/info', (req, res) => {
  res.json({
    name: 'ROI Labs Chatbot Training API',
    version: '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Página inicial
app.get('/', (req, res) => {
  res.send(`
    <h1>🤖 ROI Labs Chatbot Training</h1>
    <p>API funcionando corretamente!</p>
    <ul>
      <li><a href="/api/health">Health Check</a></li>
      <li><a href="/api/info">API Info</a></li>
    </ul>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ROI Labs Chatbot Training API iniciada!`);
  console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Servidor: http://0.0.0.0:${PORT}`);
  console.log(`✅ API pronta para receber requisições!`);
});
