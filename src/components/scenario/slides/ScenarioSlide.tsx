'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { ScenarioSlide as ScenarioSlideType, ScenarioElement } from '@/types/scenario'

interface ScenarioSlideProps {
  slide: ScenarioSlideType
  currentTime?: number // Audio current time for synchronization
}

function ScenarioElementComponent({
  element,
  currentTime = 0,
}: {
  element: ScenarioElement
  currentTime?: number
}) {
  const isVisible =
    (!element.timingStart || currentTime >= element.timingStart) &&
    (!element.timingEnd || currentTime <= element.timingEnd)

  const getAnimationClass = () => {
    if (!element.animation || element.animation.type === 'none') return ''

    const animationClasses: Record<string, string> = {
      'fade-in': 'animate-fadeIn',
      'slide-up': 'animate-slideUp',
      'slide-down': 'animate-slideDown',
      'slide-left': 'animate-slideLeft',
      'slide-right': 'animate-slideRight',
      'zoom-in': 'animate-zoomIn',
      'zoom-out': 'animate-zoomOut',
      'bounce': 'animate-bounce',
      'pulse': 'animate-pulse',
      'shake': 'animate-shake',
      'rotate': 'animate-spin',
      'flip': 'animate-flip',
      'blur-in': 'animate-blurIn',
    }

    return animationClasses[element.animation.type] || ''
  }

  const style: React.CSSProperties = {
    position: element.position ? 'absolute' : 'relative',
    left: element.position ? `${element.position.x}%` : undefined,
    top: element.position ? `${element.position.y}%` : undefined,
    width: element.size ? `${element.size.width}%` : undefined,
    height: element.size ? `${element.size.height}%` : undefined,
    transform: element.position ? 'translate(-50%, -50%)' : undefined,
    animationDelay: element.animation?.delay ? `${element.animation.delay}ms` : undefined,
    animationDuration: element.animation?.duration ? `${element.animation.duration}ms` : undefined,
  }

  if (!isVisible) return null

  switch (element.type) {
    case 'image':
      return (
        <img
          src={element.content}
          alt=""
          className={cn(
            'transition-opacity duration-500',
            getAnimationClass()
          )}
          style={style}
        />
      )

    case 'icon':
      return (
        <div
          className={cn(
            'text-6xl transition-opacity duration-500',
            getAnimationClass()
          )}
          style={style}
        >
          {element.content}
        </div>
      )

    case 'text':
      return (
        <p
          className={cn(
            'text-2xl md:text-4xl font-bold text-white transition-opacity duration-500',
            getAnimationClass()
          )}
          style={style}
        >
          {element.content}
        </p>
      )

    case 'lottie':
      // Lottie animation support - would need lottie-web library
      return (
        <div
          className={cn('transition-opacity duration-500', getAnimationClass())}
          style={style}
        >
          {/* Placeholder for Lottie animation */}
          <div className="text-white text-sm">Animation: {element.content}</div>
        </div>
      )

    case 'video':
      return (
        <video
          src={element.content}
          autoPlay
          loop
          muted
          playsInline
          className={cn('transition-opacity duration-500', getAnimationClass())}
          style={{ ...style, objectFit: 'contain' }}
        />
      )

    default:
      return null
  }
}

export function ScenarioSlide({ slide, currentTime = 0 }: ScenarioSlideProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setIsVisible(true)
    })
    return () => cancelAnimationFrame(timer)
  }, [])

  return (
    <div
      className={cn(
        'relative flex items-center justify-center h-full transition-opacity duration-700',
        isVisible ? 'opacity-100' : 'opacity-0'
      )}
    >
      {/* Scenario Elements */}
      {slide.elements?.map((element) => (
        <ScenarioElementComponent
          key={element.id}
          element={element}
          currentTime={currentTime}
        />
      ))}

      {/* Center content area for elements without absolute positioning */}
      <div className="flex flex-wrap items-center justify-center gap-8 p-8">
        {slide.elements
          ?.filter((el) => !el.position)
          .map((element) => (
            <ScenarioElementComponent
              key={element.id}
              element={element}
              currentTime={currentTime}
            />
          ))}
      </div>
    </div>
  )
}
