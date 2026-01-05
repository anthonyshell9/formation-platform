'use client'

import { useEffect, useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import type { StatsSlide as StatsSlideType, StatItem } from '@/types/scenario'

interface StatsSlideProps {
  slide: StatsSlideType
}

function AnimatedNumber({
  value,
  animate,
  prefix = '',
  suffix = '',
}: {
  value: number | string
  animate?: boolean
  prefix?: string
  suffix?: string
}) {
  const [displayValue, setDisplayValue] = useState<number | string>(
    typeof value === 'number' && animate ? 0 : value
  )
  const startTime = useRef<number | null>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    if (typeof value !== 'number' || !animate) {
      setDisplayValue(value)
      return
    }

    const duration = 2000 // 2 seconds
    const endValue = value

    const animateValue = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp
      const progress = Math.min((timestamp - startTime.current) / duration, 1)

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(easeOut * endValue)

      setDisplayValue(current)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animateValue)
      }
    }

    animationRef.current = requestAnimationFrame(animateValue)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [value, animate])

  return (
    <span>
      {prefix}
      {typeof displayValue === 'number'
        ? displayValue.toLocaleString()
        : displayValue}
      {suffix}
    </span>
  )
}

function StatCard({
  stat,
  animate,
  isVisible,
  delay,
}: {
  stat: StatItem
  animate?: boolean
  isVisible: boolean
  delay: number
}) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!isVisible) return
    const timer = setTimeout(() => setShow(true), delay)
    return () => clearTimeout(timer)
  }, [isVisible, delay])

  return (
    <div
      className={cn(
        'flex flex-col items-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm transition-all duration-700',
        show ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
      )}
    >
      {stat.icon && (
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: `${stat.color || '#00A693'}20` }}
        >
          <span className="text-3xl">{stat.icon}</span>
        </div>
      )}
      <p
        className="text-4xl md:text-5xl font-bold"
        style={{ color: stat.color || '#ffffff' }}
      >
        <AnimatedNumber
          value={stat.value}
          animate={animate && show}
          prefix={stat.prefix}
          suffix={stat.suffix}
        />
      </p>
      <p className="text-lg text-white/70 mt-2 text-center">{stat.label}</p>
    </div>
  )
}

export function StatsSlide({ slide }: StatsSlideProps) {
  const [isVisible, setIsVisible] = useState(false)
  const { stats, layout = 'grid', animateCountUp = true } = slide

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  }[Math.min(stats.length, 4)]

  return (
    <div className="flex flex-col h-full px-8 md:px-16 py-12">
      {/* Title */}
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

      {/* Stats Grid */}
      <div className="flex-1 flex items-center justify-center">
        <div
          className={cn(
            layout === 'grid' ? `grid ${gridCols} gap-6` : 'flex flex-wrap justify-center gap-6',
            'w-full max-w-5xl'
          )}
        >
          {stats.map((stat, index) => (
            <StatCard
              key={stat.id}
              stat={stat}
              animate={animateCountUp}
              isVisible={isVisible}
              delay={index * 200}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
