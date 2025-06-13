#!/bin/bash

# Script de inicialização para criar .env se não existir
echo "🔧 Verificando configuração do ambiente..."

# Criar .env se não existir
if [ ! -f "/app/.env" ]; then
    echo "🔧 Criando arquivo .env..."
    cat > /app/.env << EOF
# Variáveis de ambiente para produção
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Database - Supabase
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_DB_URL=${SUPABASE_DB_URL}

# OpenAI API
OPENAI_API_KEY=${OPENAI_API_KEY}

# Security and CORS
ALLOWED_ORIGINS=${ALLOWED_ORIGINS}

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Log Configuration
LOG_LEVEL=info

# Docker specific
DOCKER_ENV=true
EOF
    echo "✅ Arquivo .env criado!"
else
    echo "✅ Arquivo .env já existe"
fi

# Iniciar aplicação
echo "🚀 Iniciando aplicação..."
exec "$@"
