import { useState, useEffect } from 'react'
import { useThemeStore } from '../stores/themeStore'
import { CogIcon } from '@heroicons/react/24/outline'
import CrawlingForm from '../components/CrawlingForm'
import JobsList from '../components/JobsList'
import JobsTable from '../components/JobsTable'
import { apiService, type CrawlingJob } from '../utils/apiService'
import { convertCrawlingJobsToJobs, type Job } from '../types/crawling'

const Crawling = () => {
  const { isDark } = useThemeStore()
  const [crawlingJobs, setCrawlingJobs] = useState<CrawlingJob[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Carregar histórico ao montar o componente
  useEffect(() => {
    loadCrawlingHistory()
  }, [])

  // Atualizar jobs mapeados quando crawlingJobs mudar
  useEffect(() => {
    const mappedJobs = convertCrawlingJobsToJobs(crawlingJobs)
    setJobs(mappedJobs)
  }, [crawlingJobs])

  const loadCrawlingHistory = async () => {
    try {
      const response = await apiService.getCrawlingHistory()
      if (response.success) {
        setCrawlingJobs(response.history)
      }
    } catch (error) {
      console.error('Error loading crawling history:', error)
      setError('Erro ao carregar histórico de crawlings')
    }
  }

  const handleStartCrawling = async (data: { url: string; maxPages: number; depth: number }) => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Starting crawling:', data)
      
      const response = await apiService.startCrawling({
        website_url: data.url,
        max_pages: data.maxPages,
        max_depth: data.depth
      })

      if (response.success) {
        console.log('Crawling started successfully:', response)
        // Recarregar histórico para mostrar o novo job
        await loadCrawlingHistory()
      } else {
        setError(response.error || 'Erro ao iniciar crawling')
      }
    } catch (error: any) {
      console.error('Error starting crawling:', error)
      setError(error.message || 'Erro ao conectar com a API')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    loadCrawlingHistory()
  }

  const handleCancelCrawling = async (id: string) => {
    try {
      const response = await apiService.cancelCrawling(id)
      if (response.success) {
        console.log('Crawling cancelled:', response.message)
        await loadCrawlingHistory()
      }
    } catch (error: any) {
      console.error('Error cancelling crawling:', error)
      setError(error.message || 'Erro ao cancelar crawling')
    }
  }

  const handleDeleteCrawling = async (id: string) => {
    try {
      const response = await apiService.deleteCrawling(id)
      if (response.success) {
        console.log('Crawling deleted:', response.message)
        await loadCrawlingHistory()
      }
    } catch (error: any) {
      console.error('Error deleting crawling:', error)
      setError(error.message || 'Erro ao deletar crawling')
    }
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CogIcon className="h-8 w-8" />
            Crawling
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Configure e monitore seus jobs de crawling
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <p className="font-medium">Erro:</p>
            <p>{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Fechar
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <CrawlingForm onSubmit={handleStartCrawling} isLoading={isLoading} />
          </div>
          <div className="lg:col-span-2">
            <JobsList 
              jobs={jobs}
              onRefresh={handleRefresh}
              onCancel={handleCancelCrawling}
              onDelete={handleDeleteCrawling}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <JobsTable 
            jobs={jobs}
            onRefresh={handleRefresh}
            onCancel={handleCancelCrawling}
            onDelete={handleDeleteCrawling}
          />
        </div>
      </div>
    </div>
  )
}

export default Crawling