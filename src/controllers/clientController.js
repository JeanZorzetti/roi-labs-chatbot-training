const supabase = require('../config/database');
const { logger } = require('../middleware/logging');
const { asyncHandler, NotFoundError, DatabaseError, ValidationError } = require('../middleware/errorHandler');
const crypto = require('crypto');

// Controller para criar cliente
const createClient = asyncHandler(async (req, res) => {
    const { name, email, company, phone } = req.body;

    logger.info('Creating new client', { name, email, company });

    // Verificar se email já existe
    const { data: existingClient, error: checkError } = await supabase
        .from('clients')
        .select('id, email')
        .eq('email', email)
        .maybeSingle();

    if (checkError) {
        logger.error('Error checking existing client', { error: checkError.message });
        throw new DatabaseError('Erro ao verificar cliente existente');
    }

    if (existingClient) {
        throw new ValidationError('Email já está em uso', ['Email já cadastrado no sistema']);
    }

    // Gerar API key única
    const apiKey = generateApiKey();

    // Criar cliente
    const { data: newClient, error: insertError } = await supabase
        .from('clients')
        .insert({
            name,
            email,
            company,
            phone,
            api_key: apiKey,
            status: 'active',
            created_at: new Date().toISOString()
        })
        .select('id, name, email, company, phone, api_key, status, created_at')
        .single();

    if (insertError) {
        logger.error('Error creating client', { error: insertError.message });
        throw new DatabaseError('Erro ao criar cliente');
    }

    logger.info('Client created successfully', { 
        clientId: newClient.id, 
        email: newClient.email 
    });

    res.status(201).json({
        success: true,
        message: 'Cliente criado com sucesso',
        client: newClient
    });
});

// Função para gerar API key
function generateApiKey() {
    const prefix = 'roi_';
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return prefix + randomBytes;
}

// Controller para listar clientes (admin)
const getClients = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
        .from('clients')
        .select('id, name, email, company, phone, status, created_at, updated_at')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    // Filtrar por status se fornecido
    if (status) {
        query = query.eq('status', status);
    }

    // Buscar por nome ou email se fornecido
    if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: clients, error } = await query;

    if (error) {
        logger.error('Error fetching clients', { error: error.message });
        throw new DatabaseError('Erro ao buscar clientes');
    }

    // Buscar contagem total
    let countQuery = supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

    if (status) {
        countQuery = countQuery.eq('status', status);
    }

    if (search) {
        countQuery = countQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { count } = await countQuery;

    res.json({
        success: true,
        clients: clients || [],
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit)
        }
    });
});

// Controller para obter cliente específico
const getClient = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const { data: client, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !client) {
        throw new NotFoundError('Cliente não encontrado');
    }

    // Buscar estatísticas do cliente
    const stats = await getClientStats(id);

    res.json({
        success: true,
        client: {
            ...client,
            api_key: client.api_key ? client.api_key.substring(0, 12) + '...' : null // Mascarar API key
        },
        stats
    });
});

// Função para obter estatísticas do cliente
async function getClientStats(clientId) {
    try {
        // Total de crawlings
        const { count: totalCrawlings } = await supabase
            .from('chatbot_training_data')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', clientId);

        // Crawlings completados
        const { count: completedCrawlings } = await supabase
            .from('chatbot_training_data')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', clientId)
            .eq('status', 'completed');

        // Total de chunks
        const { count: totalChunks } = await supabase
            .from('chatbot_embeddings')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', clientId);

        // Domínios únicos
        const { data: domains } = await supabase
            .from('chatbot_embeddings')
            .select('domain')
            .eq('client_id', clientId);

        const uniqueDomains = domains ? [...new Set(domains.map(d => d.domain))].length : 0;

        // Último crawling
        const { data: lastCrawling } = await supabase
            .from('chatbot_training_data')
            .select('created_at, status, domain')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        return {
            total_crawlings: totalCrawlings || 0,
            completed_crawlings: completedCrawlings || 0,
            success_rate: totalCrawlings ? Math.round((completedCrawlings / totalCrawlings) * 100) : 0,
            total_chunks: totalChunks || 0,
            unique_domains: uniqueDomains,
            last_activity: lastCrawling?.created_at || null,
            last_crawling_status: lastCrawling?.status || null
        };
    } catch (error) {
        logger.error('Error fetching client stats', { clientId, error: error.message });
        return {
            total_crawlings: 0,
            completed_crawlings: 0,
            success_rate: 0,
            total_chunks: 0,
            unique_domains: 0,
            last_activity: null,
            last_crawling_status: null
        };
    }
}

