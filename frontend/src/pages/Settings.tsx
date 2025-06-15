import { useState } from 'react'
import { useThemeStore } from '../stores/themeStore'
import {
  CogIcon,
  MoonIcon,
  SunIcon,
  BellIcon,
  ShieldCheckIcon,
  ServerIcon,
} from '@heroicons/react/24/outline'

const Settings = () => {
  const { isDark, toggleTheme } = useThemeStore()
  const [notifications, setNotifications] = useState(true)
  const [autoSave, setAutoSave] = useState(true)

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CogIcon className="h-8 w-8" />
            Configurações
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Personalize sua experiência no dashboard
          </p>
        </div>

        <div className="space-y-6">
          {/* Tema */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              {isDark ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
              Aparência
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Tema Escuro</p>
                <p className="text-sm text-gray-500">
                  Ative o modo escuro para uma experiência mais confortável
                </p>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isDark ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isDark ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Notificações */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BellIcon className="h-5 w-5" />
              Notificações
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notificações Push</p>
                  <p className="text-sm text-gray-500">
                    Receba notificações sobre o status dos crawlings
                  </p>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Sistema */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ServerIcon className="h-5 w-5" />
              Sistema
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Salvamento Automático</p>
                  <p className="text-sm text-gray-500">
                    Salva automaticamente as configurações
                  </p>
                </div>
                <button
                  onClick={() => setAutoSave(!autoSave)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoSave ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoSave ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Segurança */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ShieldCheckIcon className="h-5 w-5" />
              Segurança
            </h2>
            <div className="space-y-4">
              <button className="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-750">
                <p className="font-medium">Alterar API Key</p>
                <p className="text-sm text-gray-500">
                  Configure suas credenciais de acesso
                </p>
              </button>
              
              <button className="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-750">
                <p className="font-medium">Limpar Cache</p>
                <p className="text-sm text-gray-500">
                  Remove dados temporários armazenados
                </p>
              </button>
            </div>
          </div>

          {/* Informações */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
            <h2 className="text-xl font-semibold mb-4">Informações do Sistema</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Versão:</span>
                <span>1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Última Atualização:</span>
                <span>15/06/2025</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ambiente:</span>
                <span>Produção</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings