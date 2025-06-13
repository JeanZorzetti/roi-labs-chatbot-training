const puppeteer = require('puppeteer');
const axios = require('axios');
const { URL } = require('url');

class WebCrawler {
    constructor(options = {}) {
        this.maxPages = options.maxPages || 50;
        this.maxDepth = options.maxDepth || 3;
        this.delay = options.delay || 2000;
        this.visitedUrls = new Set();
        this.crawledData = [];
        this.excludePatterns = options.excludePatterns || [
            /\.(jpg|jpeg|png|gif|pdf|doc|docx|zip|mp4|mp3)$/i,
            /\/admin/,
            /\/login/,
            /\/wp-admin/,
            /\/feed/
        ];
    }

    async crawlWebsite(baseUrl, onProgress = null) {
        console.log(`🚀 Iniciando crawling: ${baseUrl}`);
        
        try {
            const browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-web-security'
                ]
            });

            await this.crawlPage(baseUrl, browser, 0, onProgress);
            await browser.close();

            console.log(`✅ Crawling concluído! ${this.crawledData.length} páginas processadas`);
            
            return {
                domain: new URL(baseUrl).hostname,
                baseUrl,
                totalPages: this.crawledData.length,
                pages: this.crawledData,
                crawledAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Erro no crawling:', error);
            throw error;
        }
    }

    async crawlPage(url, browser, depth, onProgress) {
        // Verificar limites
        if (depth > this.maxDepth || 
            this.visitedUrls.has(url) || 
            this.crawledData.length >= this.maxPages) {
            return;
        }

        // Verificar se deve pular esta URL
        if (this.shouldSkipUrl(url)) {
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

        try {
            const page = await browser.newPage();
            
            // Configurar página
            await page.setUserAgent('ROI Labs Chatbot Crawler 1.0');
            await page.setViewport({ width: 1280, height: 720 });
            
            // Ir para a página
            await page.goto(url, { 
                waitUntil: 'networkidle2', 
                timeout: 30000 
            });

            // Extrair dados da página
            const pageData = await this.extractPageContent(page, url);
            
            if (pageData.content && pageData.content.trim().length > 50) {
                this.crawledData.push(pageData);
                console.log(`✅ Extraído: ${pageData.title || 'Sem título'} (${pageData.wordCount} palavras)`);
            }

            // Encontrar links internos
            const internalLinks = await this.findInternalLinks(page, url);
            
            await page.close();
            
            // Delay entre requests
            await this.sleep(this.delay);

            // Processar links encontrados recursivamente
            for (const link of internalLinks.slice(0, 10)) { // Limitar para evitar explosão
                await this.crawlPage(link, browser, depth + 1, onProgress);
            }

        } catch (error) {
            console.error(`❌ Erro ao processar ${url}:`, error.message);
        }
    }

    async extractPageContent(page, url) {
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
                'section', '.container', 'body'
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
                .filter(h => h.text && h.text.length > 3);

            return {
                title: title.trim(),
                description: description.trim(),
                keywords: keywords.trim(),
                content: mainContent.trim(),
                headings: headings
            };
        });

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
    }

    async findInternalLinks(page, currentUrl) {
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
                .filter(href => href !== null);
        }, baseUrl, baseDomain);

        // Remover duplicatas e URLs já visitadas
        return [...new Set(links)].filter(link => !this.visitedUrls.has(link));
    }

    cleanContent(content) {
        return content
            .replace(/\s+/g, ' ') // Normalizar espaços
            .replace(/\n+/g, '\n') // Normalizar quebras de linha
            .replace(/[^\w\s\-.,!?;:()\[\]]/g, '') // Remover caracteres especiais
            .trim();
    }

    shouldSkipUrl(url) {
        return this.excludePatterns.some(pattern => pattern.test(url));
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Dividir conteúdo em chunks para embeddings
    splitContentIntoChunks(content, maxLength = 500) {
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
}

module.exports = WebCrawler;