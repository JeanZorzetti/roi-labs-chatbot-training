const supabase = require('../config/database');
const { logger } = require('../middleware/logging');
const { asyncHandler, NotFoundError, DatabaseError, ExternalServiceError } = require('../middleware/errorHandler');
const axios = require('axios');

// Controller para buscar no conhecimento
const searchKnowledge = asyncHandler(async (req, res) => {
    const { query, limit = 10, domain = null, min_score = 0 } = req.body;
    const clientId = req.client.id;

    logger.info('Knowledge search started', {
        clientId,
        query: query.substring(0, 100),
        limit,
        domain,
        min_score
    });

    // Buscar chunks relevantes no banco
    let searchQuery = supabase
        .from('chatbot_embeddings')
        .select('*')
        .eq('client_id', clientId)
        .gte('relevance_score', min_score)
        .order('relevance_score', { ascending: false })
        .limit(limit);

    // Filtrar por domínio se especificado
    if (domain) {
        searchQuery = searchQuery.eq('domain', domain);
    }

    // Busca por texto (usando LIKE por enquanto, idealmente seria busca semântica)
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
    if (searchTerms.length > 0) {
        // Criar filtro OR para buscar em title ou content
        const searchFilter = searchTerms.map(term => 
            `title.ilike.%${term}%,content.ilike.%${term}%`
        ).join(',');
        
        searchQuery = searchQuery.or(searchFilter);
    }

    const { data: chunks, error } = await searchQuery;

    if (error) {
        logger.error('Error searching knowledge', { error: error.message });
        throw new DatabaseError('Erro ao buscar conhecimento');
    }

    // Processar e ranquear resultados
    const processedResults = chunks ? processSearchResults(chunks, query, searchTerms) : [];

    // Gerar resposta usando IA (se configurado)
    let aiResponse = null;
    if (processedResults.length > 0 && process.env.OPENAI_API_KEY) {
        try {
            aiResponse = await generateAIResponse(query, processedResults.slice(0, 5));
        } catch (error) {
            logger.warn('AI response generation failed', { error: error.message });
        }
    }

    logger.info('Knowledge search completed', {
        clientId,
        resultsFound: processedResults.length,
        hasAIResponse: !!aiResponse
    });

    res.json({
        success: true,
        query,
        results: processedResults,
        total_results: processedResults.length,
        ai_response: aiResponse,
        search_metadata: {
            search_terms: searchTerms,
            domain_filter: domain,
            min_score_filter: min_score,
            timestamp: new Date().toISOString()
        }
    });
});

// Função para processar e ranquear resultados
function processSearchResults(chunks, originalQuery, searchTerms) {
    return chunks.map(chunk => {
        // Calcular score de relevância para a busca
        let searchScore = chunk.relevance_score || 0;
        
        // Bonus por matches exatos nos termos de busca
        const contentLower = chunk.content.toLowerCase();
        const titleLower = (chunk.title || '').toLowerCase();
        
        searchTerms.forEach(term => {
            // Bonus por match no título (mais importante)
            if (titleLower.includes(term)) {
                searchScore += 15;
            }
            
            // Bonus por match no conteúdo
            const matches = (contentLower.match(new RegExp(term, 'g')) || []).length;
            searchScore += matches * 5;
            
            // Bonus por match exato da frase completa
            if (contentLower.includes(originalQuery.toLowerCase())) {
                searchScore += 20;
            }
        });

        // Criar snippet destacando os termos encontrados
        const snippet = createSnippet(chunk.content, searchTerms, 200);
        
        return {
            chunk_id: chunk.chunk_id,
            url: chunk.url,
            title: chunk.title,
            domain: chunk.domain,
            snippet,
            word_count: chunk.word_count,
            relevance_score: chunk.relevance_score,
            search_score: Math.min(100, searchScore),
            chunk_index: chunk.chunk_index,
            total_chunks: chunk.total_chunks,
            created_at: chunk.created_at
        };
    })
    .sort((a, b) => b.search_score - a.search_score) // Ordenar por score de busca
    .slice(0, 20); // Limitar a 20 resultados máximo
}

