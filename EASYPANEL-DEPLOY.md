# 🚀 Deploy ROI Labs Chatbot Training no Easypanel

## 📋 Pré-requisitos

- ✅ Conta no Easypanel configurada
- ✅ VPS conectada ao Easypanel
- ✅ Domínio configurado (opcional)
- ✅ Banco de dados Supabase criado

## 🛠️ Configuração no Easypanel

### 1. **Criar Novo Projeto**

1. Acesse seu painel Easypanel
2. Clique em **"+ Service"** 
3. Selecione **"Github"**
4. Configure:
   - **Owner:** `JeanZorzetti`
   - **Repository:** `roi-labs-chatbot-training`
   - **Branch:** `main` (ou `master`)
   - **Build Path:** `/`

### 2. **Configurar Variáveis de Ambiente**

No Easypanel, vá para **Environment** e configure:

#### ⚡ Básicas (Obrigatórias)
```bash
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
```

#### 🗄️ Database (Supabase)
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

#### 🔐 Segurança
```bash
JWT_SECRET=your-secure-jwt-secret-here
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW=900000
```

#### 🌐 CORS (Configure seus domínios)
```bash
ALLOWED_ORIGINS=https://yourdomain.com,https://api.yourdomain.com
```

#### 🤖 APIs Externas (Opcional)
```bash
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-claude-key
```

#### 📊 Redis (Opcional - para cache)
```bash
REDIS_URL=redis://your-redis-url:6379
```

### 3. **Configurar Domínios**

No Easypanel, vá para **Domains** e adicione:

1. **Domínio Principal**
   - Domain: `bot.roilabs.com.br`
   - Target: `https://ia-roi-labs-chatbot-training:3000/`

2. **Domínio da API** (opcional)
   - Domain: `api.bot.roilabs.com.br` 
   - Target: `https://ia-roi-labs-chatbot-training:3000/api`

### 4. **Deploy**

1. Clique em **"Deploy"**
2. Aguarde o build completar (5-10 minutos)
3. Verifique os logs para possíveis erros
4. Teste o health check: `https://yourdomain.com/api/health`

## 🔧 Configuração Avançada

### **Resource Limits (Recomendado)**

Configure no Easypanel:
```yaml
Memory: 512MB - 1GB
CPU: 0.5 - 1.0 cores
```

### **Health Check**

O projeto já inclui health check automático:
- **Endpoint:** `/api/health`
- **Interval:** 30s
- **Timeout:** 10s
- **Retries:** 3

### **Volumes (Opcional)**

Para persistir logs e uploads:
```yaml
/app/logs -> logs-volume
/app/uploads -> uploads-volume
```

## 🌐 Acessar a Aplicação

### **URLs Disponíveis**

- **🏠 Dashboard:** `https://yourdomain.com`
- **📊 API Health:** `https://yourdomain.com/api/health`
- **🔧 API Info:** `https://yourdomain.com/api/info`
- **📖 API Docs:** `https://yourdomain.com/api` (redirect para dashboard)

### **Funcionalidades Principais**

1. **Dashboard Moderno:** Interface React responsiva
2. **Gerenciamento de Crawling:** Iniciar/monitorar jobs
3. **Analytics:** Gráficos e métricas em tempo real
4. **API Keys:** Configuração de credenciais
5. **Configurações:** Personalização completa

## 🧪 Testando o Deploy

### 1. **Health Check**
```bash
curl https://yourdomain.com/api/health
```

**Resposta esperada:**
```json
{
  \"status\": \"healthy\",
  \"version\": \"1.0.0\",
  \"environment\": \"production\",
  \"uptime\": 123,
  \"database\": {
    \"status\": \"connected\"
  }
}
```

### 2. **Dashboard**
Acesse `https://yourdomain.com` e verifique:
- ✅ Interface carrega sem erros
- ✅ Temas dark/light funcionam
- ✅ Responsividade mobile
- ✅ Métricas aparecem no dashboard

