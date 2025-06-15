import React, { useState } from 'react'
import { useThemeStore } from '../stores/themeStore'
import { PlayIcon } from '@heroicons/react/24/outline'

interface CrawlingFormProps {
  onSubmit: (data: { url: string; maxPages: number; depth: number }) => void
  isLoading?: boolean
}

const CrawlingForm: React.FC<CrawlingFormProps> = ({ onSubmit, isLoading = false }) => {
  const { isDark } = useThemeStore()
  const [url, setUrl] = useState('')
  const [maxPages, setMaxPages] = useState(50)
  const [depth, setDepth] = useState(3)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      onSubmit({ url: url.trim(), maxPages, depth })
    }
  }

  return (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <PlayIcon className="h-5 w-5" />
        Iniciar Crawling
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            URL do Website
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
            className={`w-full px-3 py-2 border rounded-md ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Máximo de Páginas
            </label>
            <input
              type="number"
              value={maxPages}
              onChange={(e) => setMaxPages(parseInt(e.target.value) || 50)}
              min="1"
              max="1000"
              className={`w-full px-3 py-2 border rounded-md ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Profundidade
            </label>
            <input
              type="number"
              value={depth}
              onChange={(e) => setDepth(parseInt(e.target.value) || 3)}
              min="1"
              max="10"
              className={`w-full px-3 py-2 border rounded-md ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className={`w-full px-4 py-2 rounded-md transition-colors ${
            isLoading || !url.trim()
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white font-medium`}
        >
          {isLoading ? 'Iniciando...' : 'Iniciar Crawling'}
        </button>
      </form>
    </div>
  )
}

export default CrawlingForm