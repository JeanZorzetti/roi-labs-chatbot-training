const supabase = require('../config/database');
const { logger, systemLogger } = require('../middleware/logging');
const { asyncHandler, NotFoundError, DatabaseError } = require('../middleware/errorHandler');
const WebCrawler = require('../utils/web-crawler');

// Controller para iniciar crawling
const startCrawling = asyncHandler(async (req, res) => {
    const { website_url, max_pages, max_depth, delay } = req.body;
    const clientId = req.client.id;

    logger.info('Starting crawling process', {
        clientId,
        website_url,
        max_pages,
        max_depth,
        delay
    });

    const domain = new URL(website_url).hostname;
    
    // Verificar se já existe um crawling ativo para este domínio
    const { data: existingCrawling, error: checkError } = await supabase
        .from('chatbot_training_data')
        .select('id, status')
        .eq('client_id', clientId)
        .eq('domain', domain)
        .eq('status', 'processing')
        .maybeSingle();

    if (checkError) {
        logger.error('Error checking existing crawling', { error: checkError.message });
        throw new DatabaseError('Erro ao verificar crawling existente');
    }

    if (existingCrawling) {
        return res.status(409).json({
            success: false,
            error: 'Já existe um crawling em andamento para este domínio',
            crawling_id: existingCrawling.id
        });
    }

    // Inserir registro inicial
    const { data: trainingData, error: insertError } = await supabase
        .from('chatbot_training_data')
        .insert({
            client_id: clientId,
            domain: domain,
            base_url: website_url,
            total_pages: 0,
            pages_data: [],
            status: 'processing'
        })
        .select()
        .single();

    if (insertError) {
        logger.error('Error inserting crawling data', { error: insertError.message });
        throw new DatabaseError('Erro ao iniciar crawling');
    }

    // Log do sistema
    systemLogger.logCrawlingStart(clientId, website_url, {
        max_pages,
        max_depth,
        delay
    });

    // Resposta imediata para o cliente
    res.json({
        success: true,
        message: 'Crawling iniciado com sucesso!',
        crawling_id: trainingData.id,
        status: 'processing',
        website_url,
        estimated_time: `${max_pages * (delay / 1000)} segundos`
    });

    // Executar crawling em background
    performCrawling(trainingData.id, clientId, website_url, {
        maxPages: max_pages,
        maxDepth: max_depth,
        delay: delay
    }).catch(error => {
        logger.error('Background crawling error', { 
            crawlingId: trainingData.id,
            error: error.message 
        });
    });
});

// Função para executar crawling em background
async function performCrawling(trainingDataId, clientId, websiteUrl, options) {
    const startTime = Date.now();
    
    try {
        logger.info('Background crawling started', {
            trainingDataId,
            clientId,
            websiteUrl,
            options
        });

        // Configurar crawler
        const crawler = new WebCrawler({
            maxPages: options.maxPages,
            maxDepth: options.maxDepth,
            delay: options.delay,
            userAgent: 'ROI Labs Chatbot Training Bot 1.0'
        });

        // Executar crawling com callback de progresso
        const result = await crawler.crawlWebsite(websiteUrl, (progress) => {
            logger.debug('Crawling progress', {
                trainingDataId,
                processed: progress.totalProcessed,
                queue: progress.queueSize
            });
        });

        // Calcular duração
        const crawlDuration = Math.round((Date.now() - startTime) / 1000);

        // Atualizar dados no banco
        const { error: updateError } = await supabase
            .from('chatbot_training_data')
            .update({
                total_pages: result.totalPages,
                pages_data: result.pages,
                status: 'completed',
                crawl_duration_seconds: crawlDuration,
                completed_at: new Date().toISOString()
            })
            .eq('id', trainingDataId);

        if (updateError) {
            logger.error('Error updating crawling data', { error: updateError.message });
            throw new DatabaseError('Erro ao atualizar dados do crawling');
        }

        logger.info('Crawling completed successfully', {
            trainingDataId,
            totalPages: result.totalPages,
            duration: crawlDuration
        });

        // Log do sistema
        systemLogger.logCrawlingComplete(clientId, websiteUrl, {
            totalPages: result.totalPages,
            duration: crawlDuration
        });

        // Gerar chunks para embeddings
        await generateEmbeddingChunks(trainingDataId, clientId, result.pages);

    } catch (error) {
        const crawlDuration = Math.round((Date.now() - startTime) / 1000);
        
        logger.error('Crawling failed', {
            trainingDataId,
            error: error.message,
            duration: crawlDuration
        });

        // Log do sistema
        systemLogger.logCrawlingError(clientId, websiteUrl, error);
        
        // Marcar como falhou
        await supabase
            .from('chatbot_training_data')
            .update({
                status: 'failed',
                error_message: error.message,
                crawl_duration_seconds: crawlDuration,
                completed_at: new Date().toISOString()
            })
            .eq('id', trainingDataId);
    }
}

// Função para gerar chunks de embedding
async function generateEmbeddingChunks(trainingDataId, clientId, pages) {
    logger.info('Generating embedding chunks', {
        trainingDataId,
        totalPages: pages.length
    });
    
    try {
        const crawler = new WebCrawler();
        const chunks = [];

        for (const page of pages) {
            if (!page.content || page.content.length < 50) continue;

            const pageChunks = crawler.splitContentIntoChunks(page.content, 500);
            
            pageChunks.forEach((chunk, index) => {
                chunks.push({
                    training_data_id: trainingDataId,
                    client_id: clientId,
                    chunk_id: `${page.url}_chunk_${index}`,
                    url: page.url,
                    title: page.title || 'Sem título',
                    content: chunk,
                    domain: new URL(page.url).hostname,
                    chunk_index: index,
                    total_chunks: pageChunks.length,
                    word_count: chunk.split(/\s+/).length,
                    relevance_score: calculateRelevanceScore(page, chunk)
                });
            });
        }

        // Inserir chunks no banco em lotes para melhor performance
        if (chunks.length > 0) {
            const batchSize = 50;
            for (let i = 0; i < chunks.length; i += batchSize) {
                const batch = chunks.slice(i, i + batchSize);
                
                const { error } = await supabase
                    .from('chatbot_embeddings')
                    .insert(batch);

                if (error) {
                    logger.error('Error inserting chunk batch', { 
                        error: error.message,
                        batchStart: i,
                        batchSize: batch.length
                    });
                }
            }

            logger.info('Chunks created successfully', {
                trainingDataId,
                totalChunks: chunks.length
            });
        }

    } catch (error) {
        logger.error('Error generating chunks', {
            trainingDataId,
            error: error.message
        });
    }
}

// Calcular score de relevância
function calculateRelevanceScore(page, chunk) {
    let score = 0;
    
    // Pontuação baseada em características da página
    if (page.title && page.title.length > 5) score += 10;
    if (page.description && page.description.length > 10) score += 5;
    if (page.headings && page.headings.length > 0) score += page.headings.length * 2;
    
    // Pontuação baseada no chunk
    if (chunk.length > 100) score += Math.min(chunk.length / 50, 20);
    if (chunk.includes('?') || chunk.includes('!')) score += 5; // Perguntas e exclamações
    
    // Penalizar chunks muito curtos ou muito longos
    if (chunk.length < 50) score -= 10;
    if (chunk.length > 1000) score -= 5;
    
    // Bonus para chunks com palavras-chave importantes
    const importantWords = ['como', 'o que', 'quando', 'onde', 'por que', 'qual'];
    const hasImportantWords = importantWords.some(word => 
        chunk.toLowerCase().includes(word.toLowerCase())
    );
    if (hasImportantWords) score += 5;
    
    return Math.max(0, Math.min(100, score));
}

// Controller para obter status do crawling
const getCrawlingStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const clientId = req.client.id;

    const { data: crawling, error } = await supabase
        .from('chatbot_training_data')
        .select('*')
        .eq('id', id)
        .eq('client_id', clientId)
        .single();

    if (error || !crawling) {
        throw new NotFoundError('Crawling não encontrado');
    }

    // Calcular progresso se ainda está processando
    let progress = null;
    if (crawling.status === 'processing') {
        const elapsedTime = new Date() - new Date(crawling.created_at);
        const estimatedTotalTime = crawling.max_pages * 2000; // estimativa
        progress = Math.min(95, Math.round((elapsedTime / estimatedTotalTime) * 100));
    }

    res.json({
        success: true,
        crawling: {
            id: crawling.id,
            status: crawling.status,
            domain: crawling.domain,
            base_url: crawling.base_url,
            total_pages: crawling.total_pages,
            duration: crawling.crawl_duration_seconds,
            created_at: crawling.created_at,
            completed_at: crawling.completed_at,
            error_message: crawling.error_message,
            progress
        }
    });
});

