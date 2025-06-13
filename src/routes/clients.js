const express = require('express');
const router = express.Router();

// Importar middlewares
const { authenticateClient } = require('../middleware/auth');
const { 
    requestLogger, 
    errorLogger 
} = require('../middleware/logging');
const { 
    rateLimiter, 
    requestId 
} = require('../middleware/rateLimiting');
const { 
    validateClientData,
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
    createClient,
    getClients,
    getClient,
    updateClient,
    regenerateApiKey,
    deactivateClient,
    activateClient,
    deleteClient,
    getCurrentClientProfile,
    getDashboardStats
} = require('../controllers/clientController');

// Aplicar middlewares globais
router.use(requestId);
router.use(requestLogger);
router.use(performanceMonitor);

// Rota para criar novo cliente (público - sem autenticação)
router.post('/',
    validateContentType(['application/json']),
    validatePayloadSize(1 * 1024 * 1024), // 1MB max
    rateLimiter({
        windowMs: 15 * 60 * 1000, // 15 minutos
        maxRequests: 5, // Máximo 5 registros por 15 minutos
        message: {
            error: 'Too many registration attempts',
            message: 'Muitas tentativas de registro. Tente novamente em 15 minutos.'
        }
    }),
    validateClientData,
    asyncHandler(createClient)
);

// Rota para obter perfil do cliente atual
router.get('/profile',
    authenticateClient,
    asyncHandler(getCurrentClientProfile)
);

// Rota para regenerar API key do cliente atual
router.post('/profile/regenerate-key',
    authenticateClient,
    rateLimiter({
        windowMs: 60 * 60 * 1000, // 1 hora
        maxRequests: 3, // Máximo 3 regenerações por hora
        keyGenerator: (req) => `regen_${req.client.id}`,
        message: {
            error: 'Too many key regeneration attempts',
            message: 'Muitas tentativas de regeneração de chave. Tente novamente em 1 hora.'
        }
    }),
    asyncHandler((req, res) => {
        req.params.id = req.client.id; // Usar ID do cliente autenticado
        return regenerateApiKey(req, res);
    })
);

// === ROTAS ADMINISTRATIVAS (requerem autenticação especial) ===
// Nota: Em uma implementação completa, essas rotas teriam um middleware de admin

// Rota para listar todos os clientes (admin)
router.get('/',
    authenticateClient, // Por enquanto usa auth normal, mas deveria ser admin
    asyncHandler(getClients)
);

// Rota para obter estatísticas do dashboard (admin)
router.get('/dashboard/stats',
    authenticateClient, // Por enquanto usa auth normal, mas deveria ser admin
    asyncHandler(getDashboardStats)
);

// Rota para obter cliente específico (admin)
router.get('/:id',
    authenticateClient, // Por enquanto usa auth normal, mas deveria ser admin
    validateIdParam('id'),
    asyncHandler(getClient)
);

// Rota para atualizar cliente (admin)
router.put('/:id',
    validateContentType(['application/json']),
    authenticateClient, // Por enquanto usa auth normal, mas deveria ser admin
    validateIdParam('id'),
    asyncHandler(updateClient)
);

// Rota para regenerar API key de um cliente (admin)
router.post('/:id/regenerate-key',
    authenticateClient, // Por enquanto usa auth normal, mas deveria ser admin
    validateIdParam('id'),
    rateLimiter({
        windowMs: 60 * 60 * 1000, // 1 hora
        maxRequests: 10, // Admin pode fazer mais regenerações
        message: {
            error: 'Too many admin key regeneration attempts',
            message: 'Muitas tentativas de regeneração. Tente novamente em 1 hora.'
        }
    }),
    asyncHandler(regenerateApiKey)
);

// Rota para desativar cliente (admin)
router.post('/:id/deactivate',
    authenticateClient, // Por enquanto usa auth normal, mas deveria ser admin
    validateIdParam('id'),
    asyncHandler(deactivateClient)
);

// Rota para reativar cliente (admin)
router.post('/:id/activate',
    authenticateClient, // Por enquanto usa auth normal, mas deveria ser admin
    validateIdParam('id'),
    asyncHandler(activateClient)
);

// Rota para deletar cliente (admin) - CUIDADO!
router.delete('/:id',
    validateContentType(['application/json']),
    authenticateClient, // Por enquanto usa auth normal, mas deveria ser admin
    validateIdParam('id'),
    rateLimiter({
        windowMs: 60 * 60 * 1000, // 1 hora
        maxRequests: 5, // Muito restritivo para deletar
        message: {
            error: 'Too many deletion attempts',
            message: 'Muitas tentativas de exclusão. Operação temporariamente bloqueada.'
        }
    }),
    asyncHandler(deleteClient)
);

// Middleware de tratamento de erros
router.use(errorLogger);

module.exports = router;