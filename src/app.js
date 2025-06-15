require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

console.log('🚀 Initializing ROI Labs Chatbot Training...');

// Importar middlewares com verificação de erro
let supabase;
try {
    supabase = require('./config/database');
    console.log('✅ Supabase connection loaded');
} catch (error) {
    console.error('❌ Error loading Supabase:', error.message);
    supabase = null;
}

// Importar middlewares com tratamento de erro
let middlewares = {};
try {
    const logging = require('./middleware/logging');
    middlewares.requestLogger = logging.requestLogger;
    middlewares.errorLogger = logging.errorLogger;
    middlewares.logger = logging.logger;
    console.log('✅ Logging middleware loaded');
} catch (error) {
    console.error('❌ Error loading logging middleware:', error.message);
    middlewares.logger = { info: console.log, error: console.error, warn: console.warn, debug: console.log };
}

try {
    const rateLimiting = require('./middleware/rateLimiting');
    middlewares.rateLimiter = rateLimiting.rateLimiter;
    middlewares.suspiciousActivityDetector = rateLimiting.suspiciousActivityDetector;
    middlewares.requestId = rateLimiting.requestId;
    middlewares.getRateLimitStats = rateLimiting.getRateLimitStats;
    console.log('✅ Rate limiting middleware loaded');
} catch (error) {
    console.error('❌ Error loading rate limiting middleware:', error.message);
    middlewares.rateLimiter = (options) => (req, res, next) => next();
    middlewares.suspiciousActivityDetector = (req, res, next) => next();
    middlewares.requestId = (req, res, next) => { req.id = Math.random().toString(36); next(); };
    middlewares.getRateLimitStats = () => ({ requests: 0 });
}

try {
    const errorHandler = require('./middleware/errorHandler');
    middlewares.errorHandler = errorHandler.errorHandler;
    middlewares.notFoundHandler = errorHandler.notFoundHandler;
    middlewares.performanceMonitor = errorHandler.performanceMonitor;
    middlewares.requestTimeout = errorHandler.requestTimeout;
    console.log('✅ Error handler middleware loaded');
} catch (error) {
    console.error('❌ Error loading error handler middleware:', error.message);
    middlewares.errorHandler = (err, req, res, next) => {
        console.error('Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    };
    middlewares.notFoundHandler = (req, res) => {
        res.status(404).json({ error: 'Not found' });
    };
    middlewares.performanceMonitor = (req, res, next) => next();
    middlewares.requestTimeout = (timeout) => (req, res, next) => next();
}

// Importar rotas com tratamento de erro
let routes = {};
try {
    routes.crawling = require('./routes/crawling');
    console.log('✅ Crawling routes loaded');
} catch (error) {
    console.error('❌ Error loading crawling routes:', error.message);
    routes.crawling = express.Router();
}

try {
    routes.search = require('./routes/search');
    console.log('✅ Search routes loaded');
} catch (error) {
    console.error('❌ Error loading search routes:', error.message);
    routes.search = express.Router();
}

try {
    routes.clients = require('./routes/clients');
    console.log('✅ Client routes loaded');
} catch (error) {
    console.error('❌ Error loading client routes:', error.message);
    routes.clients = express.Router();
}

const app = express();

// Trust proxy para obter IP real em produção
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Configuração de CORS otimizada para produção
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'])
        : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-API-Key', 'Authorization', 'X-Request-ID'],
    credentials: false,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Configuração de segurança básica
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false // Desabilitado para evitar problemas com React
}));

// Middleware de parsing com limites
app.use(express.json({ 
    limit: '10mb'
}));
app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
}));

// Middlewares de sistema (aplicados globalmente)
app.use(middlewares.requestId); // Adicionar ID único a cada request
app.use(middlewares.performanceMonitor); // Monitorar performance
app.use(middlewares.requestTimeout(60000)); // Timeout de 60 segundos

// Middleware de logging para produção
if (process.env.NODE_ENV === 'production' && middlewares.requestLogger) {
    app.use(middlewares.requestLogger);
}

// Middleware de detecção de atividade suspeita
app.use(middlewares.suspiciousActivityDetector);

// Rate limiting global
app.use(middlewares.rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 1000, // 1000 requests por 15 minutos (global)
    message: {
        error: 'Too many requests',
        message: 'Muitas requisições. Tente novamente em alguns minutos.'
    }
}));

// Verificar dashboards disponíveis
const reactDashboardPath = path.join(__dirname, '../public/dashboard');
const fallbackDashboardPath = path.join(__dirname, '../public/fallback.html');
const publicIndexPath = path.join(__dirname, '../public/index.html');

console.log('🔍 Dashboard configuration:');
console.log(`📁 React dashboard path: ${reactDashboardPath}`);
console.log(`📁 Fallback dashboard path: ${fallbackDashboardPath}`);
console.log(`📁 Public index path: ${publicIndexPath}`);

const hasReactDashboard = fs.existsSync(path.join(reactDashboardPath, 'index.html'));
const hasFallbackDashboard = fs.existsSync(fallbackDashboardPath);
const hasPublicIndex = fs.existsSync(publicIndexPath);

console.log(`✅ React dashboard available: ${hasReactDashboard ? 'YES' : 'NO'}`);
console.log(`✅ Fallback dashboard available: ${hasFallbackDashboard ? 'YES' : 'NO'}`);
console.log(`✅ Public index available: ${hasPublicIndex ? 'YES' : 'NO'}`);

if (!hasReactDashboard && !hasFallbackDashboard && !hasPublicIndex) {
    console.log('❌ CRITICAL: No dashboard available! Check build process.');
}

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
    etag: true,
    lastModified: true,
    index: false // Não servir index.html automaticamente
}));

// Rotas da API
app.use('/api/crawling', routes.crawling);
app.use('/api/search', routes.search);
app.use('/api/clients', routes.clients);

// Health check aprimorado
app.get('/api/health', async (req, res) => {
    try {
        const startTime = Date.now();
        
        let dbStatus = 'not configured';
        let dbResponseTime = 0;
        let dbError = null;
        
        // Teste de conexão com banco (se disponível)
        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from('clients')
                    .select('count')
                    .limit(1);
                
                dbResponseTime = Date.now() - startTime;
                dbStatus = error ? 'error' : 'connected';
                dbError = error ? error.message : null;
            } catch (err) {
                dbStatus = 'error';
                dbError = err.message;
            }
        }
        
        // Informações do sistema
        const healthInfo = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            message: 'ROI Labs Chatbot Training API',
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            uptime: Math.floor(process.uptime()),
            dashboard: {
                type: hasReactDashboard ? 'React (Modern)' : hasFallbackDashboard ? 'HTML Fallback' : hasPublicIndex ? 'Public Index' : 'NOT AVAILABLE',
                available: hasReactDashboard || hasFallbackDashboard || hasPublicIndex,
                react: hasReactDashboard,
                fallback: hasFallbackDashboard,
                publicIndex: hasPublicIndex,
                path: hasReactDashboard ? reactDashboardPath : hasFallbackDashboard ? fallbackDashboardPath : hasPublicIndex ? publicIndexPath : 'N/A'
            },
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
                rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB'
            },
            database: {
                status: dbStatus,
                responseTime: dbResponseTime + 'ms',
                error: dbError
            },
            config: {
                supabase_url: process.env.SUPABASE_URL ? 'configured' : 'missing',
                supabase_key: process.env.SUPABASE_ANON_KEY ? 'configured' : 'missing',
                openai_key: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
                cors_origins: process.env.ALLOWED_ORIGINS ? 'configured' : 'wildcard'
            },
            performance: {
                node_version: process.version,
                platform: process.platform,
                arch: process.arch
            }
        };
        
        res.json(healthInfo);
    } catch (error) {
        console.error('Health check failed:', error);
        
        res.status(500).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: process.env.NODE_ENV === 'production' 
                ? 'Internal server error' 
                : error.message,
            version: '1.0.0',
            dashboard: {
                available: hasReactDashboard || hasFallbackDashboard || hasPublicIndex,
                type: hasReactDashboard ? 'React (Modern)' : hasFallbackDashboard ? 'HTML Fallback' : hasPublicIndex ? 'Public Index' : 'NOT AVAILABLE'
            }
        });
    }
});

// Rota de informações da API
app.get('/api/info', (req, res) => {
    const dashboardInfo = hasReactDashboard 
        ? { type: 'React (Modern)', available: true, url: '/' }
        : hasFallbackDashboard 
        ? { type: 'HTML Fallback', available: true, url: '/' }
        : hasPublicIndex
        ? { type: 'Public Index', available: true, url: '/' }
        : { type: 'NOT AVAILABLE', available: false, url: '/api/health' };

    res.json({
        name: 'ROI Labs Chatbot Training API',
        version: '1.0.0',
        description: 'Sistema de treinamento de chatbot por crawling de sites',
        environment: process.env.NODE_ENV || 'development',
        dashboard: dashboardInfo,
        endpoints: {
            health: '/api/health',
            auth: '/api/test-auth',
            crawling: {
                start: 'POST /api/crawling/start',
                status: 'GET /api/crawling/status/:id',
                history: 'GET /api/crawling/history'
            },
            search: {
                search: 'POST /api/search',
                domains: 'GET /api/search/domains',
                stats: 'GET /api/search/stats'
            },
            clients: {
                create: 'POST /api/clients',
                profile: 'GET /api/clients/profile'
            }
        },
        documentation: 'https://github.com/JeanZorzetti/roi-labs-chatbot-training',
        support: 'contato@roilabs.com.br'
    });
});

