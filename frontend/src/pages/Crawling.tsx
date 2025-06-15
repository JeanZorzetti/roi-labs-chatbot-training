import { useState, useEffect } from 'react'
import { useThemeStore } from '../stores/themeStore'
import { CogIcon } from '@heroicons/react/24/outline'
import CrawlingForm from '../components/CrawlingForm'
import JobsList from '../components/JobsList'
import JobsTable from '../components/JobsTable'
import ApiConfigPanel from '../components/ApiConfigPanel'
import { apiService } from '../utils/apiService'
import { convertCrawlingJobsToJobs, type CrawlingJob, type Job } from '../types/crawling'

const Crawling = () => {
  const { isDark } = useThemeStore()
  const [crawlingJobs, setCrawlingJobs] = useState<CrawlingJob[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isApiConfigured, setIsApiConfigured] = useState(false)

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
      console.log('📋 Loading crawling history...')
      const response = await apiService.getCrawlingHistory()
      if (response.success) {
        console.log('✅ History loaded:', response.history.length, 'jobs')
        setCrawlingJobs(response.history)
      }
    } catch (error) {
      console.error('❌ Error loading crawling history:', error)
      // Não mostrar erro para histórico, apenas log
    }
  }

  const handleStartCrawling = async (data: { url: string; maxPages: number; depth: number }) => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('🚀 Starting crawling:', data)
      
      const response = await apiService.startCrawling({
        website_url: data.url,
        max_pages: data.maxPages,
        max_depth: data.depth
      })

      if (response.success) {
        console.log('✅ Crawling started successfully:', response)
        // Recarregar histórico para mostrar o novo job
        await loadCrawlingHistory()
        
        // Mostrar mensagem de sucesso
        alert(`Crawling iniciado com sucesso!\nID: ${response.crawling_id}\nTempo estimado: ${response.estimated_time || 'Calculando...'}`)
      } else {
        setError(response.error || 'Erro ao iniciar crawling')
      }
    } catch (error: any) {
      console.error('❌ Error starting crawling:', error)
      
      // Mensagens de erro mais específicas
      if (error.message.includes('API key')) {
        setError('Erro de autenticação: Verifique sua API key na configuração abaixo.')
      } else if (error.message.includes('rate limit')) {
        setError('Limite de taxa excedido: Aguarde alguns minutos antes de iniciar outro crawling.')
      } else if (error.message.includes('fetch')) {
        setError('Erro de conexão: Verifique se a API está rodando e a URL está correta.')
      } else {
        setError(error.message || 'Erro ao conectar com a API')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    console.log('🔄 Refreshing crawling history...')
    loadCrawlingHistory()
  }

  const handleCancelCrawling = async (id: string) => {
    try {
      console.log('🛑 Cancelling crawling:', id)
      const response = await apiService.cancelCrawling(id)
      if (response.success) {
        console.log('✅ Crawling cancelled:', response.message)
        await loadCrawlingHistory()
        alert('Crawling cancelado com sucesso!')
      }
    } catch (error: any) {
      console.error('❌ Error cancelling crawling:', error)
      setError(error.message || 'Erro ao cancelar crawling')
    }
  }

  const handleDeleteCrawling = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este crawling? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      console.log('🗑️ Deleting crawling:', id)
      const response = await apiService.deleteCrawling(id)
      if (response.success) {
        console.log('✅ Crawling deleted:', response.message)
        await loadCrawlingHistory()
        alert('Crawling deletado com sucesso!')
      }
    } catch (error: any) {
      console.error('❌ Error deleting crawling:', error)
      setError(error.message || 'Erro ao deletar crawling')
    }
  }

  const handleApiConfigured = () => {
    setIsApiConfigured(true)
    setError(null)
    loadCrawlingHistory()
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

        {/* Painel de configuração da API */}
        <div className="mb-6">
          <ApiConfigPanel onConfigured={handleApiConfigured} />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">Erro:</p>
                <p>{error}</p>
                {error.includes('API key') && (
                  <p className="mt-2 text-sm">
                    💡 <strong>Dica:</strong> Configure sua API key no painel acima. Use "test-frontend-key-2025" para testes.
                  </p>
                )}
                {error.includes('rate limit') && (
                  <p className="mt-2 text-sm">
                    ⏰ <strong>Dica:</strong> Aguarde alguns minutos entre os crawlings para evitar sobrecarga.
                  </p>
                )}
                {error.includes('conexão') && (
                  <p className="mt-2 text-sm">
                    🔧 <strong>Dica:</strong> Verifique se a API está rodando e a URL base está correta.
                  </p>
                )}
              </div>
              <button 
                onClick={() => setError(null)}
                className="text-sm underline hover:no-underline ml-4"
              >
                Fechar
              </button>
            </div>
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

        {/* Informações de debug (apenas em desenvolvimento) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded text-xs">
            <h4 className="font-medium mb-2">Debug Info:</h4>
            <p>Jobs carregados: {jobs.length}</p>
            <p>API configurada: {isApiConfigured ? 'Sim' : 'Não'}</p>
            <p>URL atual: {window.location.origin}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Crawling