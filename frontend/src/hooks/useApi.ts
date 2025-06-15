import { useState, useCallback } from 'react'
import { useApiStore } from '../stores/apiStore'
import axios from 'axios'

interface UseApiReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  execute: (...args: any[]) => Promise<T | null>
}

export function useApi<T = any>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'
): UseApiReturn<T> {
  const { apiKey, baseUrl } = useApiStore()
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (...args: any[]) => {
    if (!baseUrl || !apiKey) {
      setError('API não configurada')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const response = await axios({
        method,
        url: `${baseUrl}${endpoint}`,
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
        data: args[0] || undefined,
      })

      setData(response.data)
      return response.data
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro desconhecido'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [endpoint, method, baseUrl, apiKey])

  return { data, loading, error, execute }
}