// Função para criar snippet com destaque
function createSnippet(content, searchTerms, maxLength = 200) {
    if (!content || content.length <= maxLength) {
        return content;
    }

    // Encontrar a primeira ocorrência de qualquer termo de busca
    let firstMatchPos = content.length;
    searchTerms.forEach(term => {
        const pos = content.toLowerCase().indexOf(term.toLowerCase());
        if (pos !== -1 && pos < firstMatchPos) {
            firstMatchPos = pos;
        }
    });

    // Se encontrou match, centralizar o snippet nele
    if (firstMatchPos < content.length) {
        const start = Math.max(0, firstMatchPos - maxLength / 3);
        const end = Math.min(content.length, start + maxLength);
        
        let snippet = content.substring(start, end);
        
        // Adicionar ... se necessário
        if (start > 0) snippet = '...' + snippet;
        if (end < content.length) snippet = snippet + '...';
        
        return snippet;
    }

    // Se não encontrou match, pegar do início
    return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
}

// Função para gerar resposta com IA
async function generateAIResponse(query, topResults) {
    if (!process.env.OPENAI_API_KEY) {
        return null;
    }

    try {
        // Preparar contexto com os melhores resultados
        const context = topResults.map(result => 
            `Fonte: ${result.title} (${result.url})\nConteúdo: ${result.snippet}`
        ).join('\n\n');

        const messages = [
            {
                role: 'system',
                content: `Você é um assistente especializado em responder perguntas baseado no conhecimento fornecido. 
                         Responda de forma clara, concisa e precisa usando apenas as informações do contexto fornecido.
                         Se não houver informação suficiente no contexto, diga que não possui informações suficientes.
                         Sempre cite as fontes quando possível.`
            },
            {
                role: 'user',
                content: `Pergunta: ${query}\n\nContexto disponível:\n${context}\n\nResposta:`
            }
        ];

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: messages,
            max_tokens: 500,
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 segundos timeout
        });

        return {
            content: response.data.choices[0].message.content,
            model: response.data.model,
            tokens_used: response.data.usage.total_tokens,
            sources_used: topResults.length
        };

    } catch (error) {
        logger.error('OpenAI API error', { 
            error: error.message,
            status: error.response?.status,
            data: error.response?.data 
        });
        
        if (error.response?.status === 401) {
            throw new ExternalServiceError('OpenAI', 'Chave da API inválida');
        } else if (error.response?.status === 429) {
            throw new ExternalServiceError('OpenAI', 'Limite de requisições excedido');
        } else {
            throw new ExternalServiceError('OpenAI', 'Erro ao gerar resposta');
        }
    }
}

// Controller para buscar domínios disponíveis
const getAvailableDomains = asyncHandler(async (req, res) => {
    const clientId = req.client.id;

    const { data: domains, error } = await supabase
        .from('chatbot_embeddings')
        .select('domain')
        .eq('client_id', clientId);

    if (error) {
        logger.error('Error fetching domains', { error: error.message });
        throw new DatabaseError('Erro ao buscar domínios');
    }

    // Extrair domínios únicos e contar chunks
    const domainStats = {};
    if (domains) {
        domains.forEach(item => {
            const domain = item.domain;
            domainStats[domain] = (domainStats[domain] || 0) + 1;
        });
    }

    res.json({
        success: true,
        domains: Object.keys(domainStats),
        domain_stats: domainStats,
        total_domains: Object.keys(domainStats).length
    });
});

