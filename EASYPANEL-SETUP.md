# 🚀 ROI Labs Chatbot Training - Easypanel Template Setup

Este documento resume todas as configurações realizadas para transformar sua aplicação em um template compatível com o Easypanel.

## 📁 Estrutura Criada

```
roi-labs-chatbot-training/
├── easypanel-template/          # Template do Easypanel
│   ├── assets/
│   │   └── logo.svg            # Logo da aplicação
│   ├── index.ts                # Configuração do template
│   ├── meta.ts                 # Definições de tipos e formulário
│   ├── meta.yaml               # Metadados do template
│   ├── package.json            # Dependências do template
│   └── README.md               # Documentação do template
├── Dockerfile                  # Otimizado para Easypanel
├── easypanel.yml              # Configuração avançada
├── build-and-deploy.sh        # Script de build (Linux/Mac)
├── build-and-deploy.bat       # Script de build (Windows)
└── [outros arquivos existentes]
```

## 🔧 Alterações Realizadas

### 1. **Template do Easypanel**
- ✅ `meta.yaml` com metadados completos
- ✅ `index.ts` com configuração de serviços
- ✅ `meta.ts` com formulário de configuração
- ✅ Logo SVG personalizado
- ✅ Documentação completa

### 2. **Dockerfile Otimizado**
- ✅ Multi-stage build para menor tamanho
- ✅ Usuário não-root para segurança
- ✅ Health check otimizado
- ✅ Metadados para Easypanel
- ✅ Timezone configurado

### 3. **Configuração Easypanel**
- ✅ `easypanel.yml` com configurações avançadas
- ✅ Variáveis de ambiente estruturadas
- ✅ Recursos otimizados (CPU/Memória)
- ✅ Health checks configurados
- ✅ Volumes persistentes para logs

### 4. **Scripts de Deploy**
- ✅ `build-and-deploy.sh` para Linux/Mac
- ✅ `build-and-deploy.bat` para Windows
- ✅ Testes automáticos de health check
- ✅ Push automático para Docker Hub

## 🚀 Como Usar

### Opção 1: Template Direto no Easypanel

1. **Copie a pasta `easypanel-template`** para o repositório oficial:
   ```bash
   # Clone o repo oficial de templates
   git clone https://github.com/easypanel-io/templates.git
   
   # Copie seu template
   cp -r easypanel-template templates/templates/roi-chatbot-training
   ```

2. **Faça um Pull Request** para o repositório oficial

### Opção 2: Deploy Manual

1. **Execute o script de build:**
   ```bash
   # Linux/Mac
   ./build-and-deploy.sh
   
   # Windows
   build-and-deploy.bat
   ```

2. **No Easypanel:**
   - Crie novo projeto
   - Adicione serviço do tipo "Docker Image"
   - Use a imagem: `jeanzvh/roi-chatbot-training:latest`
   - Configure as variáveis de ambiente

### Opção 3: JSON Import

1. Execute o script de build para gerar `easypanel-deploy.json`
2. No Easypanel, importe a configuração JSON

## 🔑 Variáveis de Ambiente Obrigatórias

```env
# Supabase (OBRIGATÓRIO)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI (OPCIONAL)
OPENAI_API_KEY=sk-...

# Configurações Opcionais
ALLOWED_ORIGINS=https://seudominio.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
LOG_LEVEL=info
```

## 🗃️ Setup do Banco de Dados

Execute no Supabase SQL Editor:

```sql
-- Tabela de clientes
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

-- Tabela de jobs de crawling
CREATE TABLE IF NOT EXISTS crawling_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    url VARCHAR(2000) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    max_depth INTEGER DEFAULT 3,
    filters JSONB,
    results JSONB,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de conhecimento extraído
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    job_id UUID REFERENCES crawling_jobs(id) ON DELETE CASCADE,
    url VARCHAR(2000) NOT NULL,
    title VARCHAR(500),
    content TEXT NOT NULL,
    metadata JSONB,
    embedding VECTOR(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_clients_api_key ON clients(api_key);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_crawling_jobs_client_id ON crawling_jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_crawling_jobs_status ON crawling_jobs(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_client_id ON knowledge_base(client_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_job_id ON knowledge_base(job_id);
```

## ✅ Teste Pós-Deploy

```bash
# Health check
curl https://seudominio.com/api/health

# API info
curl https://seudominio.com/api/info

# Criar cliente
curl -X POST https://seudominio.com/api/clients \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@email.com","company":"Test Co"}'

# Testar crawling
curl -X POST https://seudominio.com/api/crawling/start \
  -H "Content-Type: application/json" \
  -H "X-API-Key: SUA_API_KEY" \
  -d '{"url":"https://exemplo.com","maxDepth":2}'
```

## 🎯 Próximos Passos

1. **Publique a imagem Docker:**
   ```bash
   docker login
   ./build-and-deploy.sh
   ```

2. **Teste o template localmente:**
   ```bash
   cd easypanel-template
   npm install
   npm run build
   ```

3. **Submeta para o repositório oficial** do Easypanel

4. **Configure CI/CD** para builds automáticos

## 📊 Recursos Recomendados

- **CPU**: 1 core (mínimo 0.5 core)
- **Memória**: 1GB (mínimo 512MB)
- **Armazenamento**: 2GB + volume para logs
- **Rede**: Porta 3001 (HTTP)

## 🔒 Segurança Implementada

- ✅ Usuário não-root no container
- ✅ Headers de segurança (Helmet)
- ✅ Rate limiting configurável
- ✅ CORS configurado
- ✅ Logs estruturados
- ✅ Health checks robustos

## 📞 Suporte

- **Email**: contato@roilabs.com.br
- **GitHub**: https://github.com/roi-labs/chatbot-training
- **Documentação**: Acesse `/api/info` após deploy

---

**🎉 Sua aplicação está pronta para o Easypanel!**

A aplicação agora possui:
- Template oficial do Easypanel
- Docker image otimizada
- Configuração completa
- Scripts de deploy automatizados
- Documentação completa

Basta seguir os passos acima para fazer o deploy! 🚀