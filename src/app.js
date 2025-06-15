require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const supabase = require('./config/database');

// Importar middlewares
const { 
    requestLogger, 
    errorLogger, 
    logger 
} = require('./middleware/logging');
const { 
    rateLimiter, 
    suspiciousActivityDetector, 
    requestId,
    getRateLimitStats 
} = require('./middleware/rateLimiting');
const { 
    errorHandler, 
    notFoundHandler, 
    performanceMonitor, 
    requestTimeout 
} = require('./middleware/errorHandler');

// Importar rotas
const crawlingRoutes = require('./routes/crawling');
const searchRoutes = require('./routes/search');
const clientRoutes = require('./routes/clients');

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

// Configuração de segurança otimizada para React dashboard
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.openai.com", "https://*.supabase.co", process.env.NODE_ENV === 'development' ? "ws://localhost:*" : ""]
        }
    } : false
}));

// Middleware de parsing com limites
app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
}));

// Middlewares de sistema (aplicados globalmente)
app.use(requestId); // Adicionar ID único a cada request
app.use(performanceMonitor); // Monitorar performance
app.use(requestTimeout(60000)); // Timeout de 60 segundos

// Middleware de logging para produção
if (process.env.NODE_ENV === 'production') {
    app.use(requestLogger);
}

// Middleware de detecção de atividade suspeita
app.use(suspiciousActivityDetector);

