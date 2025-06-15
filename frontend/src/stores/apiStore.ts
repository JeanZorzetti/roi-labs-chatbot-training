import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ApiStore {
  apiKey: string
  baseUrl: string
  setApiKey: (key: string) => void
  setBaseUrl: (url: string) => void
  clearAuth: () => void
}

// Função para detectar ambiente de produção de forma segura
const isProduction = () => {
  if (typeof window === 'undefined') return true
  
  // Detecta produção baseado na URL
  const hostname = window.location.hostname
  return hostname !== 'localhost' && hostname !== '127.0.0.1'
}

// Função para obter a URL base da API
const getApiBaseUrl = () => {
  // Usar variável de ambiente se disponível
  const envBaseUrl = import.meta.env.VITE_API_BASE_URL
  if (envBaseUrl) return envBaseUrl
  
  // Fallback baseado no ambiente
  return isProduction() ? window.location.origin : 'http://localhost:3000'
}

// Função para obter a API key padrão
const getDefaultApiKey = () => {
  return import.meta.env.VITE_API_DEFAULT_KEY || ''
}

export const useApiStore = create<ApiStore>()(  
  persist(
    (set) => ({
      apiKey: getDefaultApiKey(),
      baseUrl: getApiBaseUrl(),
      setApiKey: (apiKey) => set({ apiKey }),
      setBaseUrl: (baseUrl) => set({ baseUrl }),
      clearAuth: () => set({ apiKey: '', baseUrl: '' }),
    }),
    {
      name: 'api-storage',
    }
  )
)