#!/bin/bash

# Script de deploy para VPS com Docker
# Execute: chmod +x deploy-vps.sh && ./deploy-vps.sh

set -e

echo "🚀 Iniciando deploy do ROI Labs Chatbot Training na VPS..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Verificar se está na pasta correta
if [[ ! -f "package.json" ]]; then
    error "Execute este script na pasta raiz do projeto!"
fi

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    error "Docker não está rodando!"
fi

# Verificar se docker-compose está disponível
if ! command -v docker-compose &> /dev/null; then
    if ! docker compose version &> /dev/null; then
        error "Docker Compose não encontrado!"
    else
        DOCKER_COMPOSE="docker compose"
    fi
else
    DOCKER_COMPOSE="docker-compose"
fi

log "Docker Compose encontrado: $DOCKER_COMPOSE"

# Parar containers existentes
log "Parando containers existentes..."
$DOCKER_COMPOSE down --remove-orphans || true

# Criar diretórios necessários
log "Criando diretórios necessários..."
mkdir -p logs/nginx
mkdir -p ssl

# Verificar se .env.production existe
if [[ ! -f ".env.production" ]]; then
    warn "Arquivo .env.production não encontrado!"
    echo "Criando arquivo de exemplo..."
    cp .env .env.production || error "Falha ao criar .env.production"
    warn "Configure as variáveis em .env.production antes do deploy!"
fi

# Build da imagem
log "Fazendo build da imagem Docker..."
$DOCKER_COMPOSE build --no-cache

# Verificar se o build foi bem-sucedido
if [[ $? -ne 0 ]]; then
    error "Falha no build da imagem Docker!"
fi

# Iniciar containers
log "Iniciando containers..."
$DOCKER_COMPOSE up -d

# Aguardar que a aplicação esteja pronta
log "Aguardando aplicação inicializar..."
sleep 10

# Verificar se a aplicação está rodando
MAX_ATTEMPTS=30
ATTEMPT=1

while [[ $ATTEMPT -le $MAX_ATTEMPTS ]]; do
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        log "✅ Aplicação está respondendo!"
        break
    fi
    
    if [[ $ATTEMPT -eq $MAX_ATTEMPTS ]]; then
        error "Aplicação não respondeu após $MAX_ATTEMPTS tentativas"
    fi
    
    echo "Tentativa $ATTEMPT/$MAX_ATTEMPTS..."
    sleep 2
    ((ATTEMPT++))
done

# Mostrar status dos containers
log "Status dos containers:"
$DOCKER_COMPOSE ps

# Mostrar logs recentes
log "Logs recentes da aplicação:"
$DOCKER_COMPOSE logs --tail=20 roi-chatbot

# Informações finais
echo ""
echo "🎉 Deploy concluído com sucesso!"
echo ""
echo "📍 URLs disponíveis:"
echo "   • Health Check: http://localhost:3000/api/health"
echo "   • API Info: http://localhost:3000/api/info"
echo "   • Dashboard: http://localhost:3000"
echo ""
echo "🔧 Comandos úteis:"
echo "   • Ver logs: $DOCKER_COMPOSE logs -f"
echo "   • Parar: $DOCKER_COMPOSE down"
echo "   • Reiniciar: $DOCKER_COMPOSE restart"
echo "   • Status: $DOCKER_COMPOSE ps"
echo ""
echo "📊 Para monitorar:"
echo "   • curl http://localhost:3000/api/health"
echo "   • $DOCKER_COMPOSE logs roi-chatbot"
echo ""
