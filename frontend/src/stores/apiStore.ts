import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ApiStore {
  apiKey: string
  baseUrl: string
  setApiKey: (key: string) => void
  setBaseUrl: (url: string) => void
  clearAuth: () => void
}

export const useApiStore = create<ApiStore>()()
  persist(
    (set) => ({
      apiKey: '',
      baseUrl: process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000',
      setApiKey: (apiKey) => set({ apiKey }),
      setBaseUrl: (baseUrl) => set({ baseUrl }),
      clearAuth: () => set({ apiKey: '', baseUrl: '' }),
    }),
    {
      name: 'api-storage',
    }
  )
)