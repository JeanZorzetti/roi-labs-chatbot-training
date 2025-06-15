const express = require('express');
const router = express.Router();

// Importar middlewares
const { authenticateClient } = require('../middleware/auth');
const { 
    requestLogger, 
    errorLogger 
} = require('../middleware/logging');
const { 
    crawlingRateLimiter, 
    requestId 
} = require('../middleware/rateLimiting');
const { 
    validateCrawlingData, 
    validateIdParam,
    validateContentType,
    validatePayloadSize 
} = require('../middleware/validation');
const { 
    asyncHandler, 
    performanceMonitor 
} = require('../middleware/errorHandler');

// Importar controllers
const {
    startCrawling,
    getCrawlingStatus,
    getCrawlingHistory,
    getCrawlingDetails,
    cancelCrawling,
    deleteCrawling
} = require('../controllers/crawlingController');

// Aplicar middlewares globais para todas as rotas
router.use(requestId);
router.use(requestLogger);
router.use(performanceMonitor);

// Rota de teste sem autenticação
router.get('/test', (req, res) => {
    res.json({
        message: 'Crawling API funcionando!',
        timestamp: new Date().toISOString(),
        status: 'ok'
    });
});

// Rota de jobs de teste (sem autenticação temporariamente)
router.get('/jobs', (req, res) => {
    res.json({
        success: true,
        history: [],
        pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0
        }
    });
});

// Rota para iniciar crawling
router.post('/start', 
    validateContentType(['application/json']),
    validatePayloadSize(5 * 1024 * 1024), // 5MB max
    crawlingRateLimiter,
    authenticateClient,
    validateCrawlingData,
    asyncHandler(startCrawling)
);

// Rota para obter status de um crawling específico
router.get('/status/:id',
    authenticateClient,
    validateIdParam('id'),
    asyncHandler(getCrawlingStatus)
);

// Rota para listar histórico de crawlings
router.get('/history',
    authenticateClient,
    asyncHandler(getCrawlingHistory)
);

// Rota para obter detalhes de um crawling
router.get('/details/:id',
    authenticateClient,
    validateIdParam('id'),
    asyncHandler(getCrawlingDetails)
);

// Rota para cancelar crawling
router.post('/cancel/:id',
    authenticateClient,
    validateIdParam('id'),
    asyncHandler(cancelCrawling)
);

// Rota para deletar crawling
router.delete('/:id',
    authenticateClient,
    validateIdParam('id'),
    asyncHandler(deleteCrawling)
);

// Middleware de tratamento de erros específico para crawling
router.use(errorLogger);

module.exports = router;