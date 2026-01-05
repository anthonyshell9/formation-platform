'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { InteractiveSlide as InteractiveSlideType } from '@/types/scenario'
import {
  DragDropExercise,
  MatchingExercise,
  FillBlankExercise,
  FlashcardsExercise,
  SortingExercise,
} from '@/components/lessons/interactive-content'

interface InteractiveSlideProps {
  slide: InteractiveSlideType
  onComplete?: (score: number) => void
}

export function InteractiveSlide({ slide, onComplete }: InteractiveSlideProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [score, setScore] = useState<number | null>(null)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleComplete = (completionScore: number) => {
    setScore(completionScore)
    onComplete?.(completionScore)
  }

  const renderInteractive = () => {
    const config = slide.config as Record<string, unknown>

    switch (slide.interactiveType) {
      case 'drag-drop':
        return (
          <DragDropExercise
            zones={(config.zones as Array<{ id: string; label: string }>) || []}
            items={
              (config.items as Array<{ id: string; text: string; zone: string }>) ||
              []
            }
            onComplete={handleComplete}
          />
        )

      case 'matching':
        return (
          <MatchingExercise
            pairs={
              (config.pairs as Array<{
                id: string
                left: string
                right: string
              }>) || []
            }
            onComplete={handleComplete}
          />
        )

      case 'fill-blank':
        return (
          <FillBlankExercise
            text={(config.text as string) || ''}
            answers={(config.answers as string[]) || []}
            onComplete={handleComplete}
          />
        )

      case 'flashcards':
        return (
          <FlashcardsExercise
            cards={
              (config.cards as Array<{
                id: string
                front: string
                back: string
              }>) || []
            }
          />
        )

      case 'sorting':
        return (
          <SortingExercise
            items={
              (config.items as Array<{
                id: string
                text: string
                correctOrder: number
              }>) || []
            }
            onComplete={handleComplete}
          />
        )

      case 'quiz':
        // Quiz would be handled separately as it has its own flow
        return (
          <div className="text-center text-white">
            <p className="text-xl">Quiz intégré - ID: {config.quizId as string}</p>
          </div>
        )

      case 'hotspot':
        return (
          <div className="text-center text-white">
            <p className="text-xl">Exercice Hotspot à venir</p>
          </div>
        )

      default:
        return (
          <div className="text-center text-white">
            <p>Type d&apos;exercice non reconnu</p>
          </div>
        )
    }
  }

  return (
    <div className="flex flex-col h-full px-8 md:px-16 py-12">
      {/* Title */}
      {slide.title && (
        <h2
          className={cn(
            'text-3xl md:text-4xl font-bold text-white text-center mb-4 transition-all duration-700',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          {slide.title}
        </h2>
      )}

      {/* Instructions */}
      {slide.instructions && (
        <p
          className={cn(
            'text-lg text-white/70 text-center mb-8 transition-all duration-700 delay-100',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          {slide.instructions}
        </p>
      )}

      {/* Interactive Content */}
      <div
        className={cn(
          'flex-1 flex items-center justify-center transition-all duration-700 delay-200',
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        )}
      >
        <div className="w-full max-w-4xl bg-white/5 backdrop-blur-sm rounded-2xl p-6 md:p-8">
          {renderInteractive()}
        </div>
      </div>

      {/* Score Display */}
      {slide.showScore && score !== null && (
        <div
          className={cn(
            'mt-6 text-center transition-all duration-500',
            score >= 70 ? 'text-green-400' : 'text-amber-400'
          )}
        >
          <p className="text-3xl font-bold">{Math.round(score)}%</p>
          <p className="text-lg">
            {score >= 70 ? 'Excellent travail !' : 'Continuez vos efforts !'}
          </p>
        </div>
      )}
    </div>
  )
}
