'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { CarouselSlide as CarouselSlideType } from '@/types/scenario'
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'

interface CarouselSlideProps {
  slide: CarouselSlideType
}

export function CarouselSlide({ slide }: CarouselSlideProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const { items, autoPlay, autoPlayInterval = 5000, showArrows = true, showDots = true } = slide

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || items.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length)
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [autoPlay, autoPlayInterval, items.length])

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1))
  }, [items.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % items.length)
  }, [items.length])

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  return (
    <div className="flex flex-col h-full px-8 md:px-16 py-12">
      {/* Title */}
      {slide.title && (
        <h2
          className={cn(
            'text-3xl md:text-4xl font-bold text-white text-center mb-8 transition-all duration-700',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          {slide.title}
        </h2>
      )}

      {/* Carousel Container */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Previous Arrow */}
        {showArrows && items.length > 1 && (
          <button
            onClick={goToPrevious}
            className="absolute left-0 z-10 p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all hover:scale-110"
            aria-label="Précédent"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        )}

        {/* Cards Container */}
        <div className="relative w-full max-w-4xl overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {items.map((item) => (
              <div key={item.id} className="w-full flex-shrink-0 px-4">
                <div
                  className={cn(
                    'bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden transition-all duration-700',
                    isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                  )}
                >
                  {item.image && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-white/70 line-clamp-3">
                        {item.description}
                      </p>
                    )}
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-white hover:text-white/80 transition-colors"
                      >
                        En savoir plus
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Arrow */}
        {showArrows && items.length > 1 && (
          <button
            onClick={goToNext}
            className="absolute right-0 z-10 p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all hover:scale-110"
            aria-label="Suivant"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      {/* Dots */}
      {showDots && items.length > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                index === currentIndex
                  ? 'bg-white w-6'
                  : 'bg-white/30 hover:bg-white/50'
              )}
              aria-label={`Aller à l'article ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
