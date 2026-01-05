'use client'

import { cn } from '@/lib/utils'
import type { Slide } from '@/types/scenario'
import {
  Type,
  FileText,
  Quote,
  Image,
  Video,
  BarChart2,
  Play,
  Puzzle,
  Clock,
  Images,
  Columns,
  GripVertical,
  Plus,
  Trash2,
  Copy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SlideListProps {
  slides: Slide[]
  selectedSlideId: string | null
  onSelectSlide: (id: string) => void
  onAddSlide: () => void
  onDeleteSlide: (id: string) => void
  onDuplicateSlide: (id: string) => void
  onReorderSlides: (fromIndex: number, toIndex: number) => void
}

const slideIcons: Record<string, React.ReactNode> = {
  title: <Type className="w-4 h-4" />,
  content: <FileText className="w-4 h-4" />,
  quote: <Quote className="w-4 h-4" />,
  carousel: <Images className="w-4 h-4" />,
  video: <Video className="w-4 h-4" />,
  stats: <BarChart2 className="w-4 h-4" />,
  scenario: <Play className="w-4 h-4" />,
  interactive: <Puzzle className="w-4 h-4" />,
  timeline: <Clock className="w-4 h-4" />,
  gallery: <Image className="w-4 h-4" />,
  comparison: <Columns className="w-4 h-4" />,
}

const slideLabels: Record<string, string> = {
  title: 'Titre',
  content: 'Contenu',
  quote: 'Citation',
  carousel: 'Carrousel',
  video: 'Vidéo',
  stats: 'Statistiques',
  scenario: 'Scénario',
  interactive: 'Interactif',
  timeline: 'Timeline',
  gallery: 'Galerie',
  comparison: 'Comparaison',
}

function getSlidePreviewText(slide: Slide): string {
  switch (slide.type) {
    case 'title':
      return slide.title || 'Sans titre'
    case 'content':
      return slide.title || slide.text?.substring(0, 30) || 'Contenu'
    case 'quote':
      return slide.quote?.substring(0, 30) || 'Citation'
    case 'carousel':
      return slide.title || `${slide.items.length} éléments`
    case 'video':
      return slide.title || 'Vidéo'
    case 'stats':
      return slide.title || `${slide.stats.length} stats`
    case 'scenario':
      return `Scénario ${slide.elements?.length || 0} éléments`
    case 'interactive':
      return slide.title || slide.interactiveType
    case 'timeline':
      return slide.title || `${slide.events.length} événements`
    case 'gallery':
      return slide.title || `${slide.images.length} images`
    case 'comparison':
      return `${slide.leftTitle || 'Gauche'} vs ${slide.rightTitle || 'Droite'}`
    default:
      return 'Slide'
  }
}

export function SlideList({
  slides,
  selectedSlideId,
  onSelectSlide,
  onAddSlide,
  onDeleteSlide,
  onDuplicateSlide,
}: SlideListProps) {
  const sortedSlides = [...slides].sort((a, b) => a.order - b.order)

  return (
    <div className="flex flex-col h-full bg-muted/30 border-r">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Slides
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sortedSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={cn(
              'group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors',
              selectedSlideId === slide.id
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            )}
            onClick={() => onSelectSlide(slide.id)}
          >
            <GripVertical className="w-4 h-4 opacity-0 group-hover:opacity-50 cursor-grab" />

            <span className="flex-shrink-0 w-6 h-6 rounded bg-background/20 flex items-center justify-center text-xs">
              {index + 1}
            </span>

            <span className="flex-shrink-0">
              {slideIcons[slide.type] || <FileText className="w-4 h-4" />}
            </span>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {slideLabels[slide.type]}
              </p>
              <p
                className={cn(
                  'text-xs truncate',
                  selectedSlideId === slide.id
                    ? 'text-primary-foreground/70'
                    : 'text-muted-foreground'
                )}
              >
                {getSlidePreviewText(slide)}
              </p>
            </div>

            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 flex gap-1">
              <button
                className="p-1 rounded hover:bg-background/20"
                onClick={(e) => {
                  e.stopPropagation()
                  onDuplicateSlide(slide.id)
                }}
                title="Dupliquer"
              >
                <Copy className="w-3 h-3" />
              </button>
              <button
                className="p-1 rounded hover:bg-destructive/20 text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteSlide(slide.id)
                }}
                title="Supprimer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-2 border-t">
        <Button onClick={onAddSlide} className="w-full" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une slide
        </Button>
      </div>
    </div>
  )
}
