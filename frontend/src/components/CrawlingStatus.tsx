import React from 'react'
import { motion } from 'framer-motion'
import {
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { cn } from '../utils/cn'

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

interface CrawlingStatusProps {
  jobs: CrawlingJob[]
  isLoading: boolean
}

const statusConfig = {
  pending: {
    icon: ClockIcon,
    color: 'text-gray-500',
    bg: 'bg-gray-100 dark:bg-gray-800',
    label: 'Pendente'
  },
  running: {
    icon: PlayIcon,
    color: 'text-blue-500',
    bg: 'bg-blue-100 dark:bg-blue-900/20',
    label: 'Executando'
  },
  completed: {
    icon: CheckCircleIcon,
    color: 'text-green-500',
    bg: 'bg-green-100 dark:bg-green-900/20',
    label: 'Concluído'
  },
  failed: {
    icon: XCircleIcon,
    color: 'text-red-500',
    bg: 'bg-red-100 dark:bg-red-900/20',
    label: 'Falhado'
  }
}

export default function CrawlingStatus({ jobs, isLoading }: CrawlingStatusProps) {
  const activeJobs = jobs.filter(job => job.status === 'running')
  const recentJobs = jobs.slice(0, 5)

  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="loading-skeleton h-6 w-32 mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="loading-skeleton w-8 h-8 rounded-full" />
              <div className="flex-1">
                <div className="loading-skeleton h-4 w-full mb-1" />
                <div className="loading-skeleton h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Status do Crawling
        </h3>
        <div className="flex items-center gap-2">
          <div className={cn(
            'status-dot',
            activeJobs.length > 0 ? 'status-warning' : 'status-online'
          )} />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {activeJobs.length} ativo{activeJobs.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-8">
          <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            Nenhum job de crawling encontrado
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Inicie um novo crawling para ver o status aqui
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentJobs.map((job, index) => {
            const config = statusConfig[job.status]
            const Icon = config.icon
            
            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className={cn('p-2 rounded-full', config.bg)}>
                  <Icon className={cn('h-4 w-4', config.color)} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {new URL(job.url).hostname}
                    </p>
                    <span className={cn('text-xs font-medium', config.color)}>
                      {config.label}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {job.pages_crawled} de {job.total_pages || '?'} páginas
                    </p>
                    {job.status === 'running' && (
                      <span className="text-xs text-blue-600 dark:text-blue-400">
                        {job.progress}%
                      </span>
                    )}
                  </div>
                  
                  {job.status === 'running' && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <motion.div
                          className="bg-blue-600 dark:bg-blue-500 h-1.5 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${job.progress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {job.status === 'failed' && job.error_message && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 truncate">
                      {job.error_message}
                    </p>
                  )}
                </div>
              </motion.div>
            )
          })}
          
          {jobs.length > 5 && (
            <div className="text-center pt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Mostrando {recentJobs.length} de {jobs.length} jobs
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}