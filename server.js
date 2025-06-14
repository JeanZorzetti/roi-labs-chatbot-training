const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001; // VOLTA PARA 3001
const HOST = process.env.HOST || '0.0.0.0';

console.log('🚀 ROI Labs Chatbot Training - Starting...');
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`📍 Port: ${PORT}`);
console.log(`📍 Host: ${HOST}`);

// Log all requests with more details
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const userAgent = req.get('User-Agent') || 'Unknown';
  const forwardedFor = req.get('X-Forwarded-For') || req.ip;
  console.log(`📥 [${timestamp}] ${req.method} ${req.originalUrl} - IP: ${forwardedFor} - UA: ${userAgent.substring(0, 50)}`);
  next();
});

// Basic middleware
app.use(cors());
app.use(express.json());

// Multiple health check endpoints for maximum compatibility
app.get('/health', (req, res) => {
  console.log('✅ Health check accessed via /health');
  res.status(200).send('OK');
});

app.get('/healthz', (req, res) => {
  console.log('✅ Health check accessed via /healthz (Kubernetes style)');
  res.status(200).send('OK');
});

app.get('/health/ready', (req, res) => {
  console.log('✅ Readiness check accessed via /health/ready');
  res.status(200).json({ status: 'ready', timestamp: new Date().toISOString() });
});

app.get('/health/live', (req, res) => {
  console.log('✅ Liveness check accessed via /health/live');
  res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  console.log('✅ API Health check accessed via /api/health');
  res.status(200).json({ 
    status: 'healthy',
    message: 'ROI Labs Chatbot Training is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    host: HOST,
    port: PORT
  });
});

// Ping endpoint
app.get('/ping', (req, res) => {
  console.log('🏓 Ping accessed');
  res.status(200).send('pong');
});

// Status endpoint
app.get('/status', (req, res) => {
  console.log('📊 Status accessed');
  res.status(200).json({ 
    status: 'running',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  console.log('🏠 Root endpoint accessed');
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>ROI Labs Chatbot Training</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0; color: white; }
          .container { max-width: 600px; margin: 0 auto; background: rgba(255,255,255,0.95); padding: 40px; border-radius: 15px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); color: #333; }
          h1 { color: #333; margin-bottom: 20px; font-size: 2.5em; }
          .status { color: #28a745; font-weight: bold; font-size: 20px; margin: 20px 0; }
          .links { margin: 30px 0; }
          .links a { margin: 5px; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 8px; display: inline-block; transition: all 0.3s; }
          .links a:hover { background: #0056b3; transform: translateY(-2px); }
          .endpoints { text-align: left; margin: 25px 0; background: #f8f9fa; padding: 20px; border-radius: 8px; }
          .endpoints h3 { color: #666; margin-top: 0; }
          .endpoints code { background: #e9ecef; padding: 4px 8px; border-radius: 4px; color: #d63384; }
          .info { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🤖 ROI Labs Chatbot Training</h1>
          <p class="status">✅ API funcionando na porta ${PORT}!</p>
          
          <div class="info">
            <strong>🎉 SUCESSO!</strong> A aplicação está rodando e funcionando perfeitamente!
          </div>
          
          <div class="links">
            <a href="/health">Health Check</a>
            <a href="/api/health">API Health</a>
            <a href="/api/info">API Info</a>
            <a href="/ping">Ping</a>
            <a href="/status">Status</a>
          </div>

          <div class="endpoints">
            <h3>📋 Endpoints de Health Check Disponíveis:</h3>
            <ul>
              <li><code>/health</code> - Health check simples</li>
              <li><code>/healthz</code> - Estilo Kubernetes</li>
              <li><code>/health/ready</code> - Readiness probe</li>
              <li><code>/health/live</code> - Liveness probe</li>
              <li><code>/api/health</code> - Informações detalhadas de saúde</li>
              <li><code>/ping</code> - Ping simples</li>
              <li><code>/status</code> - Status do sistema</li>
            </ul>
          </div>
          
          <div class="info">
            <p><strong>Versão:</strong> 1.0.0</p>
            <p><strong>Ambiente:</strong> ${process.env.NODE_ENV || 'development'}</p>
            <p><strong>Servidor:</strong> ${HOST}:${PORT}</p>
            <p><strong>Horário:</strong> ${new Date().toISOString()}</p>
          </div>
        </div>
      </body>
    </html>
  `);
});

// API info
app.get('/api/info', (req, res) => {
  console.log('ℹ️ API Info accessed');
  res.json({
    name: 'ROI Labs Chatbot Training API',
    version: '1.0.0',
    description: 'Sistema de treinamento de chatbot por crawling de sites com IA',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    host: HOST,
    port: PORT,
    health_endpoints: [
      '/health', '/healthz', '/health/ready', '/health/live', 
      '/api/health', '/ping', '/status'
    ],
    endpoints: [
      { path: '/', method: 'GET', description: 'Homepage' },
      { path: '/health', method: 'GET', description: 'Simple health check' },
      { path: '/api/health', method: 'GET', description: 'Detailed health check' },
      { path: '/api/info', method: 'GET', description: 'API information' },
      { path: '/ping', method: 'GET', description: 'Ping endpoint' },
      { path: '/status', method: 'GET', description: 'Status endpoint' }
    ]
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('❌ 404 - Route not found:', req.method, req.originalUrl);
  res.status(404).json({ 
    error: 'Endpoint not found',
    method: req.method,
    path: req.originalUrl,
    available_endpoints: ['/', '/health', '/api/health', '/api/info', '/ping', '/status']
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log('✅ ROI Labs Chatbot Training API started successfully!');
  console.log(`🌐 Server running at: http://${HOST}:${PORT}`);
  console.log(`🏥 Health checks available at:`);
  console.log(`   - http://${HOST}:${PORT}/health`);
  console.log(`   - http://${HOST}:${PORT}/healthz`);
  console.log(`   - http://${HOST}:${PORT}/health/ready`);
  console.log(`   - http://${HOST}:${PORT}/health/live`);
  console.log(`   - http://${HOST}:${PORT}/ping`);
  console.log(`📋 API info: http://${HOST}:${PORT}/api/info`);
  console.log('🎉 Ready to receive requests!');
});

// Error handling
server.on('error', (err) => {
  console.error('❌ Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});
