'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { Background } from '@/types/scenario'

interface AnimatedBackgroundProps {
  background?: Background
  className?: string
  children?: React.ReactNode
}

export function AnimatedBackground({
  background,
  className,
  children,
}: AnimatedBackgroundProps) {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(true)
  }, [])

  if (!background) {
    return (
      <div className={cn('relative w-full h-full bg-black', className)}>
        {children}
      </div>
    )
  }

  const getBackgroundStyle = (): React.CSSProperties => {
    switch (background.type) {
      case 'solid':
        return { backgroundColor: background.color }

      case 'gradient': {
        const direction = background.direction || 'to-bottom'
        const directionMap: Record<string, string> = {
          'to-bottom': '180deg',
          'to-right': '90deg',
          'to-bottom-right': '135deg',
          'to-top-right': '45deg',
          'radial': 'radial',
        }
        const angle = directionMap[direction]
        const colorStops = background.colors.join(', ')

        if (direction === 'radial') {
          return { background: `radial-gradient(circle, ${colorStops})` }
        }
        return { background: `linear-gradient(${angle}, ${colorStops})` }
      }

      case 'image':
        return {
          backgroundImage: `url(${background.url})`,
          backgroundSize: background.size || 'cover',
          backgroundPosition: background.position || 'center',
          backgroundRepeat: 'no-repeat',
        }

      case 'video':
        return {}

      default:
        return {}
    }
  }

  return (
    <div
      className={cn(
        'relative w-full h-full overflow-hidden transition-opacity duration-700',
        loaded ? 'opacity-100' : 'opacity-0',
        className
      )}
      style={getBackgroundStyle()}
    >
      {/* Video Background */}
      {background.type === 'video' && (
        <video
          autoPlay
          loop={background.loop !== false}
          muted={background.muted !== false}
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={background.url} type="video/mp4" />
        </video>
      )}

      {/* Overlay for image/video */}
      {(background.type === 'image' || background.type === 'video') &&
        background.overlay && (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: background.overlay }}
          />
        )}

      {/* Content */}
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  )
}
