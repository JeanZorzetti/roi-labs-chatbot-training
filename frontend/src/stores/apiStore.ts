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

export const useApiStore = create<ApiStore>()(  
  persist(
    (set) => ({
      apiKey: '',
      baseUrl: isProduction() ? '' : 'http://localhost:3000',
      setApiKey: (apiKey) => set({ apiKey }),
      setBaseUrl: (baseUrl) => set({ baseUrl }),
      clearAuth: () => set({ apiKey: '', baseUrl: '' }),
    }),
    {
      name: 'api-storage',
    }
  )
)