import { randomPassword } from "~templates-utils";
import { Output, randomString } from "~templates-utils";

export interface Input {
  // Service names
  appServiceName: string;
  appServiceImage: string;
  logsVolumeName: string;
  
  // Required database configuration (Supabase)
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseDbUrl?: string;
  
  // Optional OpenAI configuration
  openaiApiKey?: string;
  
  // Application configuration
  allowedOrigins?: string;
  rateLimitWindowMs?: string;
  rateLimitMaxRequests?: string;
  logLevel?: string;
  
  // Resource limits
  memoryLimit?: string;
  cpuLimit?: string;
  memoryRequest?: string;
  cpuRequest?: string;
  
  // Optional services
  includeDatabase?: boolean;
  databaseServiceName?: string;
  databasePassword?: string;
  
  includeRedis?: boolean;
  redisServiceName?: string;
  redisPassword?: string;
}

export const form = {
  appServiceName: {
    type: "text",
    title: "App Service Name",
    default: "roi-chatbot",
    description: "Nome do serviço da aplicação",
  },
  appServiceImage: {
    type: "text",
    title: "Docker Image",
    default: "jeanzvh/roi-chatbot-training:latest",
    description: "Imagem Docker da aplicação (pode usar sua própria imagem)",
  },
  logsVolumeName: {
    type: "text",
    title: "Logs Volume Name",
    default: "roi-chatbot-logs",
    description: "Nome do volume para persistir logs",
  },
  supabaseUrl: {
    type: "text",
    title: "Supabase URL",
    description: "URL do projeto Supabase (obrigatório)",
    placeholder: "https://seu-projeto.supabase.co",
  },
  supabaseAnonKey: {
    type: "text",
    title: "Supabase Anon Key",
    description: "Chave anônima do Supabase (obrigatório)",
    placeholder: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  },
  supabaseDbUrl: {
    type: "text",
    title: "Supabase DB URL (Opcional)",
    description: "URL direta da base de dados (opcional, para conexão direta)",
    placeholder: "postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres",
  },
  openaiApiKey: {
    type: "text",
    title: "OpenAI API Key (Opcional)",
    description: "Chave da API OpenAI para funcionalidades avançadas",
    placeholder: "sk-...",
  },
  allowedOrigins: {
    type: "text",
    title: "Allowed Origins",
    description: "Domínios permitidos para CORS (deixe vazio para usar domínio principal)",
    placeholder: "https://seudominio.com,https://app.seudominio.com",
  },
  rateLimitWindowMs: {
    type: "select",
    title: "Rate Limit Window",
    description: "Janela de tempo para rate limiting",
    default: "900000",
    oneOf: [
      { enum: ["300000"], title: "5 minutos" },
      { enum: ["900000"], title: "15 minutos (recomendado)" },
      { enum: ["1800000"], title: "30 minutos" },
      { enum: ["3600000"], title: "1 hora" },
    ],
  },
  rateLimitMaxRequests: {
    type: "select",
    title: "Max Requests per Window",
    description: "Número máximo de requisições por janela de tempo",
    default: "1000",
    oneOf: [
      { enum: ["100"], title: "100 requests" },
      { enum: ["500"], title: "500 requests" },
      { enum: ["1000"], title: "1000 requests (recomendado)" },
      { enum: ["2000"], title: "2000 requests" },
      { enum: ["5000"], title: "5000 requests" },
    ],
  },
  logLevel: {
    type: "select",
    title: "Log Level",
    description: "Nível de logging da aplicação",
    default: "info",
    oneOf: [
      { enum: ["error"], title: "Error only" },
      { enum: ["warn"], title: "Warning and above" },
      { enum: ["info"], title: "Info and above (recomendado)" },
      { enum: ["debug"], title: "Debug (verbose)" },
    ],
  },
  memoryLimit: {
    type: "select",
    title: "Memory Limit",
    description: "Limite de memória para a aplicação",
    default: "1Gi",
    oneOf: [
      { enum: ["512Mi"], title: "512 MB" },
      { enum: ["1Gi"], title: "1 GB (recomendado)" },
      { enum: ["2Gi"], title: "2 GB" },
      { enum: ["4Gi"], title: "4 GB" },
    ],
  },
  cpuLimit: {
    type: "select",
    title: "CPU Limit",
    description: "Limite de CPU para a aplicação",
    default: "1000m",
    oneOf: [
      { enum: ["500m"], title: "0.5 CPU core" },
      { enum: ["1000m"], title: "1 CPU core (recomendado)" },
      { enum: ["2000m"], title: "2 CPU cores" },
      { enum: ["4000m"], title: "4 CPU cores" },
    ],
  },
  memoryRequest: {
    type: "select",
    title: "Memory Request",
    description: "Memória garantida para a aplicação",
    default: "512Mi",
    oneOf: [
      { enum: ["256Mi"], title: "256 MB" },
      { enum: ["512Mi"], title: "512 MB (recomendado)" },
      { enum: ["1Gi"], title: "1 GB" },
      { enum: ["2Gi"], title: "2 GB" },
    ],
  },
  cpuRequest: {
    type: "select",
    title: "CPU Request",
    description: "CPU garantido para a aplicação",
    default: "500m",
    oneOf: [
      { enum: ["250m"], title: "0.25 CPU core" },
      { enum: ["500m"], title: "0.5 CPU core (recomendado)" },
      { enum: ["1000m"], title: "1 CPU core" },
      { enum: ["2000m"], title: "2 CPU cores" },
    ],
  },
  includeDatabase: {
    type: "boolean",
    title: "Include Local PostgreSQL Database",
    description: "Adicionar banco PostgreSQL local (além do Supabase)",
    default: false,
  },
  databaseServiceName: {
    type: "text",
    title: "Database Service Name",
    default: "roi-chatbot-db",
    description: "Nome do serviço do banco de dados local",
    condition: "includeDatabase",
  },
  databasePassword: {
    type: "text",
    title: "Database Password",
    default: () => randomPassword(),
    description: "Senha do banco PostgreSQL local",
    condition: "includeDatabase",
  },
  includeRedis: {
    type: "boolean",
    title: "Include Redis for Caching",
    description: "Adicionar Redis para cache e sessões",
    default: false,
  },
  redisServiceName: {
    type: "text",
    title: "Redis Service Name",
    default: "roi-chatbot-redis",
    description: "Nome do serviço Redis",
    condition: "includeRedis",
  },
  redisPassword: {
    type: "text",
    title: "Redis Password (Optional)",
    default: "",
    description: "Senha do Redis (deixe vazio para sem senha)",
    condition: "includeRedis",
  },
} as const;