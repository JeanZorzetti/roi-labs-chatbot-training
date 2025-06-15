import React from 'react'
import { motion } from 'framer-motion'
import { PlusIcon, MagnifyingGlassIcon, ListBulletIcon, TableCellsIcon } from '@heroicons/react/24/outline'
import { useCrawlingJobs, useStartCrawling } from '../hooks/useApi'
import { useApiStore } from '../stores/apiStore'
import CrawlingForm from '../components/CrawlingForm'
import JobsList from '../components/JobsList'
import JobsTable from '../components/JobsTable'
import SearchBox from '../components/SearchBox'
import { cn } from '../utils/cn'

type ViewMode = 'list' | 'table'

export default function Crawling() {
  const [showForm, setShowForm] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<ViewMode>('table')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  
  const { data: jobs, isLoading } = useCrawlingJobs()
  const startCrawling = useStartCrawling()
  const { apiKey } = useApiStore()

  const filteredJobs = React.useMemo(() => {
    if (!jobs) return []
    
    return jobs.filter(job => {
      const matchesSearch = searchQuery === '' || 
        job.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.id.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || job.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [jobs, searchQuery, statusFilter])

  const handleStartCrawling = async (data: { url: string; maxPages?: number; depth?: number }) => {
    try {
      await startCrawling.mutateAsync(data)
      setShowForm(false)
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  if (!apiKey) {
    return (
      <div className="text-center py-12">
        <div className="card p-8 max-w-md mx-auto">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            API Key Necessária
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Configure sua API key na aba "API Keys" para usar as funcionalidades de crawling.
          </p>
          <a
            href="/api-keys"
            className="btn-primary inline-flex items-center"
          >
            Configurar API Key
          </a>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gerenciamento de Crawling
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Inicie novos crawlings e monitore o progresso dos jobs ativos
          </p>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary inline-flex items-center gap-2"
          disabled={startCrawling.isPending}
        >
          <PlusIcon className="h-5 w-5" />
          {startCrawling.isPending ? 'Iniciando...' : 'Novo Crawling'}
        </button>
      </div>

      {/* Filters and Search */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="flex-1">
            <SearchBox
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Buscar por URL ou ID do job..."
            />
          </div>
          
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input text-sm"
            >
              <option value="all">Todos</option>
              <option value="pending">Pendente</option>
              <option value="running">Executando</option>
              <option value="completed">Concluído</option>
              <option value="failed">Falhado</option>
            </select>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-md p-1">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'p-2 rounded text-sm transition-colors',
                viewMode === 'table'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <TableCellsIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded text-sm transition-colors',
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <ListBulletIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Results count */}
        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          {isLoading ? (
            'Carregando jobs...'
          ) : (
            `${filteredJobs.length} de ${jobs?.length || 0} jobs encontrados`
          )}
        </div>
      </div>

      {/* Jobs Display */}
      <div className="card">
        {viewMode === 'table' ? (
          <JobsTable jobs={filteredJobs} isLoading={isLoading} />
        ) : (
          <JobsList jobs={filteredJobs} isLoading={isLoading} />
        )}
      </div>

      {/* Crawling Form Modal */}
      {showForm && (
        <CrawlingForm
          onSubmit={handleStartCrawling}
          onClose={() => setShowForm(false)}
          isLoading={startCrawling.isPending}
        />
      )}
    </motion.div>
  )
}