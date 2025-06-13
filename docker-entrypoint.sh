#!/bin/bash

# Script de inicialização para criar .env se não existir
echo "🔧 Verificando configuração do ambiente..."

# Verificar se já existe .env válido
if [ -f "/app/.env" ] && [ -s "/app/.env" ]; then
    echo "✅ Arquivo .env já existe e não está vazio"
else
    echo "🔧 Criando arquivo .env com variáveis de ambiente..."
    
    # Criar .env usando variáveis de ambiente do container
    {
        echo "# Variáveis de ambiente para produção"
        echo "NODE_ENV=${NODE_ENV:-production}"
        echo "PORT=${PORT:-3001}"
        echo "HOST=${HOST:-0.0.0.0}"
        echo ""
        echo "# Database - Supabase"
        echo "SUPABASE_URL=${SUPABASE_URL}"
        echo "SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}"
        echo "SUPABASE_DB_URL=${SUPABASE_DB_URL}"
        echo ""
        echo "# OpenAI API"
        echo "OPENAI_API_KEY=${OPENAI_API_KEY}"
        echo ""
        echo "# Security and CORS"
        echo "ALLOWED_ORIGINS=${ALLOWED_ORIGINS}"
        echo ""
        echo "# Rate Limiting"
        echo "RATE_LIMIT_WINDOW_MS=900000"
        echo "RATE_LIMIT_MAX_REQUESTS=1000"
        echo ""
        echo "# Log Configuration"
        echo "LOG_LEVEL=info"
        echo ""
        echo "# Docker specific"
        echo "DOCKER_ENV=true"
    } > /app/.env
    
    if [ $? -eq 0 ]; then
        echo "✅ Arquivo .env criado com sucesso!"
    else
        echo "⚠️ Falha ao criar .env, usando variáveis de ambiente do sistema"
    fi
fi

echo "🚀 Iniciando aplicação..."
exec "$@"