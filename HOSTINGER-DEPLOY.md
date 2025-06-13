# ROI Labs Chatbot Training - Deploy Hostinger VPS + Easypanel

## 🚀 Deploy na Hostinger VPS com Easypanel

### Passo 1: Preparar a VPS Hostinger

```bash
# 1. Conectar na VPS via SSH
ssh root@seu-ip-hostinger

# 2. Instalar Docker (se não estiver instalado)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 3. Instalar Easypanel
curl -sSL https://get.easypanel.io | sh
```

### Passo 2: Configurar Easypanel

1. **Acesse o painel:** `http://seu-ip-hostinger:3001`
2. **Login inicial:** Crie sua conta admin
3. **Configure domínio:** (opcional) Aponte seu domínio para a VPS

### Passo 3: Deploy da Aplicação

#### Opção A: Via GitHub (Recomendado)

1. **No Easypanel:**
   - Clique em "Create App"
   - Escolha "Git Repository"
   - Cole a URL do repositório
   - Branch: `main`

2. **Configurar Build:**
   - Dockerfile: `Dockerfile`
   - Build Context: `.`
   - Target: `production`

3. **Configurar Variáveis de Ambiente:**
   ```
   NODE_ENV=production
   PORT=3000
   HOST=0.0.0.0
   SUPABASE_URL=https://ozvwjbsqtijnmaobkbbp.supabase.co
   SUPABASE_ANON_KEY=sua_chave_aqui
   OPENAI_API_KEY=sua_chave_aqui
   ALLOWED_ORIGINS=https://seudominio.com
   ```

#### Opção B: Upload Manual

1. **Compactar projeto:**
   ```bash
   # Remover node_modules se existir
   rm -rf node_modules
   
   # Criar arquivo zip
   zip -r roi-chatbot.zip . -x "*.git*" "node_modules/*"
   ```

2. **No Easypanel:**
   - Clique em "Create App"
   - Escolha "Upload Files"
   - Faça upload do zip

### Passo 4: Configurar Recursos

- **CPU:** 1 core
- **RAM:** 1GB
- **Storage:** 5GB
- **Port:** 3000

### Passo 5: Configurar Domínio e SSL

1. **Adicionar domínio:**
   - Na aba "Domains"
   - Adicione: `seudominio.com`
   - SSL automático via Let's Encrypt

2. **Configurar DNS:**
   ```
   Tipo: A
   Nome: @
   Valor: IP-da-sua-VPS-Hostinger
   
   Tipo: A
   Nome: www
   Valor: IP-da-sua-VPS-Hostinger
   ```

### Passo 6: Testar Deploy

```bash
# Health check
curl https://seudominio.com/api/health

# Teste de API
curl https://seudominio.com/api/info
```

## 📋 Checklist de Deploy

- [ ] ✅ VPS Hostinger configurada
- [ ] ✅ Docker instalado
- [ ] ✅ Easypanel instalado
- [ ] ✅ Aplicação deployada
- [ ] ✅ Variáveis de ambiente configuradas
- [ ] ✅ Domínio configurado (opcional)
- [ ] ✅ SSL configurado
- [ ] ✅ Health check funcionando

## 🔧 Configurações Específicas da Hostinger

### Firewall (via hPanel)
- Porta 80 (HTTP)
- Porta 443 (HTTPS)
- Porta 3001 (Easypanel)
- Porta 3000 (App)

### Recursos Recomendados
- **VPS 2:** 2 vCPU, 4GB RAM, 80GB SSD
- **VPS 4:** 4 vCPU, 8GB RAM, 160GB SSD

### Backup Automático
A Hostinger oferece backup automático dos VPS.

## 🚨 Troubleshooting

### Erro "Port already in use"
```bash
# Verificar portas ocupadas
netstat -tlnp | grep :3000

# Parar processos se necessário
sudo pkill -f node
```

### Erro de memória
```bash
# Verificar uso
free -h
docker stats

# Aumentar swap se necessário
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Logs do Easypanel
```bash
# Ver logs do Easypanel
docker logs easypanel

# Ver logs da aplicação
# (No painel web do Easypanel)
```

## 📊 Monitoramento

### Easypanel Dashboard
- CPU e RAM em tempo real
- Logs da aplicação
- Métricas de rede
- Status dos containers

### Comandos úteis
```bash
# Status geral
docker ps

# Logs da aplicação
docker logs nome-do-container

# Recursos do sistema
htop
df -h
```

## 💰 Custos Estimados (Hostinger)

- **VPS 2:** ~R$ 25/mês
- **VPS 4:** ~R$ 45/mês
- **Domínio:** ~R$ 30/ano
- **SSL:** Grátis (Let's Encrypt)

**Total estimado:** R$ 25-45/mês + domínio
