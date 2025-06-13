# Dockerfile otimizado para ROI Labs Chatbot Training
# Multi-stage build para reduzir tamanho da imagem

# Stage 1: Build dependencies
FROM node:18-alpine AS builder

# Instalar dependências do sistema para Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    python3 \
    make \
    g++

# Configurar Puppeteer para usar Chromium instalado
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Production image
FROM node:18-alpine AS production

# Instalar dependências do sistema necessárias
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    dumb-init \
    bash

# Configurar Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Copiar dependências do stage de build
COPY --from=builder /app/node_modules ./node_modules

# Copiar código da aplicação
COPY . .

# Copiar e dar permissão ao script de entrada
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Criar diretório para logs
RUN mkdir -p /app/logs

# Configurar variáveis de ambiente
ENV NODE_ENV=production \
    PORT=3001 \
    HOST=0.0.0.0

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

# Usar script de entrada personalizado
ENTRYPOINT ["dumb-init", "--", "./docker-entrypoint.sh"]

# Comando para iniciar a aplicação
CMD ["node", "server.js"]