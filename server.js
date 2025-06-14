// Inicialização do banco de dados ROI Labs Chatbot Training
require('dotenv').config();

// Usar o src/app.js como servidor principal
const path = require('path');
const fs = require('fs');

// Verificar se existe src/app.js
const srcAppPath = path.join(__dirname, 'src', 'app.js');

if (fs.existsSync(srcAppPath)) {
    console.log('🔄 Carregando aplicação completa (src/app.js)...');
    require('./src/app.js');
} else {
    console.log('⚠️  src/app.js não encontrado, usando servidor básico...');
    
    // Código do servidor básico
    const express = require('express');
    const cors = require('cors');
    const { createClient } = require('@supabase/supabase-js');

    const app = express();
    const PORT = process.env.PORT || 3001;
    const HOST = process.env.HOST || '0.0.0.0';

    console.log('🚀 ROI Labs Chatbot Training - Starting...');
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`📍 Host: ${HOST}`);

    // Inicializar Supabase
    let supabase = null;
    try {
        if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
            supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
            console.log('✅ Supabase inicializado');
        } else {
            console.log('⚠️  Credenciais do Supabase não configuradas');
        }
    } catch (error) {
        console.log('❌ Erro ao inicializar Supabase:', error.message);
    }

    // Middleware
    app.use((req, res, next) => {
        const timestamp = new Date().toISOString();
        const userAgent = req.get('User-Agent') || 'Unknown';
        const forwardedFor = req.get('X-Forwarded-For') || req.ip;
        console.log(`📥 [${timestamp}] ${req.method} ${req.originalUrl} - IP: ${forwardedFor} - UA: ${userAgent.substring(0, 50)}`);
        next();
    });

    app.use(cors());
    app.use(express.json());

    // Health checks
    app.get('/health', (req, res) => {
        console.log('✅ Health check accessed via /health');
        res.status(200).send('OK');
    });

    app.get('/api/health', async (req, res) => {
        console.log('✅ API Health check accessed via /api/health');
        
        let dbStatus = 'not configured';
        let dbError = null;
        
        if (supabase) {
            try {
                const { data, error } = await supabase.from('clients').select('count').limit(1);
                dbStatus = error ? 'error' : 'connected';
                dbError = error ? error.message : null;
            } catch (err) {
                dbStatus = 'error';
                dbError = err.message;
            }
        }
        
        res.status(200).json({ 
            status: 'healthy',
            message: 'ROI Labs Chatbot Training is running',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            uptime: process.uptime(),
            host: HOST,
            port: PORT,
            database: {
                status: dbStatus,
                error: dbError
            },
            supabase: {
                configured: !!supabase,
                url: process.env.SUPABASE_URL ? 'configured' : 'missing',
                key: process.env.SUPABASE_ANON_KEY ? 'configured' : 'missing'
            }
        });
    });

    // Endpoint para inicializar banco de dados
    app.post('/api/database/init', async (req, res) => {
        console.log('🗄️  Database initialization requested');
        
        if (!supabase) {
            return res.status(500).json({
                error: 'Supabase não configurado',
                message: 'Configure SUPABASE_URL e SUPABASE_ANON_KEY'
            });
        }

        try {
            // SQL para criar tabelas
            const createTablesSQL = `
-- ====================================
-- ROI LABS CHATBOT TRAINING - DATABASE SCHEMA
-- ====================================

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    company VARCHAR(255),
    api_key VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'trial')),
    plan VARCHAR(50) DEFAULT 'basic' CHECK (plan IN ('basic', 'pro', 'enterprise', 'trial')),
    max_crawling_sessions INTEGER DEFAULT 10,
    max_pages_per_session INTEGER DEFAULT 100,
    max_storage_mb INTEGER DEFAULT 500,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP WITH TIME ZONE
);

-- Índices para clients
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_api_key ON clients(api_key);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

-- Tabela de sessões de crawling
CREATE TABLE IF NOT EXISTS crawling_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_urls TEXT[] NOT NULL,
    max_pages INTEGER DEFAULT 50,
    max_depth INTEGER DEFAULT 3,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'paused', 'completed', 'failed', 'cancelled')),
    progress DECIMAL(5,2) DEFAULT 0.00,
    pages_found INTEGER DEFAULT 0,
    pages_crawled INTEGER DEFAULT 0,
    pages_failed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para crawling_sessions
CREATE INDEX IF NOT EXISTS idx_crawling_sessions_client_id ON crawling_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_crawling_sessions_status ON crawling_sessions(status);

-- Tabela de páginas crawleadas
CREATE TABLE IF NOT EXISTS crawled_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES crawling_sessions(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title VARCHAR(500),
    cleaned_content TEXT NOT NULL,
    word_count INTEGER DEFAULT 0,
    http_status_code INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para crawled_pages
CREATE INDEX IF NOT EXISTS idx_crawled_pages_session_id ON crawled_pages(session_id);
CREATE INDEX IF NOT EXISTS idx_crawled_pages_client_id ON crawled_pages(client_id);
CREATE INDEX IF NOT EXISTS idx_crawled_pages_url ON crawled_pages(url);

-- Inserir cliente de exemplo
INSERT INTO clients (name, email, company, api_key) 
VALUES ('ROI Labs', 'admin@roilabs.com.br', 'ROI Labs', 'roi-labs-demo-key-2025') 
ON CONFLICT (email) DO NOTHING;
            `;

            // Como não podemos executar SQL diretamente com o cliente anon,
            // vamos criar um cliente de teste para verificar se a conexão funciona
            const testResult = await supabase
                .from('clients')
                .select('*')
                .limit(1);

            res.json({
                success: true,
                message: 'Conexão com banco de dados verificada',
                timestamp: new Date().toISOString(),
                database_status: testResult.error ? 'needs_setup' : 'ready',
                note: 'Para criar tabelas, acesse o painel do Supabase e execute o SQL fornecido',
                sql_to_execute: createTablesSQL,
                instructions: [
                    '1. Acesse https://supabase.com/dashboard',
                    '2. Vá para seu projeto > SQL Editor',
                    '3. Cole e execute o SQL fornecido',
                    '4. Teste novamente este endpoint'
                ]
            });

        } catch (error) {
            console.error('❌ Database init error:', error);
            res.status(500).json({
                error: 'Erro ao verificar banco de dados',
                message: error.message
            });
        }
    });

    // Endpoint para listar tabelas existentes
    app.get('/api/database/tables', async (req, res) => {
        if (!supabase) {
            return res.status(500).json({ error: 'Supabase não configurado' });
        }

        try {
            // Tentar acessar algumas tabelas comuns
            const tables = ['clients', 'crawling_sessions', 'crawled_pages'];
            const results = {};

            for (const table of tables) {
                try {
                    const { data, error } = await supabase.from(table).select('*').limit(1);
                    results[table] = {
                        exists: !error || error.code !== '42P01',
                        status: error ? error.message : 'accessible',
                        record_count: data ? data.length : 0
                    };
                } catch (err) {
                    results[table] = {
                        exists: false,
                        status: err.message
                    };
                }
            }

            res.json({
                success: true,
                tables: results,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            res.status(500).json({
                error: 'Erro ao verificar tabelas',
                message: error.message
            });
        }
    });

    // Endpoint para criar cliente de teste
    app.post('/api/clients/create', async (req, res) => {
        if (!supabase) {
            return res.status(500).json({ error: 'Supabase não configurado' });
        }

        const { name, email, company } = req.body;
        
        if (!name || !email) {
            return res.status(400).json({ error: 'Nome e email são obrigatórios' });
        }

        try {
            const apiKey = `roi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const { data, error } = await supabase
                .from('clients')
                .insert([{
                    name,
                    email,
                    company: company || '',
                    api_key: apiKey
                }])
                .select();

            if (error) {
                return res.status(400).json({ error: error.message });
            }

            res.json({
                success: true,
                client: data[0],
                message: 'Cliente criado com sucesso'
            });

        } catch (error) {
            res.status(500).json({
                error: 'Erro ao criar cliente',
                message: error.message
            });
        }
    });

    // Outros endpoints básicos
    app.get('/ping', (req, res) => {
        console.log('🏓 Ping accessed');
        res.status(200).send('pong');
    });

    app.get('/api/info', (req, res) => {
        console.log('ℹ️  API Info accessed');
        res.json({
            name: 'ROI Labs Chatbot Training API',
            version: '1.0.0',
            description: 'Sistema de treinamento de chatbot por crawling de sites com IA',
            status: 'running',
            environment: process.env.NODE_ENV || 'development',
            uptime: process.uptime(),
            endpoints: [
                { path: '/health', method: 'GET', description: 'Simple health check' },
                { path: '/api/health', method: 'GET', description: 'Detailed health check with DB status' },
                { path: '/api/database/init', method: 'POST', description: 'Initialize database schema' },
                { path: '/api/database/tables', method: 'GET', description: 'List database tables' },
                { path: '/api/clients/create', method: 'POST', description: 'Create new client' },
                { path: '/api/info', method: 'GET', description: 'API information' },
                { path: '/ping', method: 'GET', description: 'Ping endpoint' }
            ]
        });
    });

    // Homepage
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
              .container { max-width: 900px; margin: 0 auto; background: rgba(255,255,255,0.95); padding: 40px; border-radius: 15px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); color: #333; }
              h1 { color: #333; margin-bottom: 20px; font-size: 2.5em; }
              .status { color: #28a745; font-weight: bold; font-size: 20px; margin: 20px 0; }
              .links { margin: 30px 0; }
              .links a { margin: 5px; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 8px; display: inline-block; transition: all 0.3s; }
              .links a:hover { background: #0056b3; transform: translateY(-2px); }
              .endpoints { text-align: left; margin: 25px 0; background: #f8f9fa; padding: 20px; border-radius: 8px; }
              .endpoints h3 { color: #666; margin-top: 0; }
              .endpoints code { background: #e9ecef; padding: 4px 8px; border-radius: 4px; color: #d63384; }
              .info { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; }
              .database { background: #f1f8e9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50; }
              .setup { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
              .form { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left; }
              .form input, .form button { padding: 10px; margin: 5px; border-radius: 5px; border: 1px solid #ddd; }
              .form button { background: #007bff; color: white; cursor: pointer; }
              .form button:hover { background: #0056b3; }
            </style>
            <script>
              async function initDatabase() {
                try {
                  const response = await fetch('/api/database/init', { method: 'POST' });
                  const result = await response.json();
                  alert(JSON.stringify(result, null, 2));
                } catch (error) {
                  alert('Erro: ' + error.message);
                }
              }
              
              async function createClient() {
                const name = document.getElementById('clientName').value;
                const email = document.getElementById('clientEmail').value;
                const company = document.getElementById('clientCompany').value;
                
                try {
                  const response = await fetch('/api/clients/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, company })
                  });
                  const result = await response.json();
                  alert(JSON.stringify(result, null, 2));
                } catch (error) {
                  alert('Erro: ' + error.message);
                }
              }
            </script>
          </head>
          <body>
            <div class="container">
              <h1>🤖 ROI Labs Chatbot Training</h1>
              <p class="status">✅ API funcionando na porta ${PORT} com Supabase!</p>
              
              <div class="info">
                <strong>🎉 APLICAÇÃO ATUALIZADA!</strong> Agora com integração Supabase funcionando!
              </div>

              <div class="setup">
                <h3>⚡ Setup Rápido</h3>
                <p><strong>1. Inicializar Banco:</strong> <button onclick="initDatabase()" style="background: #28a745; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">Inicializar DB</button></p>
                <p><strong>2. Criar Cliente de Teste:</strong> Use o formulário abaixo</p>
              </div>

              <div class="database">
                <h3>🗄️ Database Management</h3>
                <p>Gerencie o banco de dados através da API:</p>
                <ul style="text-align: left;">
                  <li><strong>POST /api/database/init</strong> - Obter SQL para inicializar banco</li>
                  <li><strong>GET /api/database/tables</strong> - Verificar tabelas existentes</li>
                  <li><strong>POST /api/clients/create</strong> - Criar novo cliente</li>
                  <li><strong>GET /api/health</strong> - Status detalhado incluindo banco</li>
                </ul>
              </div>

              <div class="form">
                <h3>👥 Criar Cliente de Teste</h3>
                <input type="text" id="clientName" placeholder="Nome do cliente" required>
                <input type="email" id="clientEmail" placeholder="Email do cliente" required>
                <input type="text" id="clientCompany" placeholder="Empresa (opcional)">
                <br>
                <button onclick="createClient()">Criar Cliente</button>
              </div>
              
              <div class="links">
                <a href="/health">Health Check</a>
                <a href="/api/health">API Health</a>
                <a href="/api/database/tables">Database Tables</a>
                <a href="/api/info">API Info</a>
                <a href="/ping">Ping</a>
              </div>

              <div class="endpoints">
                <h3>📋 Endpoints Disponíveis:</h3>
                <ul>
                  <li><code>GET /health</code> - Health check simples</li>
                  <li><code>GET /api/health</code> - Health check com status do banco</li>
                  <li><code>POST /api/database/init</code> - Obter SQL para inicializar banco</li>
                  <li><code>GET /api/database/tables</code> - Verificar tabelas existentes</li>
                  <li><code>POST /api/clients/create</code> - Criar novo cliente</li>
                  <li><code>GET /api/info</code> - Informações da API</li>
                  <li><code>GET /ping</code> - Ping simples</li>
                </ul>
              </div>
              
              <div class="info">
                <p><strong>Versão:</strong> 1.0.0</p>
                <p><strong>Ambiente:</strong> ${process.env.NODE_ENV || 'development'}</p>
                <p><strong>Servidor:</strong> ${HOST}:${PORT}</p>
                <p><strong>Supabase:</strong> ${supabase ? '✅ Configurado' : '❌ Não configurado'}</p>
                <p><strong>Horário:</strong> ${new Date().toISOString()}</p>
              </div>
            </div>
          </body>
        </html>
        `);
    });

    // 404 handler
    app.use('*', (req, res) => {
        console.log('❌ 404 - Route not found:', req.method, req.originalUrl);
        res.status(404).json({ 
            error: 'Endpoint not found',
            method: req.method,
            path: req.originalUrl,
            available_endpoints: ['/', '/health', '/api/health', '/api/database/init', '/api/database/tables', '/api/clients/create', '/api/info', '/ping']
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
        console.log(`🏥 Health checks: http://${HOST}:${PORT}/api/health`);
        console.log(`🗄️  Database init: POST http://${HOST}:${PORT}/api/database/init`);
        console.log(`👥 Create client: POST http://${HOST}:${PORT}/api/clients/create`);
        console.log(`📋 API info: http://${HOST}:${PORT}/api/info`);
        console.log('🎉 Ready to receive requests!');
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
}
