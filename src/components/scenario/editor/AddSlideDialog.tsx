'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Slide, TitleSlide, ContentSlide, QuoteSlide, CarouselSlide, VideoSlide, StatsSlide, ScenarioSlide, InteractiveSlide, TimelineSlide, GallerySlide, ComparisonSlide } from '@/types/scenario'
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
} from 'lucide-react'

interface AddSlideDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddSlide: (slide: Slide) => void
  nextOrder: number
}

interface SlideTypeOption {
  type: Slide['type']
  label: string
  description: string
  icon: React.ReactNode
  category: 'basic' | 'media' | 'interactive' | 'advanced'
}

const slideTypes: SlideTypeOption[] = [
  {
    type: 'title',
    label: 'Titre',
    description: 'Page de titre plein écran',
    icon: <Type className="w-6 h-6" />,
    category: 'basic',
  },
  {
    type: 'content',
    label: 'Contenu',
    description: 'Texte avec image optionnelle',
    icon: <FileText className="w-6 h-6" />,
    category: 'basic',
  },
  {
    type: 'quote',
    label: 'Citation',
    description: 'Citation ou statement centré',
    icon: <Quote className="w-6 h-6" />,
    category: 'basic',
  },
  {
    type: 'video',
    label: 'Vidéo',
    description: 'Vidéo YouTube, Vimeo ou fichier',
    icon: <Video className="w-6 h-6" />,
    category: 'media',
  },
  {
    type: 'gallery',
    label: 'Galerie',
    description: 'Grille d\'images avec lightbox',
    icon: <Image className="w-6 h-6" />,
    category: 'media',
  },
  {
    type: 'carousel',
    label: 'Carrousel',
    description: 'Cards défilantes',
    icon: <Images className="w-6 h-6" />,
    category: 'media',
  },
  {
    type: 'stats',
    label: 'Statistiques',
    description: 'Chiffres clés animés',
    icon: <BarChart2 className="w-6 h-6" />,
    category: 'advanced',
  },
  {
    type: 'timeline',
    label: 'Timeline',
    description: 'Chronologie d\'événements',
    icon: <Clock className="w-6 h-6" />,
    category: 'advanced',
  },
  {
    type: 'comparison',
    label: 'Comparaison',
    description: 'Côte à côte ou avant/après',
    icon: <Columns className="w-6 h-6" />,
    category: 'advanced',
  },
  {
    type: 'scenario',
    label: 'Scénario',
    description: 'Animation avec narration',
    icon: <Play className="w-6 h-6" />,
    category: 'interactive',
  },
  {
    type: 'interactive',
    label: 'Exercice',
    description: 'Quiz, drag-drop, matching...',
    icon: <Puzzle className="w-6 h-6" />,
    category: 'interactive',
  },
]

const categories = [
  { id: 'basic', label: 'Basique' },
  { id: 'media', label: 'Média' },
  { id: 'advanced', label: 'Avancé' },
  { id: 'interactive', label: 'Interactif' },
]

function generateId(): string {
  return `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function createDefaultSlide(type: Slide['type'], order: number): Slide {
  const baseSlide = {
    id: generateId(),
    order,
  }

  switch (type) {
    case 'title':
      return {
        ...baseSlide,
        type: 'title',
        title: 'Titre de la section',
        subtitle: 'Sous-titre optionnel',
        background: {
          type: 'gradient',
          colors: ['#0A4D4A', '#00A693'],
          direction: 'to-bottom-right',
        },
      } as TitleSlide

    case 'content':
      return {
        ...baseSlide,
        type: 'content',
        layout: 'text-left',
        title: 'Titre du contenu',
        text: 'Votre texte ici...',
      } as ContentSlide

    case 'quote':
      return {
        ...baseSlide,
        type: 'quote',
        quote: 'Votre citation ici...',
        author: 'Auteur',
      } as QuoteSlide

    case 'carousel':
      return {
        ...baseSlide,
        type: 'carousel',
        title: 'Articles',
        items: [
          {
            id: generateId(),
            title: 'Article 1',
            description: 'Description de l\'article',
          },
        ],
        showArrows: true,
        showDots: true,
      } as CarouselSlide

    case 'video':
      return {
        ...baseSlide,
        type: 'video',
        videoUrl: '',
        title: 'Titre de la vidéo',
        autoPlay: false,
        controls: true,
      } as VideoSlide

    case 'stats':
      return {
        ...baseSlide,
        type: 'stats',
        title: 'Chiffres clés',
        stats: [
          { id: generateId(), value: 100, label: 'Statistique 1' },
          { id: generateId(), value: 50, label: 'Statistique 2' },
        ],
        animateCountUp: true,
      } as StatsSlide

    case 'scenario':
      return {
        ...baseSlide,
        type: 'scenario',
        elements: [],
        showSubtitles: true,
        background: {
          type: 'gradient',
          colors: ['#0A4D4A', '#00A693'],
        },
      } as ScenarioSlide

    case 'interactive':
      return {
        ...baseSlide,
        type: 'interactive',
        interactiveType: 'quiz',
        config: {},
        title: 'Exercice interactif',
        showScore: true,
      } as InteractiveSlide

    case 'timeline':
      return {
        ...baseSlide,
        type: 'timeline',
        title: 'Chronologie',
        events: [
          { id: generateId(), title: 'Événement 1', date: '2024' },
        ],
        orientation: 'vertical',
      } as TimelineSlide

    case 'gallery':
      return {
        ...baseSlide,
        type: 'gallery',
        title: 'Galerie',
        images: [],
        layout: 'grid',
        columns: 3,
      } as GallerySlide

    case 'comparison':
      return {
        ...baseSlide,
        type: 'comparison',
        layout: 'side-by-side',
        leftTitle: 'Avant',
        rightTitle: 'Après',
        leftContent: { type: 'text', content: 'Contenu gauche' },
        rightContent: { type: 'text', content: 'Contenu droite' },
      } as ComparisonSlide

    default:
      return {
        ...baseSlide,
        type: 'title',
        title: 'Nouvelle slide',
      } as TitleSlide
  }
}

export function AddSlideDialog({
  open,
  onOpenChange,
  onAddSlide,
  nextOrder,
}: AddSlideDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('basic')

  const handleSelectType = (type: Slide['type']) => {
    const newSlide = createDefaultSlide(type, nextOrder)
    onAddSlide(newSlide)
    onOpenChange(false)
  }

  const filteredTypes = slideTypes.filter((t) => t.category === selectedCategory)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajouter une slide</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {filteredTypes.map((option) => (
            <button
              key={option.type}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                'hover:border-primary hover:bg-primary/5',
                'focus:outline-none focus:ring-2 focus:ring-primary'
              )}
              onClick={() => handleSelectType(option.type)}
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                {option.icon}
              </div>
              <span className="font-medium">{option.label}</span>
              <span className="text-xs text-muted-foreground text-center">
                {option.description}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
