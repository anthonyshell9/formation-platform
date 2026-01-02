'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  ArrowRight,
  GripVertical,
} from 'lucide-react'

// =============================================================================
// DRAG & DROP EXERCISE
// =============================================================================
interface DragDropZone {
  id: string
  label: string
}

interface DragDropItem {
  id: string
  text: string
  zone: string
}

interface DragDropProps {
  zones: DragDropZone[]
  items: DragDropItem[]
  onComplete?: (score: number) => void
}

export function DragDropExercise({ zones, items, onComplete }: DragDropProps) {
  const [placements, setPlacements] = useState<Record<string, string>>({})
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [shuffledItems, setShuffledItems] = useState<DragDropItem[]>(() =>
    [...items].sort(() => Math.random() - 0.5)
  )

  const handleDragStart = (itemId: string) => {
    setDraggedItem(itemId)
  }

  const handleDrop = (zoneId: string) => {
    if (draggedItem) {
      setPlacements(prev => ({ ...prev, [draggedItem]: zoneId }))
      setDraggedItem(null)
    }
  }

  const handleSubmit = () => {
    setSubmitted(true)
    const correct = items.filter(item => placements[item.id] === item.zone).length
    const score = Math.round((correct / items.length) * 100)
    onComplete?.(score)
  }

  const handleReset = () => {
    setPlacements({})
    setSubmitted(false)
    setShuffledItems([...items].sort(() => Math.random() - 0.5))
  }

  const getItemsInZone = (zoneId: string) => {
    return shuffledItems.filter(item => placements[item.id] === zoneId)
  }

  const getUnplacedItems = () => {
    return shuffledItems.filter(item => !placements[item.id])
  }

  return (
    <div className="space-y-6">
      {/* Unplaced items */}
      <div className="p-4 bg-muted/50 rounded-lg min-h-[80px]">
        <p className="text-sm font-medium mb-3 text-muted-foreground">
          Glissez les elements dans les zones appropriees
        </p>
        <div className="flex flex-wrap gap-2">
          {getUnplacedItems().map(item => (
            <div
              key={item.id}
              draggable={!submitted}
              onDragStart={() => handleDragStart(item.id)}
              className={cn(
                "px-3 py-2 bg-background border rounded-lg cursor-grab active:cursor-grabbing shadow-sm",
                "hover:border-primary hover:shadow-md transition-all",
                submitted && "cursor-default"
              )}
            >
              {item.text}
            </div>
          ))}
          {getUnplacedItems().length === 0 && !submitted && (
            <p className="text-sm text-muted-foreground italic">
              Tous les elements ont ete places
            </p>
          )}
        </div>
      </div>

      {/* Drop zones */}
      <div className="grid gap-4 md:grid-cols-2">
        {zones.map(zone => {
          const zoneItems = getItemsInZone(zone.id)
          return (
            <div
              key={zone.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(zone.id)}
              className={cn(
                "p-4 border-2 border-dashed rounded-lg min-h-[120px] transition-colors",
                draggedItem && "border-primary bg-primary/5",
                !draggedItem && "border-muted-foreground/25"
              )}
            >
              <p className="font-medium mb-3">{zone.label}</p>
              <div className="space-y-2">
                {zoneItems.map(item => {
                  const isCorrect = item.zone === zone.id
                  return (
                    <div
                      key={item.id}
                      draggable={!submitted}
                      onDragStart={() => handleDragStart(item.id)}
                      className={cn(
                        "px-3 py-2 bg-background border rounded-lg flex items-center gap-2",
                        !submitted && "cursor-grab",
                        submitted && isCorrect && "border-green-500 bg-green-50 dark:bg-green-950",
                        submitted && !isCorrect && "border-red-500 bg-red-50 dark:bg-red-950"
                      )}
                    >
                      <span className="flex-1">{item.text}</span>
                      {submitted && (
                        isCorrect
                          ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                          : <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Recommencer
        </Button>
        {!submitted ? (
          <Button onClick={handleSubmit} disabled={Object.keys(placements).length !== items.length}>
            Verifier mes reponses
          </Button>
        ) : (
          <div className="text-sm font-medium">
            Score: {items.filter(item => placements[item.id] === item.zone).length}/{items.length} correct
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// MATCHING EXERCISE
// =============================================================================
interface MatchingPair {
  id: string
  left: string
  right: string
}

interface MatchingProps {
  pairs: MatchingPair[]
  onComplete?: (score: number) => void
}

export function MatchingExercise({ pairs, onComplete }: MatchingProps) {
  const [connections, setConnections] = useState<Record<string, string>>({})
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [shuffledRight, setShuffledRight] = useState<MatchingPair[]>(() =>
    [...pairs].sort(() => Math.random() - 0.5)
  )

  const handleLeftClick = (pairId: string) => {
    if (submitted) return
    if (selectedLeft === pairId) {
      setSelectedLeft(null)
    } else {
      setSelectedLeft(pairId)
    }
  }

  const handleRightClick = (pairId: string) => {
    if (submitted || !selectedLeft) return
    setConnections(prev => ({ ...prev, [selectedLeft]: pairId }))
    setSelectedLeft(null)
  }

  const handleSubmit = () => {
    setSubmitted(true)
    const correct = pairs.filter(pair => connections[pair.id] === pair.id).length
    const score = Math.round((correct / pairs.length) * 100)
    onComplete?.(score)
  }

  const handleReset = () => {
    setConnections({})
    setSelectedLeft(null)
    setSubmitted(false)
    setShuffledRight([...pairs].sort(() => Math.random() - 0.5))
  }

  const getConnectionColor = (leftId: string) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500']
    const index = Object.keys(connections).indexOf(leftId)
    return index >= 0 ? colors[index % colors.length] : ''
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Cliquez sur un element a gauche, puis sur son correspondant a droite
      </p>

      <div className="grid grid-cols-2 gap-8">
        {/* Left column */}
        <div className="space-y-2">
          {pairs.map(pair => {
            const isConnected = connections[pair.id]
            const isSelected = selectedLeft === pair.id
            const isCorrect = submitted && connections[pair.id] === pair.id

            return (
              <button
                key={pair.id}
                onClick={() => handleLeftClick(pair.id)}
                disabled={submitted}
                className={cn(
                  "w-full p-3 text-left rounded-lg border-2 transition-all flex items-center gap-2",
                  isSelected && "border-primary ring-2 ring-primary/20",
                  !isSelected && !isConnected && "border-muted hover:border-muted-foreground",
                  isConnected && !submitted && "border-muted",
                  submitted && isCorrect && "border-green-500 bg-green-50 dark:bg-green-950",
                  submitted && !isCorrect && "border-red-500 bg-red-50 dark:bg-red-950"
                )}
              >
                {isConnected && (
                  <span className={cn("w-3 h-3 rounded-full", getConnectionColor(pair.id))} />
                )}
                <span className="flex-1">{pair.left}</span>
                {submitted && (
                  isCorrect
                    ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                    : <XCircle className="h-4 w-4 text-red-600" />
                )}
              </button>
            )
          })}
        </div>

        {/* Right column */}
        <div className="space-y-2">
          {shuffledRight.map(pair => {
            const connectedTo = Object.entries(connections).find(([, v]) => v === pair.id)?.[0]

            return (
              <button
                key={pair.id}
                onClick={() => handleRightClick(pair.id)}
                disabled={submitted || !selectedLeft}
                className={cn(
                  "w-full p-3 text-left rounded-lg border-2 transition-all flex items-center gap-2",
                  !connectedTo && "border-muted hover:border-muted-foreground",
                  connectedTo && "border-muted",
                  selectedLeft && !connectedTo && "hover:border-primary"
                )}
              >
                {connectedTo && (
                  <span className={cn("w-3 h-3 rounded-full", getConnectionColor(connectedTo))} />
                )}
                <span className="flex-1">{pair.right}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Recommencer
        </Button>
        {!submitted ? (
          <Button onClick={handleSubmit} disabled={Object.keys(connections).length !== pairs.length}>
            Verifier mes reponses
          </Button>
        ) : (
          <div className="text-sm font-medium">
            Score: {pairs.filter(pair => connections[pair.id] === pair.id).length}/{pairs.length} correct
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// FILL IN THE BLANKS
// =============================================================================
interface FillBlankProps {
  text: string
  answers: string[]
  onComplete?: (score: number) => void
}

export function FillBlankExercise({ text, answers, onComplete }: FillBlankProps) {
  const [userAnswers, setUserAnswers] = useState<string[]>(answers.map(() => ''))
  const [submitted, setSubmitted] = useState(false)

  const parts = text.split(/\[___\]/)

  const handleSubmit = () => {
    setSubmitted(true)
    const correct = userAnswers.filter((answer, idx) =>
      answer.toLowerCase().trim() === answers[idx]?.toLowerCase().trim()
    ).length
    const score = Math.round((correct / answers.length) * 100)
    onComplete?.(score)
  }

  const handleReset = () => {
    setUserAnswers(answers.map(() => ''))
    setSubmitted(false)
  }

  let blankIndex = 0

  return (
    <div className="space-y-6">
      <div className="text-lg leading-relaxed">
        {parts.map((part, idx) => (
          <span key={idx}>
            {part}
            {idx < parts.length - 1 && (
              <span className="inline-block align-middle mx-1">
                <Input
                  value={userAnswers[blankIndex] || ''}
                  onChange={(e) => {
                    const newAnswers = [...userAnswers]
                    newAnswers[blankIndex] = e.target.value
                    setUserAnswers(newAnswers)
                  }}
                  disabled={submitted}
                  className={cn(
                    "w-32 h-8 inline-block text-center",
                    submitted && userAnswers[blankIndex]?.toLowerCase().trim() === answers[blankIndex]?.toLowerCase().trim()
                      && "border-green-500 bg-green-50 dark:bg-green-950",
                    submitted && userAnswers[blankIndex]?.toLowerCase().trim() !== answers[blankIndex]?.toLowerCase().trim()
                      && "border-red-500 bg-red-50 dark:bg-red-950"
                  )}
                  ref={() => { blankIndex++ }}
                />
                {submitted && userAnswers[blankIndex - 1]?.toLowerCase().trim() !== answers[blankIndex - 1]?.toLowerCase().trim() && (
                  <span className="text-sm text-green-600 ml-2">
                    ({answers[blankIndex - 1]})
                  </span>
                )}
              </span>
            )}
          </span>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Recommencer
        </Button>
        {!submitted ? (
          <Button onClick={handleSubmit}>
            Verifier mes reponses
          </Button>
        ) : (
          <div className="text-sm font-medium">
            Score: {userAnswers.filter((answer, idx) =>
              answer.toLowerCase().trim() === answers[idx]?.toLowerCase().trim()
            ).length}/{answers.length} correct
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// FLASHCARDS
// =============================================================================
interface FlashCard {
  id: string
  front: string
  back: string
}

interface FlashcardsProps {
  cards: FlashCard[]
}

export function FlashcardsExercise({ cards }: FlashcardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [shuffledCards, setShuffledCards] = useState<FlashCard[]>(() => [...cards])
  const [isAnimating, setIsAnimating] = useState(false)
  const [knownCards, setKnownCards] = useState<Set<string>>(new Set())

  const handleShuffle = () => {
    setShuffledCards([...cards].sort(() => Math.random() - 0.5))
    setCurrentIndex(0)
    setIsFlipped(false)
    setKnownCards(new Set())
  }

  const handleFlip = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsFlipped(!isFlipped)
    setTimeout(() => setIsAnimating(false), 600)
  }

  const handleNext = () => {
    if (currentIndex < shuffledCards.length - 1 && !isAnimating) {
      setIsAnimating(true)
      setIsFlipped(false)
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1)
        setIsAnimating(false)
      }, 150)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0 && !isAnimating) {
      setIsAnimating(true)
      setIsFlipped(false)
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1)
        setIsAnimating(false)
      }, 150)
    }
  }

  const markAsKnown = () => {
    if (currentCard) {
      setKnownCards(prev => new Set([...prev, currentCard.id]))
      handleNext()
    }
  }

  const currentCard = shuffledCards[currentIndex]

  if (!currentCard) return null

  const progress = Math.round((knownCards.size / shuffledCards.length) * 100)

  return (
    <div className="space-y-6">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm px-3 py-1">
            {currentIndex + 1} / {shuffledCards.length}
          </Badge>
          {knownCards.size > 0 && (
            <Badge className="bg-green-500 text-white">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {knownCards.size} maitrise{knownCards.size > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleShuffle}>
          <Shuffle className="mr-2 h-4 w-4" />
          Recommencer
        </Button>
      </div>

      {/* Progress bar */}
      {shuffledCards.length > 1 && (
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Flashcard with 3D flip */}
      <div
        onClick={handleFlip}
        className="cursor-pointer select-none"
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative w-full transition-all duration-500 ease-in-out"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: '280px',
          }}
        >
          {/* Front - Question */}
          <div
            className="absolute inset-0 rounded-2xl border-2 bg-gradient-to-br from-background to-muted/50 shadow-lg flex flex-col items-center justify-center p-8"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <div className="absolute top-4 left-4">
              <Badge variant="secondary" className="text-xs">
                Question
              </Badge>
            </div>
            <div className="text-center max-w-md">
              <p className="text-2xl font-semibold leading-relaxed">{currentCard.front}</p>
            </div>
            <div className="absolute bottom-4 flex items-center gap-2 text-muted-foreground">
              <RotateCcw className="h-4 w-4" />
              <span className="text-sm">Cliquez pour retourner</span>
            </div>
          </div>

          {/* Back - Answer */}
          <div
            className="absolute inset-0 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg flex flex-col items-center justify-center p-8"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="absolute top-4 left-4">
              <Badge className="bg-primary text-primary-foreground text-xs">
                Reponse
              </Badge>
            </div>
            <div className="text-center max-w-md">
              <p className="text-2xl font-semibold leading-relaxed text-primary">{currentCard.back}</p>
            </div>
            <div className="absolute bottom-4 flex items-center gap-2 text-muted-foreground">
              <RotateCcw className="h-4 w-4" />
              <span className="text-sm">Cliquez pour retourner</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentIndex === 0 || isAnimating}
          className="flex-1"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Precedente
        </Button>

        <Button
          variant="default"
          onClick={markAsKnown}
          disabled={knownCards.has(currentCard.id) || isAnimating}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          {knownCards.has(currentCard.id) ? 'Maitrise !' : 'Je sais'}
        </Button>

        <Button
          variant="outline"
          onClick={handleNext}
          disabled={currentIndex === shuffledCards.length - 1 || isAnimating}
          className="flex-1"
        >
          Suivante
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-xs text-muted-foreground">
        Astuce: Utilisez Espace pour retourner, les fleches pour naviguer
      </p>
    </div>
  )
}

// =============================================================================
// SORTING EXERCISE
// =============================================================================
interface SortingItem {
  id: string
  text: string
  correctOrder: number
}

interface SortingProps {
  items: SortingItem[]
  onComplete?: (score: number) => void
}

export function SortingExercise({ items, onComplete }: SortingProps) {
  const [orderedItems, setOrderedItems] = useState<SortingItem[]>(() =>
    [...items].sort(() => Math.random() - 0.5)
  )
  const [submitted, setSubmitted] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newItems = [...orderedItems]
    const [draggedItem] = newItems.splice(draggedIndex, 1)
    newItems.splice(index, 0, draggedItem)
    setOrderedItems(newItems)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleSubmit = () => {
    setSubmitted(true)
    const correct = orderedItems.filter((item, idx) => item.correctOrder === idx + 1).length
    const score = Math.round((correct / items.length) * 100)
    onComplete?.(score)
  }

  const handleReset = () => {
    setOrderedItems([...items].sort(() => Math.random() - 0.5))
    setSubmitted(false)
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Glissez les elements pour les mettre dans le bon ordre
      </p>

      <div className="space-y-2">
        {orderedItems.map((item, index) => {
          const isCorrect = item.correctOrder === index + 1
          return (
            <div
              key={item.id}
              draggable={!submitted}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
                !submitted && "cursor-grab active:cursor-grabbing hover:border-primary",
                submitted && isCorrect && "border-green-500 bg-green-50 dark:bg-green-950",
                submitted && !isCorrect && "border-red-500 bg-red-50 dark:bg-red-950",
                draggedIndex === index && "opacity-50"
              )}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground w-6">
                {index + 1}.
              </span>
              <span className="flex-1">{item.text}</span>
              {submitted && (
                isCorrect
                  ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                  : <span className="text-xs text-red-600">Position correcte: {item.correctOrder}</span>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Recommencer
        </Button>
        {!submitted ? (
          <Button onClick={handleSubmit}>
            Verifier mon classement
          </Button>
        ) : (
          <div className="text-sm font-medium">
            Score: {orderedItems.filter((item, idx) => item.correctOrder === idx + 1).length}/{items.length} correct
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// VIDEO PLAYER
// =============================================================================
interface VideoPlayerProps {
  url: string
  title?: string
}

export function VideoPlayer({ url, title }: VideoPlayerProps) {
  const getEmbedUrl = (videoUrl: string) => {
    // YouTube
    const ytMatch = videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    if (ytMatch) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`
    }

    // Vimeo
    const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`
    }

    return videoUrl
  }

  const embedUrl = getEmbedUrl(url)
  const isEmbed = embedUrl !== url

  return (
    <div className="space-y-4">
      {title && <h3 className="font-semibold text-lg">{title}</h3>}
      <div className="aspect-video rounded-lg overflow-hidden bg-black">
        {isEmbed ? (
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        ) : (
          <video src={url} controls className="w-full h-full" />
        )}
      </div>
    </div>
  )
}

// =============================================================================
// PDF VIEWER
// =============================================================================
interface PDFViewerProps {
  url: string
  title?: string
}

export function PDFViewer({ url, title }: PDFViewerProps) {
  return (
    <div className="space-y-4">
      {title && <h3 className="font-semibold text-lg">{title}</h3>}
      <div className="border rounded-lg overflow-hidden">
        <iframe
          src={url}
          className="w-full h-[600px]"
          title={title || "Document PDF"}
        />
      </div>
      <div className="flex justify-end">
        <Button variant="outline" asChild>
          <a href={url} target="_blank" rel="noopener noreferrer">
            Ouvrir dans un nouvel onglet
          </a>
        </Button>
      </div>
    </div>
  )
}

// =============================================================================
// MARKDOWN RENDERER
// =============================================================================
interface MarkdownContentProps {
  content: string
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  // Basic markdown to HTML conversion
  const renderMarkdown = (text: string) => {
    const html = text
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-8 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      // Code blocks
      .replace(/```([\s\S]*?)```/gim, '<pre class="bg-muted p-4 rounded-lg overflow-x-auto my-4"><code>$1</code></pre>')
      // Inline code
      .replace(/`(.*?)`/gim, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener" class="text-primary underline">$1</a>')
      // Unordered lists
      .replace(/^\s*[-*] (.*$)/gim, '<li class="ml-4">$1</li>')
      // Ordered lists
      .replace(/^\s*\d+\. (.*$)/gim, '<li class="ml-4 list-decimal">$1</li>')
      // Line breaks
      .replace(/\n\n/gim, '</p><p class="my-4">')
      .replace(/\n/gim, '<br/>')

    return `<div class="prose dark:prose-invert max-w-none"><p class="my-4">${html}</p></div>`
  }

  return (
    <div
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      className="prose dark:prose-invert max-w-none"
    />
  )
}
