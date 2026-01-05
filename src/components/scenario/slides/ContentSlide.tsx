'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { ContentSlide as ContentSlideType } from '@/types/scenario'

interface ContentSlideProps {
  slide: ContentSlideType
}

export function ContentSlide({ slide }: ContentSlideProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Trigger animations after mount
    const timer = requestAnimationFrame(() => {
      setMounted(true)
    })
    return () => cancelAnimationFrame(timer)
  }, [])

  const contentDelay = slide.textAnimation?.delay || 0
  const imageDelay = slide.image?.animation?.delay || 200

  const getLayoutClasses = () => {
    switch (slide.layout) {
      case 'text-left':
        return 'flex-row'
      case 'text-right':
        return 'flex-row-reverse'
      case 'text-top':
        return 'flex-col'
      case 'text-bottom':
        return 'flex-col-reverse'
      case 'text-center':
        return 'flex-col items-center'
      case 'split-50':
        return 'flex-row'
      case 'split-60-40':
        return 'flex-row'
      case 'split-40-60':
        return 'flex-row-reverse'
      default:
        return 'flex-row'
    }
  }

  const getTextWidth = () => {
    if (slide.layout === 'text-center') return 'w-full max-w-3xl'
    if (slide.layout === 'split-60-40') return 'w-3/5'
    if (slide.layout === 'split-40-60') return 'w-3/5'
    if (!slide.image?.url) return 'w-full max-w-4xl mx-auto'
    return 'w-1/2'
  }

  const getImageWidth = () => {
    if (slide.layout === 'text-center') return 'w-full max-w-2xl'
    if (slide.layout === 'split-60-40') return 'w-2/5'
    if (slide.layout === 'split-40-60') return 'w-2/5'
    return 'w-1/2'
  }

  const isVertical = slide.layout === 'text-top' || slide.layout === 'text-bottom' || slide.layout === 'text-center'

  return (
    <div
      className={cn(
        'flex h-full px-8 md:px-16 py-12 gap-8',
        getLayoutClasses(),
        isVertical ? 'items-center' : 'items-center'
      )}
    >
      {/* Text Content */}
      <div
        className={cn(
          'transition-all duration-500',
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
          isVertical ? 'w-full text-center' : getTextWidth()
        )}
        style={{ transitionDelay: `${contentDelay}ms` }}
      >
        {slide.title && (
          <h2
            className="text-3xl md:text-4xl font-bold mb-6"
            style={{ color: slide.titleColor || '#ffffff' }}
          >
            {slide.title}
          </h2>
        )}

        {slide.text && (
          <div
            className="text-lg md:text-xl leading-relaxed whitespace-pre-wrap"
            style={{ color: slide.textColor || 'rgba(255,255,255,0.9)' }}
          >
            {slide.text}
          </div>
        )}

        {slide.bullets && slide.bullets.length > 0 && (
          <ul className="mt-6 space-y-3">
            {slide.bullets.map((bullet, index) => (
              <li
                key={index}
                className={cn(
                  'flex items-start gap-3 text-lg transition-all duration-500',
                  mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                )}
                style={{
                  color: slide.textColor || 'rgba(255,255,255,0.9)',
                  transitionDelay: `${contentDelay + (index + 1) * 100}ms`,
                }}
              >
                <span className="flex-shrink-0 w-2 h-2 mt-2.5 rounded-full bg-current" />
                {bullet}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Image */}
      {slide.image?.url && (
        <div
          className={cn(
            'transition-all duration-500',
            mounted ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-4 scale-95',
            isVertical ? 'w-full flex justify-center' : getImageWidth()
          )}
          style={{ transitionDelay: `${imageDelay}ms` }}
        >
          <img
            src={slide.image.url}
            alt={slide.image.alt || ''}
            className="max-h-[60vh] w-auto object-contain rounded-lg shadow-2xl"
            onError={(e) => {
              // Hide broken images
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      )}
    </div>
  )
}
