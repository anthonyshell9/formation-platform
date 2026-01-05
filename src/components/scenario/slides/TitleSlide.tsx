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
  const [showTitle, setShowTitle] = useState(false)
  const [showSubtitle, setShowSubtitle] = useState(false)

  useEffect(() => {
    const titleDelay = slide.titleAnimation?.delay || 0
    const subtitleDelay = slide.subtitleAnimation?.delay || 500

    const titleTimer = setTimeout(() => setShowTitle(true), titleDelay)
    const subtitleTimer = setTimeout(() => setShowSubtitle(true), subtitleDelay)

    return () => {
      clearTimeout(titleTimer)
      clearTimeout(subtitleTimer)
    }
  }, [slide.titleAnimation?.delay, slide.subtitleAnimation?.delay])

  const titleStyle = slide.titleStyle || {}

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center">
      {/* Main Title */}
      <h1
        className={cn(
          'font-bold leading-tight transition-all duration-700',
          showTitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
          getAnimationClass(slide.titleAnimation)
        )}
        style={{
          fontSize: titleStyle.fontSize || '4rem',
          fontWeight: titleStyle.fontWeight || '700',
          color: titleStyle.color || '#ffffff',
          textAlign: titleStyle.textAlign || 'center',
        }}
      >
        {slide.title}
      </h1>

      {/* Subtitle */}
      {slide.subtitle && (
        <p
          className={cn(
            'mt-6 text-xl md:text-2xl transition-all duration-700 delay-300',
            showSubtitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
            getAnimationClass(slide.subtitleAnimation)
          )}
          style={{ color: `${titleStyle.color || '#ffffff'}cc` }}
        >
          {slide.subtitle}
        </p>
      )}

      {/* Visual indicator to continue */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
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
