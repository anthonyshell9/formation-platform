'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
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

  const { slides, settings, theme } = scenario
  const currentSlideData = slides.find((s) => s.order === currentSlide) || slides[0]

  // Mark slide as completed when viewed
  useEffect(() => {
    if (!completedSlides.includes(currentSlide)) {
      setCompletedSlides((prev) => [...prev, currentSlide])
    }
    onSlideChange?.(currentSlide)
  }, [currentSlide, completedSlides, onSlideChange])

  // Keyboard navigation
  useEffect(() => {
    if (!settings.allowKeyboardNavigation) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        goToNext()
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        goToPrevious()
      }
      if (e.key === 'Escape' && settings.showExitButton) {
        onExit?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [settings.allowKeyboardNavigation, settings.showExitButton, currentSlide, slides.length, onExit])

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
    container.addEventListener('touchstart', handleTouchStart)
    container.addEventListener('touchend', handleTouchEnd)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [settings.allowSwipeNavigation, settings.navigation, currentSlide, slides.length])

  // Auto-advance
  useEffect(() => {
    if (!settings.autoAdvance || !currentSlideData.duration) return

    const timer = setTimeout(() => {
      goToNext()
    }, currentSlideData.duration * 1000)

    return () => clearTimeout(timer)
  }, [settings.autoAdvance, currentSlideData, currentSlide])

  const navigateWithTransition = useCallback(
    (targetSlide: number) => {
      if (targetSlide < 0 || targetSlide >= slides.length) return
      if (isTransitioning) return

      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentSlide(targetSlide)
        setAudioTime(0) // Reset audio time for new slide
        setTimeout(() => setIsTransitioning(false), settings.transitionDuration)
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

  const goToSlide = useCallback(
    (index: number) => {
      if (settings.navigation === 'free') {
        navigateWithTransition(index)
      }
    },
    [settings.navigation, navigateWithTransition]
  )

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
    // Mark current slide as fully completed and potentially auto-advance
    if (!completedSlides.includes(currentSlide)) {
      setCompletedSlides((prev) => [...prev, currentSlide])
    }
  }, [currentSlide, completedSlides])

  const getTransitionStyle = (): React.CSSProperties => {
    const { transitionType, transitionDuration } = settings

    return {
      transition: `all ${transitionDuration}ms ease-in-out`,
      opacity: isTransitioning ? 0 : 1,
      transform: isTransitioning
        ? transitionType === 'slide'
          ? 'translateY(20px)'
          : transitionType === 'zoom'
          ? 'scale(0.95)'
          : 'none'
        : 'none',
    }
  }

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
      {/* Background */}
      <AnimatedBackground
        background={currentSlideData.background}
        className="absolute inset-0"
      />

      {/* Slide Content */}
      <div
        className="relative z-10 w-full h-full"
        style={getTransitionStyle()}
      >
        <SlideRenderer
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

      {/* Exit Button */}
      {settings.showExitButton && onExit && (
        <button
          onClick={onExit}
          className="fixed top-6 right-6 z-50 p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors"
          aria-label="Quitter la formation"
        >
          <X className="h-5 w-5 text-white" />
        </button>
      )}

      {/* Keyboard hints (shown briefly on first load) */}
      <div className="fixed bottom-6 right-6 z-40 text-white/40 text-sm hidden md:block">
        <kbd className="px-2 py-1 bg-white/10 rounded">↑</kbd> /{' '}
        <kbd className="px-2 py-1 bg-white/10 rounded">↓</kbd> pour naviguer
      </div>
    </div>
  )
}
