# ROI Labs Chatbot Training - Template Easypanel

Este template permite fazer deploy do sistema ROI Labs Chatbot Training no Easypanel com apenas alguns cliques.

## 📋 Pré-requisitos

Antes de usar este template, você precisa:

### 1. Conta no Supabase (Obrigatório)
- Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita
- Crie um novo projeto
- Anote a **URL do projeto** e a **chave anônima** (anon key)
- Execute o script SQL para criar as tabelas necessárias (fornecido abaixo)

### 2. Chave OpenAI (Opcional)
- Acesse [platform.openai.com](https://platform.openai.com)
- Gere uma API key para funcionalidades avançadas de IA

## 🚀 Deploy no Easypanel

1. **Abra o Easypanel** em seu servidor
2. **Crie um novo projeto** ou selecione um existente
3. **Adicione um serviço** → **Template** → **ROI Labs Chatbot Training**
4. **Configure as variáveis necessárias:**
   - **Supabase URL**: URL do seu projeto Supabase
   - **Supabase Anon Key**: Chave anônima do Supabase
   - **OpenAI API Key** (opcional): Para funcionalidades avançadas
5. **Clique em Deploy**

## 🗃️ Configuração do Banco de Dados

Execute este script SQL no seu Supabase Dashboard:

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
    embedding VECTOR(1536), -- Para embeddings da OpenAI
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_clients_api_key ON clients(api_key);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_crawling_jobs_client_id ON crawling_jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_crawling_jobs_status ON crawling_jobs(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_client_id ON knowledge_base(client_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_job_id ON knowledge_base(job_id);

-- RLS (Row Level Security) - Opcional
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawling_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
```

## ✅ Verificação Pós-Deploy

Após o deploy, verifique se tudo está funcionando:

1. **Health Check**: Acesse `https://seu-dominio.com/api/health`
2. **API Info**: Acesse `https://seu-dominio.com/api/info`
3. **Dashboard**: Acesse `https://seu-dominio.com`

## 👥 Criando o Primeiro Cliente

Use a API para criar um cliente:

```bash
curl -X POST https://seu-dominio.com/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Seu Nome",
    "email": "seu@email.com",
    "company": "Sua Empresa"
  }'
```

Anote a `api_key` retornada - você precisará dela para usar a API.

## 🕷️ Testando o Crawling

```bash
curl -X POST https://seu-dominio.com/api/crawling/start \
  -H "Content-Type: application/json" \
  -H "X-API-Key: SUA_API_KEY" \
  -d '{
    "url": "https://exemplo.com",
    "maxDepth": 3,
    "filters": ["produtos", "serviços"]
  }'
```

## 🔍 Testando a Busca

```bash
curl -X POST https://seu-dominio.com/api/search \
  -H "Content-Type: application/json" \
  -H "X-API-Key: SUA_API_KEY" \
  -d '{
    "query": "Como funciona o produto?",
    "limit": 5
  }'
```

## 📊 Endpoints da API

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/health` | GET | Status do sistema |
| `/api/info` | GET | Informações da API |
| `/api/test-auth` | GET | Teste de autenticação |
| `/api/clients` | POST | Criar cliente |
| `/api/clients/profile` | GET | Perfil do cliente |
| `/api/crawling/start` | POST | Iniciar crawling |
| `/api/crawling/status/:id` | GET | Status do crawling |
| `/api/crawling/history` | GET | Histórico de crawling |
| `/api/search` | POST | Buscar no conhecimento |
| `/api/search/domains` | GET | Domínios indexados |

## ⚙️ Configurações Avançadas

### Variáveis de Ambiente Opcionais

- `ALLOWED_ORIGINS`: Domínios permitidos para CORS
- `RATE_LIMIT_WINDOW_MS`: Janela de rate limiting (padrão: 15min)
- `RATE_LIMIT_MAX_REQUESTS`: Máximo de requests por janela (padrão: 1000)
- `LOG_LEVEL`: Nível de log (error, warn, info, debug)

### Recursos Recomendados

- **CPU**: 1 core (mínimo 0.5 core)
- **Memória**: 1GB (mínimo 512MB)
- **Armazenamento**: Volume para logs persistentes

## 🔧 Resolução de Problemas

### Container não inicia
1. Verifique os logs no Easypanel
2. Confirme se as variáveis de ambiente estão corretas
3. Teste a conexão com Supabase

### API retorna erros 500
1. Verifique se o banco de dados foi configurado corretamente
2. Confirme se as tabelas foram criadas
3. Teste a conectividade com o Supabase

### Crawling não funciona
1. Verifique se a API key do cliente está correta
2. Confirme se a URL é acessível
3. Verifique os logs para erros específicos

## 📞 Suporte

- **Email**: contato@roilabs.com.br
- **GitHub**: [roi-labs/chatbot-training](https://github.com/roi-labs/chatbot-training)
- **Documentação**: Acesse `/api/info` para ver todos os endpoints

## 🔄 Atualizações

Para atualizar a aplicação:
1. No Easypanel, vá até o serviço
2. Clique em "Rebuild"
3. Ou atualize a tag da imagem Docker se usar imagem customizada

## 📄 Licença

MIT License - Veja o arquivo LICENSE para detalhes.

---

**ROI Labs** - Transformando ideias em soluções inteligentes 🤖