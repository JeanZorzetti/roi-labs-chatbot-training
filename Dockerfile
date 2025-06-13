# Dockerfile otimizado para ROI Labs Chatbot Training - Easypanel Ready
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
    g++ \
    curl

# Configurar Puppeteer para usar Chromium instalado
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Copiar package files primeiro para cache layer
COPY package*.json ./

# Instalar dependências de produção
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Production image
FROM node:18-alpine AS production

# Metadata para Easypanel
LABEL maintainer="ROI Labs <contato@roilabs.com.br>"
LABEL description="Sistema de treinamento de chatbot por crawling de sites"
LABEL version="1.0.0"

# Instalar dependências do sistema necessárias
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    dumb-init \
    bash \
    curl \
    tzdata

# Configurar timezone
ENV TZ=America/Sao_Paulo

# Configurar Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

WORKDIR /app

# Copiar dependências do stage de build
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copiar código da aplicação
COPY --chown=nextjs:nodejs . .

# Criar diretórios necessários
RUN mkdir -p /app/logs && \
    chown -R nextjs:nodejs /app/logs

# Configurar variáveis de ambiente para Easypanel
ENV NODE_ENV=production \
    PORT=3001 \
    HOST=0.0.0.0 \
    DOCKER_ENV=true

# Expor porta
EXPOSE 3001

# Health check otimizado para Easypanel
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node healthcheck.js || exit 1

# Trocar para usuário não-root
USER nextjs

# Comando para iniciar a aplicação
CMD ["node", "server.js"]