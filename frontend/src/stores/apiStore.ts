import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ApiStore {
  apiKey: string
  baseUrl: string
  setApiKey: (key: string) => void
  setBaseUrl: (url: string) => void
  clearAuth: () => void
}

// Função para detectar ambiente de produção
const isProduction = () => {
  try {
    return import.meta?.env?.PROD || 
           (typeof window !== 'undefined' && window.location.protocol === 'https:') ||
           false
  } catch {
    return false
  }
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