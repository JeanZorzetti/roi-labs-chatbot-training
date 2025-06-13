# ROI Labs Chatbot Training

![Status](https://img.shields.io/badge/status-ready%20for%20production-green)
![Docker](https://img.shields.io/badge/docker-ready-blue)
![Node.js](https://img.shields.io/badge/node.js-18-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

Sistema de treinamento de chatbot por crawling de sites, otimizado para VPS com Docker e Easypanel.

## 🚀 Deploy Rápido

### Opção 1: Script Automatizado (Recomendado)

**Windows:**
```cmd
deploy-vps.bat
```

**Linux/Mac:**
```bash
chmod +x deploy-vps.sh
./deploy-vps.sh
```

### Opção 2: Makefile

```bash
# Setup inicial
make dev-install

# Deploy completo
make deploy

# Monitorar
make logs
```

### Opção 3: Easypanel

1. Acesse seu painel Easypanel
2. Crie nova aplicação
3. Configure repositório Git ou faça upload dos arquivos
4. Configure as variáveis de ambiente
5. Deploy!

## 🔧 Configuração Rápida

1. **Configure as variáveis de ambiente:**
```bash
cp .env .env.production
# Edite .env.production com suas configurações
```

2. **Execute o deploy:**
```bash
./deploy-vps.sh
```

3. **Teste a aplicação:**
```bash
curl http://localhost:3000/api/health
```

## 🐳 Arquitetura Docker

- **Node.js 18 Alpine** - Aplicação principal
- **Nginx** - Proxy reverso com SSL
- **Multi-stage build** - Imagem otimizada
- **Health checks** - Monitoramento automático
- **Resource limits** - Performance garantida

## 🔍 Endpoints da API

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/health` | GET | Status da aplicação |
| `/api/info` | GET | Informações da API |
| `/api/test-auth` | GET | Teste de autenticação |
| `/api/crawling/start` | POST | Iniciar crawling |
| `/api/crawling/status` | GET | Status do crawling |
| `/api/search` | POST | Buscar no conhecimento |

## 🛠️ Comandos Úteis

```bash
# Ver logs
docker-compose logs -f

# Status dos containers
docker-compose ps

# Reiniciar aplicação
docker-compose restart

# Parar aplicação
docker-compose down

# Rebuild completo
docker-compose up -d --build
```

## 📊 Monitoramento

### Health Check Automático
```bash
curl http://localhost:3000/api/health
```

### Logs Estruturados
```bash
# Logs em tempo real
make watch-logs

# Últimas 100 linhas
docker-compose logs --tail=100
```

### Métricas de Recursos
```bash
# Uso de CPU e memória
make monitor

# Status geral
make status
```

## 🔒 Segurança Implementada

- Headers de segurança (Helmet)
- Rate limiting (100 req/min)
- CORS configurado para produção
- SSL/HTTPS pronto
- Usuário não-root no container
- Logs de auditoria

## ⚡ Performance Otimizada

- Multi-stage Docker build
- Compressão gzip
- Cache de arquivos estáticos
- Resource limits configurados
- Health checks eficientes

## 🧪 Testando a Aplicação

```bash
# Teste completo dos endpoints
make test-endpoints

# Verificar saúde
make health

# Dashboard web
# Abra: http://localhost:3000
```

## 🚨 Resolução de Problemas

### Container não inicia
```bash
docker-compose logs roi-chatbot
docker-compose down
docker-compose up -d --build
```

### Aplicação não responde
```bash
# Verificar se porta está livre
netstat -tlnp | grep :3000

# Restart forçado
make restart
```

### Erro de permissão
```bash
# Linux/Mac
chmod +x deploy-vps.sh
```

## 🔄 Atualizações

```bash
# Atualizar código
git pull origin main
make redeploy

# Atualizar dependências
make update
```

## 📦 Estrutura do Projeto

```
roi-labs-chatbot-training/
├── src/                    # Código da aplicação
├── public/                 # Arquivos estáticos
├── logs/                   # Logs persistentes
├── ssl/                    # Certificados SSL
├── Dockerfile              # Imagem Docker
├── docker-compose.yml      # Orquestração
├── nginx.conf             # Configuração Nginx
├── healthcheck.js         # Script de saúde
├── Makefile              # Automação
├── deploy-vps.sh         # Script de deploy
└── .env.production       # Variáveis de produção
```

## 🎯 Próximos Passos

1. **Configure seu domínio** para apontar para a VPS
2. **Configure SSL** (automático no Easypanel)
3. **Configure backup** do banco de dados
4. **Configure monitoramento** avançado
5. **Configure CI/CD** para deploys automáticos

## 📚 Documentação Adicional

- [VPS-README.md](./VPS-README.md) - Guia completo de deploy
- [Makefile](./Makefile) - Todos os comandos disponíveis
- [docker-compose.yml](./docker-compose.yml) - Configuração dos containers

## 📞 Suporte

- **Email:** contato@roilabs.com.br
- **Health Check:** `http://seudominio.com/api/health`
- **GitHub Issues:** Para reportar problemas

## 📄 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

**ROI Labs** - Transformando ideias em soluções inteligentes 🤖🐳

**Versão otimizada para VPS/Docker - Deploy em minutos!**
"# ROI Labs Chatbot Training - Build Ready" 
