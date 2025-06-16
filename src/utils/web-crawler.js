const puppeteer = require('puppeteer');
const { URL } = require('url');

class WebCrawler {
    constructor(options = {}) {
        this.maxPages = options.maxPages || 50;
        this.maxDepth = Math.min(options.maxDepth || 2, 2); // Limitar profundidade máxima
        this.delay = Math.max(options.delay || 1000, 500); // Mínimo 500ms
        this.visitedUrls = new Set();
        this.crawledData = [];
        this.excludePatterns = options.excludePatterns || [
            /\.(jpg|jpeg|png|gif|pdf|doc|docx|zip|mp4|mp3)$/i,
            /\/admin/,
            /\/login/,
            /\/wp-admin/,
            /\/feed/
        ];
        this.maxTimeoutMs = options.timeout || 15000; // Timeout configurável
        this.abortController = new AbortController(); // Controller principal
        this.activeOperations = new Set(); // Track de operações ativas
    }

    async crawlWebsite(baseUrl, onProgress = null) {
        console.log(`🚀 Iniciando crawling: ${baseUrl}`);
        
        let browser = null;
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--disable-background-timer-throttling',
                    '--disable-renderer-backgrounding',
                    '--disable-backgrounding-occluded-windows'
                ],
                timeout: 30000 // 30s timeout para launch
            });

            console.log(`🌐 Browser iniciado, começando crawling...`);
            await this.crawlPage(baseUrl, browser, 0, onProgress);
            
            console.log(`✅ Crawling concluído! ${this.crawledData.length} páginas processadas`);
            
            return {
                domain: new URL(baseUrl).hostname,
                baseUrl,
                totalPages: this.crawledData.length,
                pages: this.crawledData,
                crawledAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Erro no crawling:', error.message);
            throw error;
        } finally {
            // Cleanup de recursos
            await this.cleanup();
            
            if (browser) {
                try {
                    await browser.close();
                    console.log('🔒 Browser fechado');
                } catch (closeError) {
                    console.error('⚠️ Erro ao fechar browser:', closeError.message);
                }
            }
        }
    }

    async crawlPage(url, browser, depth, onProgress) {
        // Verificar se foi cancelado
        if (this.abortController.signal.aborted) {
            console.log(`🛑 Crawling cancelado para: ${url}`);
            return;
        }

        // Verificar limites rigorosamente
        if (depth > this.maxDepth || 
            this.visitedUrls.has(url) || 
            this.crawledData.length >= this.maxPages) {
            console.log(`⏭️ Pulando ${url} - limites atingidos`);
            return;
        }

        // Verificar se deve pular esta URL
        if (this.shouldSkipUrl(url)) {
            console.log(`⏭️ Pulando ${url} - padrão excluído`);
            return;
        }

        this.visitedUrls.add(url);
        console.log(`📄 Processando [${depth}]: ${url}`);

        // Callback de progresso
        if (onProgress) {
            onProgress({
                currentUrl: url,
                totalProcessed: this.crawledData.length,
                totalFound: this.visitedUrls.size,
                depth
            });
        }

        let page = null;
        let requestHandler = null; // Track do handler de request
        
        try {
            page = await browser.newPage();
            
            // Configurações mais agressivas para timeout
            await page.setDefaultTimeout(this.maxTimeoutMs);
            await page.setDefaultNavigationTimeout(this.maxTimeoutMs);
            
            // Configurar página
            await page.setUserAgent('ROI Labs Chatbot Crawler 1.0');
            await page.setViewport({ width: 1280, height: 720 });
            
            // Desabilitar imagens e CSS para ser mais rápido
            await page.setRequestInterception(true);
            
            // Criar handler removível para requests
            requestHandler = (req) => {
                const resourceType = req.resourceType();
                if (resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font') {
                    req.abort();
                } else {
                    req.continue();
                }
            };
            
            page.on('request', requestHandler);
            
            console.log(`🌐 Navegando para: ${url}`);
            
            // Ir para a página com timeout menor e estratégia mais simples
            await page.goto(url, { 
                waitUntil: 'domcontentloaded', // Mais rápido que networkidle2
                timeout: this.maxTimeoutMs 
            });

            console.log(`📋 Extraindo conteúdo de: ${url}`);

            // Extrair dados da página com AbortController
            const pageData = await this.extractPageContentWithTimeout(page, url);
            
            if (pageData.content && pageData.content.trim().length > 50) {
                this.crawledData.push(pageData);
                console.log(`✅ Extraído: ${pageData.title || 'Sem título'} (${pageData.wordCount} palavras)`);
            } else {
                console.log(`⚠️ Conteúdo insuficiente em: ${url}`);
            }

            // Encontrar links internos com AbortController e timeout adequado
            const internalLinks = await this.findInternalLinksWithTimeout(page, url);
            
            console.log(`🔗 Encontrados ${internalLinks.length} links em: ${url}`);

            // Delay entre requests (verificando abort)
            await this.sleepWithAbort(this.delay);

            // Processar apenas alguns links para evitar explosão
            const linksToProcess = internalLinks.slice(0, Math.min(5, this.maxPages - this.crawledData.length));
            console.log(`🔄 Processando ${linksToProcess.length} sub-links...`);
            
            for (const link of linksToProcess) {
                if (this.crawledData.length >= this.maxPages || this.abortController.signal.aborted) break;
                await this.crawlPage(link, browser, depth + 1, onProgress);
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                console.log(`🛑 Operação cancelada para: ${url}`);
            } else {
                console.error(`❌ Erro ao processar ${url}:`, error.message);
            }
            // Não quebrar o crawling por causa de uma página
        } finally {
            // Cleanup da página
            if (page) {
                try {
                    // Remover event listeners antes de fechar
                    if (requestHandler) {
                        page.removeListener('request', requestHandler);
                    }
                    await page.close();
                } catch (closeError) {
                    console.error(`⚠️ Erro ao fechar página ${url}:`, closeError.message);
                }
            }
        }
    }

    async extractPageContentWithTimeout(page, url) {
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => {
            abortController.abort();
        }, 10000); // 10s timeout

        try {
            // Registrar operação ativa
            this.activeOperations.add(abortController);

            const content = await page.evaluate(() => {
                // Remover elementos desnecessários
                const elementsToRemove = [
                    'script', 'style', 'nav', 'header', 'footer', 
                    '.advertisement', '.ads', '.sidebar', '.menu', 
                    '.navigation', '.cookie-banner', '.popup'
                ];
                
                elementsToRemove.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => el.remove());
                });

                // Extrair metadados
                const title = document.title || '';
                const description = document.querySelector('meta[name="description"]')?.content || 
                                 document.querySelector('meta[property="og:description"]')?.content || '';
                const keywords = document.querySelector('meta[name="keywords"]')?.content || '';
                
                // Extrair conteúdo principal
                const contentSelectors = [
                    'main', 'article', '[role="main"]', '.content', 
                    '.main-content', '.post-content', '.entry-content',
                    'section', '.container'
                ];
                
                let mainContent = '';
                for (const selector of contentSelectors) {
                    const element = document.querySelector(selector);
                    if (element) {
                        mainContent = element.innerText || element.textContent || '';
                        if (mainContent.trim().length > 100) break;
                    }
                }

                // Se não encontrou conteúdo suficiente, pegar do body
                if (mainContent.trim().length < 100) {
                    mainContent = document.body.innerText || document.body.textContent || '';
                }

                // Extrair headings
                const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
                    .map(h => ({
                        level: h.tagName.toLowerCase(),
                        text: h.innerText.trim()
                    }))
                    .filter(h => h.text && h.text.length > 3)
                    .slice(0, 20); // Limitar headings

                return {
                    title: title.trim(),
                    description: description.trim(),
                    keywords: keywords.trim(),
                    content: mainContent.trim(),
                    headings: headings
                };
            });

            // Verificar se foi abortado
            if (abortController.signal.aborted) {
                throw new Error('Timeout extracting content');
            }

            return {
                url,
                title: content.title,
                description: content.description,
                keywords: content.keywords,
                content: this.cleanContent(content.content),
                headings: content.headings,
                crawledAt: new Date().toISOString(),
                wordCount: content.content.split(/\s+/).filter(w => w.length > 0).length,
                contentLength: content.content.length
            };
        } catch (error) {
            console.error(`❌ Erro extraindo conteúdo de ${url}:`, error.message);
            return {
                url,
                title: 'Erro na extração',
                description: '',
                keywords: '',
                content: '',
                headings: [],
                crawledAt: new Date().toISOString(),
                wordCount: 0,
                contentLength: 0,
                error: error.message
            };
        } finally {
            // Cleanup do timeout e operação
            clearTimeout(timeoutId);
            this.activeOperations.delete(abortController);
        }
    }

    async findInternalLinksWithTimeout(page, currentUrl) {
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => {
            abortController.abort();
        }, 5000); // 5s timeout

        try {
            // Registrar operação ativa
            this.activeOperations.add(abortController);

            const baseUrl = new URL(currentUrl).origin;
            const baseDomain = new URL(currentUrl).hostname;
            
            const links = await page.evaluate((baseUrl, baseDomain) => {
                const anchorTags = Array.from(document.querySelectorAll('a[href]'));
                return anchorTags
                    .map(a => {
                        try {
                            const href = a.href;
                            const url = new URL(href);
                            
                            // Só links do mesmo domínio
                            if (url.hostname === baseDomain) {
                                return url.href;
                            }
                            return null;
                        } catch {
                            return null;
                        }
                    })
                    .filter(href => href !== null)
                    .slice(0, 20); // Limitar links encontrados
            }, baseUrl, baseDomain);

            // Verificar se foi abortado
            if (abortController.signal.aborted) {
                throw new Error('Timeout finding links');
            }

            // Remover duplicatas e URLs já visitadas
            return [...new Set(links)].filter(link => !this.visitedUrls.has(link));
        } catch (error) {
            console.error(`❌ Erro encontrando links em ${currentUrl}:`, error.message);
            return [];
        } finally {
            // Cleanup do timeout e operação
            clearTimeout(timeoutId);
            this.activeOperations.delete(abortController);
        }
    }

    cleanContent(content) {
        if (!content) return '';
        
        return content
            .replace(/\s+/g, ' ') // Normalizar espaços
            .replace(/\n+/g, '\n') // Normalizar quebras de linha
            .replace(/[^\w\s\-.,!?;:()\[\]]/g, '') // Remover caracteres especiais
            .trim()
            .substring(0, 10000); // Limitar tamanho do conteúdo
    }

    shouldSkipUrl(url) {
        try {
            return this.excludePatterns.some(pattern => pattern.test(url));
        } catch (error) {
            console.error(`❌ Erro verificando padrão para ${url}:`, error.message);
            return true; // Skip em caso de erro
        }
    }

    async sleepWithAbort(ms) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(resolve, Math.min(ms, 5000)); // Max 5s delay
            
            // Verificar abort no signal
            if (this.abortController.signal.aborted) {
                clearTimeout(timeoutId);
                reject(new Error('AbortError'));
                return;
            }

            // Listener para abort
            const abortListener = () => {
                clearTimeout(timeoutId);
                reject(new Error('AbortError'));
            };

            this.abortController.signal.addEventListener('abort', abortListener);

            // Cleanup no resolve
            const originalResolve = resolve;
            resolve = (value) => {
                this.abortController.signal.removeEventListener('abort', abortListener);
                originalResolve(value);
            };
        });
    }

    // Dividir conteúdo em chunks para embeddings
    splitContentIntoChunks(content, maxLength = 500) {
        if (!content) return [];
        
        const sentences = content.split(/[.!?]+/).filter(s => s.trim());
        const chunks = [];
        let currentChunk = '';

        for (const sentence of sentences) {
            const newChunk = currentChunk + (currentChunk ? '. ' : '') + sentence;
            
            if (newChunk.length > maxLength && currentChunk) {
                chunks.push(currentChunk.trim());
                currentChunk = sentence;
            } else {
                currentChunk = newChunk;
            }
        }

        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }

        return chunks.filter(chunk => chunk.length > 20); // Filtrar chunks muito pequenos
    }

    // Método para abortar todas as operações
    abort() {
        console.log('🛑 Abortando todas as operações do crawler...');
        this.abortController.abort();
        
        // Abortar operações ativas
        this.activeOperations.forEach(controller => {
            controller.abort();
        });
    }

    // Cleanup de recursos
    async cleanup() {
        console.log('🧹 Executando cleanup do crawler...');
        
        // Abortar operações pendentes
        this.abort();
        
        // Limpar sets
        this.visitedUrls.clear();
        this.activeOperations.clear();
        
        // Aguardar um pouco para operações abortarem
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('✅ Cleanup concluído');
    }
}

module.exports = WebCrawler;