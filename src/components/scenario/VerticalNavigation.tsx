'use client'

import { cn } from '@/lib/utils'
import { ChevronUp, ChevronDown } from 'lucide-react'
import type { ScenarioSettings } from '@/types/scenario'

interface VerticalNavigationProps {
  currentSlide: number
  totalSlides: number
  completedSlides: number[]
  settings: ScenarioSettings
  onNavigate: (index: number) => void
  onPrevious: () => void
  onNext: () => void
  primaryColor?: string
  className?: string
}

export function VerticalNavigation({
  currentSlide,
  totalSlides,
  completedSlides,
  settings,
  onNavigate,
  onPrevious,
  onNext,
  primaryColor = '#00A693',
  className,
}: VerticalNavigationProps) {
  const { showProgress, progressStyle, showNavArrows, navigation } = settings

  if (!showProgress && !showNavArrows) {
    return null
  }

  // Dots navigation
  const renderDots = () => (
    <div className="flex flex-col gap-2 items-center">
      {Array.from({ length: totalSlides }).map((_, index) => {
        const isActive = index === currentSlide
        const isCompleted = completedSlides.includes(index)

        return (
          <button
            key={index}
            onClick={() => navigation === 'free' && onNavigate(index)}
            disabled={navigation !== 'free' && index !== currentSlide}
            className={cn(
              'rounded-full transition-all duration-300',
              isActive
                ? 'w-3 h-3 scale-125'
                : 'w-2 h-2 hover:scale-110',
              navigation !== 'free' && index !== currentSlide
                ? 'cursor-default'
                : 'cursor-pointer'
            )}
            style={{
              backgroundColor: isActive
                ? primaryColor
                : isCompleted
                ? `${primaryColor}80`
                : 'rgba(255,255,255,0.3)',
            }}
            aria-label={`Aller à la slide ${index + 1}`}
          />
        )
      })}
    </div>
  )

  // Progress bar
  const renderBar = () => {
    const progress = ((currentSlide + 1) / totalSlides) * 100
    return (
      <div className="w-1 h-32 bg-white/20 rounded-full overflow-hidden">
        <div
          className="w-full transition-all duration-300 rounded-full"
          style={{
            height: `${progress}%`,
            backgroundColor: primaryColor,
          }}
        />
      </div>
    )
  }

  // Numbers navigation
  const renderNumbers = () => (
    <div className="flex flex-col items-center gap-1">
      <span className="text-2xl font-bold text-white">
        {currentSlide + 1}
      </span>
      <span className="text-sm text-white/60">/ {totalSlides}</span>
    </div>
  )

  const renderProgress = () => {
    switch (progressStyle) {
      case 'dots':
        return renderDots()
      case 'bar':
        return renderBar()
      case 'numbers':
        return renderNumbers()
      default:
        return null
    }
  }

  return (
    <div
      className={cn(
        'fixed right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-40',
        className
      )}
    >
      {/* Previous button */}
      {showNavArrows && (
        <button
          onClick={onPrevious}
          disabled={currentSlide === 0}
          className={cn(
            'p-2 rounded-full bg-white/10 backdrop-blur-md transition-all',
            currentSlide === 0
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:bg-white/20 hover:scale-110'
          )}
          aria-label="Slide précédente"
        >
          <ChevronUp className="h-5 w-5 text-white" />
        </button>
      )}

      {/* Progress indicator */}
      {showProgress && progressStyle !== 'none' && renderProgress()}

      {/* Next button */}
      {showNavArrows && (
        <button
          onClick={onNext}
          disabled={currentSlide === totalSlides - 1}
          className={cn(
            'p-2 rounded-full bg-white/10 backdrop-blur-md transition-all',
            currentSlide === totalSlides - 1
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:bg-white/20 hover:scale-110'
          )}
          aria-label="Slide suivante"
        >
          <ChevronDown className="h-5 w-5 text-white" />
        </button>
      )}
    </div>
  )
}
