import React from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HomeIcon,
  GlobeAltIcon,
  ChartBarIcon,
  KeyIcon,
  CogIcon,
  SunIcon,
  MoonIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useThemeStore } from '../stores/themeStore'
import { useHealth } from '../hooks/useApi'
import { cn } from '../utils/cn'

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Crawling', href: '/crawling', icon: GlobeAltIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'API Keys', href: '/api-keys', icon: KeyIcon },
  { name: 'Configurações', href: '/settings', icon: CogIcon },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const { isDark, toggleTheme } = useThemeStore()
  const { data: health } = useHealth()
  const location = useLocation()

  return (
    <div className="h-full">
      {/* Mobile sidebar */}
      <motion.div
        initial={false}
        animate={{ x: sidebarOpen ? 0 : '-100%' }}
        className="fixed inset-0 z-50 lg:hidden"
      >
        <div className="fixed inset-0 bg-gray-600/75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 shadow-xl">
          <div className="flex h-16 items-center justify-between px-6">
            <img className="h-8 w-auto" src="/logo.svg" alt="ROI Labs" />
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-700 dark:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="mt-8">
            <SidebarNavigation currentPath={location.pathname} />
          </nav>
        </div>
      </motion.div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
          <div className="flex h-16 shrink-0 items-center px-6">
            <img className="h-8 w-auto" src="/logo.svg" alt="ROI Labs" />
          </div>
          <nav className="flex flex-1 flex-col px-6">
            <SidebarNavigation currentPath={location.pathname} />
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-300 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-x-4">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
              </h1>
              
              {/* System status */}
              {health && (
                <div className="flex items-center gap-x-2">
                  <div className={cn(
                    'status-dot',
                    health.status === 'healthy' ? 'status-online' : 'status-offline'
                  )} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {health.status === 'healthy' ? 'Online' : 'Offline'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-x-4">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                {isDark ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </button>
              
              {/* Version info */}
              {health && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  v{health.version}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

function SidebarNavigation({ currentPath }: { currentPath: string }) {
  return (
    <ul role="list" className="flex flex-1 flex-col gap-y-7">
      <li>
        <ul role="list" className="-mx-2 space-y-1">
          {navigation.map((item) => {
            const isActive = currentPath === item.href
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={cn(
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:text-primary-700 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800',
                    'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium transition-colors'
                  )}
                >
                  <item.icon
                    className={cn(
                      isActive
                        ? 'text-primary-700 dark:text-primary-400'
                        : 'text-gray-400 group-hover:text-primary-700 dark:group-hover:text-primary-400',
                      'h-6 w-6 shrink-0 transition-colors'
                    )}
                  />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </li>
    </ul>
  )
}