// Controller para listar histórico de crawlings
const getCrawlingHistory = asyncHandler(async (req, res) => {
    const clientId = req.client.id;
    const { page = 1, limit = 20, status } = req.query;

    const offset = (page - 1) * limit;
    
    let query = supabase
        .from('chatbot_training_data')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (status) {
        query = query.eq('status', status);
    }

    const { data: history, error } = await query;

    if (error) {
        logger.error('Error fetching crawling history', { error: error.message });
        throw new DatabaseError('Erro ao buscar histórico');
    }

    // Buscar contagem total
    let countQuery = supabase
        .from('chatbot_training_data')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId);

    if (status) {
        countQuery = countQuery.eq('status', status);
    }

    const { count } = await countQuery;

    res.json({
        success: true,
        history: history || [],
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit)
        }
    });
});

// Controller para obter detalhes de um crawling
const getCrawlingDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const clientId = req.client.id;

    const { data: crawling, error } = await supabase
        .from('chatbot_training_data')
        .select('*')
        .eq('id', id)
        .eq('client_id', clientId)
        .single();

    if (error || !crawling) {
        throw new NotFoundError('Crawling não encontrado');
    }

    // Buscar chunks relacionados
    const { data: chunks, error: chunksError } = await supabase
        .from('chatbot_embeddings')
        .select('chunk_id, url, title, word_count, relevance_score, created_at')
        .eq('training_data_id', id)
        .order('relevance_score', { ascending: false });

    if (chunksError) {
        logger.error('Error fetching chunks', { error: chunksError.message });
    }

    // Estatísticas dos chunks
    const chunkStats = chunks ? {
        total: chunks.length,
        avgWordCount: Math.round(chunks.reduce((sum, c) => sum + c.word_count, 0) / chunks.length),
        avgRelevanceScore: Math.round(chunks.reduce((sum, c) => sum + c.relevance_score, 0) / chunks.length),
        topScoring: chunks.slice(0, 5)
    } : null;

    res.json({
        success: true,
        crawling,
        chunks: chunks || [],
        stats: chunkStats
    });
});

// Controller para cancelar crawling
const cancelCrawling = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const clientId = req.client.id;

    const { data: crawling, error: fetchError } = await supabase
        .from('chatbot_training_data')
        .select('*')
        .eq('id', id)
        .eq('client_id', clientId)
        .single();

    if (fetchError || !crawling) {
        throw new NotFoundError('Crawling não encontrado');
    }

    if (crawling.status !== 'processing') {
        return res.status(400).json({
            success: false,
            error: 'Só é possível cancelar crawlings em processamento'
        });
    }

    // Atualizar status para cancelado
    const { error: updateError } = await supabase
        .from('chatbot_training_data')
        .update({
            status: 'cancelled',
            completed_at: new Date().toISOString()
        })
        .eq('id', id);

    if (updateError) {
        logger.error('Error cancelling crawling', { error: updateError.message });
        throw new DatabaseError('Erro ao cancelar crawling');
    }

    logger.info('Crawling cancelled', {
        crawlingId: id,
        clientId
    });

    res.json({
        success: true,
        message: 'Crawling cancelado com sucesso'
    });
});

// Controller para deletar crawling
const deleteCrawling = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const clientId = req.client.id;

    // Verificar se o crawling existe e pertence ao cliente
    const { data: crawling, error: fetchError } = await supabase
        .from('chatbot_training_data')
        .select('status')
        .eq('id', id)
        .eq('client_id', clientId)
        .single();

    if (fetchError || !crawling) {
        throw new NotFoundError('Crawling não encontrado');
    }

    if (crawling.status === 'processing') {
        return res.status(400).json({
            success: false,
            error: 'Não é possível deletar um crawling em processamento. Cancele primeiro.'
        });
    }

    // Deletar chunks relacionados primeiro
    const { error: deleteChunksError } = await supabase
        .from('chatbot_embeddings')
        .delete()
        .eq('training_data_id', id);

    if (deleteChunksError) {
        logger.error('Error deleting chunks', { error: deleteChunksError.message });
    }

    // Deletar o crawling
    const { error: deleteCrawlingError } = await supabase
        .from('chatbot_training_data')
        .delete()
        .eq('id', id);

    if (deleteCrawlingError) {
        logger.error('Error deleting crawling', { error: deleteCrawlingError.message });
        throw new DatabaseError('Erro ao deletar crawling');
    }

    logger.info('Crawling deleted', {
        crawlingId: id,
        clientId
    });

    res.json({
        success: true,
        message: 'Crawling deletado com sucesso'
    });
});

module.exports = {
    startCrawling,
    getCrawlingStatus,
    getCrawlingHistory,
    getCrawlingDetails,
    cancelCrawling,
    deleteCrawling
};