// Controller para estatísticas de busca
const getSearchStats = asyncHandler(async (req, res) => {
    const clientId = req.client.id;

    // Buscar estatísticas gerais
    const { data: totalChunks, count: totalCount } = await supabase
        .from('chatbot_embeddings')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId);

    // Buscar chunks por score de relevância
    const { data: highScoreChunks, count: highScoreCount } = await supabase
        .from('chatbot_embeddings')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .gte('relevance_score', 70);

    // Buscar últimos chunks criados
    const { data: recentChunks } = await supabase
        .from('chatbot_embeddings')
        .select('created_at, domain, title')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(5);

    // Calcular estatísticas de palavras
    const { data: wordStats } = await supabase
        .from('chatbot_embeddings')
        .select('word_count')
        .eq('client_id', clientId);

    let avgWordCount = 0;
    let totalWords = 0;
    if (wordStats && wordStats.length > 0) {
        totalWords = wordStats.reduce((sum, chunk) => sum + chunk.word_count, 0);
        avgWordCount = Math.round(totalWords / wordStats.length);
    }

    res.json({
        success: true,
        stats: {
            total_chunks: totalCount || 0,
            high_quality_chunks: highScoreCount || 0,
            quality_percentage: totalCount ? Math.round((highScoreCount / totalCount) * 100) : 0,
            total_words: totalWords,
            avg_words_per_chunk: avgWordCount,
            recent_additions: recentChunks || []
        },
        timestamp: new Date().toISOString()
    });
});

// Função para extrair palavras-chave
function extractKeywords(content) {
    if (!content) return [];
    
    // Palavras de parada em português
    const stopWords = new Set([
        'a', 'e', 'o', 'de', 'do', 'da', 'em', 'um', 'uma', 'com', 'não', 'na', 'no',
        'para', 'por', 'se', 'mais', 'que', 'mas', 'como', 'ao', 'dos', 'das', 'pelo',
        'pela', 'são', 'é', 'ou', 'foi', 'ser', 'tem', 'ter', 'seu', 'sua', 'seus',
        'suas', 'esse', 'essa', 'isso', 'este', 'esta', 'isto', 'aquele', 'aquela',
        'quando', 'onde', 'porque', 'como', 'muito', 'bem', 'também', 'já', 'ainda'
    ]);
    
    // Extrair palavras de 3+ caracteres, excluindo stopwords
    const words = content.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length >= 3 && !stopWords.has(word));
    
    // Contar frequência e retornar as mais comuns
    const wordCount = {};
    words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    return Object.entries(wordCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([word]) => word);
}

