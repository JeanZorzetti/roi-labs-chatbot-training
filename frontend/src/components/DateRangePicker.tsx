import React, { useState } from 'react'
import { useThemeStore } from '../stores/themeStore'
import { CalendarIcon } from '@heroicons/react/24/outline'

interface DateRange {
  start: string
  end: string
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange }) => {
  const { isDark } = useThemeStore()
  const [isOpen, setIsOpen] = useState(false)

  const presets = [
    { label: 'Hoje', days: 0 },
    { label: 'Últimos 7 dias', days: 7 },
    { label: 'Últimos 30 dias', days: 30 },
    { label: 'Últimos 90 dias', days: 90 },
  ]

  const getDateString = (daysAgo: number) => {
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    return date.toISOString().split('T')[0]
  }

  const handlePresetClick = (days: number) => {
    const end = new Date().toISOString().split('T')[0]
    const start = getDateString(days)
    onChange({ start, end })
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 border rounded-md ${
          isDark 
            ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
            : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
      >
        <CalendarIcon className="h-4 w-4" />
        <span className="text-sm">
          {value.start} - {value.end}
        </span>
      </button>

      {isOpen && (
        <div className={`absolute top-full left-0 mt-1 w-64 p-4 rounded-lg shadow-lg border z-50 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium mb-2">Períodos Rápidos</h3>
              <div className="space-y-1">
                {presets.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handlePresetClick(preset.days)}
                    className={`w-full text-left px-2 py-1 text-sm rounded hover:${
                      isDark ? 'bg-gray-700' : 'bg-gray-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t pt-3">
              <h3 className="text-sm font-medium mb-2">Período Personalizado</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Data Inicial</label>
                  <input
                    type="date"
                    value={value.start}
                    onChange={(e) => onChange({ ...value, start: e.target.value })}
                    className={`w-full px-2 py-1 text-sm border rounded ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Data Final</label>
                  <input
                    type="date"
                    value={value.end}
                    onChange={(e) => onChange({ ...value, end: e.target.value })}
                    className={`w-full px-2 py-1 text-sm border rounded ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-3">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DateRangePicker