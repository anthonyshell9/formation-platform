'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { ContentSlide as ContentSlideType } from '@/types/scenario'

interface ContentSlideProps {
  slide: ContentSlideType
}

export function ContentSlide({ slide }: ContentSlideProps) {
  const [showContent, setShowContent] = useState(false)
  const [showImage, setShowImage] = useState(false)

  useEffect(() => {
    const contentDelay = slide.textAnimation?.delay || 0
    const imageDelay = slide.image?.animation?.delay || 300

    const contentTimer = setTimeout(() => setShowContent(true), contentDelay)
    const imageTimer = setTimeout(() => setShowImage(true), imageDelay)

    return () => {
      clearTimeout(contentTimer)
      clearTimeout(imageTimer)
    }
  }, [slide.textAnimation?.delay, slide.image?.animation?.delay])

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
          'transition-all duration-700',
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
          isVertical ? 'w-full text-center' : getTextWidth()
        )}
      >
        {slide.title && (
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            {slide.title}
          </h2>
        )}

        {slide.text && (
          <div className="text-lg md:text-xl text-white/90 leading-relaxed whitespace-pre-wrap">
            {slide.text}
          </div>
        )}

        {slide.bullets && slide.bullets.length > 0 && (
          <ul className="mt-6 space-y-3">
            {slide.bullets.map((bullet, index) => (
              <li
                key={index}
                className="flex items-start gap-3 text-lg text-white/90"
                style={{
                  animationDelay: `${(index + 1) * 200}ms`,
                }}
              >
                <span className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-current" />
                {bullet}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Image */}
      {slide.image && (
        <div
          className={cn(
            'transition-all duration-700 delay-300',
            showImage ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8',
            isVertical ? 'w-full flex justify-center' : getImageWidth()
          )}
        >
          <img
            src={slide.image.url}
            alt={slide.image.alt || ''}
            className="max-h-[60vh] w-auto object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  )
}