// Controller para busca similar (baseada em similaridade semântica)
const findSimilarContent = asyncHandler(async (req, res) => {
    const { chunk_id, limit = 5 } = req.body;
    const clientId = req.client.id;

    // Buscar o chunk de referência
    const { data: referenceChunk, error: refError } = await supabase
        .from('chatbot_embeddings')
        .select('*')
        .eq('chunk_id', chunk_id)
        .eq('client_id', clientId)
        .single();

    if (refError || !referenceChunk) {
        throw new NotFoundError('Chunk de referência não encontrado');
    }

    // Extrair palavras-chave do chunk de referência
    const keywords = extractKeywords(referenceChunk.content);
    
    if (keywords.length === 0) {
        return res.json({
            success: true,
            reference_chunk: {
                chunk_id: referenceChunk.chunk_id,
                title: referenceChunk.title,
                url: referenceChunk.url
            },
            similar_chunks: [],
            message: 'Nenhum conteúdo similar encontrado'
        });
    }

    // Buscar chunks similares baseado nas palavras-chave
    const keywordFilter = keywords.map(kw => `content.ilike.%${kw}%`).join(',');
    
    const { data: similarChunks, error: searchError } = await supabase
        .from('chatbot_embeddings')
        .select('*')
        .eq('client_id', clientId)
        .neq('chunk_id', chunk_id) // Excluir o próprio chunk
        .or(keywordFilter)
        .limit(limit * 3); // Buscar mais para ranquear depois

    if (searchError) {
        logger.error('Error finding similar content', { error: searchError.message });
        throw new DatabaseError('Erro ao buscar conteúdo similar');
    }

    // Calcular similaridade e ranquear
    const rankedResults = (similarChunks || []).map(chunk => {
        let similarityScore = 0;
        
        // Calcular similaridade baseada em palavras-chave
        keywords.forEach(keyword => {
            const content = chunk.content.toLowerCase();
            const matches = (content.match(new RegExp(keyword, 'g')) || []).length;
            similarityScore += matches * 10;
        });
        
        // Bonus por mesmo domínio
        if (chunk.domain === referenceChunk.domain) {
            similarityScore += 5;
        }
        
        // Bonus por relevance_score alto
        similarityScore += (chunk.relevance_score || 0) * 0.1;
        
        return {
            ...chunk,
            similarity_score: Math.min(100, similarityScore),
            matching_keywords: keywords.filter(kw => 
                chunk.content.toLowerCase().includes(kw)
            )
        };
    })
    .filter(chunk => chunk.similarity_score > 0) // Só incluir com alguma similaridade
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, limit);

    res.json({
        success: true,
        reference_chunk: {
            chunk_id: referenceChunk.chunk_id,
            title: referenceChunk.title,
            url: referenceChunk.url,
            keywords_extracted: keywords
        },
        similar_chunks: rankedResults.map(chunk => ({
            chunk_id: chunk.chunk_id,
            title: chunk.title,
            url: chunk.url,
            domain: chunk.domain,
            snippet: createSnippet(chunk.content, keywords, 150),
            similarity_score: chunk.similarity_score,
            matching_keywords: chunk.matching_keywords,
            relevance_score: chunk.relevance_score
        })),
        total_found: rankedResults.length
    });
});

// Controller para autocompletar busca
const searchAutocomplete = asyncHandler(async (req, res) => {
    const { query, limit = 5 } = req.query;
    const clientId = req.client.id;

    if (!query || query.length < 2) {
        return res.json({
            success: true,
            suggestions: []
        });
    }

    // Buscar títulos e primeiras palavras dos chunks que fazem match
    const { data: chunks, error } = await supabase
        .from('chatbot_embeddings')
        .select('title, content')
        .eq('client_id', clientId)
        .ilike('title', `%${query}%`)
        .limit(limit * 2);

    if (error) {
        logger.error('Error in autocomplete search', { error: error.message });
        throw new DatabaseError('Erro na busca de autocompletar');
    }

    // Processar sugestões
    const suggestions = [];
    const seen = new Set();

    (chunks || []).forEach(chunk => {
        // Sugestão baseada no título
        if (chunk.title && chunk.title.toLowerCase().includes(query.toLowerCase())) {
            const suggestion = chunk.title.trim();
            if (!seen.has(suggestion.toLowerCase()) && suggestions.length < limit) {
                suggestions.push({
                    text: suggestion,
                    type: 'title'
                });
                seen.add(suggestion.toLowerCase());
            }
        }
        
        // Sugestão baseada no conteúdo (frases que contêm a query)
        if (chunk.content && suggestions.length < limit) {
            const sentences = chunk.content.split(/[.!?]+/);
            for (const sentence of sentences) {
                if (sentence.toLowerCase().includes(query.toLowerCase()) && 
                    sentence.length > query.length + 10 && 
                    sentence.length < 100) {
                    
                    const suggestion = sentence.trim();
                    if (!seen.has(suggestion.toLowerCase()) && suggestions.length < limit) {
                        suggestions.push({
                            text: suggestion,
                            type: 'content'
                        });
                        seen.add(suggestion.toLowerCase());
                        break;
                    }
                }
            }
        }
    });

    res.json({
        success: true,
        query,
        suggestions: suggestions.slice(0, limit)
    });
});

module.exports = {
    searchKnowledge,
    getAvailableDomains,
    getSearchStats,
    findSimilarContent,
    searchAutocomplete
};