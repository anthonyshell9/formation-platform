'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Loader2,
  Video,
  FileText,
  Code,
  Image as ImageIcon,
  ListChecks,
  HelpCircle,
  Layers,
  BookOpen,
  Edit,
} from 'lucide-react'
import Link from 'next/link'

interface LessonMedia {
  id: string
  type: string
  url: string
  filename: string
}

interface Lesson {
  id: string
  title: string
  description?: string
  contentType: string
  content?: string
  videoUrl?: string
  videoDuration?: number
  moduleId: string
  media: LessonMedia[]
  module: {
    id: string
    title: string
    courseId: string
    course: { id: string; title: string }
  }
}

const contentTypeIcons: Record<string, React.ReactNode> = {
  VIDEO: <Video className="h-5 w-5" />,
  TEXT: <FileText className="h-5 w-5" />,
  INTERACTIVE: <Code className="h-5 w-5" />,
  QUIZ: <HelpCircle className="h-5 w-5" />,
  SLIDES: <Layers className="h-5 w-5" />,
  DOCUMENT: <BookOpen className="h-5 w-5" />,
}

const contentTypeLabels: Record<string, string> = {
  VIDEO: 'Video',
  TEXT: 'Texte',
  INTERACTIVE: 'Interactif',
  QUIZ: 'Quiz',
  SLIDES: 'Diaporama',
  DOCUMENT: 'Document',
}

export default function LessonPreviewPage() {
  const params = useParams()
  const courseId = params.courseId as string
  const moduleId = params.moduleId as string
  const lessonId = params.lessonId as string

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLesson() {
      try {
        const response = await fetch(
          `/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`
        )
        if (response.ok) {
          const data = await response.json()
          setLesson(data)
        } else {
          toast.error('Erreur lors du chargement')
        }
      } catch (error) {
        toast.error('Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }
    fetchLesson()
  }, [courseId, moduleId, lessonId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Lecon non trouvee</p>
        <Button asChild variant="outline">
          <Link href={`/dashboard/courses/${courseId}/modules/${moduleId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/courses/${courseId}/modules/${moduleId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="text-sm text-muted-foreground">
              {lesson.module.course.title} / {lesson.module.title}
            </div>
            <h1 className="text-2xl font-bold">{lesson.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            {contentTypeIcons[lesson.contentType]}
            {contentTypeLabels[lesson.contentType] || lesson.contentType}
          </Badge>
          <Button asChild variant="outline">
            <Link href={`/dashboard/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>Apercu du contenu</CardTitle>
          {lesson.description && (
            <p className="text-muted-foreground">{lesson.description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Video */}
          {lesson.contentType === 'VIDEO' && lesson.videoUrl && (
            <div className="aspect-video rounded-lg overflow-hidden bg-black">
              <video
                src={lesson.videoUrl}
                controls
                className="w-full h-full"
              />
            </div>
          )}

          {/* Text/Document Content */}
          {(lesson.contentType === 'TEXT' || lesson.contentType === 'DOCUMENT') && lesson.content && (
            <div className="prose dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
            </div>
          )}

          {/* Interactive Content */}
          {lesson.contentType === 'INTERACTIVE' && lesson.content && (
            <InteractivePreview content={lesson.content} />
          )}

          {/* Slides */}
          {lesson.contentType === 'SLIDES' && lesson.content && (
            <SlidesPreview content={lesson.content} />
          )}

          {/* Quiz */}
          {lesson.contentType === 'QUIZ' && lesson.content && (
            <QuizPreview content={lesson.content} />
          )}

          {/* Media attachments */}
          {lesson.media && lesson.media.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Fichiers attaches</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {lesson.media.map((media) => (
                  <div
                    key={media.id}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                  >
                    {media.type === 'image' ? (
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{media.filename}</p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={media.url} target="_blank" rel="noopener noreferrer">
                        Voir
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No content message */}
          {!lesson.content && !lesson.videoUrl && lesson.media.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun contenu pour cette lecon</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Interactive content preview
function InteractivePreview({ content }: { content: string }) {
  try {
    const data = JSON.parse(content)

    if (data.type === 'flashcards' && data.cards) {
      return (
        <div className="space-y-4">
          <h3 className="font-semibold">Flashcards ({data.cards.length})</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {data.cards.slice(0, 4).map((card: { front: string; back: string }, index: number) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <p className="font-medium mb-2">Q: {card.front}</p>
                  <p className="text-muted-foreground">R: {card.back}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          {data.cards.length > 4 && (
            <p className="text-sm text-muted-foreground">
              +{data.cards.length - 4} autres cartes...
            </p>
          )}
        </div>
      )
    }

    if (data.type === 'timeline' && data.events) {
      return (
        <div className="space-y-4">
          <h3 className="font-semibold">Timeline ({data.events.length} evenements)</h3>
          <div className="border-l-2 pl-4 space-y-4">
            {data.events.map((event: { date: string; title: string; description?: string }, index: number) => (
              <div key={index}>
                <span className="text-sm font-medium text-primary">{event.date}</span>
                <p className="font-medium">{event.title}</p>
                {event.description && (
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )
    }

    return (
      <div className="p-4 bg-muted rounded-lg">
        <pre className="text-sm overflow-auto">{JSON.stringify(data, null, 2)}</pre>
      </div>
    )
  } catch {
    return (
      <div className="prose dark:prose-invert max-w-none">
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    )
  }
}

// Slides preview
function SlidesPreview({ content }: { content: string }) {
  try {
    const data = JSON.parse(content)
    if (data.slides) {
      return (
        <div className="space-y-4">
          <h3 className="font-semibold">Diaporama ({data.slides.length} slides)</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {data.slides.slice(0, 6).map((slide: { title: string; content?: string }, index: number) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <p className="font-medium text-sm">Slide {index + 1}</p>
                  <p className="text-xs text-muted-foreground truncate">{slide.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )
    }
    return null
  } catch {
    return null
  }
}

// Quiz preview
function QuizPreview({ content }: { content: string }) {
  try {
    const data = JSON.parse(content)
    if (data.questions) {
      return (
        <div className="space-y-4">
          <h3 className="font-semibold">Quiz ({data.questions.length} questions)</h3>
          <div className="space-y-4">
            {data.questions.slice(0, 3).map((q: { question: string; options?: string[] }, index: number) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <p className="font-medium">Q{index + 1}: {q.question}</p>
                  {q.options && (
                    <ul className="mt-2 space-y-1">
                      {q.options.map((opt: string, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground">
                          {String.fromCharCode(65 + i)}. {opt}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          {data.questions.length > 3 && (
            <p className="text-sm text-muted-foreground">
              +{data.questions.length - 3} autres questions...
            </p>
          )}
        </div>
      )
    }
    return null
  } catch {
    return null
  }
}
