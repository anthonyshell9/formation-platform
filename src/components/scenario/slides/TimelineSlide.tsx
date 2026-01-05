'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { TimelineSlide as TimelineSlideType } from '@/types/scenario'

interface TimelineSlideProps {
  slide: TimelineSlideType
}

export function TimelineSlide({ slide }: TimelineSlideProps) {
  const [isVisible, setIsVisible] = useState(false)
  const { events, orientation = 'vertical' } = slide

  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setIsVisible(true)
    })
    return () => cancelAnimationFrame(timer)
  }, [])

  if (orientation === 'horizontal') {
    return (
      <div className="flex flex-col h-full px-8 md:px-16 py-12">
        {slide.title && (
          <h2
            className={cn(
              'text-3xl md:text-4xl font-bold text-white text-center mb-12 transition-all duration-700',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            )}
          >
            {slide.title}
          </h2>
        )}

        <div className="flex-1 flex items-center overflow-x-auto">
          <div className="flex items-center min-w-max mx-auto">
            {events.map((event, index) => (
              <div
                key={event.id}
                className={cn(
                  'flex flex-col items-center transition-all duration-700',
                  isVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-8'
                )}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Event content */}
                <div className="flex flex-col items-center w-48 text-center">
                  {event.image && (
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-16 h-16 rounded-full object-cover mb-3"
                    />
                  )}
                  {event.date && (
                    <span className="text-sm text-white/60 mb-1">{event.date}</span>
                  )}
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {event.title}
                  </h3>
                  {event.description && (
                    <p className="text-sm text-white/70">{event.description}</p>
                  )}
                </div>

                {/* Connector */}
                {index < events.length - 1 && (
                  <div className="flex items-center mt-4">
                    <div className="w-4 h-4 rounded-full bg-white/30" />
                    <div className="w-24 h-0.5 bg-white/30" />
                  </div>
                )}
                {index === events.length - 1 && (
                  <div className="mt-4">
                    <div className="w-4 h-4 rounded-full bg-white/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Vertical orientation
  return (
    <div className="flex flex-col h-full px-8 md:px-16 py-12 overflow-auto">
      {slide.title && (
        <h2
          className={cn(
            'text-3xl md:text-4xl font-bold text-white text-center mb-12 transition-all duration-700',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          {slide.title}
        </h2>
      )}

      <div className="flex-1 flex justify-center">
        <div className="relative max-w-2xl">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-white/20" />

          {/* Events */}
          <div className="space-y-8">
            {events.map((event, index) => (
              <div
                key={event.id}
                className={cn(
                  'relative flex gap-6 transition-all duration-700',
                  isVisible
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 -translate-x-8'
                )}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                {/* Dot */}
                <div className="relative z-10 flex-shrink-0">
                  <div className="w-4 h-4 mt-2 rounded-full bg-white/30 ring-4 ring-white/10" />
                </div>

                {/* Content */}
                <div className="flex-1 pb-8">
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4">
                    {event.image && (
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-32 rounded-lg object-cover mb-3"
                      />
                    )}
                    <div className="flex items-center gap-3 mb-2">
                      {event.date && (
                        <span className="text-sm text-white/60 px-2 py-0.5 bg-white/10 rounded">
                          {event.date}
                        </span>
                      )}
                      <h3 className="text-lg font-semibold text-white">
                        {event.title}
                      </h3>
                    </div>
                    {event.description && (
                      <p className="text-white/70">{event.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
