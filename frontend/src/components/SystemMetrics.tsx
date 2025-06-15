import { useState, useEffect } from 'react'
import { useThemeStore } from '../stores/themeStore'
import { CpuChipIcon, ServerIcon, ClockIcon } from '@heroicons/react/24/outline'

interface SystemStats {
  cpu: number
  memory: number
  uptime: number
  status: 'online' | 'offline' | 'warning'
}

const SystemMetrics = () => {
  const { isDark } = useThemeStore()
  const [stats, setStats] = useState<SystemStats>({
    cpu: 0,
    memory: 0,
    uptime: 0,
    status: 'online'
  })

  useEffect(() => {
    // Simular dados do sistema
    const interval = setInterval(() => {
      setStats({
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        uptime: Date.now(),
        status: 'online'
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const formatUptime = (timestamp: number) => {
    const hours = Math.floor(timestamp / (1000 * 60 * 60)) % 24
    return `${hours}h`
  }

  return (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
      <h2 className="text-xl font-semibold mb-4">Métricas do Sistema</h2>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <CpuChipIcon className="h-8 w-8 mx-auto mb-2 text-blue-500" />
          <p className="text-2xl font-bold">{stats.cpu.toFixed(1)}%</p>
          <p className="text-sm text-gray-500">CPU</p>
        </div>
        
        <div className="text-center">
          <ServerIcon className="h-8 w-8 mx-auto mb-2 text-green-500" />
          <p className="text-2xl font-bold">{stats.memory.toFixed(1)}%</p>
          <p className="text-sm text-gray-500">Memória</p>
        </div>
        
        <div className="text-center">
          <ClockIcon className="h-8 w-8 mx-auto mb-2 text-purple-500" />
          <p className="text-2xl font-bold">{formatUptime(stats.uptime)}</p>
          <p className="text-sm text-gray-500">Uptime</p>
        </div>
      </div>
      
      <div className={`mt-4 p-3 rounded-md ${
        stats.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        <p className="text-sm text-center font-medium">
          Sistema {stats.status === 'online' ? 'Online' : 'Offline'}
        </p>
      </div>
    </div>
  )
}

export default SystemMetrics