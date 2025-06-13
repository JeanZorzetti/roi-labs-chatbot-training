const { logger } = require('./logging');

// Tipos de erro personalizados
class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message, details = []) {
        super(message, 400, 'VALIDATION_ERROR');
        this.details = details;
    }
}

class AuthenticationError extends AppError {
    constructor(message = 'Acesso não autorizado') {
        super(message, 401, 'AUTHENTICATION_ERROR');
    }
}

class AuthorizationError extends AppError {
    constructor(message = 'Acesso negado') {
        super(message, 403, 'AUTHORIZATION_ERROR');
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Recurso não encontrado') {
        super(message, 404, 'NOT_FOUND');
    }
}

class RateLimitError extends AppError {
    constructor(message = 'Muitas requisições') {
        super(message, 429, 'RATE_LIMIT_EXCEEDED');
    }
}

class DatabaseError extends AppError {
    constructor(message = 'Erro no banco de dados') {
        super(message, 503, 'DATABASE_ERROR');
    }
}

class ExternalServiceError extends AppError {
    constructor(service, message = 'Serviço externo indisponível') {
        super(`${service}: ${message}`, 503, 'EXTERNAL_SERVICE_ERROR');
        this.service = service;
    }
}

// Middleware principal de tratamento de erros
const errorHandler = (error, req, res, next) => {
    const requestId = req.requestId || 'unknown';
    
    // Se a resposta já foi enviada, delegar para o Express
    if (res.headersSent) {
        return next(error);
    }

    // Determinar se é um erro operacional
    let isOperational = error.isOperational || false;
    let statusCode = error.statusCode || 500;
    let code = error.code || 'INTERNAL_ERROR';
    let message = error.message;
    let details = error.details || null;

    // Tratar erros específicos do sistema
    if (error.name === 'ValidationError') {
        isOperational = true;
        statusCode = 400;
        code = 'VALIDATION_ERROR';
        message = 'Dados inválidos';
        details = error.errors ? Object.values(error.errors).map(e => e.message) : null;
    } else if (error.name === 'CastError') {
        isOperational = true;
        statusCode = 400;
        code = 'INVALID_ID';
        message = 'ID inválido fornecido';
    } else if (error.code === 11000) { // Erro de duplicação no MongoDB
        isOperational = true;
        statusCode = 409;
        code = 'DUPLICATE_ENTRY';
        message = 'Entrada duplicada';
    } else if (error.name === 'JsonWebTokenError') {
        isOperational = true;
        statusCode = 401;
        code = 'INVALID_TOKEN';
        message = 'Token inválido';
    } else if (error.name === 'TokenExpiredError') {
        isOperational = true;
        statusCode = 401;
        code = 'TOKEN_EXPIRED';
        message = 'Token expirado';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        isOperational = true;
        statusCode = 503;
        code = 'SERVICE_UNAVAILABLE';
        message = 'Serviço indisponível';
    } else if (error.type === 'entity.too.large') {
        isOperational = true;
        statusCode = 413;
        code = 'PAYLOAD_TOO_LARGE';
        message = 'Dados enviados muito grandes';
    }

    // Log do erro
    const errorLog = {
        requestId,
        code,
        message,
        statusCode,
        isOperational,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    };

    if (isOperational) {
        logger.warn('Operational error', errorLog);
    } else {
        errorLog.stack = error.stack;
        logger.error('System error', errorLog);
    }

    // Resposta para o cliente
    const response = {
        error: true,
        code,
        message: isOperational ? message : 'Erro interno do servidor',
        requestId,
        timestamp: new Date().toISOString()
    };

    // Adicionar detalhes apenas em desenvolvimento ou para erros operacionais
    if (details && (process.env.NODE_ENV !== 'production' || isOperational)) {
        response.details = details;
    }

    // Adicionar stack trace apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development' && !isOperational) {
        response.stack = error.stack;
    }

    res.status(statusCode).json(response);
};

// Middleware para capturar erros assíncronos
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Middleware para tratar 404
const notFoundHandler = (req, res, next) => {
    const error = new NotFoundError(`Rota ${req.originalUrl} não encontrada`);
    next(error);
};

// Middleware para tratar erros não capturados
const unhandledErrorHandler = () => {
    // Capturar exceções não tratadas
    process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception', {
            error: error.message,
            stack: error.stack,
            pid: process.pid
        });
        
        // Em produção, fazer graceful shutdown
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    });

    // Capturar promises rejeitadas
    process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Rejection', {
            reason: reason?.message || reason,
            stack: reason?.stack,
            promise: promise.toString(),
            pid: process.pid
        });
        
        // Em produção, fazer graceful shutdown
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    });
};

// Middleware para monitorar performance
const performanceMonitor = (req, res, next) => {
    const startTime = process.hrtime.bigint();
    
    res.on('finish', () => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // converter para ms
        
        // Log para requests lentos (mais de 1 segundo)
        if (duration > 1000) {
            logger.warn('Slow request detected', {
                url: req.originalUrl,
                method: req.method,
                duration: `${duration.toFixed(2)}ms`,
                statusCode: res.statusCode,
                ip: req.ip
            });
        }
        
        // Log para requests com erro
        if (res.statusCode >= 400) {
            logger.warn('Error response', {
                url: req.originalUrl,
                method: req.method,
                statusCode: res.statusCode,
                duration: `${duration.toFixed(2)}ms`,
                ip: req.ip
            });
        }
    });
    
    next();
};

// Middleware para timeout de requests
const requestTimeout = (timeout = 30000) => { // 30 segundos por padrão
    return (req, res, next) => {
        const timer = setTimeout(() => {
            if (!res.headersSent) {
                logger.warn('Request timeout', {
                    url: req.originalUrl,
                    method: req.method,
                    timeout: `${timeout}ms`,
                    ip: req.ip
                });
                
                const error = new AppError('Request timeout', 408, 'REQUEST_TIMEOUT');
                next(error);
            }
        }, timeout);
        
        // Limpar timer quando request terminar
        res.on('finish', () => clearTimeout(timer));
        res.on('close', () => clearTimeout(timer));
        
        next();
    };
};

// Middleware para capturar métricas de erro
const errorMetrics = {
    errorCounts: new Map(),
    
    increment: (code, statusCode) => {
        const key = `${statusCode}_${code}`;
        const current = errorMetrics.errorCounts.get(key) || 0;
        errorMetrics.errorCounts.set(key, current + 1);
    },
    
    getStats: () => {
        const stats = {};
        for (const [key, count] of errorMetrics.errorCounts.entries()) {
            stats[key] = count;
        }
        return stats;
    },
    
    reset: () => {
        errorMetrics.errorCounts.clear();
    }
};

// Middleware para coletar métricas
const metricsCollector = (error, req, res, next) => {
    if (error.statusCode && error.code) {
        errorMetrics.increment(error.code, error.statusCode);
    }
    next(error);
};

// Função para criar handlers de erro específicos
const createErrorHandler = (statusCode, code, message) => {
    return (req, res, next) => {
        const error = new AppError(message, statusCode, code);
        next(error);
    };
};

// Inicializar handlers de erros não capturados
unhandledErrorHandler();

module.exports = {
    // Classes de erro
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    RateLimitError,
    DatabaseError,
    ExternalServiceError,
    
    // Middlewares
    errorHandler,
    asyncHandler,
    notFoundHandler,
    performanceMonitor,
    requestTimeout,
    metricsCollector,
    
    // Utilitários
    createErrorHandler,
    errorMetrics
};