import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../utils/cn'

interface StatsCardProps {
  title: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  color: 'primary' | 'success' | 'warning' | 'error'
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  loading?: boolean
}

const colorClasses = {
  primary: {
    icon: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    trend: 'text-blue-600 dark:text-blue-400'
  },
  success: {
    icon: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
    trend: 'text-green-600 dark:text-green-400'
  },
  warning: {
    icon: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    trend: 'text-yellow-600 dark:text-yellow-400'
  },
  error: {
    icon: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    trend: 'text-red-600 dark:text-red-400'
  }
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
  trend,
  loading = false
}: StatsCardProps) {
  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="loading-skeleton w-12 h-12 rounded-lg" />
          </div>
          <div className="ml-4 flex-1">
            <div className="loading-skeleton h-4 w-16 mb-2" />
            <div className="loading-skeleton h-6 w-20" />
          </div>
        </div>
      </div>
    )
  }

  const colors = colorClasses[color]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card p-6 hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={cn('inline-flex items-center justify-center p-3 rounded-lg', colors.bg)}>
            <Icon className={cn('h-6 w-6', colors.icon)} />
          </div>
        </div>
        <div className="ml-4 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
              {title}
            </p>
            {trend && (
              <div className={cn('flex items-center text-sm', colors.trend)}>
                <span className="font-medium">
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
              </div>
            )}
          </div>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}