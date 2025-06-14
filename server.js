const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

console.log('🚀 ROI Labs Chatbot Training - Starting...');
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`📍 Port: ${PORT}`);
console.log(`📍 Host: ${HOST}`);

// Log all requests with more details
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const userAgent = req.get('User-Agent') || 'Unknown';
  console.log(`📥 [${timestamp}] ${req.method} ${req.originalUrl} - IP: ${req.ip} - UA: ${userAgent.substring(0, 50)}`);
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
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; margin: 0; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #333; margin-bottom: 20px; }
          .links { margin: 30px 0; }
          .links a { margin: 5px; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; display: inline-block; }
          .links a:hover { background: #0056b3; }
          .status { color: #28a745; font-weight: bold; font-size: 18px; }
          .endpoints { text-align: left; margin: 20px 0; }
          .endpoints h3 { color: #666; }
          .endpoints code { background: #f8f9fa; padding: 2px 5px; border-radius: 3px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🤖 ROI Labs Chatbot Training</h1>
          <p class="status">✅ API is running successfully!</p>
          
          <div class="links">
            <a href="/health">Health Check</a>
            <a href="/api/health">API Health</a>
            <a href="/api/info">API Info</a>
            <a href="/ping">Ping</a>
            <a href="/status">Status</a>
          </div>

          <div class="endpoints">
            <h3>Available Health Check Endpoints:</h3>
            <ul>
              <li><code>/health</code> - Simple health check</li>
              <li><code>/healthz</code> - Kubernetes style</li>
              <li><code>/health/ready</code> - Readiness probe</li>
              <li><code>/health/live</code> - Liveness probe</li>
              <li><code>/api/health</code> - Detailed health info</li>
              <li><code>/ping</code> - Simple ping-pong</li>
              <li><code>/status</code> - System status</li>
            </ul>
          </div>
          
          <p><small>Version: 1.0.0 | Environment: ${process.env.NODE_ENV || 'development'}</small></p>
          <p><small>Server Time: ${new Date().toISOString()}</small></p>
          <p><small>Host: ${HOST}:${PORT}</small></p>
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
