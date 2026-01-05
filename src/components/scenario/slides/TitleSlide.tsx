'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { TitleSlide as TitleSlideType, AnimationConfig } from '@/types/scenario'

interface TitleSlideProps {
  slide: TitleSlideType
}

const getAnimationClass = (animation?: AnimationConfig) => {
  if (!animation || animation.type === 'none') return ''

  const animationClasses: Record<string, string> = {
    'fade-in': 'animate-fadeIn',
    'slide-up': 'animate-slideUp',
    'slide-down': 'animate-slideDown',
    'zoom-in': 'animate-zoomIn',
    'blur-in': 'animate-blurIn',
    'typewriter': 'animate-typewriter',
  }

  return animationClasses[animation.type] || ''
}

export function TitleSlide({ slide }: TitleSlideProps) {
  // Start visible immediately, then apply animation
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Small delay to allow initial render, then trigger animations
    const timer = requestAnimationFrame(() => {
      setMounted(true)
    })
    return () => cancelAnimationFrame(timer)
  }, [])

  const titleStyle = slide.titleStyle || {}
  const titleDelay = slide.titleAnimation?.delay || 0
  const subtitleDelay = slide.subtitleAnimation?.delay || 200

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center">
      {/* Main Title */}
      <h1
        className={cn(
          'font-bold leading-tight transition-all duration-500',
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
          getAnimationClass(slide.titleAnimation)
        )}
        style={{
          fontSize: titleStyle.fontSize || 'clamp(2rem, 6vw, 4rem)',
          fontWeight: titleStyle.fontWeight || '700',
          color: slide.titleColor || titleStyle.color || '#ffffff',
          textAlign: titleStyle.textAlign || 'center',
          transitionDelay: `${titleDelay}ms`,
        }}
      >
        {slide.title}
      </h1>

      {/* Subtitle */}
      {slide.subtitle && (
        <p
          className={cn(
            'mt-6 text-xl md:text-2xl transition-all duration-500',
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
            getAnimationClass(slide.subtitleAnimation)
          )}
          style={{
            color: slide.subtitleColor || `${slide.titleColor || titleStyle.color || '#ffffff'}cc`,
            transitionDelay: `${subtitleDelay}ms`,
          }}
        >
          {slide.subtitle}
        </p>
      )}

      {/* Visual indicator to continue */}
      <div
        className={cn(
          'absolute bottom-12 left-1/2 -translate-x-1/2 transition-opacity duration-500',
          mounted ? 'opacity-100 animate-bounce' : 'opacity-0'
        )}
        style={{ transitionDelay: '500ms' }}
      >
        <svg
          className="w-6 h-6 text-white/60"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>
    </div>
  )
}
