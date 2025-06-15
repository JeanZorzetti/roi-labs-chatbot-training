import React from 'react'
import { motion } from 'framer-motion'
import {
  CpuChipIcon,
  ServerIcon,
  CircleStackIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline'
import { cn } from '../utils/cn'

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

interface SystemStats {
  uptime: number
  memory: any
  version: string
  platform: string
  rate_limiting: any
}

interface SystemMetricsProps {
  health?: HealthData
  stats?: SystemStats
  isLoading: boolean
}

export default function SystemMetrics({ health, stats, isLoading }: SystemMetricsProps) {
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) {
      return `${days}d ${hours}h`
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="loading-skeleton h-6 w-32 mb-4" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="loading-skeleton w-8 h-8 rounded" />
                <div className="loading-skeleton h-4 w-20" />
              </div>
              <div className="loading-skeleton h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const memoryUsed = health?.memory?.used ? parseInt(health.memory.used.replace(' MB', '')) : 0
  const memoryTotal = health?.memory?.total ? parseInt(health.memory.total.replace(' MB', '')) : 0
  const memoryPercentage = memoryTotal > 0 ? (memoryUsed / memoryTotal) * 100 : 0

  const metrics = [
    {
      icon: ServerIcon,
      label: 'Sistema',
      value: health?.status === 'healthy' ? 'Online' : 'Offline',
      color: health?.status === 'healthy' ? 'text-green-600' : 'text-red-600',
      detail: health ? `v${health.version} - ${health.environment}` : ''
    },
    {
      icon: CpuChipIcon,
      label: 'Uptime',
      value: health?.uptime ? formatUptime(health.uptime) : 'N/A',
      color: 'text-blue-600',
      detail: stats ? `Node.js ${stats.version}` : ''
    },
    {
      icon: CircleStackIcon,
      label: 'Memória',
      value: health?.memory?.used || 'N/A',
      color: memoryPercentage > 80 ? 'text-red-600' : memoryPercentage > 60 ? 'text-yellow-600' : 'text-green-600',
      detail: health?.memory?.total ? `de ${health.memory.total}` : '',
      progress: memoryPercentage
    },
    {
      icon: GlobeAltIcon,
      label: 'Database',
      value: health?.database?.status === 'connected' ? 'Conectado' : 'Desconectado',
      color: health?.database?.status === 'connected' ? 'text-green-600' : 'text-red-600',
      detail: health?.database?.responseTime || ''
    }
  ]

  return (
    <div className="card p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Métricas do Sistema
      </h3>

      <div className="space-y-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-gray-700 rounded-lg">
                  <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {metric.label}
                  </p>
                  {metric.detail && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {metric.detail}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <p className={cn('text-sm font-medium', metric.color)}>
                  {metric.value}
                </p>
                {metric.progress !== undefined && (
                  <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-1">
                    <div
                      className={cn(
                        'h-1 rounded-full transition-all duration-500',
                        metric.progress > 80 ? 'bg-red-500' :
                        metric.progress > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      )}
                      style={{ width: `${Math.min(metric.progress, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Configuration Status */}
      {health?.config && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Status da Configuração
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(health.config).map(([key, status]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400 capitalize">
                  {key.replace('_', ' ')}
                </span>
                <span className={cn(
                  'font-medium',
                  status === 'configured' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                )}>
                  {status === 'configured' ? '✓' : '✗'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}