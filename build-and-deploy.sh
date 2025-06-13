#!/bin/bash

# Script de build e deploy para Easypanel
# ROI Labs Chatbot Training

set -e

echo "🚀 ROI Labs Chatbot Training - Build & Deploy Script"
echo "=================================================="

# Configurações
IMAGE_NAME="jeanzvh/roi-chatbot-training"
VERSION=$(date +%Y%m%d-%H%M%S)
LATEST_TAG="latest"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    error "Docker não está instalado!"
    exit 1
fi

# Verificar se está logado no Docker Hub
if ! docker info | grep -q "Username"; then
    warn "Não está logado no Docker Hub. Execute: docker login"
fi

log "Iniciando build da imagem Docker..."

# Build da imagem
log "Building image: $IMAGE_NAME:$VERSION"
docker build \
    --platform linux/amd64 \
    --tag "$IMAGE_NAME:$VERSION" \
    --tag "$IMAGE_NAME:$LATEST_TAG" \
    --label "version=$VERSION" \
    --label "build-date=$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
    --label "maintainer=ROI Labs <contato@roilabs.com.br>" \
    .

if [ $? -eq 0 ]; then
    log "✅ Build concluído com sucesso!"
else
    error "❌ Falha no build da imagem"
    exit 1
fi

# Testar a imagem localmente
log "Testando a imagem localmente..."
CONTAINER_ID=$(docker run -d \
    -p 3001:3001 \
    -e NODE_ENV=production \
    -e PORT=3001 \
    -e HOST=0.0.0.0 \
    "$IMAGE_NAME:$LATEST_TAG")

# Aguardar container inicializar
sleep 10

# Testar health check
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    log "✅ Health check passou!"
else
    error "❌ Health check falhou!"
    docker logs $CONTAINER_ID
    docker stop $CONTAINER_ID
    docker rm $CONTAINER_ID
    exit 1
fi

# Parar container de teste
docker stop $CONTAINER_ID > /dev/null
docker rm $CONTAINER_ID > /dev/null

# Push para Docker Hub (opcional)
read -p "Fazer push para Docker Hub? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "Fazendo push para Docker Hub..."
    
    docker push "$IMAGE_NAME:$VERSION"
    docker push "$IMAGE_NAME:$LATEST_TAG"
    
    if [ $? -eq 0 ]; then
        log "✅ Push concluído com sucesso!"
        log "🐳 Imagem disponível em: $IMAGE_NAME:$LATEST_TAG"
    else
        error "❌ Falha no push"
        exit 1
    fi
fi

# Gerar configuração para Easypanel
log "Gerando configuração para Easypanel..."

cat > easypanel-deploy.json << EOF
{
  "name": "roi-labs-chatbot-training",
  "image": "$IMAGE_NAME:$LATEST_TAG",
  "port": 3001,
  "env": {
    "NODE_ENV": "production",
    "PORT": "3001",
    "HOST": "0.0.0.0",
    "DOCKER_ENV": "true"
  },
  "healthCheck": {
    "path": "/api/health",
    "port": 3001,
    "initialDelaySeconds": 40,
    "periodSeconds": 30
  },
  "resources": {
    "limits": {
      "memory": "1Gi",
      "cpu": "1000m"
    },
    "requests": {
      "memory": "512Mi",
      "cpu": "500m"
    }
  },
  "volumes": [
    {
      "name": "logs",
      "mountPath": "/app/logs",
      "size": "1Gi"
    }
  ]
}
EOF

log "✅ Configuração salva em: easypanel-deploy.json"

# Mostrar próximos passos
echo ""
echo "🎉 Build concluído com sucesso!"
echo ""
echo -e "${BLUE}Próximos passos:${NC}"
echo "1. 📋 Configure as variáveis de ambiente no Easypanel:"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_ANON_KEY" 
echo "   - OPENAI_API_KEY (opcional)"
echo ""
echo "2. 🚀 No Easypanel:"
echo "   - Use a imagem: $IMAGE_NAME:$LATEST_TAG"
echo "   - Ou importe: easypanel-deploy.json"
echo ""
echo "3. 🗃️ Configure o banco de dados Supabase"
echo "   - Execute o script SQL fornecido"
echo ""
echo "4. ✅ Teste o deploy:"
echo "   - Health: https://seudominio.com/api/health"
echo "   - Dashboard: https://seudominio.com"
echo ""

# Cleanup (opcional)
read -p "Limpar imagens locais antigas? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "Limpando imagens antigas..."
    docker image prune -f
    log "✅ Limpeza concluída!"
fi

log "🚀 Deploy ready! Imagem: $IMAGE_NAME:$LATEST_TAG"