### 3. **API Key Setup**
1. Vá para **API Keys** no dashboard
2. Configure a URL base: `https://yourdomain.com`
3. Gere ou configure uma API key
4. Teste a conexão automaticamente

### 4. **Crawling Test**
1. Acesse **Crawling** no dashboard
2. Clique em **"Novo Crawling"**
3. Configure: URL, max pages, depth
4. Inicie e monitore o progresso

## 🐛 Troubleshooting

### **Problema: App não carrega**
```bash
# Verificar logs no Easypanel
# Ou via API:
curl https://yourdomain.com/api/health
```

**Soluções:**
- Verificar variáveis de ambiente
- Confirmar que SUPABASE_URL está correto
- Checar se a porta 3000 está configurada

### **Problema: Frontend não aparece**
**Causa:** Build do React falhou

**Solução:**
1. Verificar logs de build no Easypanel
2. Confirmar que `frontend/` existe no repositório
3. Rebuild do zero se necessário

### **Problema: Database connection failed**
**Causa:** Configuração do Supabase incorreta

**Solução:**
1. Verificar `SUPABASE_URL` e `SUPABASE_ANON_KEY`
2. Confirmar que o projeto Supabase está ativo
3. Testar conexão diretamente

### **Problema: CORS errors**
**Causa:** `ALLOWED_ORIGINS` não configurado

**Solução:**
```bash
ALLOWED_ORIGINS=https://yourdomain.com,https://api.yourdomain.com
```

### **Problema: Crawling não funciona**
**Causa:** Puppeteer/Chromium não configurado

**Solução:**
- O Dockerfile já inclui Chromium
- Verificar se o container tem recursos suficientes
- Aumentar memory limit se necessário

## 🔄 Atualizações

### **Deploy Automático**
O Easypanel detecta automaticamente:
- ✅ Commits na branch `main`
- ✅ Builds automáticos
- ✅ Deploy sem downtime

### **Manual Update**
1. Vá para **Source** no Easypanel
2. Clique em **"Deploy"**
3. Aguarde o build completar

### **Rollback**
1. Vá para **Deployments**
2. Selecione versão anterior
3. Clique em **"Rollback"**

## 📊 Monitoramento

### **Métricas Disponíveis**
- **CPU Usage:** Monitor via Easypanel
- **Memory Usage:** Dashboard interno + Easypanel
- **Response Time:** Health check endpoint
- **Error Rate:** Logs do aplicativo

### **Logs**
```bash
# Via Easypanel UI ou:
curl https://yourdomain.com/api/system/stats
```

### **Alertas**
Configure no Easypanel:
- **High CPU:** > 80%
- **High Memory:** > 90%
- **Health Check Failed:** > 3 attempts

## 🚀 Otimizações de Performance

### **Recommended VPS Specs**
- **Mínimo:** 1GB RAM, 1 CPU core
- **Recomendado:** 2GB RAM, 2 CPU cores
- **High Traffic:** 4GB RAM, 4 CPU cores

### **CDN Setup (Opcional)**
Configure Cloudflare para:
- ✅ Cache de assets estáticos
- ✅ Compressão gzip/brotli
- ✅ SSL automático
- ✅ DDoS protection

### **Database Optimization**
- ✅ Connection pooling (já configurado)
- ✅ Índices nas tabelas principais
- ✅ Query optimization

## 🎉 Conclusão

Após seguir este guia, você terá:

- ✅ **Dashboard React moderno** rodando em produção
- ✅ **API robusta** com rate limiting e segurança
- ✅ **Sistema de crawling** funcional
- ✅ **Analytics em tempo real** operacionais
- ✅ **Deploy automático** configurado
- ✅ **Monitoramento** ativo

**🚀 Sua plataforma de chatbot training está pronta para produção!**

---

**Suporte:** contato@roilabs.com.br
**Docs:** https://github.com/JeanZorzetti/roi-labs-chatbot-training