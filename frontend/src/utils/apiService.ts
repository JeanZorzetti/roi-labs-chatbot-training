import { useApiStore } from '../stores/apiStore'

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
    return {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey
    }
  }

  private getBaseUrl() {
    const { baseUrl } = useApiStore.getState()
    return baseUrl
  }

  async startCrawling(data: CrawlingData): Promise<CrawlingResponse> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/crawling/start`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          ...data,
          delay: data.delay || 2000
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`)
      }

      return result
    } catch (error) {
      console.error('Error starting crawling:', error)
      throw error
    }
  }

  async getCrawlingHistory(): Promise<CrawlingHistoryResponse> {
    try {
      // Usar rota temporária sem autenticação
      const response = await fetch(`${this.getBaseUrl()}/api/crawling/jobs`, {
        method: 'GET'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`)
      }

      return result
    } catch (error) {
      console.error('Error fetching crawling history:', error)
      throw error
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

      return result
    } catch (error) {
      console.error('Health check failed:', error)
      throw error
    }
  }
}

export const apiService = new ApiService()
export type { CrawlingData, CrawlingResponse, CrawlingJob, CrawlingHistoryResponse }