// Controller para atualizar cliente
const updateClient = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, email, company, phone, status } = req.body;

    // Verificar se cliente existe
    const { data: existingClient, error: checkError } = await supabase
        .from('clients')
        .select('id, email')
        .eq('id', id)
        .single();

    if (checkError || !existingClient) {
        throw new NotFoundError('Cliente não encontrado');
    }

    // Se mudou o email, verificar se não está em uso
    if (email && email !== existingClient.email) {
        const { data: emailInUse, error: emailCheckError } = await supabase
            .from('clients')
            .select('id')
            .eq('email', email)
            .neq('id', id)
            .maybeSingle();

        if (emailCheckError) {
            logger.error('Error checking email availability', { error: emailCheckError.message });
            throw new DatabaseError('Erro ao verificar disponibilidade do email');
        }

        if (emailInUse) {
            throw new ValidationError('Email já está em uso por outro cliente');
        }
    }

    // Atualizar cliente
    const updateData = {
        updated_at: new Date().toISOString()
    };

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (company !== undefined) updateData.company = company;
    if (phone !== undefined) updateData.phone = phone;
    if (status) updateData.status = status;

    const { data: updatedClient, error: updateError } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', id)
        .select('id, name, email, company, phone, status, updated_at')
        .single();

    if (updateError) {
        logger.error('Error updating client', { error: updateError.message });
        throw new DatabaseError('Erro ao atualizar cliente');
    }

    logger.info('Client updated successfully', { clientId: id });

    res.json({
        success: true,
        message: 'Cliente atualizado com sucesso',
        client: updatedClient
    });
});

// Controller para regenerar API key
const regenerateApiKey = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Verificar se cliente existe
    const { data: existingClient, error: checkError } = await supabase
        .from('clients')
        .select('id, name, email')
        .eq('id', id)
        .single();

    if (checkError || !existingClient) {
        throw new NotFoundError('Cliente não encontrado');
    }

    // Gerar nova API key
    const newApiKey = generateApiKey();

    const { data: updatedClient, error: updateError } = await supabase
        .from('clients')
        .update({
            api_key: newApiKey,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('id, name, email, api_key')
        .single();

    if (updateError) {
        logger.error('Error regenerating API key', { error: updateError.message });
        throw new DatabaseError('Erro ao regenerar API key');
    }

    logger.info('API key regenerated', { 
        clientId: id, 
        clientEmail: existingClient.email 
    });

    res.json({
        success: true,
        message: 'API key regenerada com sucesso',
        client: {
            id: updatedClient.id,
            name: updatedClient.name,
            email: updatedClient.email,
            api_key: updatedClient.api_key
        }
    });
});

// Controller para desativar cliente
const deactivateClient = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const { data: updatedClient, error } = await supabase
        .from('clients')
        .update({
            status: 'inactive',
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('id, name, email, status')
        .single();

    if (error || !updatedClient) {
        throw new NotFoundError('Cliente não encontrado');
    }

    logger.info('Client deactivated', { clientId: id });

    res.json({
        success: true,
        message: 'Cliente desativado com sucesso',
        client: updatedClient
    });
});

// Controller para reativar cliente
const activateClient = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const { data: updatedClient, error } = await supabase
        .from('clients')
        .update({
            status: 'active',
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('id, name, email, status')
        .single();

    if (error || !updatedClient) {
        throw new NotFoundError('Cliente não encontrado');
    }

    logger.info('Client activated', { clientId: id });

    res.json({
        success: true,
        message: 'Cliente reativado com sucesso',
        client: updatedClient
    });
});

