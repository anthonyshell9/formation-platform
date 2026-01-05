'use client'

import type { Slide } from '@/types/scenario'
import { TitleSlide } from './TitleSlide'
import { ContentSlide } from './ContentSlide'
import { QuoteSlide } from './QuoteSlide'
import { CarouselSlide } from './CarouselSlide'
import { VideoSlide } from './VideoSlide'
import { StatsSlide } from './StatsSlide'
import { ScenarioSlide } from './ScenarioSlide'
import { InteractiveSlide } from './InteractiveSlide'
import { TimelineSlide } from './TimelineSlide'
import { GallerySlide } from './GallerySlide'

interface SlideRendererProps {
  slide: Slide
  currentTime?: number
  onComplete?: (score?: number) => void
}

export function SlideRenderer({ slide, currentTime, onComplete }: SlideRendererProps) {
  switch (slide.type) {
    case 'title':
      return <TitleSlide slide={slide} />

    case 'content':
      return <ContentSlide slide={slide} />

    case 'quote':
      return <QuoteSlide slide={slide} />

    case 'carousel':
      return <CarouselSlide slide={slide} />

    case 'video':
      return <VideoSlide slide={slide} onComplete={onComplete} />

    case 'stats':
      return <StatsSlide slide={slide} />

    case 'scenario':
      return <ScenarioSlide slide={slide} currentTime={currentTime} />

    case 'interactive':
      return <InteractiveSlide slide={slide} onComplete={onComplete} />

    case 'timeline':
      return <TimelineSlide slide={slide} />

    case 'gallery':
      return <GallerySlide slide={slide} />

    case 'comparison':
      // Simple comparison slide implementation
      return (
        <div className="flex h-full px-8 md:px-16 py-12 gap-8">
          <div className="flex-1 flex flex-col items-center justify-center">
            {slide.leftTitle && (
              <h3 className="text-2xl font-bold text-white mb-4">{slide.leftTitle}</h3>
            )}
            {slide.leftContent.type === 'image' ? (
              <img
                src={slide.leftContent.content}
                alt=""
                className="max-h-[50vh] rounded-xl"
              />
            ) : (
              <p className="text-white text-lg">{slide.leftContent.content}</p>
            )}
          </div>

          <div className="w-px bg-white/20" />

          <div className="flex-1 flex flex-col items-center justify-center">
            {slide.rightTitle && (
              <h3 className="text-2xl font-bold text-white mb-4">{slide.rightTitle}</h3>
            )}
            {slide.rightContent.type === 'image' ? (
              <img
                src={slide.rightContent.content}
                alt=""
                className="max-h-[50vh] rounded-xl"
              />
            ) : (
              <p className="text-white text-lg">{slide.rightContent.content}</p>
            )}
          </div>
        </div>
      )

    default:
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-white/60">Type de slide non reconnu</p>
        </div>
      )
  }
}

export {
  TitleSlide,
  ContentSlide,
  QuoteSlide,
  CarouselSlide,
  VideoSlide,
  StatsSlide,
  ScenarioSlide,
  InteractiveSlide,
  TimelineSlide,
  GallerySlide,
}
