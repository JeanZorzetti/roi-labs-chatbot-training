# ROI Labs Chatbot Training - Deploy VPS com Docker

![Status](https://img.shields.io/badge/status-ready%20for%20vps-green)
![Docker](https://img.shields.io/badge/docker-ready-blue)
![Node.js](https://img.shields.io/badge/node.js-18-brightgreen)

Sistema de treinamento de chatbot otimizado para deploy em VPS com Docker e Easypanel.

## 🚀 Deploy Rápido

### Opção 1: Script Automatizado (Recomendado)

**Linux/Mac:**
```bash
chmod +x deploy-vps.sh
./deploy-vps.sh
```

**Windows:**
```cmd
deploy-vps.bat
```

### Opção 2: Docker Compose Manual

```bash
# 1. Configurar ambiente
cp .env .env.production
# Edite .env.production com suas configurações

# 2. Build e iniciar
docker-compose up -d --build

# 3. Verificar saúde
curl http://localhost:3000/api/health
```

### Opção 3: Easypanel

1. Acesse seu painel Easypanel
2. Crie nova aplicação
3. Configure repositório Git ou faça upload dos arquivos
4. Use a configuração do arquivo `easypanel.yml` (veja os artefatos)
5. Configure as variáveis de ambiente
6. Deploy!

## 🔧 Configuração do Ambiente

### Variáveis de Ambiente (.env.production)

```env
# App Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database - Supabase
SUPABASE_URL=sua_url_supabase
SUPABASE_ANON_KEY=sua_chave_supabase
SUPABASE_DB_URL=sua_url_database

# OpenAI API
OPENAI_API_KEY=sua_chave_openai

# Security
ALLOWED_ORIGINS=https://seudominio.com,https://www.seudominio.com

# Docker specific
DOCKER_ENV=true
```

## 📋 Pré-requisitos

- [ ] ✅ VPS com Docker instalado
- [ ] ✅ Docker Compose instalado
- [ ] ✅ Portas 80, 443 e 3000 liberadas no firewall
- [ ] ✅ Domínio apontando para o IP da VPS (opcional)
- [ ] ✅ Credenciais do Supabase e OpenAI

## 🐳 Arquitetura Docker

### Containers

- **roi-chatbot**: Aplicação Node.js principal
- **nginx**: Proxy reverso com SSL (opcional)

### Recursos Configurados

- **CPU**: 0.5-1.0 cores
- **Memory**: 512MB-1GB
- **Storage**: Logs persistentes
- **Health Check**: Monitoramento automático

### Portas Expostas

- **3000**: Aplicação Node.js
- **80**: HTTP (Nginx)
- **443**: HTTPS (Nginx com SSL)

## 🔍 Endpoints Disponíveis

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/` | GET | Dashboard web |
| `/api/health` | GET | Status da aplicação |
| `/api/info` | GET | Informações da API |
| `/api/test-auth` | GET | Teste de autenticação |
| `/api/crawling/start` | POST | Iniciar crawling |
| `/api/crawling/status` | GET | Status do crawling |
| `/api/search` | POST | Buscar no conhecimento |

## 🧪 Testando a Aplicação

### Health Check
```bash
curl http://localhost:3000/api/health
```

**Resposta esperada:**
```json
{
  "status": "healthy",
  "message": "ROI Labs Chatbot Training API",
  "database": "connected",
  "environment": "production"
}
```

### Teste de Autenticação
```bash
curl -H "X-API-Key: sua_api_key" http://localhost:3000/api/test-auth
```

### Informações da API
```bash
curl http://localhost:3000/api/info
```

## 🔧 Comandos Úteis

### Docker Compose

```bash
# Ver status dos containers
docker-compose ps

# Ver logs em tempo real
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs roi-chatbot

# Reiniciar aplicação
docker-compose restart roi-chatbot

# Parar todos os containers
docker-compose down

# Rebuild e reiniciar
docker-compose up -d --build
```

### Docker

```bash
# Ver containers rodando
docker ps

# Acessar container da aplicação
docker exec -it roi-chatbot-training /bin/sh

# Ver logs do container
docker logs roi-chatbot-training

# Ver uso de recursos
docker stats
```

## 🚨 Resolução de Problemas

### Container não inicia

```bash
# Verificar logs
docker-compose logs roi-chatbot

# Verificar se portas estão livres
netstat -tlnp | grep :3000

# Rebuild forçado
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Erro de conexão com banco

1. Verificar variáveis no `.env.production`
2. Testar conexão manualmente:
```bash
curl http://localhost:3000/api/health
```

### Erro "Permission denied"

```bash
# Linux/Mac
chmod +x deploy-vps.sh

# Se persistir, verificar SELinux
sudo setsebool -P container_manage_cgroup on
```

### Container consome muita memória

```bash
# Verificar uso atual
docker stats roi-chatbot-training

# Ajustar limites no docker-compose.yml
deploy:
  resources:
    limits:
      memory: 512M
```

## 🔒 Configuração SSL/HTTPS

### Com Nginx (incluído)

1. Coloque seus certificados na pasta `ssl/`:
   - `ssl/cert.pem`
   - `ssl/key.pem`

2. Descomente as linhas HTTPS no `nginx.conf`

3. Reinicie:
```bash
docker-compose restart nginx
```

### Com Easypanel

O Easypanel gerencia SSL automaticamente via Let's Encrypt.

## 📊 Monitoramento

### Health Checks Automáticos

O Docker verifica a saúde da aplicação a cada 30 segundos:
```bash
# Ver status do health check
docker inspect roi-chatbot-training | grep -A 10 Health
```

### Logs Estruturados

```bash
# Logs com timestamp
docker-compose logs --timestamps roi-chatbot

# Últimas 100 linhas
docker-compose logs --tail=100 roi-chatbot

# Filtrar por nível
docker-compose logs roi-chatbot | grep ERROR
```

### Métricas de Sistema

```bash
# Uso de CPU e memória
docker stats --no-stream

# Espaço em disco
df -h

# Processos do Docker
docker system df
```

## 🔄 Atualizações

### Atualizar código

```bash
# Se usando Git
git pull origin main

# Rebuild e redeploy
docker-compose down
docker-compose up -d --build
```

### Atualizar dependências

```bash
# No host
npm update

# Rebuild imagem
docker-compose build --no-cache roi-chatbot
docker-compose up -d
```

## 🏗️ Arquivos de Configuração

### Principais arquivos criados:

- `Dockerfile` - Configuração da imagem Docker
- `docker-compose.yml` - Orquestração dos containers
- `.dockerignore` - Arquivos ignorados no build
- `nginx.conf` - Configuração do Nginx
- `healthcheck.js` - Script de verificação de saúde
- `.env.production` - Variáveis de ambiente para produção
- `deploy-vps.sh` / `deploy-vps.bat` - Scripts de deploy automatizado

## 🎯 Próximos Passos

1. **Configure seu domínio** para apontar para a VPS
2. **Configure SSL** para HTTPS
3. **Configure backup** do banco de dados
4. **Configure monitoramento** (ex: Grafana, Prometheus)
5. **Configure CI/CD** para deploys automáticos

## 📞 Suporte

- **Email:** contato@roilabs.com.br
- **Documentação:** [README.md](./README.md)
- **GitHub:** https://github.com/roi-labs/chatbot-training

## 📄 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

**ROI Labs** - Transformando ideias em soluções inteligentes 🤖🐳
