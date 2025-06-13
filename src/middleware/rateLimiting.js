const { systemLogger } = require('./logging');

// Armazenamento em memória para rate limiting
// Em produção, considere usar Redis para múltiplas instâncias
const requestCounts = new Map();
const suspiciousIPs = new Set();

// Configurações padrão
const DEFAULT_CONFIG = {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 100,    // 100 requests por minuto
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    keyGenerator: (req) => req.ip,
    message: {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: 60
    }
};

// Rate limiter principal
const rateLimiter = (options = {}) => {
    const config = { ...DEFAULT_CONFIG, ...options };
    
    return (req, res, next) => {
        const key = config.keyGenerator(req);
        const now = Date.now();
        
        // Verificar se IP está em lista de suspeitos
        if (suspiciousIPs.has(key)) {
            systemLogger.logRateLimitExceeded(key, req.originalUrl);
            return res.status(429).json({
                ...config.message,
                suspiciousActivity: true
            });
        }
        
        // Inicializar contador se não existir
        if (!requestCounts.has(key)) {
            requestCounts.set(key, {
                count: 0,
                resetTime: now + config.windowMs,
                firstRequest: now
            });
        }
        
        const record = requestCounts.get(key);
        
        // Reset do contador se o tempo passou
        if (now > record.resetTime) {
            record.count = 0;
            record.resetTime = now + config.windowMs;
            record.firstRequest = now;
        }
        
        // Incrementar contador
        record.count++;
        
        // Headers informativos
        res.set({
            'X-RateLimit-Limit': config.maxRequests,
            'X-RateLimit-Remaining': Math.max(0, config.maxRequests - record.count),
            'X-RateLimit-Reset': new Date(record.resetTime).toISOString()
        });
        
        // Verificar se excedeu o limite
        if (record.count > config.maxRequests) {
            // Marcar como suspeito se exceder muito o limite
            if (record.count > config.maxRequests * 2) {
                suspiciousIPs.add(key);
                setTimeout(() => suspiciousIPs.delete(key), 5 * 60 * 1000); // 5 minutos
            }
            
            systemLogger.logRateLimitExceeded(key, req.originalUrl);
            
            res.set('Retry-After', Math.ceil(config.windowMs / 1000));
            return res.status(429).json(config.message);
        }
        
        next();
    };
};

// Rate limiter específico para crawling (mais restritivo)
const crawlingRateLimiter = rateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutos
    maxRequests: 5,          // 5 crawlings por 5 minutos
    message: {
        error: 'Crawling rate limit exceeded',
        message: 'Too many crawling requests. Please wait before starting another crawl.',
        retryAfter: 300
    }
});

// Rate limiter para autenticação (proteção contra brute force)
const authRateLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 10,          // 10 tentativas por 15 minutos
    skipSuccessfulRequests: true, // Não contar requests bem-sucedidos
    message: {
        error: 'Authentication rate limit exceeded',
        message: 'Too many authentication attempts. Please wait before trying again.',
        retryAfter: 900
    }
});

// Rate limiter para busca/search
const searchRateLimiter = rateLimiter({
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 30,     // 30 buscas por minuto
    message: {
        error: 'Search rate limit exceeded',
        message: 'Too many search requests. Please wait before searching again.',
        retryAfter: 60
    }
});

// Middleware para detectar padrões suspeitos
const suspiciousActivityDetector = (req, res, next) => {
    const ip = req.ip;
    const userAgent = req.get('User-Agent') || '';
    const referer = req.get('Referer') || '';
    
    // Verificar padrões suspeitos
    const suspiciousPatterns = [
        // User agents suspeitos
        /bot|crawler|spider|scraper/i.test(userAgent) && !userAgent.includes('Googlebot'),
        
        // URLs suspeitas
        req.originalUrl.includes('../') || req.originalUrl.includes('..\\'),
        req.originalUrl.includes('script>') || req.originalUrl.includes('javascript:'),
        
        // Headers suspeitos
        req.headers['x-forwarded-for']?.split(',').length > 5, // Muitos proxies
        
        // Requisições muito rápidas (menos de 100ms entre requests)
        (() => {
            const lastRequest = requestCounts.get(`last_${ip}`);
            const now = Date.now();
            
            if (lastRequest && (now - lastRequest) < 100) {
                return true;
            }
            
            requestCounts.set(`last_${ip}`, now);
            return false;
        })()
    ];
    
    if (suspiciousPatterns.some(pattern => pattern)) {
        systemLogger.logger.warn('Suspicious activity detected', {
            ip,
            userAgent,
            url: req.originalUrl,
            referer
        });
        
        // Aplicar rate limit mais rigoroso
        return rateLimiter({
            windowMs: 60 * 1000,
            maxRequests: 10
        })(req, res, next);
    }
    
    next();
};

// Middleware para limpar dados antigos periodicamente
const cleanupOldData = () => {
    const now = Date.now();
    const keysToDelete = [];
    
    for (const [key, record] of requestCounts.entries()) {
        // Remover registros muito antigos (mais de 1 hora)
        if (record.resetTime && now > record.resetTime + (60 * 60 * 1000)) {
            keysToDelete.push(key);
        }
    }
    
    keysToDelete.forEach(key => requestCounts.delete(key));
    
    if (keysToDelete.length > 0) {
        console.log(`🧹 Limpeza: ${keysToDelete.length} registros antigos removidos`);
    }
};

// Executar limpeza a cada 30 minutos
setInterval(cleanupOldData, 30 * 60 * 1000);

// Função para obter estatísticas
const getRateLimitStats = () => {
    const now = Date.now();
    const activeRecords = Array.from(requestCounts.entries())
        .filter(([key, record]) => now <= record.resetTime)
        .map(([key, record]) => ({
            ip: key,
            requests: record.count,
            resetTime: new Date(record.resetTime).toISOString(),
            suspicious: suspiciousIPs.has(key)
        }));
    
    return {
        totalActiveIPs: activeRecords.length,
        suspiciousIPs: suspiciousIPs.size,
        topRequesters: activeRecords
            .sort((a, b) => b.requests - a.requests)
            .slice(0, 10),
        memoryUsage: {
            requestCounts: requestCounts.size,
            suspiciousIPs: suspiciousIPs.size
        }
    };
};

// Middleware para adicionar Request ID
const requestId = (req, res, next) => {
    const id = req.headers['x-request-id'] || 
              `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    req.requestId = id;
    res.set('X-Request-ID', id);
    
    next();
};

module.exports = {
    rateLimiter,
    crawlingRateLimiter,
    authRateLimiter,
    searchRateLimiter,
    suspiciousActivityDetector,
    requestId,
    getRateLimitStats,
    cleanupOldData
};