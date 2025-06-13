# 🚀 Deploy Rápido no Easypanel (Sem Docker Local)

Como você não tem Docker instalado localmente, aqui estão 3 métodos para fazer deploy:

## 🌟 Método 1: GitHub + Easypanel (Recomendado)

### 1. Suba seu código para o GitHub
```powershell
# Se ainda não é um repositório Git
git init
git add .
git commit -m "Initial commit - ROI Labs Chatbot Training"

# Crie repositório no GitHub e depois:
git remote add origin https://github.com/SEU-USUARIO/roi-labs-chatbot-training.git
git push -u origin main
```

### 2. Configure os Secrets no GitHub
- Vá em: Repositório → Settings → Secrets and variables → Actions
- Adicione:
  - `DOCKER_USERNAME`: seu usuário do Docker Hub
  - `DOCKER_PASSWORD`: sua senha/token do Docker Hub

### 3. O GitHub Actions irá buildar automaticamente
- A cada push, será gerada uma nova imagem Docker
- Imagem ficará disponível em: `jeanzvh/roi-chatbot-training:latest`

### 4. No Easypanel
- Crie novo projeto
- Use a imagem: `jeanzvh/roi-chatbot-training:latest`
- Configure as variáveis de ambiente

## 📦 Método 2: Build Direto no Easypanel

### 1. No Easypanel, crie novo serviço
- Tipo: "Build from Git"
- Repository: `https://github.com/SEU-USUARIO/roi-labs-chatbot-training`
- Branch: `main`

### 2. Configure o build
```yaml
Build Command: npm ci --only=production
Start Command: node server.js
Port: 3001
```

### 3. Variáveis de ambiente
```env
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-aqui
OPENAI_API_KEY=sk-sua-chave-aqui
```

## 🔄 Método 3: Template JSON Import

### 1. Crie arquivo de configuração
Salve este conteúdo como `easypanel-config.json`:

```json
{
  "name": "roi-labs-chatbot-training",
  "source": {
    "type": "git",
    "repository": "https://github.com/SEU-USUARIO/roi-labs-chatbot-training",
    "branch": "main"
  },
  "build": {
    "command": "npm ci --only=production",
    "startCommand": "node server.js"
  },
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
```

### 2. No Easypanel
- Vá em "Services" → "Import from JSON"
- Cole o conteúdo do arquivo acima
- Ajuste as configurações conforme necessário

## 🔧 Configuração Essencial

### Supabase Setup (Obrigatório)
1. Acesse [supabase.com](https://supabase.com)
2. Crie novo projeto
3. Vá em Settings → API
4. Copie: URL e anon key
5. Execute no SQL Editor:

```sql
-- Script SQL completo está no arquivo EASYPANEL-SETUP.md
CREATE TABLE IF NOT EXISTS clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    company VARCHAR(255),
    api_key VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- [resto do script no EASYPANEL-SETUP.md]
```

## ✅ Teste Pós-Deploy

1. **Aguarde o deploy completar** (3-5 minutos)
2. **Teste os endpoints:**
   ```
   https://seu-dominio.com/api/health
   https://seu-dominio.com/api/info
   https://seu-dominio.com/
   ```
3. **Crie um cliente teste:**
   ```bash
   curl -X POST https://seu-dominio.com/api/clients \
     -H "Content-Type: application/json" \
     -d '{"name":"Test User","email":"test@test.com","company":"Test"}'
   ```

## 🎯 Próximos Passos

1. **Escolha um dos métodos acima**
2. **Configure o Supabase**
3. **Faça o deploy**
4. **Teste a aplicação**

**Qual método você prefere usar?** Posso te ajudar com qualquer um deles! 🚀

---

💡 **Dica:** O Método 1 (GitHub Actions) é o mais profissional e permite atualizações automáticas!