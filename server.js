const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

console.log('🚀 ROI Labs Chatbot Training - Starting...');
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`📍 Port: ${PORT}`);
console.log(`📍 Host: ${HOST}`);

// Log all requests
app.use((req, res, next) => {
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.path} from ${req.ip}`);
  next();
});

// Basic middleware
app.use(cors());
app.use(express.json());

// Health checks with detailed logging
app.get('/health', (req, res) => {
  console.log('✅ Health check accessed via /health');
  res.status(200).send('OK');
});

app.get('/api/health', (req, res) => {
  console.log('✅ API Health check accessed via /api/health');
  res.status(200).json({ 
    status: 'healthy',
    message: 'ROI Labs Chatbot Training is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime()
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
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #333; margin-bottom: 20px; }
          .links { margin: 30px 0; }
          .links a { margin: 0 15px; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
          .links a:hover { background: #0056b3; }
          .status { color: #28a745; font-weight: bold; }
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
          </div>
          <p><small>Version: 1.0.0 | Environment: ${process.env.NODE_ENV || 'development'}</small></p>
          <p><small>Server Time: ${new Date().toISOString()}</small></p>
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
    endpoints: [
      { path: '/', method: 'GET', description: 'Homepage' },
      { path: '/health', method: 'GET', description: 'Simple health check' },
      { path: '/api/health', method: 'GET', description: 'Detailed health check' },
      { path: '/api/info', method: 'GET', description: 'API information' }
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
    available_endpoints: ['/', '/health', '/api/health', '/api/info']
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
  console.log(`🏥 Health check: http://${HOST}:${PORT}/health`);
  console.log(`📋 API info: http://${HOST}:${PORT}/api/info`);
  console.log('🎉 Ready to receive requests!');
  
  // Test internal health check
  setTimeout(() => {
    console.log('🔄 Testing internal health check...');
    const http = require('http');
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: '/health',
      method: 'GET'
    };
    
    const req = http.request(options, (res) => {
      console.log(`🏥 Internal health check response: ${res.statusCode}`);
    });
    
    req.on('error', (err) => {
      console.log('❌ Internal health check error:', err.message);
    });
    
    req.end();
  }, 2000);
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
