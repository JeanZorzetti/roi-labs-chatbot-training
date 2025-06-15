import { useState } from 'react'
import { useApiStore } from '../stores/apiStore'
import { useThemeStore } from '../stores/themeStore'
import { EyeIcon, EyeSlashIcon, KeyIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

const ApiKeys = () => {
  const { isDark } = useThemeStore()
  const { apiKey, baseUrl, setApiKey, setBaseUrl } = useApiStore()
  const [showApiKey, setShowApiKey] = useState(false)
  const [tempApiKey, setTempApiKey] = useState(apiKey)
  const [tempBaseUrl, setTempBaseUrl] = useState(baseUrl)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setApiKey(tempApiKey)
    setBaseUrl(tempBaseUrl)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <KeyIcon className="h-8 w-8" />
            Configuração da API
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Configure suas credenciais de acesso à API
          </p>
        </div>

        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                URL Base da API
              </label>
              <input
                type="url"
                value={tempBaseUrl}
                onChange={(e) => setTempBaseUrl(e.target.value)}
                placeholder="https://api.example.com"
                className={`w-full px-3 py-2 border rounded-md ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder="sua-api-key-aqui"
                  className={`w-full px-3 py-2 border rounded-md pr-10 ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showApiKey ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors"
              >
                Salvar Configurações
              </button>
              
              {saved && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircleIcon className="h-5 w-5" />
                  <span className="text-sm">Configurações salvas!</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`mt-6 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
          <h2 className="text-xl font-semibold mb-4">Como usar</h2>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <p>1. Configure a URL base da sua API (ex: https://api.roilabs.com.br)</p>
            <p>2. Insira sua API key de acesso</p>
            <p>3. Clique em "Salvar Configurações"</p>
            <p>4. As configurações serão salvas localmente no seu navegador</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApiKeys