# ROI Labs Chatbot Training - React Dashboard

## 🚀 Visão Geral

Dashboard moderno e responsivo construído com React, TypeScript e Tailwind CSS para gerenciar o sistema de treinamento de chatbot da ROI Labs.

## ✨ Características

### 🎨 Interface Moderna
- **Design System Consistente** - Componentes padronizados com Tailwind CSS
- **Dark/Light Theme** - Alternância suave entre temas com persistência
- **Responsivo** - Interface adaptável para desktop, tablet e mobile
- **Animações Fluidas** - Transições suaves com Framer Motion
- **Glassmorphism** - Efeitos modernos de vidro e blur

### 📊 Dashboard Inteligente
- **Real-time Monitoring** - Status em tempo real dos crawlings
- **Analytics Avançados** - Gráficos interativos com Chart.js
- **System Health** - Monitoramento de saúde do sistema
- **Performance Metrics** - Métricas detalhadas de performance

### 🕷️ Gerenciamento de Crawling
- **Iniciar Crawlings** - Interface intuitiva para configurar novos jobs
- **Monitoramento em Tempo Real** - Progress bars e status updates
- **Histórico Completo** - Lista e tabela de todos os crawlings
- **Filtros Avançados** - Busca e filtros por status, URL, data
- **Ações em Massa** - Seleção múltipla para ações em lote

### 🔑 Gestão de API Keys
- **Configuração Segura** - Interface para gerenciar credenciais
- **Teste de Conexão** - Validação automática de API keys
- **Status Visual** - Indicadores de conexão e configuração
- **Documentação Integrada** - Guias e exemplos de uso

### ⚙️ Configurações Avançadas
- **Personalização Completa** - Aparência, notificações, crawling
- **Backup/Restore** - Export/import de configurações
- **Segurança** - Configurações de timeout, whitelist, logs
- **Modo Debug** - Ferramentas para desenvolvimento

## 🛠️ Stack Tecnológico

### Core
- **React 18** - Framework principal
- **TypeScript** - Type safety
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Styling utility-first

### State Management
- **Zustand** - Estado global leve e performático
- **TanStack Query** - Data fetching e cache
- **Persist Middleware** - Persistência automática

### UI/UX
- **Framer Motion** - Animações fluidas
- **Heroicons** - Ícones modernos
- **React Hot Toast** - Notificações elegantes
- **Headless UI** - Componentes acessíveis

### Data Visualization
- **Chart.js** - Gráficos interativos
- **React Chart.js 2** - Wrapper React para Chart.js
- **Date-fns** - Manipulação de datas

### Networking
- **Axios** - HTTP client
- **Socket.io Client** - Real-time updates

## 📁 Estrutura do Projeto

```
frontend/
├── public/
│   ├── index.html
│   └── logo.svg
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── Layout.tsx      # Layout principal
│   │   ├── StatsCard.tsx   # Card de estatísticas
│   │   ├── SearchBox.tsx   # Componente de busca
│   │   ├── CrawlingStatus.tsx
│   │   ├── SystemMetrics.tsx
│   │   ├── RecentActivity.tsx
│   │   ├── CrawlingForm.tsx
│   │   ├── JobsTable.tsx
│   │   ├── JobsList.tsx
│   │   └── DateRangePicker.tsx
│   ├── pages/              # Páginas principais
│   │   ├── Dashboard.tsx   # Dashboard principal
│   │   ├── Crawling.tsx    # Gerenciamento de crawling
│   │   ├── Analytics.tsx   # Analytics e relatórios
│   │   ├── ApiKeys.tsx     # Gestão de API keys
│   │   └── Settings.tsx    # Configurações
│   ├── hooks/              # Hooks customizados
│   │   └── useApi.ts      # Hooks para API
│   ├── stores/             # Estado global
│   │   ├── themeStore.ts  # Tema dark/light
│   │   └── apiStore.ts    # Configurações da API
│   ├── utils/              # Utilitários
│   │   └── cn.ts          # Utility para classes CSS
│   ├── App.tsx            # Componente raiz
│   ├── main.tsx           # Entry point
│   └── index.css          # Estilos globais
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js 16+
- npm ou yarn
- API Backend rodando

### Passos de Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/JeanZorzetti/roi-labs-chatbot-training.git
cd roi-labs-chatbot-training/frontend
```

2. **Instale as dependências**
```bash
npm install
# ou
yarn install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env.local
```

Edite `.env.local`:
```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

4. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
# ou
yarn dev
```

5. **Acesse o dashboard**
```
http://localhost:5173
```

