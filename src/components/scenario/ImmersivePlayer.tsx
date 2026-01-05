'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { X, Loader2 } from 'lucide-react'
import type { Scenario, PlayerState } from '@/types/scenario'
import { AnimatedBackground } from './AnimatedBackground'
import { AudioPlayer } from './AudioPlayer'
import { VerticalNavigation } from './VerticalNavigation'
import { SlideRenderer } from './slides'

interface ImmersivePlayerProps {
  scenario: Scenario
  initialSlide?: number
  onExit?: () => void
  onComplete?: (state: PlayerState) => void
  onSlideChange?: (index: number) => void
  className?: string
}

export function ImmersivePlayer({
  scenario,
  initialSlide = 0,
  onExit,
  onComplete,
  onSlideChange,
  className,
}: ImmersivePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentSlide, setCurrentSlide] = useState(initialSlide)
  const [completedSlides, setCompletedSlides] = useState<number[]>([])
  const [audioTime, setAudioTime] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [slideKey, setSlideKey] = useState(0) // Force re-render of slides

  const { slides, settings, theme } = scenario
  const currentSlideData = slides.find((s) => s.order === currentSlide) || slides[0]

  // Initial load - show content after brief delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Mark slide as completed when viewed
  useEffect(() => {
    if (!completedSlides.includes(currentSlide)) {
      setCompletedSlides((prev) => [...prev, currentSlide])
    }
    onSlideChange?.(currentSlide)
  }, [currentSlide]) // Removed completedSlides from deps to avoid infinite loop

  // Navigation functions defined first
  const navigateWithTransition = useCallback(
    (targetSlide: number) => {
      if (targetSlide < 0 || targetSlide >= slides.length) return
      if (isTransitioning) return

      setIsTransitioning(true)

      // Fade out
      setTimeout(() => {
        setCurrentSlide(targetSlide)
        setAudioTime(0)
        setSlideKey((prev) => prev + 1) // Force slide component re-render

        // Fade in
        setTimeout(() => {
          setIsTransitioning(false)
        }, 50) // Small delay before showing new content
      }, settings.transitionDuration / 2)
    },
    [slides.length, isTransitioning, settings.transitionDuration]
  )

  const goToNext = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      navigateWithTransition(currentSlide + 1)
    } else {
      // Completed all slides
      onComplete?.({
        currentSlide,
        totalSlides: slides.length,
        isPlaying: false,
        isMuted: false,
        audioProgress: 0,
        completedSlides,
        startedAt: new Date(),
        interactions: [],
      })
    }
  }, [currentSlide, slides.length, completedSlides, navigateWithTransition, onComplete])

  const goToPrevious = useCallback(() => {
    if (currentSlide > 0) {
      navigateWithTransition(currentSlide - 1)
    }
  }, [currentSlide, navigateWithTransition])

  // Navigation for dots - always allow direct navigation
  const goToSlide = useCallback(
    (index: number) => {
      navigateWithTransition(index)
    },
    [navigateWithTransition]
  )

  // Keyboard navigation - use refs to avoid stale closures
  const currentSlideRef = useRef(currentSlide)
  const slidesLengthRef = useRef(slides.length)
  const isTransitioningRef = useRef(isTransitioning)

  useEffect(() => {
    currentSlideRef.current = currentSlide
    slidesLengthRef.current = slides.length
    isTransitioningRef.current = isTransitioning
  }, [currentSlide, slides.length, isTransitioning])

  useEffect(() => {
    if (!settings.allowKeyboardNavigation) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default for navigation keys
      if (['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', ' ', 'Escape'].includes(e.key)) {
        e.preventDefault()
      }

      if (isTransitioningRef.current) return

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === ' ') {
        goToNext()
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        goToPrevious()
      }
      if (e.key === 'Escape' && settings.showExitButton && onExit) {
        onExit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [settings.allowKeyboardNavigation, settings.showExitButton, onExit, goToNext, goToPrevious])

  // Touch/swipe navigation
  useEffect(() => {
    if (!settings.allowSwipeNavigation || !containerRef.current) return

    let startY = 0
    let startX = 0

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY
      startX = e.touches[0].clientX
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (isTransitioningRef.current) return

      const endY = e.changedTouches[0].clientY
      const endX = e.changedTouches[0].clientX
      const diffY = startY - endY
      const diffX = startX - endX

      // Determine if it's more vertical or horizontal
      if (Math.abs(diffY) > Math.abs(diffX)) {
        // Vertical swipe
        if (diffY > 50) goToNext()
        if (diffY < -50) goToPrevious()
      } else {
        // Horizontal swipe (for horizontal navigation mode)
        if (settings.navigation === 'horizontal') {
          if (diffX > 50) goToNext()
          if (diffX < -50) goToPrevious()
        }
      }
    }

    const container = containerRef.current
    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [settings.allowSwipeNavigation, settings.navigation, goToNext, goToPrevious])

  // Auto-advance
  useEffect(() => {
    if (!settings.autoAdvance || !currentSlideData.duration) return

    const timer = setTimeout(() => {
      goToNext()
    }, currentSlideData.duration * 1000)

    return () => clearTimeout(timer)
  }, [settings.autoAdvance, currentSlideData, goToNext])

  const handleAudioTimeUpdate = useCallback((time: number) => {
    setAudioTime(time)
  }, [])

  const handleAudioEnded = useCallback(() => {
    // Optionally auto-advance when audio ends
    if (settings.autoAdvance) {
      goToNext()
    }
  }, [settings.autoAdvance, goToNext])

  const handleSlideComplete = useCallback(() => {
    // Mark current slide as fully completed
    if (!completedSlides.includes(currentSlide)) {
      setCompletedSlides((prev) => [...prev, currentSlide])
    }
  }, [currentSlide, completedSlides])

  // Handle exit button click
  const handleExitClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onExit?.()
  }, [onExit])

  return (
    <div
      ref={containerRef}
      className={cn(
        'fixed inset-0 w-screen h-screen overflow-hidden',
        className
      )}
      style={{
        fontFamily: theme.font || 'Inter, sans-serif',
        backgroundColor: theme.backgroundColor || '#0A0A0A',
      }}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      )}

      {/* Background */}
      <AnimatedBackground
        background={currentSlideData.background}
        className="absolute inset-0"
      />

      {/* Slide Content */}
      <div
        className={cn(
          'relative z-10 w-full h-full transition-opacity',
          isTransitioning ? 'opacity-0' : 'opacity-100'
        )}
        style={{
          transitionDuration: `${settings.transitionDuration / 2}ms`,
        }}
      >
        <SlideRenderer
          key={slideKey}
          slide={currentSlideData}
          currentTime={audioTime}
          onComplete={handleSlideComplete}
        />
      </div>

      {/* Audio Player */}
      {settings.showAudioControls && (
        <AudioPlayer
          audio={currentSlideData.audio}
          subtitles={currentSlideData.subtitles}
          showSubtitles={'showSubtitles' in currentSlideData ? currentSlideData.showSubtitles : true}
          subtitleStyle={'subtitleStyle' in currentSlideData ? currentSlideData.subtitleStyle : undefined}
          onTimeUpdate={handleAudioTimeUpdate}
          onEnded={handleAudioEnded}
        />
      )}

      {/* Navigation */}
      <VerticalNavigation
        currentSlide={currentSlide}
        totalSlides={slides.length}
        completedSlides={completedSlides}
        settings={settings}
        onNavigate={goToSlide}
        onPrevious={goToPrevious}
        onNext={goToNext}
        primaryColor={theme.primaryColor}
      />

      {/* Exit Button - Higher z-index and better click handling */}
      {settings.showExitButton && onExit && (
        <button
          type="button"
          onClick={handleExitClick}
          onMouseDown={(e) => e.stopPropagation()}
          className="fixed top-6 right-6 z-[100] p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/30 active:bg-white/40 transition-all cursor-pointer select-none"
          aria-label="Quitter la formation"
          style={{ touchAction: 'manipulation' }}
        >
          <X className="h-6 w-6 text-white pointer-events-none" />
        </button>
      )}

      {/* Keyboard hints (shown briefly on first load) */}
      <div className="fixed bottom-6 right-6 z-40 text-white/40 text-sm hidden md:block pointer-events-none">
        <kbd className="px-2 py-1 bg-white/10 rounded">↑</kbd> /{' '}
        <kbd className="px-2 py-1 bg-white/10 rounded">↓</kbd> pour naviguer
      </div>

      {/* Transition indicator */}
      {isTransitioning && (
        <div className="fixed inset-0 z-30 pointer-events-none flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
