# Dockerfile otimizado para ROI Labs Chatbot Training - Easypanel Ready
FROM node:18-alpine

# Metadata para Easypanel
LABEL maintainer="ROI Labs <contato@roilabs.com.br>"
LABEL description="Sistema de treinamento de chatbot por crawling de sites"
LABEL version="1.0.0"

# Instalar dependências do sistema
RUN apk add --no-cache \
    curl \
    bash \
    tzdata

# Configurar timezone
ENV TZ=America/Sao_Paulo

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Copiar código da aplicação
COPY . .

# Configurar variáveis de ambiente - PORTA 80
ENV NODE_ENV=production \
    PORT=80 \
    HOST=0.0.0.0

# Expor porta 80
EXPOSE 80

# Health check na porta 80
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# Comando para iniciar a aplicação
CMD ["node", "server.js"]
