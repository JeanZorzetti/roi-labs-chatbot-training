const express = require('express');
const router = express.Router();

// Importar middlewares
const { authenticateClient } = require('../middleware/auth');
const { 
    requestLogger, 
    errorLogger 
} = require('../middleware/logging');
const { 
    searchRateLimiter, 
    requestId 
} = require('../middleware/rateLimiting');
const { 
    validateSearchData,
    validateContentType,
    validatePayloadSize 
} = require('../middleware/validation');
const { 
    asyncHandler, 
    performanceMonitor 
} = require('../middleware/errorHandler');

// Importar controllers
const {
    searchKnowledge,
    getAvailableDomains,
    getSearchStats,
    findSimilarContent,
    searchAutocomplete
} = require('../controllers/searchController');

// Aplicar middlewares globais
router.use(requestId);
router.use(requestLogger);
router.use(performanceMonitor);

// Rota principal para buscar no conhecimento
router.post('/',
    validateContentType(['application/json']),
    validatePayloadSize(1 * 1024 * 1024), // 1MB max
    searchRateLimiter,
    authenticateClient,
    validateSearchData,
    asyncHandler(searchKnowledge)
);

// Rota para buscar domínios disponíveis
router.get('/domains',
    authenticateClient,
    asyncHandler(getAvailableDomains)
);

// Rota para estatísticas de busca
router.get('/stats',
    authenticateClient,
    asyncHandler(getSearchStats)
);

// Rota para encontrar conteúdo similar
router.post('/similar',
    validateContentType(['application/json']),
    authenticateClient,
    asyncHandler(findSimilarContent)
);

// Rota para autocompletar busca
router.get('/autocomplete',
    authenticateClient,
    asyncHandler(searchAutocomplete)
);

// Middleware de tratamento de erros
router.use(errorLogger);

module.exports = router;