# 🧪 Teste e Validação do Template Easypanel

## Como Testar o Template Localmente

### 1. **Validar Estrutura do Template**
```bash
cd easypanel-template

# Verificar se todos os arquivos estão presentes
ls -la
# Deve mostrar: index.ts, meta.ts, meta.yaml, assets/, README.md

# Testar compilação TypeScript
npm install
npm run build
```

### 2. **Testar a Imagem Docker**
```bash
# Build da imagem
docker build -t roi-chatbot-test .

# Testar localmente
docker run -d \
  -p 3001:3001 \
  -e SUPABASE_URL="https://demo.supabase.co" \
  -e SUPABASE_ANON_KEY="demo-key" \
  roi-chatbot-test

# Testar health check
curl http://localhost:3001/api/health

# Ver logs
docker logs <container-id>
```

### 3. **Validar Template no Easypanel**

#### Método 1: Upload Manual
1. No Easypanel, vá em "Templates"
2. Clique em "Create from JSON"
3. Cole o conteúdo do arquivo gerado pelo template

#### Método 2: Fork do Repositório
1. Fork o repositório oficial: https://github.com/easypanel-io/templates
2. Adicione sua pasta `roi-chatbot-training` em `/templates/`
3. Faça um PR ou use seu fork

## 🔧 Configuração para Produção

### 1. **Build e Push da Imagem**
```bash
# Execute o script de build
./build-and-deploy.sh  # Linux/Mac
# ou
build-and-deploy.bat   # Windows

# Verificar se a imagem foi enviada
docker pull jeanzvh/roi-chatbot-training:latest
```

### 2. **Configurar Supabase**
```sql
-- Execute no Supabase SQL Editor
[Script SQL completo está no EASYPANEL-SETUP.md]
```

### 3. **Deploy no Easypanel**
1. Acesse seu painel Easypanel
2. Crie novo projeto: "ROI Chatbot Training"
3. Adicione serviço via template ou imagem Docker
4. Configure variáveis de ambiente:
   ```
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiI...
   OPENAI_API_KEY=sk-... (opcional)
   ```
5. Deploy!

## ✅ Checklist de Validação

### Pré-Deploy
- [ ] Template compila sem erros (`npm run build`)
- [ ] Dockerfile build com sucesso
- [ ] Imagem funciona localmente
- [ ] Health check responde
- [ ] Logs aparecem corretamente

### Pós-Deploy
- [ ] Aplicação inicia sem erros
- [ ] Health check: `GET /api/health` retorna 200
- [ ] API info: `GET /api/info` retorna dados corretos
- [ ] Dashboard acessível na URL principal
- [ ] Logs persistem no volume configurado

### Funcionalidades
- [ ] Criação de cliente funciona
- [ ] Autenticação via API key funciona
- [ ] Crawling pode ser iniciado
- [ ] Busca retorna resultados
- [ ] Interface web carrega corretamente

## 🐛 Troubleshooting

### Problema: Container não inicia
```bash
# Verificar logs
docker logs <container-id>

# Problemas comuns:
# 1. Variáveis de ambiente faltando
# 2. Porta já em uso
# 3. Permissions no volume
```

### Problema: Health check falha
```bash
# Testar manualmente
curl -v http://localhost:3001/api/health

# Verificar se:
# 1. Aplicação iniciou completamente
# 2. Porta está correta
# 3. Supabase está acessível
```

### Problema: Template não aparece no Easypanel
```bash
# Verificar estrutura:
easypanel-template/
├── index.ts     ✓
├── meta.ts      ✓  
├── meta.yaml    ✓
└── assets/
    └── logo.svg ✓

# Verificar sintaxe dos arquivos TypeScript
npx tsc --noEmit index.ts meta.ts
```

## 📊 Monitoramento Pós-Deploy

### 1. **Logs da Aplicação**
```bash
# No Easypanel, acesse a aba "Logs"
# Ou via Docker:
docker logs -f roi-chatbot-training
```

### 2. **Métricas de Performance**
```bash
# CPU e Memória no dashboard do Easypanel
# Ou via API:
curl https://seudominio.com/api/system/stats
```

### 3. **Health Monitoring**
```bash
# Setup de monitoramento externo
# Exemplo com curl em cron:
*/5 * * * * curl -f https://seudominio.com/api/health || echo "Service down" | mail admin@empresa.com
```

## 🔄 Atualizações

### 1. **Atualizar Código**
```bash
# 1. Atualizar código
git pull origin main

# 2. Rebuild imagem
./build-and-deploy.sh

# 3. No Easypanel: "Rebuild" do serviço
```

### 2. **Atualizar Template**
```bash
# 1. Atualizar arquivos do template
# 2. Incrementar versão no meta.yaml
# 3. Commit e push
# 4. Update no repositório de templates
```

## 🎯 Próximos Desenvolvimentos

1. **Adicionar ao marketplace oficial** do Easypanel
2. **CI/CD automático** para builds
3. **Múltiplas versões** da imagem
4. **Template com banco local** opcional
5. **Integração com Redis** para cache
6. **Backup automático** configurável

---

**✅ Template validado e pronto para uso!**

Agora você pode:
1. Usar o template em qualquer instância do Easypanel
2. Compartilhar com a comunidade
3. Contribuir para o repositório oficial
4. Fazer deploys em minutos! 🚀