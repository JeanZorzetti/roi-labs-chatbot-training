import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useApiStore } from '../stores/apiStore'
import toast from 'react-hot-toast'

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface HealthData {
  status: string
  timestamp: string
  version: string
  environment: string
  uptime: number
  memory: {
    used: string
    total: string
    rss: string
  }
  database: {
    status: string
    responseTime: string
  }
  config: {
    supabase_url: string
    supabase_key: string
    openai_key: string
  }
}

interface CrawlingJob {
  id: string
  url: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  pages_crawled: number
  total_pages: number
  created_at: string
  completed_at?: string
  error_message?: string
}

interface SystemStats {
  uptime: number
  memory: any
  version: string
  platform: string
  rate_limiting: any
}

const createApiClient = () => {
  const { apiKey, baseUrl } = useApiStore.getState()
  
  const client = axios.create({
    baseURL: baseUrl || 'http://localhost:3000',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey && { 'X-API-Key': apiKey }),
    },
  })

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        toast.error('API Key inválida ou expirada')
        useApiStore.getState().clearAuth()
      } else if (error.response?.status >= 500) {
        toast.error('Erro interno do servidor')
      }
      return Promise.reject(error)
    }
  )

  return client
}

export const useHealth = () => {
  return useQuery<HealthData>({
    queryKey: ['health'],
    queryFn: async () => {
      const client = createApiClient()
      const { data } = await client.get('/api/health')
      return data
    },
    refetchInterval: 30000, // 30 seconds
    retry: 3,
  })
}

export const useSystemStats = () => {
  return useQuery<SystemStats>({
    queryKey: ['system-stats'],
    queryFn: async () => {
      const client = createApiClient()
      const { data } = await client.get('/api/system/stats')
      return data
    },
    refetchInterval: 60000, // 1 minute
    enabled: !!useApiStore.getState().apiKey,
  })
}

export const useCrawlingJobs = () => {
  return useQuery<CrawlingJob[]>({
    queryKey: ['crawling-jobs'],
    queryFn: async () => {
      const client = createApiClient()
      const { data } = await client.get('/api/crawling/history')
      return data.jobs || []
    },
    refetchInterval: 5000, // 5 seconds
    enabled: !!useApiStore.getState().apiKey,
  })
}

export const useStartCrawling = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: { url: string; maxPages?: number; depth?: number }) => {
      const client = createApiClient()
      const response = await client.post('/api/crawling/start', data)
      return response.data
    },
    onSuccess: (data) => {
      toast.success('Crawling iniciado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['crawling-jobs'] })
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao iniciar crawling'
      toast.error(message)
    },
  })
}

export const useTestAuth = () => {
  return useMutation({
    mutationFn: async (apiKey: string) => {
      const client = axios.create({
        baseURL: useApiStore.getState().baseUrl || 'http://localhost:3000',
        headers: { 'X-API-Key': apiKey },
      })
      const { data } = await client.get('/api/test-auth')
      return data
    },
    onSuccess: (data) => {
      toast.success(`Autenticação bem-sucedida! Bem-vindo, ${data.client.name}`)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro na autenticação'
      toast.error(message)
    },
  })
}

export const useSearch = () => {
  return useMutation({
    mutationFn: async (data: { query: string; limit?: number }) => {
      const client = createApiClient()
      const response = await client.post('/api/search', data)
      return response.data
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro na busca'
      toast.error(message)
    },
  })
}