## 📝 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
npm run lint         # Linting do código

# Utilitários
npm run type-check   # Verificação de tipos TypeScript
npm run clean        # Limpa cache e node_modules
```

## 🔧 Configuração da API

### Configuração Inicial
1. Acesse a aba "API Keys" no dashboard
2. Configure a URL base da API (ex: `http://localhost:3000`)
3. Insira sua API key
4. Teste a conexão

### Endpoints Utilizados
```
GET  /api/health              # Status do sistema
GET  /api/test-auth           # Teste de autenticação
GET  /api/system/stats        # Estatísticas do sistema
GET  /api/crawling/history    # Histórico de crawlings
POST /api/crawling/start      # Iniciar novo crawling
POST /api/search              # Buscar no conhecimento
```

## 🎨 Customização

### Temas
O dashboard suporta temas dark/light com persistência automática:

```typescript
// useThemeStore
const { isDark, toggleTheme, setTheme } = useThemeStore()
```

### Cores
Personalize as cores no `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        50: '#eff6ff',
        500: '#3b82f6',
        600: '#2563eb',
        // ...
      }
    }
  }
}
```

### Componentes
Todos os componentes seguem um padrão consistente:

```typescript
interface ComponentProps {
  // Props tipadas
}

export default function Component({ ...props }: ComponentProps) {
  // Lógica do componente
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="card p-6"
    >
      {/* Conteúdo */}
    </motion.div>
  )
}
```

## 📱 Responsividade

### Breakpoints Tailwind
```css
sm: 640px   # Mobile landscape
md: 768px   # Tablet
lg: 1024px  # Desktop
xl: 1280px  # Large desktop
2xl: 1536px # Extra large
```

### Padrões Responsivos
```tsx
// Grid responsivo
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

// Sidebar responsiva
<div className="hidden lg:block lg:w-64">

// Mobile menu
<div className="lg:hidden">
```

## 🔒 Segurança

### Autenticação
- API keys armazenadas com segurança
- Headers de autenticação automáticos
- Logout automático em caso de erro 401

### Validação
- Validação de formulários no frontend
- Sanitização de inputs
- Proteção XSS com escape automático

## 📊 Performance

### Otimizações Implementadas
- **Code Splitting** - Carregamento sob demanda
- **Lazy Loading** - Componentes carregados quando necessário
- **React Query** - Cache inteligente de dados
- **Debounced Search** - Busca otimizada
- **Memoization** - React.memo e useMemo

### Bundle Analysis
```bash
npm run build
npm run preview
```

## 🧪 Testes

### Estratégia de Testes
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

## 🚀 Deploy

### Build para Produção
```bash
npm run build
```

### Deploy Automático
O projeto está configurado para deploy automático:

1. **Vercel** (Recomendado)
2. **Netlify**
3. **Docker** (usando o Dockerfile raiz)

### Variáveis de Ambiente (Produção)
```env
VITE_API_URL=https://api.roilabs.com.br
VITE_WS_URL=wss://api.roilabs.com.br
VITE_SENTRY_DSN=your-sentry-dsn
```

## 🐛 Troubleshooting

### Problemas Comuns

**1. Erro de CORS**
```bash
# Configure o proxy no vite.config.ts
server: {
  proxy: {
    '/api': 'http://localhost:3000'
  }
}
```

**2. Build Error**
```bash
# Limpe o cache
rm -rf node_modules package-lock.json
npm install
```

**3. TypeScript Errors**
```bash
# Verifique os tipos
npm run type-check
```

## 🔄 Atualizações

### Dependências
```bash
# Verificar atualizações
npm outdated

# Atualizar dependências
npm update

# Atualizar major versions
npx npm-check-updates -u
npm install
```

## 📞 Suporte

### Canais de Suporte
- **Email:** contato@roilabs.com.br
- **GitHub Issues:** Para bugs e feature requests
- **Documentação:** README.md e código comentado

### Logs de Debug
```typescript
// Habilitar logs no Settings
const { debugMode } = useSettingsStore()

if (debugMode) {
  console.log('Debug info:', data)
}
```

## 🤝 Contribuição

### Guidelines
1. Fork o repositório
2. Crie uma branch feature: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'Add: nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

### Padrões de Código
- **TypeScript** obrigatório
- **ESLint + Prettier** para formatação
- **Conventional Commits** para mensagens
- **Testes** para novas funcionalidades

## 📄 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](../LICENSE) para detalhes.

---

**ROI Labs** - Transformando ideias em soluções inteligentes 🤖⚛️

**Dashboard React - Interface moderna para IA!** ✨