import { useState, useEffect } from 'react'
import { useApiStore } from '../stores/apiStore'
import { apiService } from '../utils/apiService'
import { KeyIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface ApiConfigPanelProps {
  onConfigured?: () => void
}

const ApiConfigPanel = ({ onConfigured }: ApiConfigPanelProps) => {
  const { apiKey, baseUrl, setApiKey, setBaseUrl } = useApiStore()
  const [tempApiKey, setTempApiKey] = useState(apiKey || 'test-frontend-key-2025')
  const [tempBaseUrl, setTempBaseUrl] = useState(baseUrl || window.location.origin)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [isExpanded, setIsExpanded] = useState(!apiKey)

  useEffect(() => {
    // Auto-teste na montagem se já houver configuração
    if (apiKey) {
      testConnection()
    }
  }, [])

  const testConnection = async () => {
    setIsTestingConnection(true)
    setConnectionStatus('idle')

    try {
      const health = await apiService.healthCheck()
      console.log('🏥 Health check result:', health)
      setConnectionStatus('success')
      onConfigured?.()
    } catch (error) {
      console.error('❌ Connection test failed:', error)
      setConnectionStatus('error')
    } finally {
      setIsTestingConnection(false)
    }
  }

  const saveConfiguration = () => {
    setApiKey(tempApiKey)
    setBaseUrl(tempBaseUrl)
    testConnection()
  }

  const resetToDefaults = () => {
    const defaultApiKey = 'test-frontend-key-2025'
    const defaultBaseUrl = window.location.origin
    
    setTempApiKey(defaultApiKey)
    setTempBaseUrl(defaultBaseUrl)
    setApiKey(defaultApiKey)
    setBaseUrl(defaultBaseUrl)
    
    setTimeout(testConnection, 100)
  }

  return (
    <div className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <KeyIcon className="h-5 w-5 text-blue-500" />
          <h3 className="font-medium text-gray-900 dark:text-white">
            Configuração da API
          </h3>
          {connectionStatus === 'success' && (
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
          )}
          {connectionStatus === 'error' && (
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
          )}
        </div>
        <span className="text-sm text-gray-500">
          {isExpanded ? 'Fechar' : 'Expandir'}
        </span>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              API Key
            </label>
            <input
              type="password"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              placeholder="Sua API key"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Base URL
            </label>
            <input
              type="url"
              value={tempBaseUrl}
              onChange={(e) => setTempBaseUrl(e.target.value)}
              placeholder="http://localhost:3001"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={saveConfiguration}
              disabled={isTestingConnection}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isTestingConnection ? 'Testando...' : 'Salvar & Testar'}
            </button>
            <button
              onClick={resetToDefaults}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              Padrão
            </button>
          </div>

          {/* Status da conexão */}
          <div className="p-3 rounded-md text-sm">
            {connectionStatus === 'success' && (
              <div className="text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-900/20 p-2 rounded">
                ✅ Conexão estabelecida com sucesso!
              </div>
            )}
            {connectionStatus === 'error' && (
              <div className="text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-900/20 p-2 rounded">
                ❌ Erro de conexão. Verifique a API key e URL.
              </div>
            )}
            {connectionStatus === 'idle' && apiKey && (
              <div className="text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/20 p-2 rounded">
                🔄 Pronto para testar conexão
              </div>
            )}
          </div>

          {/* Informações de debug */}
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer hover:text-gray-700">
              Informações de Debug
            </summary>
            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded">
              <p><strong>URL atual:</strong> {window.location.origin}</p>
              <p><strong>API configurada:</strong> {tempBaseUrl}</p>
              <p><strong>API Key:</strong> {tempApiKey ? '***' + tempApiKey.slice(-4) : 'Não configurada'}</p>
            </div>
          </details>
        </div>
      )}
    </div>
  )
}

export default ApiConfigPanel