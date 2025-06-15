import { useState } from 'react'
import { useThemeStore } from '../stores/themeStore'
import {
  ChartBarIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import DateRangePicker from '../components/DateRangePicker'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const Analytics = () => {
  const { isDark } = useThemeStore()
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })

  const chartData = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    datasets: [
      {
        label: 'Páginas Crawled',
        data: [12, 19, 3, 5, 2, 3],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Atividade de Crawling',
      },
    },
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ChartBarIcon className="h-8 w-8" />
              Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Análise detalhada das atividades de crawling
            </p>
          </div>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <DocumentChartBarIcon className="h-5 w-5" />
              Estatísticas Gerais
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">1,234</p>
                <p className="text-sm text-gray-500">Total de Páginas</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">98.5%</p>
                <p className="text-sm text-gray-500">Taxa de Sucesso</p>
              </div>
            </div>
          </div>

          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics