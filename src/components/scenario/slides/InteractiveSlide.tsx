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
  QuizExercise,
} from '@/components/lessons/interactive-content'
import { AlertCircle, Puzzle, ArrowRightLeft, TextCursor, Layers, ArrowUpDown, HelpCircle, MousePointer } from 'lucide-react'

interface InteractiveSlideProps {
  slide: InteractiveSlideType
  onComplete?: (score: number) => void
}

export function InteractiveSlide({ slide, onComplete }: InteractiveSlideProps) {
  const [mounted, setMounted] = useState(false)
  const [score, setScore] = useState<number | null>(null)

  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setMounted(true)
    })
    return () => cancelAnimationFrame(timer)
  }, [])

  const handleComplete = (completionScore: number) => {
    setScore(completionScore)
    onComplete?.(completionScore)
  }

  const getExerciseIcon = () => {
    switch (slide.interactiveType) {
      case 'drag-drop': return <Puzzle className="w-16 h-16" />
      case 'matching': return <ArrowRightLeft className="w-16 h-16" />
      case 'fill-blank': return <TextCursor className="w-16 h-16" />
      case 'flashcards': return <Layers className="w-16 h-16" />
      case 'sorting': return <ArrowUpDown className="w-16 h-16" />
      case 'quiz': return <HelpCircle className="w-16 h-16" />
      case 'hotspot': return <MousePointer className="w-16 h-16" />
      default: return <AlertCircle className="w-16 h-16" />
    }
  }

  const getExerciseLabel = () => {
    switch (slide.interactiveType) {
      case 'drag-drop': return 'Glisser-Déposer'
      case 'matching': return 'Association'
      case 'fill-blank': return 'Texte à trous'
      case 'flashcards': return 'Flashcards'
      case 'sorting': return 'Classement'
      case 'quiz': return 'Quiz'
      case 'hotspot': return 'Zones cliquables'
      default: return 'Exercice'
    }
  }

  const renderInteractive = () => {
    const config = slide.config as Record<string, unknown>

    switch (slide.interactiveType) {
      case 'drag-drop':
        if (!config.zones || !config.items || (config.zones as []).length === 0) {
          return renderPlaceholder('Configurez les zones et les éléments à déplacer')
        }
        return (
          <DragDropExercise
            zones={(config.zones as Array<{ id: string; label: string }>) || []}
            items={
              (config.items as Array<{ id: string; text: string; zone: string }>) || []
            }
            onComplete={handleComplete}
          />
        )

      case 'matching':
        if (!config.pairs || (config.pairs as []).length === 0) {
          return renderPlaceholder('Configurez les paires à associer')
        }
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
        if (!config.text || !config.answers) {
          return renderPlaceholder('Configurez le texte et les réponses')
        }
        return (
          <FillBlankExercise
            text={(config.text as string) || ''}
            answers={(config.answers as string[]) || []}
            onComplete={handleComplete}
          />
        )

      case 'flashcards':
        if (!config.cards || (config.cards as []).length === 0) {
          return renderPlaceholder('Configurez les cartes (question/réponse)')
        }
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
        if (!config.items || (config.items as []).length === 0) {
          return renderPlaceholder('Configurez les éléments à classer')
        }
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
        const quizId = config.quizId as string
        if (!quizId) {
          return renderPlaceholder('Selectionnez un quiz a integrer')
        }
        return (
          <QuizExercise
            quizId={quizId}
            onComplete={handleComplete}
            darkMode={true}
          />
        )

      case 'hotspot':
        return renderPlaceholder('Les zones cliquables seront bientôt disponibles')

      default:
        return renderPlaceholder('Type d\'exercice non reconnu')
    }
  }

  const renderPlaceholder = (message: string) => (
    <div className="text-center text-white/70 space-y-4 py-8">
      {getExerciseIcon()}
      <p className="text-xl font-medium text-white">{getExerciseLabel()}</p>
      <p className="text-white/60">{message}</p>
      <p className="text-sm text-white/40">
        Utilisez l&apos;éditeur pour configurer cet exercice
      </p>
    </div>
  )

  return (
    <div className="flex flex-col h-full px-8 md:px-16 py-12">
      {/* Title */}
      {slide.title && (
        <h2
          className={cn(
            'text-3xl md:text-4xl font-bold text-center mb-4 transition-all duration-500',
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
          style={{ color: slide.titleColor || '#ffffff' }}
        >
          {slide.title}
        </h2>
      )}

      {/* Instructions */}
      {slide.instructions && (
        <p
          className={cn(
            'text-lg text-center mb-8 transition-all duration-500',
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
          style={{ color: 'rgba(255,255,255,0.7)', transitionDelay: '100ms' }}
        >
          {slide.instructions}
        </p>
      )}

      {/* Interactive Content */}
      <div
        className={cn(
          'flex-1 flex items-center justify-center transition-all duration-500',
          mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        )}
        style={{ transitionDelay: '200ms' }}
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
