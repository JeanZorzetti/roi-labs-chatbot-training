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

// Verificar se existe o dashboard React buildado
const reactDashboardPath = path.join(__dirname, '../public/dashboard');
const fallbackDashboardPath = path.join(__dirname, '../public/index.html');
const hasReactDashboard = fs.existsSync(path.join(reactDashboardPath, 'index.html'));

console.log('🔍 Dashboard paths:');
console.log(`📁 React dashboard: ${reactDashboardPath} - ${hasReactDashboard ? '✅ Found' : '❌ Not found'}`);
console.log(`📁 Fallback dashboard: ${fallbackDashboardPath} - ${fs.existsSync(fallbackDashboardPath) ? '✅ Found' : '❌ Not found'}`);

// Servir arquivos estáticos - priorizar React dashboard se disponível
if (hasReactDashboard) {
    console.log('🎨 Serving React dashboard from /public/dashboard/');
    app.use('/static', express.static(path.join(reactDashboardPath, 'assets'), {
        maxAge: process.env.NODE_ENV === 'production' ? '1y' : 0,
        etag: true,
        lastModified: true
    }));
    
    app.use('/assets', express.static(path.join(reactDashboardPath, 'assets'), {
        maxAge: process.env.NODE_ENV === 'production' ? '1y' : 0,
        etag: true,
        lastModified: true
    }));
} else {
    console.log('📄 Serving fallback dashboard from /public/');
}

// Servir arquivos estáticos gerais
app.use(express.static(path.join(__dirname, '../public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
        // Headers de cache específicos por tipo de arquivo
        if (path.endsWith('.js') || path.endsWith('.css')) {
            res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 dia
        } else if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg')) {
            res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30 dias
        }
    }
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
                type: hasReactDashboard ? 'React (Modern)' : 'HTML (Fallback)',
                available: hasReactDashboard || fs.existsSync(fallbackDashboardPath)
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
                memoryUsage: healthInfo.memory
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
            version: require('../../package.json').version
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
    res.json({
        name: 'ROI Labs Chatbot Training API',
        version: require('../../package.json').version,
        description: 'Sistema de treinamento de chatbot por crawling de sites',
        environment: process.env.NODE_ENV || 'development',
        dashboard: {
            type: hasReactDashboard ? 'React (Modern)' : 'HTML (Fallback)',
            url: hasReactDashboard ? '/' : '/dashboard.html'
        },
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

// Rota principal do dashboard - servir React ou fallback
app.get('/', (req, res) => {
    if (hasReactDashboard) {
        // Servir React dashboard
        res.sendFile(path.join(reactDashboardPath, 'index.html'));
    } else {
        // Servir fallback dashboard
        res.sendFile(fallbackDashboardPath);
    }
});

// Rota de fallback para React Router (SPA)
app.get('/*', (req, res) => {
    // Se for uma requisição de API, não interceptar
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // Se for um arquivo estático, não interceptar
    if (req.path.includes('.')) {
        return res.status(404).send('File not found');
    }
    
    // Para outras rotas, servir o React app (SPA routing)
    if (hasReactDashboard) {
        res.sendFile(path.join(reactDashboardPath, 'index.html'));
    } else {
        res.sendFile(fallbackDashboardPath);
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
    
    logger.info('🚀 ROI Labs Chatbot Training API iniciada!', {
        environment: env,
        host: HOST,
        port: PORT,
        version: require('../../package.json').version,
        nodeVersion: process.version,
        dashboard: hasReactDashboard ? 'React (Modern)' : 'HTML (Fallback)'
    });
    
    console.log('🚀 ROI Labs Chatbot Training API iniciada!');
    console.log(`📍 Ambiente: ${env}`);
    console.log(`🌐 Servidor: http://${HOST}:${PORT}`);
    console.log(`🎨 Dashboard: ${hasReactDashboard ? 'React (Modern)' : 'HTML (Fallback)'}`);
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