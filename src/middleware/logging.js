const fs = require('fs');
const path = require('path');

// Criar diretório de logs se não existir
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Configuração de logs
const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

const getCurrentLogLevel = () => {
    const level = process.env.LOG_LEVEL || 'INFO';
    return LOG_LEVELS[level] || LOG_LEVELS.INFO;
};

// Função para escrever logs
const writeLog = (level, message, metadata = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        message,
        ...metadata,
        environment: process.env.NODE_ENV || 'development',
        pid: process.pid
    };

    // Log no console para desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
        console.log(`[${timestamp}] ${level}: ${message}`, metadata);
    }

    // Log em arquivo para produção
    if (process.env.NODE_ENV === 'production') {
        const logFile = path.join(logsDir, `app-${new Date().toISOString().split('T')[0]}.log`);
        const logLine = JSON.stringify(logEntry) + '\n';
        
        fs.appendFileSync(logFile, logLine);
    }
};

// Logger object
const logger = {
    error: (message, metadata) => {
        if (getCurrentLogLevel() >= LOG_LEVELS.ERROR) {
            writeLog('ERROR', message, metadata);
        }
    },
    warn: (message, metadata) => {
        if (getCurrentLogLevel() >= LOG_LEVELS.WARN) {
            writeLog('WARN', message, metadata);
        }
    },
    info: (message, metadata) => {
        if (getCurrentLogLevel() >= LOG_LEVELS.INFO) {
            writeLog('INFO', message, metadata);
        }
    },
    debug: (message, metadata) => {
        if (getCurrentLogLevel() >= LOG_LEVELS.DEBUG) {
            writeLog('DEBUG', message, metadata);
        }
    }
};

// Middleware de logging de requests
const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || req.requestId || 'unknown';
    
    // Log da requisição
    logger.info('Request started', {
        requestId,
        method: req.method,
        url: req.originalUrl,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        contentLength: req.get('Content-Length') || 0
    });

    // Override do res.json para capturar response
    const originalJson = res.json;
    res.json = function(data) {
        const responseTime = Date.now() - startTime;
        
        // Log da resposta
        logger.info('Request completed', {
            requestId,
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
            responseSize: JSON.stringify(data).length
        });
        
        return originalJson.call(this, data);
    };

    // Override do res.send para capturar outras respostas
    const originalSend = res.send;
    res.send = function(data) {
        const responseTime = Date.now() - startTime;
        
        logger.info('Request completed', {
            requestId,
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
            responseSize: typeof data === 'string' ? data.length : JSON.stringify(data).length
        });
        
        return originalSend.call(this, data);
    };

    next();
};

// Middleware de logging de erros
const errorLogger = (error, req, res, next) => {
    const requestId = req.headers['x-request-id'] || req.requestId || 'unknown';
    
    logger.error('Request error', {
        requestId,
        method: req.method,
        url: req.originalUrl,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        statusCode: error.status || 500,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    next(error);
};

// Middleware para logging de eventos de sistema
const systemLogger = {
    logCrawlingStart: (clientId, websiteUrl, options) => {
        logger.info('Crawling started', {
            event: 'crawling_start',
            clientId,
            websiteUrl,
            options
        });
    },
    
    logCrawlingComplete: (clientId, websiteUrl, result) => {
        logger.info('Crawling completed', {
            event: 'crawling_complete',
            clientId,
            websiteUrl,
            totalPages: result.totalPages,
            duration: result.duration
        });
    },
    
    logCrawlingError: (clientId, websiteUrl, error) => {
        logger.error('Crawling failed', {
            event: 'crawling_error',
            clientId,
            websiteUrl,
            error: error.message
        });
    },
    
    logAuthFailure: (apiKey, ip, userAgent) => {
        logger.warn('Authentication failed', {
            event: 'auth_failure',
            apiKey: apiKey ? apiKey.substring(0, 8) + '...' : 'missing',
            ip,
            userAgent
        });
    },
    
    logRateLimitExceeded: (ip, endpoint) => {
        logger.warn('Rate limit exceeded', {
            event: 'rate_limit_exceeded',
            ip,
            endpoint
        });
    }
};

// Função para rotacionar logs antigos (opcional)
const rotateLogs = () => {
    const maxLogFiles = parseInt(process.env.MAX_LOG_FILES) || 30; // 30 dias por padrão
    
    try {
        const files = fs.readdirSync(logsDir)
            .filter(file => file.startsWith('app-') && file.endsWith('.log'))
            .sort()
            .reverse();

        if (files.length > maxLogFiles) {
            const filesToDelete = files.slice(maxLogFiles);
            filesToDelete.forEach(file => {
                fs.unlinkSync(path.join(logsDir, file));
                logger.info('Log file rotated', { deletedFile: file });
            });
        }
    } catch (error) {
        logger.error('Error rotating logs', { error: error.message });
    }
};

// Executar rotação de logs diariamente em produção
if (process.env.NODE_ENV === 'production') {
    setInterval(rotateLogs, 24 * 60 * 60 * 1000); // 24 horas
}

module.exports = {
    logger,
    requestLogger,
    errorLogger,
    systemLogger,
    rotateLogs
};