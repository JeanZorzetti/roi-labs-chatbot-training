// Middleware central - ROI Labs Chatbot Training
// Arquivo de índice para organizar todos os middlewares

const auth = require('./auth');
const logging = require('./logging');
const rateLimiting = require('./rateLimiting');
const validation = require('./validation');
const errorHandler = require('./errorHandler');

// Re-exportar todos os middlewares de forma organizada
module.exports = {
    // Autenticação
    auth: {
        authenticateClient: auth.authenticateClient
    },
    
    // Logging
    logging: {
        logger: logging.logger,
        requestLogger: logging.requestLogger,
        errorLogger: logging.errorLogger,
        systemLogger: logging.systemLogger,
        rotateLogs: logging.rotateLogs
    },
    
    // Rate Limiting
    rateLimiting: {
        rateLimiter: rateLimiting.rateLimiter,
        crawlingRateLimiter: rateLimiting.crawlingRateLimiter,
        authRateLimiter: rateLimiting.authRateLimiter,
        searchRateLimiter: rateLimiting.searchRateLimiter,
        suspiciousActivityDetector: rateLimiting.suspiciousActivityDetector,
        requestId: rateLimiting.requestId,
        getRateLimitStats: rateLimiting.getRateLimitStats,
        cleanupOldData: rateLimiting.cleanupOldData
    },
    
    // Validação
    validation: {
        validateCrawlingData: validation.validateCrawlingData,
        validateSearchData: validation.validateSearchData,
        validateClientData: validation.validateClientData,
        validateIdParam: validation.validateIdParam,
        validateRequiredHeaders: validation.validateRequiredHeaders,
        validateContentType: validation.validateContentType,
        validatePayloadSize: validation.validatePayloadSize,
        validateCustom: validation.validateCustom,
        validationSchemas: validation.validationSchemas,
        // Utilitários
        isValidUrl: validation.isValidUrl,
        sanitizeString: validation.sanitizeString,
        isValidEmail: validation.isValidEmail,
        isValidNumber: validation.isValidNumber
    },
    
    // Tratamento de Erros
    errorHandler: {
        // Classes de erro
        AppError: errorHandler.AppError,
        ValidationError: errorHandler.ValidationError,
        AuthenticationError: errorHandler.AuthenticationError,
        AuthorizationError: errorHandler.AuthorizationError,
        NotFoundError: errorHandler.NotFoundError,
        RateLimitError: errorHandler.RateLimitError,
        DatabaseError: errorHandler.DatabaseError,
        ExternalServiceError: errorHandler.ExternalServiceError,
        
        // Middlewares
        errorHandler: errorHandler.errorHandler,
        asyncHandler: errorHandler.asyncHandler,
        notFoundHandler: errorHandler.notFoundHandler,
        performanceMonitor: errorHandler.performanceMonitor,
        requestTimeout: errorHandler.requestTimeout,
        metricsCollector: errorHandler.metricsCollector,
        
        // Utilitários
        createErrorHandler: errorHandler.createErrorHandler,
        errorMetrics: errorHandler.errorMetrics
    }
};

// Também exportar individualmente para compatibilidade
module.exports.authenticateClient = auth.authenticateClient;
module.exports.logger = logging.logger;
module.exports.requestLogger = logging.requestLogger;
module.exports.errorLogger = logging.errorLogger;