import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ApiState {
  apiKey: string
  baseUrl: string
  setApiKey: (apiKey: string) => void
  setBaseUrl: (baseUrl: string) => void
  reset: () => void
}

// Configuração padrão
const DEFAULT_CONFIG = {
  API_KEY: 'test-frontend-key-2025',
  BASE_URL: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'
}

export const useApiStore = create<ApiState>()(
  persist(
    (set, get) => ({
      // Inicializar com valores padrão
      apiKey: DEFAULT_CONFIG.API_KEY,
      baseUrl: DEFAULT_CONFIG.BASE_URL,
      
      setApiKey: (apiKey: string) => {
        console.log('🔑 API Key updated in store')
        set({ apiKey })
      },
      
      setBaseUrl: (baseUrl: string) => {
        console.log('🌐 Base URL updated in store:', baseUrl)
        set({ baseUrl })
      },
      
      reset: () => {
        console.log('🔄 Resetting API store to defaults')
        set({
          apiKey: DEFAULT_CONFIG.API_KEY,
          baseUrl: DEFAULT_CONFIG.BASE_URL
        })
      }
    }),
    {
      name: 'roi-labs-api-config', // Nome da chave no localStorage
      version: 1,
      // Migração para versões futuras
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migrar de versão 0 para 1
          return {
            ...persistedState,
            apiKey: persistedState.apiKey || DEFAULT_CONFIG.API_KEY,
            baseUrl: persistedState.baseUrl || DEFAULT_CONFIG.BASE_URL
          }
        }
        return persistedState
      }
    }
  )
)

// Hook para verificar se a configuração está válida
export const useApiConfiguration = () => {
  const { apiKey, baseUrl } = useApiStore()
  
  const isConfigured = Boolean(apiKey && baseUrl)
  const isDefaultConfig = apiKey === DEFAULT_CONFIG.API_KEY && baseUrl === DEFAULT_CONFIG.BASE_URL
  
  return {
    isConfigured,
    isDefaultConfig,
    hasCustomConfig: isConfigured && !isDefaultConfig,
    config: { apiKey, baseUrl }
  }
}