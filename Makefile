# Makefile para ROI Labs Chatbot Training
# Comandos de automação para desenvolvimento e deploy

# Variáveis
DOCKER_IMAGE_NAME = roi-chatbot-training
DOCKER_CONTAINER_NAME = roi-chatbot-training
DOCKER_COMPOSE = docker-compose
PORT = 3000

.PHONY: help install dev build start stop restart logs health clean deploy

# Comando padrão
help: ## Mostrar esta ajuda
	@echo "ROI Labs Chatbot Training - Comandos disponíveis:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Instalar dependências
	npm install

dev: ## Executar em modo desenvolvimento
	npm run dev

build: ## Build da imagem Docker
	$(DOCKER_COMPOSE) build --no-cache

start: ## Iniciar containers
	$(DOCKER_COMPOSE) up -d

stop: ## Parar containers
	$(DOCKER_COMPOSE) down

restart: ## Reiniciar containers
	$(DOCKER_COMPOSE) restart

logs: ## Ver logs dos containers
	$(DOCKER_COMPOSE) logs -f

health: ## Verificar saúde da aplicação
	@echo "Verificando saúde da aplicação..."
	@curl -f http://localhost:$(PORT)/api/health && echo "\n✅ Aplicação saudável!" || echo "\n❌ Aplicação com problemas!"

status: ## Status dos containers
	$(DOCKER_COMPOSE) ps

clean: ## Limpar containers e imagens não utilizados
	docker system prune -f
	docker volume prune -f

deploy: ## Deploy completo (build + start + health check)
	@echo "🚀 Iniciando deploy..."
	$(DOCKER_COMPOSE) down --remove-orphans
	$(DOCKER_COMPOSE) build --no-cache
	$(DOCKER_COMPOSE) up -d
	@echo "⏳ Aguardando aplicação inicializar..."
	@sleep 10
	@make health
	@echo "🎉 Deploy concluído!"

redeploy: ## Redeploy (para atualizações)
	@echo "🔄 Fazendo redeploy..."
	$(DOCKER_COMPOSE) down
	$(DOCKER_COMPOSE) up -d --build
	@sleep 10
	@make health

backup: ## Fazer backup dos logs
	@echo "📦 Fazendo backup dos logs..."
	@mkdir -p backups/$(shell date +%Y%m%d_%H%M%S)
	@cp -r logs backups/$(shell date +%Y%m%d_%H%M%S)/ 2>/dev/null || true
	@echo "✅ Backup concluído!"

shell: ## Acessar shell do container
	docker exec -it $(DOCKER_CONTAINER_NAME) /bin/sh

update: ## Atualizar dependências
	npm update
	$(DOCKER_COMPOSE) build --no-cache
	$(DOCKER_COMPOSE) up -d

# Comandos de desenvolvimento
dev-install: ## Setup completo para desenvolvimento
	npm install
	cp .env .env.production
	@echo "⚠️  Configure o arquivo .env.production antes do deploy!"

dev-reset: ## Reset completo do ambiente de desenvolvimento
	$(DOCKER_COMPOSE) down -v
	docker system prune -f
	npm install
	$(DOCKER_COMPOSE) up -d --build

# Comandos de produção
prod-deploy: ## Deploy para produção
	@echo "🏭 Deploy para produção..."
	@test -f .env.production || (echo "❌ .env.production não encontrado!" && exit 1)
	$(DOCKER_COMPOSE) -f docker-compose.yml up -d --build

prod-logs: ## Ver logs de produção
	$(DOCKER_COMPOSE) logs --tail=100 -f

prod-backup: ## Backup de produção
	@echo "💾 Backup de produção $(shell date)..."
	@mkdir -p backups/prod_$(shell date +%Y%m%d_%H%M%S)
	@cp -r logs backups/prod_$(shell date +%Y%m%d_%H%M%S)/ 2>/dev/null || true
	@cp .env.production backups/prod_$(shell date +%Y%m%d_%H%M%S)/
	@echo "✅ Backup de produção concluído!"

# Monitoramento
monitor: ## Monitorar uso de recursos
	@echo "📊 Monitorando recursos..."
	docker stats $(DOCKER_CONTAINER_NAME) --no-stream

watch-logs: ## Acompanhar logs em tempo real
	$(DOCKER_COMPOSE) logs -f --tail=50

test-endpoints: ## Testar todos os endpoints
	@echo "🧪 Testando endpoints..."
	@echo "Health Check:"
	@curl -s http://localhost:$(PORT)/api/health | python -m json.tool || echo "❌ Health check falhou"
	@echo "\nAPI Info:"
	@curl -s http://localhost:$(PORT)/api/info | python -m json.tool || echo "❌ API info falhou"
	@echo "\n✅ Testes concluídos!"
