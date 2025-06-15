import React from 'react'
import { motion } from 'framer-motion'
import {
  CogIcon,
  BellIcon,
  PaintBrushIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import { useThemeStore } from '../stores/themeStore'
import { cn } from '../utils/cn'
import toast from 'react-hot-toast'

interface SettingsSection {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const sections: SettingsSection[] = [
  {
    id: 'appearance',
    title: 'Aparência',
    description: 'Personalize a interface do dashboard',
    icon: PaintBrushIcon,
  },
  {
    id: 'notifications',
    title: 'Notificações',
    description: 'Configure alertas e notificações',
    icon: BellIcon,
  },
  {
    id: 'crawling',
    title: 'Crawling',
    description: 'Configurações padrão para crawling',
    icon: GlobeAltIcon,
  },
  {
    id: 'security',
    title: 'Segurança',
    description: 'Configurações de segurança e privacidade',
    icon: ShieldCheckIcon,
  },
  {
    id: 'advanced',
    title: 'Avançado',
    description: 'Configurações avançadas e logs',
    icon: CogIcon,
  },
]

export default function Settings() {
  const [activeSection, setActiveSection] = React.useState('appearance')
  const { isDark, toggleTheme } = useThemeStore()
  
  // Mock settings state
  const [settings, setSettings] = React.useState({
    // Appearance
    theme: isDark ? 'dark' : 'light',
    compactMode: false,
    animations: true,
    language: 'pt-BR',
    
    // Notifications
    emailNotifications: true,
    pushNotifications: false,
    jobCompletionAlerts: true,
    errorAlerts: true,
    weeklyReports: false,
    
    // Crawling
    defaultMaxPages: 100,
    defaultDepth: 3,
    respectRobotsTxt: true,
    politeDelay: 1000,
    userAgent: 'ROI Labs Chatbot Training Bot',
    
    // Security
    sessionTimeout: 24,
    ipWhitelist: '',
    auditLogs: true,
    
    // Advanced
    debugMode: false,
    logLevel: 'info',
    cacheEnabled: true,
    compressionEnabled: true,
  })

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    
    // Handle special cases
    if (key === 'theme') {
      if (value === 'dark' && !isDark) {
        toggleTheme()
      } else if (value === 'light' && isDark) {
        toggleTheme()
      }
    }
    
    toast.success('Configuração atualizada!')
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Preferências de Aparência
              </h3>
              
              <div className="space-y-4">
                {/* Theme */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tema
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Escolha entre tema claro ou escuro
                    </p>
                  </div>
                  <select
                    value={settings.theme}
                    onChange={(e) => updateSetting('theme', e.target.value)}
                    className="input w-32"
                  >
                    <option value="light">Claro</option>
                    <option value="dark">Escuro</option>
                    <option value="auto">Automático</option>
                  </select>
                </div>
                
                {/* Compact Mode */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Modo Compacto
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Interface mais densa com menos espaçamento
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.compactMode}
                    onChange={(e) => updateSetting('compactMode', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>
                
                {/* Animations */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Animações
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Habilitar transições e animações
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.animations}
                    onChange={(e) => updateSetting('animations', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>
                
                {/* Language */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Idioma
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Idioma da interface
                    </p>
                  </div>
                  <select
                    value={settings.language}
                    onChange={(e) => updateSetting('language', e.target.value)}
                    className="input w-32"
                  >
                    <option value="pt-BR">Português</option>
                    <option value="en-US">English</option>
                    <option value="es-ES">Español</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )
        
      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Preferências de Notificação
              </h3>
              
              <div className="space-y-4">
                {/* Email Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Notificações por Email
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Receber notificações importantes por email
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => updateSetting('emailNotifications', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>
                
                {/* Push Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Notificações Push
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Notificações em tempo real no navegador
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.pushNotifications}
                    onChange={(e) => updateSetting('pushNotifications', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>
                
                {/* Job Completion */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Conclusão de Jobs
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Alertas quando jobs de crawling terminarem
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.jobCompletionAlerts}
                    onChange={(e) => updateSetting('jobCompletionAlerts', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>
                
                {/* Error Alerts */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Alertas de Erro
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Notificações quando ocorrerem erros
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.errorAlerts}
                    onChange={(e) => updateSetting('errorAlerts', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>
                
                {/* Weekly Reports */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Relatórios Semanais
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Resumo semanal de atividades por email
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.weeklyReports}
                    onChange={(e) => updateSetting('weeklyReports', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )
        
      case 'crawling':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Configurações de Crawling
              </h3>
              
              <div className="space-y-4">
                {/* Default Max Pages */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Máximo de Páginas (Padrão)
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Número máximo de páginas por crawling
                    </p>
                  </div>
                  <input
                    type="number"
                    value={settings.defaultMaxPages}
                    onChange={(e) => updateSetting('defaultMaxPages', parseInt(e.target.value))}
                    className="input w-24"
                    min="1"
                    max="10000"
                  />
                </div>
                
                {/* Default Depth */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Profundidade (Padrão)
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Níveis de profundidade para seguir links
                    </p>
                  </div>
                  <input
                    type="number"
                    value={settings.defaultDepth}
                    onChange={(e) => updateSetting('defaultDepth', parseInt(e.target.value))}
                    className="input w-24"
                    min="1"
                    max="10"
                  />
                </div>
                
                {/* Respect robots.txt */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Respeitar robots.txt
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Seguir as diretrizes do arquivo robots.txt
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.respectRobotsTxt}
                    onChange={(e) => updateSetting('respectRobotsTxt', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>
                
                {/* Polite Delay */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Delay entre Requests (ms)
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Tempo de espera entre requisições
                    </p>
                  </div>
                  <input
                    type="number"
                    value={settings.politeDelay}
                    onChange={(e) => updateSetting('politeDelay', parseInt(e.target.value))}
                    className="input w-32"
                    min="100"
                    max="10000"
                    step="100"
                  />
                </div>
                
                {/* User Agent */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    User Agent
                  </label>
                  <input
                    type="text"
                    value={settings.userAgent}
                    onChange={(e) => updateSetting('userAgent', e.target.value)}
                    className="input"
                    placeholder="ROI Labs Chatbot Training Bot"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    String de identificação enviada aos servidores
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
        
      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Configurações de Segurança
              </h3>
              
              <div className="space-y-4">
                {/* Session Timeout */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Timeout de Sessão (horas)
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Tempo até expirar a sessão automaticamente
                    </p>
                  </div>
                  <input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                    className="input w-24"
                    min="1"
                    max="720"
                  />
                </div>
                
                {/* IP Whitelist */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Lista de IPs Permitidos
                  </label>
                  <textarea
                    value={settings.ipWhitelist}
                    onChange={(e) => updateSetting('ipWhitelist', e.target.value)}
                    className="input h-24 resize-none"
                    placeholder="192.168.1.100
10.0.0.50
203.0.113.0/24"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Um IP ou CIDR por linha. Deixe vazio para permitir todos.
                  </p>
                </div>
                
                {/* Audit Logs */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Logs de Auditoria
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Registrar todas as ações dos usuários
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.auditLogs}
                    onChange={(e) => updateSetting('auditLogs', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )
        
      case 'advanced':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Configurações Avançadas
              </h3>
              
              <div className="space-y-4">
                {/* Debug Mode */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Modo Debug
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Habilitar informações detalhadas de debug
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.debugMode}
                    onChange={(e) => updateSetting('debugMode', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>
                
                {/* Log Level */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nível de Log
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Detalhamento dos logs do sistema
                    </p>
                  </div>
                  <select
                    value={settings.logLevel}
                    onChange={(e) => updateSetting('logLevel', e.target.value)}
                    className="input w-32"
                  >
                    <option value="error">Error</option>
                    <option value="warn">Warning</option>
                    <option value="info">Info</option>
                    <option value="debug">Debug</option>
                  </select>
                </div>
                
                {/* Cache */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Cache Habilitado
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Usar cache para melhorar performance
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.cacheEnabled}
                    onChange={(e) => updateSetting('cacheEnabled', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>
                
                {/* Compression */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Compressão Habilitada
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Comprimir respostas da API
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.compressionEnabled}
                    onChange={(e) => updateSetting('compressionEnabled', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Export/Import */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                Backup e Restauração
              </h4>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    const dataStr = JSON.stringify(settings, null, 2)
                    const dataBlob = new Blob([dataStr], {type: 'application/json'})
                    const url = URL.createObjectURL(dataBlob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = 'roi-labs-settings.json'
                    link.click()
                    toast.success('Configurações exportadas!')
                  }}
                  className="btn-secondary"
                >
                  Exportar Configurações
                </button>
                
                <label className="btn-secondary cursor-pointer">
                  Importar Configurações
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = (event) => {
                          try {
                            const importedSettings = JSON.parse(event.target?.result as string)
                            setSettings({...settings, ...importedSettings})
                            toast.success('Configurações importadas!')
                          } catch (error) {
                            toast.error('Arquivo inválido!')
                          }
                        }
                        reader.readAsText(file)
                      }
                    }}
                  />
                </label>
                
                <button
                  onClick={() => {
                    if (confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
                      // Reset to defaults
                      setSettings({
                        theme: 'light',
                        compactMode: false,
                        animations: true,
                        language: 'pt-BR',
                        emailNotifications: true,
                        pushNotifications: false,
                        jobCompletionAlerts: true,
                        errorAlerts: true,
                        weeklyReports: false,
                        defaultMaxPages: 100,
                        defaultDepth: 3,
                        respectRobotsTxt: true,
                        politeDelay: 1000,
                        userAgent: 'ROI Labs Chatbot Training Bot',
                        sessionTimeout: 24,
                        ipWhitelist: '',
                        auditLogs: true,
                        debugMode: false,
                        logLevel: 'info',
                        cacheEnabled: true,
                        compressionEnabled: true,
                      })
                      toast.success('Configurações restauradas!')
                    }
                  }}
                  className="btn-secondary text-red-600 dark:text-red-400"
                >
                  Restaurar Padrões
                </button>
              </div>
            </div>
          </div>
        )
        
      default:
        return null
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Configurações
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Personalize sua experiência e configure as preferências do sistema
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <nav className="space-y-1">
            {sections.map((section) => {
              const isActive = activeSection === section.id
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <section.icon
                      className={cn(
                        'h-5 w-5',
                        isActive
                          ? 'text-primary-700 dark:text-primary-400'
                          : 'text-gray-400'
                      )}
                    />
                    <div>
                      <div className="font-medium">{section.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {section.description}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="card p-6">
            {renderSection()}
          </div>
        </div>
      </div>
    </motion.div>
  )
}