// Rate limiting global
app.use(rateLimiter({
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
const hasReactDashboard = fs.existsSync(path.join(reactDashboardPath, 'index.html'));
const hasFallbackDashboard = fs.existsSync(fallbackDashboardPath);

console.log('🔍 Dashboard configuration:');
console.log(`📁 React dashboard path: ${reactDashboardPath}`);
console.log(`✅ React dashboard available: ${hasReactDashboard ? 'YES' : 'NO'}`);
console.log(`📁 Fallback dashboard path: ${fallbackDashboardPath}`);
console.log(`✅ Fallback dashboard available: ${hasFallbackDashboard ? 'YES' : 'NO'}`);

if (!hasReactDashboard && !hasFallbackDashboard) {
    console.log('❌ CRITICAL: No dashboard available! Check build process.');
}

// Servir arquivos estáticos do React dashboard (se disponível)
if (hasReactDashboard) {
    console.log('🎨 Configuring React dashboard serving...');
    
    // Servir assets do React com cache longo
    app.use('/assets', express.static(path.join(reactDashboardPath, 'assets'), {
        maxAge: process.env.NODE_ENV === 'production' ? '1y' : 0,
        etag: true,
        lastModified: true
    }));
    
    // Servir outros arquivos estáticos do dashboard
    app.use(express.static(reactDashboardPath, {
        maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
        etag: true,
        lastModified: true,
        index: false // Não servir index.html automaticamente
    }));
}

// Servir arquivos estáticos gerais (fallback)
app.use(express.static(path.join(__dirname, '../public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
    etag: true,
    lastModified: true,
    index: false // Não servir index.html automaticamente
}));

// Rotas da API
app.use('/api/crawling', crawlingRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/clients', clientRoutes);

// Health check aprimorado
app.get('/api/health', async (req, res) => {
    try {
        const startTime = Date.now();
        
        // Teste de conexão com banco
        const { data, error } = await supabase
            .from('clients')
            .select('count')
            .limit(1);
        
        const dbResponseTime = Date.now() - startTime;
        
        // Informações do sistema
        const healthInfo = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            message: 'ROI Labs Chatbot Training API',
            version: require('../../package.json').version,
            environment: process.env.NODE_ENV || 'development',
            uptime: Math.floor(process.uptime()),
            dashboard: {
                type: hasReactDashboard ? 'React (Modern)' : hasFallbackDashboard ? 'HTML Fallback' : 'NOT AVAILABLE',
                available: hasReactDashboard || hasFallbackDashboard,
                react: hasReactDashboard,
                fallback: hasFallbackDashboard,
                path: hasReactDashboard ? '/app/public/dashboard/' : hasFallbackDashboard ? '/app/public/fallback.html' : 'N/A'
            },
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
                rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB'
            },
            database: {
                status: error ? 'error' : 'connected',
                responseTime: dbResponseTime + 'ms',
                error: error ? error.message : null
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
        
        // Log de health check bem-sucedido
        if (process.env.NODE_ENV === 'development') {
            logger.debug('Health check completed', {
                dbResponseTime,
                memoryUsage: healthInfo.memory,
                dashboardType: healthInfo.dashboard.type
            });
        }
        
        res.json(healthInfo);
    } catch (error) {
        logger.error('Health check failed', {
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
        
        res.status(500).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: process.env.NODE_ENV === 'production' 
                ? 'Internal server error' 
                : error.message,
            version: require('../../package.json').version,
            dashboard: {
                available: hasReactDashboard || hasFallbackDashboard,
                type: hasReactDashboard ? 'React (Modern)' : hasFallbackDashboard ? 'HTML Fallback' : 'NOT AVAILABLE'
            }
        });
    }
});

// Rota de teste da API key
app.get('/api/test-auth', async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
        return res.status(400).json({ 
            error: 'API key obrigatória',
            message: 'Envie a API key no header X-API-Key' 
        });
    }

    try {
        const { data: client, error } = await supabase
            .from('clients')
            .select('*')
            .eq('api_key', apiKey)
            .eq('status', 'active')
            .single();

        if (error || !client) {
            logger.warn('Invalid API key attempt', {
                apiKey: apiKey.substring(0, 8) + '...',
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            
            return res.status(401).json({ 
                error: 'API key inválida',
                message: 'Verifique se a API key está correta e o cliente está ativo'
            });
        }

        logger.info('API key validated successfully', {
            clientId: client.id,
            clientName: client.name,
            ip: req.ip
        });

        res.json({
            success: true,
            message: 'Autenticação bem-sucedida!',
            client: {
                id: client.id,
                name: client.name,
                email: client.email,
                company: client.company,
                status: client.status,
                created_at: client.created_at
            }
        });
    } catch (error) {
        logger.error('Auth test error', {
            error: error.message,
            apiKey: apiKey ? apiKey.substring(0, 8) + '...' : 'missing'
        });
        
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            message: 'Tente novamente em alguns instantes'
        });
    }
});

// Rota de informações da API
app.get('/api/info', (req, res) => {
    const dashboardInfo = hasReactDashboard 
        ? { type: 'React (Modern)', available: true, url: '/' }
        : hasFallbackDashboard 
        ? { type: 'HTML Fallback', available: true, url: '/' }
        : { type: 'NOT AVAILABLE', available: false, url: '/api/health' };

    res.json({
        name: 'ROI Labs Chatbot Training API',
        version: require('../../package.json').version,
        description: 'Sistema de treinamento de chatbot por crawling de sites',
        environment: process.env.NODE_ENV || 'development',
        dashboard: dashboardInfo,
        endpoints: {
            health: '/api/health',
            auth: '/api/test-auth',
            crawling: {
                start: 'POST /api/crawling/start',
                status: 'GET /api/crawling/status/:id',
                history: 'GET /api/crawling/history',
                details: 'GET /api/crawling/details/:id',
                cancel: 'POST /api/crawling/cancel/:id',
                delete: 'DELETE /api/crawling/:id'
            },
            search: {
                search: 'POST /api/search',
                domains: 'GET /api/search/domains',
                stats: 'GET /api/search/stats',
                similar: 'POST /api/search/similar',
                autocomplete: 'GET /api/search/autocomplete'
            },
            clients: {
                create: 'POST /api/clients',
                profile: 'GET /api/clients/profile',
                list: 'GET /api/clients (admin)',
                details: 'GET /api/clients/:id (admin)',
                update: 'PUT /api/clients/:id (admin)'
            }
        },
        documentation: 'https://github.com/roi-labs/chatbot-training',
        support: 'contato@roilabs.com.br'
    });
});

// Rota para estatísticas do sistema (admin)
app.get('/api/system/stats', async (req, res) => {
    try {
        const rateLimitStats = getRateLimitStats();
        
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            system: {
                uptime: Math.floor(process.uptime()),
                memory: process.memoryUsage(),
                version: process.version,
                platform: process.platform
            },
            rate_limiting: rateLimitStats
        });
    } catch (error) {
        logger.error('System stats error', { error: error.message });
        res.status(500).json({ error: 'Erro ao obter estatísticas do sistema' });
    }
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
    } else {
        // Se não há nenhum dashboard, mostrar erro informativo
        res.status(503).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>ROI Labs - Dashboard Unavailable</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .error { color: #d32f2f; }
                    .info { color: #1976d2; }
                </style>
            </head>
            <body>
                <h1 class="error">🚨 Dashboard Not Available</h1>
                <p>Neither React nor fallback dashboard are available.</p>
                <p class="info">Expected locations:</p>
                <ul style="display: inline-block; text-align: left;">
                    <li><code>/app/public/dashboard/index.html</code> (React)</li>
                    <li><code>/app/public/fallback.html</code> (Fallback)</li>
                </ul>
                <p>Please check the build process or contact support.</p>
                <hr>
                <a href="/api/health">API Health Check</a> | 
                <a href="/api/info">API Information</a>
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
            available_endpoints: '/api/health, /api/info, /api/test-auth'
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
    } else {
        res.redirect('/');
    }
});

// Middleware de tratamento de 404
app.use(notFoundHandler);

// Middleware de logging de erros
app.use(errorLogger);

// Middleware de tratamento de erros global
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
    const env = process.env.NODE_ENV || 'development';
    const isProduction = env === 'production';
    
    const dashboardStatus = hasReactDashboard 
        ? 'React (Modern) ✅' 
        : hasFallbackDashboard 
        ? 'HTML Fallback ⚠️' 
        : 'NOT AVAILABLE ❌';
    
    logger.info('🚀 ROI Labs Chatbot Training API iniciada!', {
        environment: env,
        host: HOST,
        port: PORT,
        version: require('../../package.json').version,
        nodeVersion: process.version,
        dashboard: dashboardStatus
    });
    
    console.log('🚀 ROI Labs Chatbot Training API iniciada!');
    console.log(`📍 Ambiente: ${env}`);
    console.log(`🌐 Servidor: http://${HOST}:${PORT}`);
    console.log(`🎨 Dashboard: ${dashboardStatus}`);
    
    if (hasReactDashboard) {
        console.log(`📁 React dashboard path: ${reactDashboardPath}`);
    } else if (hasFallbackDashboard) {
        console.log(`📁 Fallback dashboard path: ${fallbackDashboardPath}`);
        console.log('ℹ️  Using HTML fallback - React build may have failed');
    } else {
        console.log('❌ CRITICAL: No dashboard available!');
        console.log('🔧 Check Docker build process and frontend compilation.');
    }
    
    console.log(`🏥 Health check: http://${HOST}:${PORT}/api/health`);
    console.log(`ℹ️  API info: http://${HOST}:${PORT}/api/info`);
    
    if (!isProduction) {
        console.log(`🔐 Teste auth: http://${HOST}:${PORT}/api/test-auth`);
        console.log(`🕷️  Crawling: http://${HOST}:${PORT}/api/crawling/start`);
        console.log(`🔍 Busca: http://${HOST}:${PORT}/api/search`);
        console.log(`👥 Clientes: http://${HOST}:${PORT}/api/clients`);
    }
    
    console.log('✅ API pronta para receber requisições!');
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
    logger.info(`📴 Recebido ${signal}, iniciando graceful shutdown...`);
    
    server.close(() => {
        logger.info('✅ Servidor HTTP encerrado');
        
        // Fechar outras conexões se necessário
        // Por exemplo, conexões de banco, Redis, etc.
        
        logger.info('✅ Graceful shutdown concluído');
        process.exit(0);
    });
    
    // Forçar encerramento após timeout
    setTimeout(() => {
        logger.error('❌ Forcando encerramento após timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Tratamento de erros não capturados já está no errorHandler middleware
process.on('uncaughtException', (error) => {
    logger.error('❌ Uncaught Exception', {
        error: error.message,
        stack: error.stack
    });
    
    if (process.env.NODE_ENV === 'production') {
        gracefulShutdown('UNCAUGHT_EXCEPTION');
    }
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('❌ Unhandled Rejection', {
        reason: reason?.message || reason,
        stack: reason?.stack
    });
    
    if (process.env.NODE_ENV === 'production') {
        gracefulShutdown('UNHANDLED_REJECTION');
    }
});

module.exports = app;