import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { useThemeStore } from './stores/themeStore'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Crawling from './pages/Crawling'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import ApiKeys from './pages/ApiKeys'
import { cn } from './utils/cn'

function App() {
  const { isDark } = useThemeStore()

  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  return (
    <div className={cn('min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300')}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="crawling" element={<Crawling />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="api-keys" element={<ApiKeys />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App