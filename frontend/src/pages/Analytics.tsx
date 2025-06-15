import React from 'react'
import { motion } from 'framer-motion'
import {
  ChartBarIcon,
  ClockIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  CalendarIcon,
  ArrowDownIcon,
  ArrowUpIcon,
} from '@heroicons/react/24/outline'
import { useCrawlingJobs, useSystemStats } from '../hooks/useApi'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { useThemeStore } from '../stores/themeStore'
import { format, subDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import StatsCard from '../components/StatsCard'
import DateRangePicker from '../components/DateRangePicker'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

export default function Analytics() {
  const [dateRange, setDateRange] = React.useState({
    start: subDays(new Date(), 30),
    end: new Date()
  })
  
  const { data: jobs, isLoading } = useCrawlingJobs()
  const { data: stats } = useSystemStats()
  const { isDark } = useThemeStore()

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: isDark ? '#e5e7eb' : '#374151',
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: isDark ? '#9ca3af' : '#6b7280',
        },
        grid: {
          color: isDark ? '#374151' : '#e5e7eb',
        },
      },
      y: {
        ticks: {
          color: isDark ? '#9ca3af' : '#6b7280',
        },
        grid: {
          color: isDark ? '#374151' : '#e5e7eb',
        },
      },
    },
  }

  // Process jobs data for analytics
  const analyticsData = React.useMemo(() => {
    if (!jobs) return null

    const filteredJobs = jobs.filter(job => {
      const jobDate = parseISO(job.created_at)
      return jobDate >= dateRange.start && jobDate <= dateRange.end
    })

    // Jobs by status
    const statusCounts = filteredJobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Jobs over time (daily)
    const dailyJobs = filteredJobs.reduce((acc, job) => {
      const date = format(parseISO(job.created_at), 'yyyy-MM-dd')
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Average pages per job
    const completedJobs = filteredJobs.filter(job => job.status === 'completed')
    const avgPages = completedJobs.length > 0 
      ? completedJobs.reduce((sum, job) => sum + job.pages_crawled, 0) / completedJobs.length
      : 0

    // Success rate
    const successRate = filteredJobs.length > 0
      ? (completedJobs.length / filteredJobs.length) * 100
      : 0

    return {
      statusCounts,
      dailyJobs,
      avgPages: Math.round(avgPages),
      successRate: Math.round(successRate),
      totalJobs: filteredJobs.length,
      totalPages: completedJobs.reduce((sum, job) => sum + job.pages_crawled, 0)
    }
  }, [jobs, dateRange])

  // Chart data
  const lineChartData = {
    labels: analyticsData ? Object.keys(analyticsData.dailyJobs).sort() : [],
    datasets: [
      {
        label: 'Jobs por Dia',
        data: analyticsData ? Object.keys(analyticsData.dailyJobs).sort().map(date => analyticsData.dailyJobs[date]) : [],
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f6',
        tension: 0.4,
      },
    ],
  }

  const doughnutChartData = {
    labels: ['Concluído', 'Executando', 'Pendente', 'Falhado'],
    datasets: [
      {
        data: analyticsData ? [
          analyticsData.statusCounts.completed || 0,
          analyticsData.statusCounts.running || 0,
          analyticsData.statusCounts.pending || 0,
          analyticsData.statusCounts.failed || 0,
        ] : [0, 0, 0, 0],
        backgroundColor: ['#10b981', '#f59e0b', '#6b7280', '#ef4444'],
        borderWidth: 0,
      },
    ],
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5">
              <div className="loading-skeleton h-4 w-16 mb-2" />
              <div className="loading-skeleton h-8 w-24" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="loading-skeleton h-6 w-32 mb-4" />
            <div className="loading-skeleton h-64 w-full" />
          </div>
          <div className="card p-6">
            <div className="loading-skeleton h-6 w-32 mb-4" />
            <div className="loading-skeleton h-64 w-full" />
          </div>
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
            Analytics & Relatórios
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Analise o desempenho e estatísticas dos seus crawlings
          </p>
        </div>
        
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
        />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Jobs"
          value={analyticsData?.totalJobs.toString() || '0'}
          icon={ChartBarIcon}
          color="primary"
          subtitle={`no período selecionado`}
        />
        
        <StatsCard
          title="Taxa de Sucesso"
          value={`${analyticsData?.successRate || 0}%`}
          icon={ArrowUpIcon}
          color={analyticsData && analyticsData.successRate >= 80 ? 'success' : 'warning'}
          subtitle="jobs concluídos com sucesso"
        />
        
        <StatsCard
          title="Páginas Crawled"
          value={analyticsData?.totalPages.toString() || '0'}
          icon={DocumentTextIcon}
          color="success"
          subtitle={`média: ${analyticsData?.avgPages || 0} por job`}
        />
        
        <StatsCard
          title="Média Diária"
          value={analyticsData ? Math.round(analyticsData.totalJobs / 30).toString() : '0'}
          icon={CalendarIcon}
          color="primary"
          subtitle="jobs por dia"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Jobs ao Longo do Tempo
          </h3>
          <div className="h-64">
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </div>

        {/* Doughnut Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Status dos Jobs
          </h3>
          <div className="h-64 flex items-center justify-center">
            <div className="w-48 h-48">
              <Doughnut data={doughnutChartData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Análise Detalhada por Status
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quantidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Porcentagem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Páginas Médias
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {analyticsData && Object.entries(analyticsData.statusCounts).map(([status, count]) => {
                const percentage = analyticsData.totalJobs > 0 ? (count / analyticsData.totalJobs) * 100 : 0
                const statusJobs = jobs?.filter(job => job.status === status) || []
                const avgPagesForStatus = statusJobs.length > 0 
                  ? statusJobs.reduce((sum, job) => sum + job.pages_crawled, 0) / statusJobs.length 
                  : 0
                
                return (
                  <tr key={status}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`status-dot mr-2 ${
                          status === 'completed' ? 'status-online' :
                          status === 'running' ? 'status-warning' :
                          status === 'failed' ? 'status-offline' :
                          'bg-gray-400'
                        }`} />
                        <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {status === 'completed' ? 'Concluído' :
                           status === 'running' ? 'Executando' :
                           status === 'pending' ? 'Pendente' :
                           status === 'failed' ? 'Falhado' : status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {percentage.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {Math.round(avgPagesForStatus)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}