// Controller para deletar cliente (cuidado!)
const deleteClient = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { confirm } = req.body;

    if (!confirm || confirm !== 'DELETE') {
        throw new ValidationError('Confirmação obrigatória', [
            'Para deletar um cliente, envie {"confirm": "DELETE"} no body'
        ]);
    }

    // Verificar se cliente existe
    const { data: existingClient, error: checkError } = await supabase
        .from('clients')
        .select('id, name, email')
        .eq('id', id)
        .single();

    if (checkError || !existingClient) {
        throw new NotFoundError('Cliente não encontrado');
    }

    // Verificar se tem dados associados
    const { count: crawlingsCount } = await supabase
        .from('chatbot_training_data')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', id);

    const { count: chunksCount } = await supabase
        .from('chatbot_embeddings')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', id);

    if ((crawlingsCount || 0) > 0 || (chunksCount || 0) > 0) {
        return res.status(400).json({
            success: false,
            error: 'Cliente possui dados associados',
            message: 'Não é possível deletar um cliente que possui crawlings ou chunks. Desative o cliente em vez de deletá-lo.',
            data_count: {
                crawlings: crawlingsCount || 0,
                chunks: chunksCount || 0
            }
        });
    }

    // Deletar cliente
    const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

    if (deleteError) {
        logger.error('Error deleting client', { error: deleteError.message });
        throw new DatabaseError('Erro ao deletar cliente');
    }

    logger.info('Client deleted', { 
        clientId: id, 
        clientName: existingClient.name,
        clientEmail: existingClient.email 
    });

    res.json({
        success: true,
        message: 'Cliente deletado com sucesso'
    });
});

// Controller para obter perfil do cliente atual (baseado na API key)
const getCurrentClientProfile = asyncHandler(async (req, res) => {
    const client = req.client; // Vem do middleware de autenticação

    // Buscar estatísticas do cliente
    const stats = await getClientStats(client.id);

    res.json({
        success: true,
        profile: {
            id: client.id,
            name: client.name,
            email: client.email,
            company: client.company,
            phone: client.phone,
            status: client.status,
            created_at: client.created_at,
            api_key: client.api_key ? client.api_key.substring(0, 12) + '...' : null
        },
        stats
    });
});

// Controller para obter dashboard stats (admin)
const getDashboardStats = asyncHandler(async (req, res) => {
    try {
        // Total de clientes
        const { count: totalClients } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true });

        // Clientes ativos
        const { count: activeClients } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        // Total de crawlings
        const { count: totalCrawlings } = await supabase
            .from('chatbot_training_data')
            .select('*', { count: 'exact', head: true });

        // Crawlings hoje
        const today = new Date().toISOString().split('T')[0];
        const { count: crawlingsToday } = await supabase
            .from('chatbot_training_data')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today);

        // Total de chunks
        const { count: totalChunks } = await supabase
            .from('chatbot_embeddings')
            .select('*', { count: 'exact', head: true });

        // Clientes recentes (últimos 7 dias)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const { data: recentClients } = await supabase
            .from('clients')
            .select('name, email, created_at')
            .gte('created_at', weekAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(5);

        // Domínios mais populares
        const { data: domains } = await supabase
            .from('chatbot_embeddings')
            .select('domain');

        const domainCount = {};
        (domains || []).forEach(item => {
            domainCount[item.domain] = (domainCount[item.domain] || 0) + 1;
        });

        const topDomains = Object.entries(domainCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([domain, count]) => ({ domain, count }));

        res.json({
            success: true,
            stats: {
                clients: {
                    total: totalClients || 0,
                    active: activeClients || 0,
                    inactive: (totalClients || 0) - (activeClients || 0)
                },
                crawlings: {
                    total: totalCrawlings || 0,
                    today: crawlingsToday || 0
                },
                chunks: {
                    total: totalChunks || 0
                },
                recent_clients: recentClients || [],
                top_domains: topDomains
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Error fetching dashboard stats', { error: error.message });
        throw new DatabaseError('Erro ao buscar estatísticas do dashboard');
    }
});

module.exports = {
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
};