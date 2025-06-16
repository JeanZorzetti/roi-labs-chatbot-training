# 🏥 Health Check Configuration

Este documento explica a configuração de health check do ROI Labs Chatbot Training, que foi otimizada para eliminar dependências externas e fornecer diagnósticos detalhados.

## 🎯 **Problemas Resolvidos**

### **Antes (Problemas)**
- ❌ Dockerfile usava `curl` (não instalado no container Alpine)
- ❌ Duas configurações conflitantes (Dockerfile vs docker-compose.yml)
- ❌ Dependência externa desnecessária
- ❌ Timeouts muito agressivos

### **Agora (Solução)**
- ✅ Usa apenas Node.js nativo (sem dependências externas)
- ✅ Configuração única no docker-compose.yml
- ✅ Health check detalhado com diagnósticos
- ✅ Timeouts apropriados para containers

## 🔧 **Configuração Atual**

### **docker-compose.yml**
```yaml
healthcheck:
  test: ["CMD", "node", "/app/healthcheck.js"]
  interval: 30s
  timeout: 15s
  retries: 3
  start_period: 45s
```

### **npm Scripts**
```bash
# Health check principal (usa healthcheck.js)
npm run health

# Health check em produção com porta dinâmica
npm run health:prod

# Fallback usando curl (se disponível)
npm run health:curl
```

## 📊 **Output do Health Check**

O script `healthcheck.js` fornece informações detalhadas:

```
🚀 ROI Labs Health Check v1.0.3
🐳 Environment: production
📊 Process PID: 1
🏥 Starting health check...
📍 Target: http://localhost:3001/api/health
⏱️  Timeout: 8000ms
📁 Source directory: ✅ OK
📁 Public directory: ✅ OK
📁 Package.json: ✅ OK
🎨 Dashboard build: ✅ Available
✅ Health check completed in 156ms
📊 API Status: healthy
📈 Uptime: 42s
💾 Memory: 145 MB
🎨 Dashboard: ✅ Available (React (Modern))
✅ Health check PASSED - Service is healthy!
```

## 🐳 **Docker Integration**

### **Container Health Status**
```bash
# Verificar status do health check
docker-compose ps

# Ver logs do health check
docker-compose logs roi-chatbot | grep -i health

# Testar health check manualmente
docker-compose exec roi-chatbot node healthcheck.js
```

### **Health Check Timeline**
- **0-45s**: `start_period` - Container iniciando, falhas são ignoradas
- **45s+**: Health checks ativos a cada 30s
- **Timeout**: 15s por tentativa
- **Retries**: 3 tentativas antes de marcar como unhealthy

## ⚡ **Troubleshooting**

### **Common Issues**

1. **"Connection refused"**
   ```
   ❌ Connection refused to localhost:3001 - service may not be ready
   ```
   - **Causa**: Aplicação ainda não iniciou completamente
   - **Solução**: Aguardar o `start_period` (45s)

2. **"Health check timeout"**
   ```
   ❌ Request timeout after 8000ms
   ```
   - **Causa**: Aplicação sobrecarregada ou travada
   - **Solução**: Verificar logs da aplicação

3. **"Parse error"**
   ```
   ❌ Parse error: Unexpected token '<'
   ```
   - **Causa**: API retornando HTML em vez de JSON
   - **Solução**: Verificar se endpoint `/api/health` está funcionando

### **Debug Commands**

```bash
# Testar health check localmente
npm run health

# Testar dentro do container
docker-compose exec roi-chatbot node healthcheck.js

# Verificar endpoint diretamente
curl http://localhost:3001/api/health

# Ver logs detalhados
docker-compose logs -f roi-chatbot
```

## 📈 **Monitoring Integration**

### **Docker Swarm**
```yaml
healthcheck:
  test: ["CMD", "node", "/app/healthcheck.js"]
  interval: 30s
  timeout: 15s
  retries: 3
  start_period: 45s
```

### **Kubernetes**
```yaml
livenessProbe:
  exec:
    command:
    - node
    - /app/healthcheck.js
  initialDelaySeconds: 45
  periodSeconds: 30
  timeoutSeconds: 15
  failureThreshold: 3
```

## 🔄 **Nginx Integration**

O nginx aguarda o health check do backend:

```yaml
depends_on:
  roi-chatbot:
    condition: service_healthy
```

## 📋 **Best Practices**

1. **Sempre usar healthcheck.js** em vez de curl
2. **Aguardar start_period** antes de reportar problemas
3. **Verificar logs** quando health checks falham
4. **Testar localmente** antes de fazer deploy
5. **Usar timeouts apropriados** para seu ambiente

## 🚀 **Deployment**

```bash
# Deploy com health check
docker-compose up -d --build

# Aguardar service ficar healthy
docker-compose ps

# Verificar se está funcionando
npm run health
```

---

**Status**: ✅ Health check otimizado e funcionando
**Dependências**: ❌ Nenhuma (apenas Node.js nativo)
**Compatibilidade**: ✅ Docker, Docker Compose, Kubernetes
