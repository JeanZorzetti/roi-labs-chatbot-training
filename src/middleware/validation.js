const { logger } = require('./logging');

// Função auxiliar para validar URL
const isValidUrl = (string) => {
    try {
        const url = new URL(string);
        return ['http:', 'https:'].includes(url.protocol);
    } catch {
        return false;
    }
};

// Função auxiliar para sanitizar strings
const sanitizeString = (str, maxLength = 1000) => {
    if (typeof str !== 'string') return '';
    
    return str
        .trim()
        .slice(0, maxLength)
        .replace(/[<>\"'&]/g, '') // Remove caracteres perigosos
        .replace(/\s+/g, ' '); // Normaliza espaços
};

// Função auxiliar para validar email
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 320;
};

// Função auxiliar para validar números
const isValidNumber = (value, min = null, max = null) => {
    const num = Number(value);
    if (isNaN(num)) return false;
    if (min !== null && num < min) return false;
    if (max !== null && num > max) return false;
    return true;
};

// Validação para crawling
const validateCrawlingData = (req, res, next) => {
    const { website_url, max_pages, max_depth, delay } = req.body;
    const errors = [];

    // Validar URL obrigatória
    if (!website_url) {
        errors.push('website_url é obrigatório');
    } else if (!isValidUrl(website_url)) {
        errors.push('website_url deve ser uma URL válida (http/https)');
    } else {
        // Verificar se não é um domínio proibido
        const forbiddenDomains = [
            'localhost',
            '127.0.0.1',
            '0.0.0.0',
            'facebook.com',
            'google.com',
            'amazon.com'
        ];
        
        const hostname = new URL(website_url).hostname.toLowerCase();
        if (forbiddenDomains.some(domain => hostname.includes(domain))) {
            errors.push('Domínio não permitido para crawling');
        }
    }

    // Validar max_pages (opcional)
    if (max_pages !== undefined) {
        if (!isValidNumber(max_pages, 1, 100)) {
            errors.push('max_pages deve ser um número entre 1 e 100');
        }
    }

    // Validar max_depth (opcional)
    if (max_depth !== undefined) {
        if (!isValidNumber(max_depth, 1, 10)) {
            errors.push('max_depth deve ser um número entre 1 e 10');
        }
    }

    // Validar delay (opcional)
    if (delay !== undefined) {
        if (!isValidNumber(delay, 1000, 10000)) {
            errors.push('delay deve ser um número entre 1000 e 10000 (ms)');
        }
    }

    if (errors.length > 0) {
        logger.warn('Validation failed for crawling', {
            errors,
            data: { website_url, max_pages, max_depth, delay },
            ip: req.ip
        });
        
        return res.status(400).json({
            error: 'Dados inválidos',
            details: errors
        });
    }

    // Sanitizar dados
    req.body.website_url = website_url.trim();
    req.body.max_pages = max_pages ? parseInt(max_pages) : 20;
    req.body.max_depth = max_depth ? parseInt(max_depth) : 3;
    req.body.delay = delay ? parseInt(delay) : 2000;

    next();
};

// Validação para busca/search
const validateSearchData = (req, res, next) => {
    const { query, limit, client_id } = req.body;
    const errors = [];

    // Validar query obrigatória
    if (!query) {
        errors.push('query é obrigatória');
    } else if (typeof query !== 'string') {
        errors.push('query deve ser uma string');
    } else if (query.trim().length < 2) {
        errors.push('query deve ter pelo menos 2 caracteres');
    } else if (query.length > 500) {
        errors.push('query deve ter no máximo 500 caracteres');
    }

    // Validar limit (opcional)
    if (limit !== undefined) {
        if (!isValidNumber(limit, 1, 50)) {
            errors.push('limit deve ser um número entre 1 e 50');
        }
    }

    // Validar client_id se fornecido
    if (client_id !== undefined) {
        if (!isValidNumber(client_id, 1)) {
            errors.push('client_id deve ser um número positivo');
        }
    }

    if (errors.length > 0) {
        logger.warn('Validation failed for search', {
            errors,
            data: { query: query?.substring(0, 50), limit, client_id },
            ip: req.ip
        });
        
        return res.status(400).json({
            error: 'Dados inválidos',
            details: errors
        });
    }

    // Sanitizar dados
    req.body.query = sanitizeString(query, 500);
    req.body.limit = limit ? parseInt(limit) : 10;

    next();
};

// Validação para criação de cliente
const validateClientData = (req, res, next) => {
    const { name, email, company, phone } = req.body;
    const errors = [];

    // Validar nome obrigatório
    if (!name) {
        errors.push('name é obrigatório');
    } else if (typeof name !== 'string' || name.trim().length < 2) {
        errors.push('name deve ter pelo menos 2 caracteres');
    } else if (name.length > 100) {
        errors.push('name deve ter no máximo 100 caracteres');
    }

    // Validar email obrigatório
    if (!email) {
        errors.push('email é obrigatório');
    } else if (!isValidEmail(email)) {
        errors.push('email deve ser um endereço válido');
    }

    // Validar company (opcional)
    if (company !== undefined) {
        if (typeof company !== 'string' || company.length > 200) {
            errors.push('company deve ser uma string com no máximo 200 caracteres');
        }
    }

    // Validar phone (opcional)
    if (phone !== undefined) {
        const phoneRegex = /^[\d\s\-\+\(\)]{10,20}$/;
        if (!phoneRegex.test(phone)) {
            errors.push('phone deve ser um número de telefone válido');
        }
    }

    if (errors.length > 0) {
        logger.warn('Validation failed for client creation', {
            errors,
            data: { name, email, company: company?.substring(0, 50) },
            ip: req.ip
        });
        
        return res.status(400).json({
            error: 'Dados inválidos',
            details: errors
        });
    }

    // Sanitizar dados
    req.body.name = sanitizeString(name, 100);
    req.body.email = email.trim().toLowerCase();
    req.body.company = company ? sanitizeString(company, 200) : null;
    req.body.phone = phone ? sanitizeString(phone, 20) : null;

    next();
};

// Validação de parâmetros de ID
const validateIdParam = (paramName = 'id') => {
    return (req, res, next) => {
        const id = req.params[paramName];
        
        if (!id) {
            return res.status(400).json({
                error: `Parâmetro ${paramName} é obrigatório`
            });
        }

        if (!isValidNumber(id, 1)) {
            return res.status(400).json({
                error: `Parâmetro ${paramName} deve ser um número positivo`
            });
        }

        // Converter para número
        req.params[paramName] = parseInt(id);
        next();
    };
};

// Middleware para validar headers obrigatórios
const validateRequiredHeaders = (requiredHeaders = []) => {
    return (req, res, next) => {
        const errors = [];
        
        requiredHeaders.forEach(header => {
            const value = req.headers[header.toLowerCase()];
            if (!value) {
                errors.push(`Header ${header} é obrigatório`);
            }
        });

        if (errors.length > 0) {
            logger.warn('Missing required headers', {
                errors,
                url: req.originalUrl,
                ip: req.ip
            });
            
            return res.status(400).json({
                error: 'Headers obrigatórios ausentes',
                details: errors
            });
        }

        next();
    };
};

// Middleware para validar Content-Type
const validateContentType = (allowedTypes = ['application/json']) => {
    return (req, res, next) => {
        const contentType = req.headers['content-type'];
        
        if (!contentType) {
            return res.status(400).json({
                error: 'Content-Type é obrigatório'
            });
        }

        const isValid = allowedTypes.some(type => 
            contentType.toLowerCase().startsWith(type.toLowerCase())
        );

        if (!isValid) {
            return res.status(415).json({
                error: 'Content-Type não suportado',
                supported: allowedTypes
            });
        }

        next();
    };
};

// Middleware para validar tamanho do payload
const validatePayloadSize = (maxSize = 10 * 1024 * 1024) => { // 10MB por padrão
    return (req, res, next) => {
        const contentLength = req.headers['content-length'];
        
        if (contentLength && parseInt(contentLength) > maxSize) {
            logger.warn('Payload too large', {
                size: contentLength,
                maxSize,
                url: req.originalUrl,
                ip: req.ip
            });
            
            return res.status(413).json({
                error: 'Payload muito grande',
                maxSize: `${Math.round(maxSize / 1024 / 1024)}MB`
            });
        }

        next();
    };
};

// Middleware genérico para validação customizada
const validateCustom = (validationFn) => {
    return async (req, res, next) => {
        try {
            const result = await validationFn(req.body, req);
            
            if (result !== true) {
                logger.warn('Custom validation failed', {
                    errors: result,
                    url: req.originalUrl,
                    ip: req.ip
                });
                
                return res.status(400).json({
                    error: 'Validação customizada falhou',
                    details: Array.isArray(result) ? result : [result]
                });
            }

            next();
        } catch (error) {
            logger.error('Error in custom validation', {
                error: error.message,
                url: req.originalUrl,
                ip: req.ip
            });
            
            return res.status(500).json({
                error: 'Erro na validação'
            });
        }
    };
};

// Schema de validação para diferentes endpoints
const validationSchemas = {
    crawling: validateCrawlingData,
    search: validateSearchData,
    client: validateClientData,
    idParam: validateIdParam,
    requiredHeaders: validateRequiredHeaders,
    contentType: validateContentType,
    payloadSize: validatePayloadSize,
    custom: validateCustom
};

module.exports = {
    // Validadores específicos
    validateCrawlingData,
    validateSearchData,
    validateClientData,
    validateIdParam,
    validateRequiredHeaders,
    validateContentType,
    validatePayloadSize,
    validateCustom,
    
    // Schemas
    validationSchemas,
    
    // Funções auxiliares
    isValidUrl,
    sanitizeString,
    isValidEmail,
    isValidNumber
};