import { useState } from 'react'
import { useThemeStore } from '../stores/themeStore'
import SystemMetrics from '../components/SystemMetrics'
import SearchBox from '../components/SearchBox'
import CrawlingStatus from '../components/CrawlingStatus'

const Dashboard = () => {
  const { isDark } = useThemeStore()
  const [jobs] = useState([])
  const [isLoading] = useState(false)

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitore o status do sistema e gerencie suas operações de crawling
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <SystemMetrics />
          </div>
          <div>
            <SearchBox />
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <CrawlingStatus jobs={jobs} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}

export default Dashboard