// ROTA PRINCIPAL: Servir Dashboard com fallback inteligente
app.get('/', (req, res) => {
    if (hasReactDashboard) {
        const reactIndexPath = path.join(reactDashboardPath, 'index.html');
        console.log(`🎨 Serving React dashboard from: ${reactIndexPath}`);
        res.sendFile(reactIndexPath);
    } else if (hasFallbackDashboard) {
        console.log(`🏠 Serving fallback dashboard from: ${fallbackDashboardPath}`);
        res.sendFile(fallbackDashboardPath);
    } else if (hasPublicIndex) {
        console.log(`📄 Serving public index from: ${publicIndexPath}`);
        res.sendFile(publicIndexPath);
    } else {
        // Se não há nenhum dashboard, mostrar página de status
        res.status(200).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>ROI Labs - Chatbot Training</title>
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
                    .info { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🤖 ROI Labs Chatbot Training</h1>
                    <p class="status">✅ API funcionando na porta ${process.env.PORT || 3001}!</p>
                    
                    <div class="info">
                        <strong>🎉 SUCESSO!</strong> A aplicação está rodando e funcionando perfeitamente!
                    </div>
                    
                    <div class="links">
                        <a href="/api/health">Health Check</a>
                        <a href="/api/info">API Info</a>
                    </div>
                    
                    <div class="info">
                        <p><strong>Versão:</strong> 1.0.0</p>
                        <p><strong>Ambiente:</strong> ${process.env.NODE_ENV || 'development'}</p>
                        <p><strong>Servidor:</strong> ${process.env.HOST || '0.0.0.0'}:${process.env.PORT || 3001}</p>
                        <p><strong>Horário:</strong> ${new Date().toISOString()}</p>
                    </div>
                </div>
            </body>
            </html>
        `);
    }
});

// Rota de fallback para React Router (SPA) ou fallback dashboard
app.get('/*', (req, res) => {
    // Se for uma requisição de API, não interceptar
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ 
            error: 'API endpoint not found',
            available_endpoints: '/api/health, /api/info'
        });
    }
    
    // Se for um arquivo estático, não interceptar
    if (req.path.includes('.')) {
        return res.status(404).send('File not found');
    }
    
    // Para outras rotas, servir o dashboard disponível (SPA routing)
    if (hasReactDashboard) {
        const reactIndexPath = path.join(reactDashboardPath, 'index.html');
        console.log(`🔄 SPA routing: serving React dashboard for ${req.path}`);
        res.sendFile(reactIndexPath);
    } else if (hasFallbackDashboard) {
        console.log(`🔄 SPA routing: serving fallback dashboard for ${req.path}`);
        res.sendFile(fallbackDashboardPath);
    } else if (hasPublicIndex) {
        console.log(`🔄 SPA routing: serving public index for ${req.path}`);
        res.sendFile(publicIndexPath);
    } else {
        res.redirect('/');
    }
});

// Middleware de tratamento de 404
app.use(middlewares.notFoundHandler);

// Middleware de logging de erros
if (middlewares.errorLogger) {
    app.use(middlewares.errorLogger);
}

// Middleware de tratamento de erros global
app.use(middlewares.errorHandler);

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
    const env = process.env.NODE_ENV || 'development';
    
    const dashboardStatus = hasReactDashboard 
        ? 'React (Modern) ✅' 
        : hasFallbackDashboard 
        ? 'HTML Fallback ⚠️' 
        : hasPublicIndex
        ? 'Public Index 📄'
        : 'Status Page 📊';
    
    console.log('🚀 ROI Labs Chatbot Training API iniciada!');
    console.log(`📍 Ambiente: ${env}`);
    console.log(`🌐 Servidor: http://${HOST}:${PORT}`);
    console.log(`🎨 Dashboard: ${dashboardStatus}`);
    console.log(`🏥 Health check: http://${HOST}:${PORT}/api/health`);
    console.log(`ℹ️  API info: http://${HOST}:${PORT}/api/info`);
    console.log('✅ API pronta para receber requisições!');
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
    console.log(`📴 Recebido ${signal}, iniciando graceful shutdown...`);
    
    server.close(() => {
        console.log('✅ Servidor HTTP encerrado');
        console.log('✅ Graceful shutdown concluído');
        process.exit(0);
    });
    
    // Forçar encerramento após timeout
    setTimeout(() => {
        console.error('❌ Forcando encerramento após timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error.message);
    
    if (process.env.NODE_ENV === 'production') {
        gracefulShutdown('UNCAUGHT_EXCEPTION');
    } else {
        console.error(error.stack);
    }
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection:', reason);
    
    if (process.env.NODE_ENV === 'production') {
        gracefulShutdown('UNHANDLED_REJECTION');
    }
});

module.exports = app;