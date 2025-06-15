import { useApiStore } from '../stores/apiStore'

// Configuração padrão para desenvolvimento/produção
const DEFAULT_CONFIG = {
  // API Key de teste que já existe no banco
  DEFAULT_API_KEY: 'test-frontend-key-2025',
  // Base URL dinâmica baseada no ambiente
  getBaseUrl: () => {
    if (typeof window !== 'undefined') {
      return window.location.origin
    }
    return 'http://localhost:3001'
  }
}

interface CrawlingData {
  website_url: string
  max_pages: number
  max_depth: number
  delay?: number
}

interface CrawlingResponse {
  success: boolean
  message?: string
  crawling_id?: string
  status?: string
  estimated_time?: string
  error?: string
}

interface CrawlingJob {
  id: string
  client_id: string
  domain: string
  base_url: string
  total_pages: number
  status: 'processing' | 'completed' | 'failed' | 'cancelled'
  error_message?: string
  created_at: string
  crawl_duration_seconds?: number
  pages_data?: any[]
}

interface CrawlingHistoryResponse {
  success: boolean
  history: CrawlingJob[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

class ApiService {
  private getHeaders() {
    const { apiKey } = useApiStore.getState()
    
    // Se não há API key no store, usar a padrão
    const effectiveApiKey = apiKey || DEFAULT_CONFIG.DEFAULT_API_KEY
    
    console.log('🔑 Using API Key:', effectiveApiKey ? 'Configured' : 'Missing')
    
    return {
      'Content-Type': 'application/json',
      'X-API-Key': effectiveApiKey
    }
  }

  private getBaseUrl() {
    const { baseUrl } = useApiStore.getState()
    return baseUrl || DEFAULT_CONFIG.getBaseUrl()
  }

  async startCrawling(data: CrawlingData): Promise<CrawlingResponse> {
    try {
      const headers = this.getHeaders()
      const url = `${this.getBaseUrl()}/api/crawling/start`
      
      console.log('🚀 Starting crawling request to:', url)
      console.log('📋 Request data:', data)
      console.log('🔐 Headers:', { ...headers, 'X-API-Key': headers['X-API-Key'] ? '***' : 'Missing' })

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...data,
          delay: data.delay || 2000
        })
      })

      const result = await response.json()
      console.log('📥 Response:', { status: response.status, result })

      if (!response.ok) {
        console.error('❌ API Error:', result)
        throw new Error(result.error || `HTTP ${response.status}`)
      }

      return result
    } catch (error) {
      console.error('❌ Error starting crawling:', error)
      throw error
    }
  }

  async getCrawlingHistory(): Promise<CrawlingHistoryResponse> {
    try {
      const headers = this.getHeaders()
      const url = `${this.getBaseUrl()}/api/crawling/history`
      
      console.log('📋 Fetching crawling history from:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('❌ History API Error:', result)
        throw new Error(result.error || `HTTP ${response.status}`)
      }

      return result
    } catch (error) {
      console.error('❌ Error fetching crawling history:', error)
      // Retornar dados vazios em caso de erro para não quebrar a UI
      return {
        success: true,
        history: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0
        }
      }
    }
  }

  async getCrawlingStatus(id: string): Promise<{ success: boolean; crawling: CrawlingJob }> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/crawling/status/${id}`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`)
      }

      return result
    } catch (error) {
      console.error('Error fetching crawling status:', error)
      throw error
    }
  }

  async cancelCrawling(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/crawling/cancel/${id}`, {
        method: 'POST',
        headers: this.getHeaders()
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`)
      }

      return result
    } catch (error) {
      console.error('Error cancelling crawling:', error)
      throw error
    }
  }

  async deleteCrawling(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/crawling/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`)
      }

      return result
    } catch (error) {
      console.error('Error deleting crawling:', error)
      throw error
    }
  }

  // Health check para testar conectividade
  async healthCheck(): Promise<any> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/health`, {
        method: 'GET'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      console.log('✅ Health check passed:', result)
      return result
    } catch (error) {
      console.error('❌ Health check failed:', error)
      throw error
    }
  }

  // Método para configurar API key manualmente (útil para debugging)
  setApiKey(apiKey: string) {
    const { setApiKey } = useApiStore.getState()
    setApiKey(apiKey)
    console.log('🔑 API Key updated')
  }

  // Método para testar autenticação
  async testAuthentication(): Promise<boolean> {
    try {
      await this.healthCheck()
      return true
    } catch (error) {
      console.error('🔐 Authentication test failed:', error)
      return false
    }
  }
}

export const apiService = new ApiService()
export type { CrawlingData, CrawlingResponse, CrawlingJob, CrawlingHistoryResponse }