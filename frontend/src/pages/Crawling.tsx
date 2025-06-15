import { useState } from 'react'
import { useThemeStore } from '../stores/themeStore'
import { CogIcon } from '@heroicons/react/24/outline'
import CrawlingForm from '../components/CrawlingForm'
import JobsList from '../components/JobsList'
import JobsTable from '../components/JobsTable'

const Crawling = () => {
  const { isDark } = useThemeStore()
  const [jobs] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const handleStartCrawling = async (data: { url: string; maxPages: number; depth: number }) => {
    setIsLoading(true)
    console.log('Starting crawling:', data)
    // Simular API call
    setTimeout(() => {
      setIsLoading(false)
    }, 2000)
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CogIcon className="h-8 w-8" />
            Gerenciamento de Crawling
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Configure e monitore seus jobs de crawling
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <CrawlingForm onSubmit={handleStartCrawling} isLoading={isLoading} />
          </div>
          <div className="lg:col-span-2">
            <JobsList jobs={jobs} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <JobsTable jobs={jobs} />
        </div>
      </div>
    </div>
  )
}

export default Crawling