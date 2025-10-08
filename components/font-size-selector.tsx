import React from 'react'
import { FontSize } from '@/types/buddy'
import { useTranslation } from '@/lib/translations'

interface FontSizeSelectorProps {
  currentSize: FontSize
  onSizeChange: (size: FontSize) => void
  className?: string
}

export function FontSizeSelector({ currentSize, onSizeChange, className = '' }: FontSizeSelectorProps) {
  const { t } = useTranslation()
  
  const fontSizeLevels: { size: FontSize; label: string; dotCount: number }[] = [
    { size: 'tiny', label: t('fontSizeTiny'), dotCount: 1 },
    { size: 'small', label: t('fontSizeSmall'), dotCount: 2 },
    { size: 'medium', label: t('fontSizeMedium'), dotCount: 3 },
    { size: 'large', label: t('fontSizeLarge'), dotCount: 4 },
    { size: 'huge', label: t('fontSizeHuge'), dotCount: 5 },
    { size: 'massive', label: t('fontSizeMassive'), dotCount: 6 },
  ]
  
  const currentIndex = fontSizeLevels.findIndex(level => level.size === currentSize)

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('fontSize')}
      </label>
      
      {/* Visual dot selector like a sound bar */}
      <div className="flex items-center space-x-2">
        {fontSizeLevels.map((level, index) => (
          <button
            key={level.size}
            onClick={() => onSizeChange(level.size)}
            className="flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-200 hover:bg-muted"
            title={`Set font size to ${level.label}`}
          >
            {/* Dots representing the level */}
            <div className="flex flex-col space-y-0.5">
              {[...Array(6)].map((_, dotIndex) => (
                <div
                  key={dotIndex}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    dotIndex < level.dotCount
                      ? index === currentIndex
                        ? 'bg-blue-500 shadow-md' // Active level - blue
                        : 'bg-muted-foreground' // Inactive level - muted
                      : 'bg-border' // Empty dots - very light
                  }`}
                  style={{
                    // Stack dots from bottom up (reverse order)
                    order: 6 - dotIndex
                  }}
                />
              ))}
            </div>
            
            {/* Size label */}
            <span 
              className={`text-xs transition-all duration-200 ${
                index === currentIndex
                  ? 'text-blue-500 font-medium'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {level.label}
            </span>
          </button>
        ))}
      </div>
      
      {/* Current selection indicator */}
      <div className="text-xs text-gray-600 dark:text-gray-400">
        Current: <span className="font-medium capitalize">{currentSize}</span>
      </div>
    </div>
  )
}