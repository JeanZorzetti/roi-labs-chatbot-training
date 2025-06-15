import React from 'react'
import { useThemeStore } from '../stores/themeStore'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { type Job } from '../types/crawling'

interface JobsTableProps {
  jobs: Job[]
  onRefresh?: () => void
  onCancel?: (id: string) => void
  onDelete?: (id: string) => void
}

const JobsTable: React.FC<JobsTableProps> = ({ jobs, onRefresh, onCancel, onDelete }) => {
  const { isDark } = useThemeStore()

  const getStatusBadge = (status: Job['status']) => {
    const baseClasses = 'inline-block px-2 py-1 rounded-full text-xs font-medium'
    
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'running':
        return `${baseClasses} bg-blue-100 text-blue-800`
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800`
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
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
        <h2 className="text-xl font-semibold">Histórico Detalhado</h2>
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
          Nenhum histórico disponível.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <th className="text-left py-3 px-4 font-medium">URL</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
                <th className="text-left py-3 px-4 font-medium">Progresso</th>
                <th className="text-left py-3 px-4 font-medium">Páginas</th>
                <th className="text-left py-3 px-4 font-medium">Criado</th>
                <th className="text-left py-3 px-4 font-medium">Concluído</th>
                {(onCancel || onDelete) && (
                  <th className="text-left py-3 px-4 font-medium">Ações</th>
                )}
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr
                  key={job.id}
                  className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} hover:${
                    isDark ? 'bg-gray-750' : 'bg-gray-50'
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="max-w-xs truncate" title={job.url}>
                      {job.url}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={getStatusBadge(job.status)}>
                      {getStatusText(job.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {job.status === 'running' ? (
                      <div className="flex items-center gap-2">
                        <div className={`w-16 h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                          <div
                            className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                        <span className="text-sm">{job.progress}%</span>
                      </div>
                    ) : job.status === 'completed' ? (
                      <span className="text-green-600 font-medium">100%</span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm">
                      {job.pagesCrawled || 0} / {job.pagesFound || 0}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm">
                      {new Date(job.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm">
                      {job.completedAt 
                        ? new Date(job.completedAt).toLocaleDateString('pt-BR')
                        : '-'
                      }
                    </span>
                  </td>
                  {(onCancel || onDelete) && (
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {onCancel && job.status === 'running' && (
                          <button
                            onClick={() => onCancel(job.id)}
                            className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors"
                          >
                            Cancelar
                          </button>
                        )}
                        {onDelete && (job.status === 'completed' || job.status === 'failed') && (
                          <button
                            onClick={() => onDelete(job.id)}
                            className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
                          >
                            Deletar
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default JobsTable