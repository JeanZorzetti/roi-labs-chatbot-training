import React from 'react'
import { useThemeStore } from '../stores/themeStore'
import { ClockIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface Job {
  id: string
  url: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  createdAt: string
  completedAt?: string
  pagesFound: number
  pagesCrawled: number
}

interface JobsListProps {
  jobs: Job[]
  onRefresh?: () => void
  onCancel?: (id: string) => void
  onDelete?: (id: string) => void
}

const JobsList: React.FC<JobsListProps> = ({ jobs, onRefresh, onCancel, onDelete }) => {
  const { isDark } = useThemeStore()

  const getStatusIcon = (status: Job['status']) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'running':
        return <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  const getStatusText = (status: Job['status']) => {
    switch (status) {
      case 'pending':
        return 'Pendente'
      case 'running':
        return 'Executando'
      case 'completed':
        return 'Concluído'
      case 'failed':
        return 'Falhou'
      default:
        return status
    }
  }

  return (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Jobs Recentes</h2>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className={`p-2 rounded-lg hover:${isDark ? 'bg-gray-700' : 'bg-gray-100'} transition-colors`}
            title="Atualizar"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {jobs.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          Nenhum job encontrado. Inicie um crawling para começar.
        </p>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className={`p-4 rounded-lg border ${
                isDark ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(job.status)}
                  <div>
                    <p className="font-medium truncate max-w-xs">{job.url}</p>
                    <p className="text-sm text-gray-500">
                      Criado em {new Date(job.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    job.status === 'completed' ? 'bg-green-100 text-green-800' :
                    job.status === 'running' ? 'bg-blue-100 text-blue-800' :
                    job.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {getStatusText(job.status)}
                  </span>
                  {job.status === 'running' && (
                    <div className="mt-2">
                      <div className={`w-24 h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div
                          className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{job.progress}%</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Botões de ação */}
              {(onCancel || onDelete) && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                  {onCancel && job.status === 'running' && (
                    <button
                      onClick={() => onCancel(job.id)}
                      className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                  {onDelete && (job.status === 'completed' || job.status === 'failed') && (
                    <button
                      onClick={() => onDelete(job.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
                    >
                      Deletar
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default JobsList