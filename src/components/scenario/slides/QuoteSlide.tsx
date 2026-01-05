'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { QuoteSlide as QuoteSlideType } from '@/types/scenario'
import { Quote } from 'lucide-react'

interface QuoteSlideProps {
  slide: QuoteSlideType
}

export function QuoteSlide({ slide }: QuoteSlideProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setMounted(true)
    })
    return () => cancelAnimationFrame(timer)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 md:px-16 text-center">
      {/* Quote icon */}
      <Quote
        className={cn(
          'w-12 h-12 mb-8 transition-all duration-500',
          mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        )}
        style={{ color: slide.accentColor || 'rgba(255,255,255,0.3)' }}
      />

      {/* Quote text */}
      <blockquote
        className={cn(
          'text-2xl md:text-4xl font-light leading-relaxed max-w-4xl transition-all duration-500',
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}
        style={{
          color: slide.quoteColor || '#ffffff',
          transitionDelay: '100ms',
        }}
      >
        &ldquo;{slide.quote}&rdquo;
      </blockquote>

      {/* Author */}
      {(slide.author || slide.authorTitle) && (
        <div
          className={cn(
            'mt-8 flex items-center gap-4 transition-all duration-500',
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
          style={{ transitionDelay: '300ms' }}
        >
          {slide.authorImage && (
            <img
              src={slide.authorImage}
              alt={slide.author || ''}
              className="w-16 h-16 rounded-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          )}
          <div className="text-left">
            {slide.author && (
              <p className="text-xl font-semibold text-white">{slide.author}</p>
            )}
            {slide.authorTitle && (
              <p className="text-white/60">{slide.authorTitle}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
