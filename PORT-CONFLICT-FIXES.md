# 🔧 Port Conflict Resolution - Fixed

Este documento detalha as correções realizadas para resolver os **conflitos críticos de porta** no projeto ROI Labs Chatbot Training.

## 🚨 **Problemas Identificados e Corrigidos**

### **1. Conflito Frontend → Backend** ✅ **RESOLVIDO**

**Arquivo:** `frontend/vite.config.ts`

**❌ Problema:**
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3000',  // ❌ ERRO: Backend roda na 3001!
    changeOrigin: true,
  },
}
```

**✅ Solução:**
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3001',  // ✅ CORRIGIDO: Backend roda na porta 3001
    changeOrigin: true,
    secure: false,
    ws: true, // WebSocket support
  },
}
```

**Melhorias adicionais:**
- ✅ Adicionado suporte a WebSocket (`ws: true`)
- ✅ Configuração `secure: false` para HTTPS em desenvolvimento
- ✅ Alinhamento total com configuração do backend

---

### **2. Conflito Nginx → Backend** ✅ **RESOLVIDO**

**Arquivo:** `nginx.conf`

**❌ Problema:**
```nginx
upstream nodejs_backend {
    server roi-chatbot:3000;  # ❌ ERRO: Backend roda na 3001!
    keepalive 32;
}
```

**✅ Solução:**
```nginx
upstream nodejs_backend {
    server roi-chatbot:3001;  # ✅ CORRIGIDO: Backend roda na porta 3001
    keepalive 32;
}
```

**Melhorias adicionais:**
- ✅ Configurações de timeout otimizadas por endpoint
- ✅ Health check específico com timeout menor
- ✅ Endpoint de status do nginx (`/nginx-status`)
- ✅ Cache otimizado para assets estáticos

---

### **3. Health Check Nginx Melhorado** ✅ **RESOLVIDO**

**Arquivo:** `docker-compose.yml`

**❌ Problema:**
```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/api/health", "||", "exit", "1"]
```
*`wget` não disponível no nginx:alpine*

**✅ Solução:**
```yaml
healthcheck:
  test: ["CMD", "sh", "-c", "nc -z localhost 80 || exit 1"]
```
*Usa `netcat` que está disponível no container*

## 🎯 **Resultado Final: Porta 3001 Padronizada**

### **Configuração Consistente em Todos os Arquivos:**

| Arquivo | Configuração | Status |
|---------|-------------|--------|
| `Dockerfile` | `ENV PORT=3001` + `EXPOSE 3001` | ✅ Correto |
| `docker-compose.yml` | `PORT=3001` + `"3001:3001"` | ✅ Correto |
| `package.json` | Scripts usam `:3001` | ✅ Correto |
| `frontend/vite.config.ts` | `target: 'localhost:3001'` | ✅ **CORRIGIDO** |
| `nginx.conf` | `server roi-chatbot:3001` | ✅ **CORRIGIDO** |
| `.env.production` | `PORT=3001` | ✅ Correto |
| `healthcheck.js` | `PORT=3001` | ✅ Correto |

## 🚀 **Como Testar as Correções**

### **1. Teste Local (Desenvolvimento)**
```bash
# Terminal 1 - Backend
npm run dev
# Deve mostrar: "Servidor: http://0.0.0.0:3001"

# Terminal 2 - Frontend
cd frontend
npm run dev
# Deve mostrar: "Local: http://localhost:5173"
# Proxy deve funcionar: http://localhost:5173/api/health
```

### **2. Teste Docker (Produção)**
```bash
# Build e start completo
docker-compose up -d --build

# Verificar se tudo está rodando
docker-compose ps

# Testar endpoints
curl http://localhost:3001/api/health  # Backend direto
curl http://localhost:80/api/health    # Através do nginx

# Verificar logs
docker-compose logs roi-chatbot
docker-compose logs nginx
```

### **3. Teste Health Checks**
```bash
# Health check do backend
npm run health

# Status dos containers
docker-compose ps

# Logs de health check
docker-compose logs | grep -i health
```

## ⚡ **Timeouts Otimizados por Endpoint**

### **Nginx Timeouts:**
- **Health Check**: 10s (rápido para monitoramento)
- **API Endpoints**: 90s (permite operações longas como crawling)
- **Assets Estáticos**: Cache de 1 dia
- **Conexão Geral**: 60s

### **Health Check Intervals:**
- **Backend**: A cada 30s (timeout 15s)
- **Nginx**: A cada 30s (timeout 10s)
- **Start Period**: 45s (backend), 10s (nginx)

## 🔍 **Verificação de Funcionamento**

### **Frontend → Backend**
```bash
# No browser developer tools (Network tab)
# Requisições para /api/* devem ir para localhost:3001
```

### **Nginx → Backend**
```bash
# Logs do nginx devem mostrar comunicação com roi-chatbot:3001
docker-compose logs nginx | grep "upstream"
```

### **Health Checks**
```bash
# Backend health (detalhado)
curl -s http://localhost:3001/api/health | jq .

# Nginx status
curl -s http://localhost:80/nginx-status
```

## ✅ **Status Final**

- 🟢 **Frontend**: Proxy configurado corretamente (3001)
- 🟢 **Nginx**: Upstream configurado corretamente (3001)  
- 🟢 **Docker**: Todas as portas alinhadas (3001)
- 🟢 **Health Checks**: Funcionando sem dependências externas
- 🟢 **Performance**: Timeouts otimizados por uso

**Todos os conflitos de porta foram resolvidos com sucesso!** 🎉

---

**Data da correção:** 2025-06-16  
**Status:** ✅ **RESOLVIDO COMPLETAMENTE**  
**Próximo passo:** Deploy e validação em produção
