'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { QuoteSlide as QuoteSlideType } from '@/types/scenario'
import { Quote } from 'lucide-react'

interface QuoteSlideProps {
  slide: QuoteSlideType
}

export function QuoteSlide({ slide }: QuoteSlideProps) {
  const [showQuote, setShowQuote] = useState(false)
  const [showAuthor, setShowAuthor] = useState(false)

  useEffect(() => {
    const timer1 = setTimeout(() => setShowQuote(true), 200)
    const timer2 = setTimeout(() => setShowAuthor(true), 800)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 md:px-16 text-center">
      {/* Quote icon */}
      <Quote
        className={cn(
          'w-12 h-12 text-white/30 mb-8 transition-all duration-500',
          showQuote ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        )}
      />

      {/* Quote text */}
      <blockquote
        className={cn(
          'text-2xl md:text-4xl font-light text-white leading-relaxed max-w-4xl transition-all duration-700',
          showQuote ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        )}
      >
        &ldquo;{slide.quote}&rdquo;
      </blockquote>

      {/* Author */}
      {(slide.author || slide.authorTitle) && (
        <div
          className={cn(
            'mt-8 flex items-center gap-4 transition-all duration-700',
            showAuthor ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          {slide.authorImage && (
            <img
              src={slide.authorImage}
              alt={slide.author || ''}
              className="w-16 h-16 rounded-full object-cover"
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
