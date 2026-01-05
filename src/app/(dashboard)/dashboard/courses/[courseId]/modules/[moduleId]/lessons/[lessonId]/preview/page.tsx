'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Loader2,
  Video,
  FileText,
  File,
  HelpCircle,
  Layers,
  BookOpen,
  Edit,
  Link as LinkIcon,
  Puzzle,
  ArrowRightLeft,
  TextCursor,
  MousePointer,
  ArrowUpDown,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'
import {
  DragDropExercise,
  MatchingExercise,
  FillBlankExercise,
  FlashcardsExercise,
  SortingExercise,
  VideoPlayer,
  PDFViewer,
  MarkdownContent,
} from '@/components/lessons/interactive-content'
import { ImmersivePlayer } from '@/components/scenario'
import type { Scenario } from '@/types/scenario'
import { Play } from 'lucide-react'

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

const contentTypeConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  VIDEO: { icon: Video, label: 'Video', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  TEXT: { icon: FileText, label: 'Texte', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  PDF: { icon: File, label: 'Document PDF', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
  QUIZ: { icon: HelpCircle, label: 'Quiz', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  EXTERNAL_LINK: { icon: LinkIcon, label: 'Lien externe', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  DRAG_DROP: { icon: Puzzle, label: 'Glisser-Deposer', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  MATCHING: { icon: ArrowRightLeft, label: 'Association', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300' },
  FILL_BLANK: { icon: TextCursor, label: 'Texte a trous', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  HOTSPOT: { icon: MousePointer, label: 'Zones cliquables', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300' },
  SORTING: { icon: ArrowUpDown, label: 'Classement', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' },
  FLASHCARDS: { icon: Layers, label: 'Flashcards', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300' },
  DOCUMENT: { icon: BookOpen, label: 'Document', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  INTERACTIVE_SCENARIO: { icon: Play, label: 'Scenario interactif', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' },
}

export default function LessonPreviewPage() {
  const params = useParams()
  const courseId = params.courseId as string
  const moduleId = params.moduleId as string
  const lessonId = params.lessonId as string

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [score, setScore] = useState<number | null>(null)
  const [showImmersivePlayer, setShowImmersivePlayer] = useState(false)
  const [scenarioData, setScenarioData] = useState<Scenario | null>(null)

  useEffect(() => {
    async function fetchLesson() {
      try {
        const response = await fetch(
          `/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`
        )
        if (response.ok) {
          const data = await response.json()
          setLesson(data)
          // Parse scenario data if INTERACTIVE_SCENARIO
          if (data.contentType === 'INTERACTIVE_SCENARIO' && data.content) {
            try {
              const parsed = JSON.parse(data.content) as Scenario
              setScenarioData(parsed)
            } catch {
              console.error('Failed to parse scenario data')
            }
          }
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

  const handleExerciseComplete = (exerciseScore: number) => {
    setScore(exerciseScore)
    if (exerciseScore >= 70) {
      toast.success(`Bravo ! Score: ${exerciseScore}%`)
    } else {
      toast.info(`Score: ${exerciseScore}%. Reessayez pour ameliorer !`)
    }
  }

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

  const typeConfig = contentTypeConfig[lesson.contentType] || contentTypeConfig.TEXT
  const TypeIcon = typeConfig.icon

  // Parse content for interactive types
  interface ParsedContent {
    zones?: { id: string; label: string }[]
    items?: { id: string; text: string; zone: string; correctOrder?: number }[]
    pairs?: { id: string; left: string; right: string }[]
    text?: string
    answers?: string[]
    cards?: { id: string; front: string; back: string }[]
  }
  let parsedContent: ParsedContent = {}
  if (lesson.content) {
    try {
      parsedContent = JSON.parse(lesson.content) as ParsedContent
    } catch {
      // Content is plain text
    }
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
          <Badge variant="outline" className={`flex items-center gap-1.5 ${typeConfig.color}`}>
            <TypeIcon className="h-3.5 w-3.5" />
            {typeConfig.label}
          </Badge>
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Link>
          </Button>
        </div>
      </div>

      {/* Score indicator for interactive content */}
      {score !== null && (
        <Card className={score >= 70 ? 'border-green-500' : 'border-yellow-500'}>
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <CheckCircle2 className={`h-8 w-8 ${score >= 70 ? 'text-green-500' : 'text-yellow-500'}`} />
              <div className="flex-1">
                <p className="font-medium">
                  {score >= 70 ? 'Excellent travail !' : 'Continuez vos efforts !'}
                </p>
                <Progress value={score} className="mt-2" />
              </div>
              <div className="text-2xl font-bold">
                {score}%
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>Contenu de la lecon</CardTitle>
          {lesson.description && (
            <CardDescription>{lesson.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* VIDEO */}
          {lesson.contentType === 'VIDEO' && lesson.videoUrl && (
            <VideoPlayer url={lesson.videoUrl} />
          )}

          {/* TEXT */}
          {lesson.contentType === 'TEXT' && lesson.content && (
            <MarkdownContent content={lesson.content} />
          )}

          {/* PDF */}
          {lesson.contentType === 'PDF' && lesson.videoUrl && (
            <PDFViewer url={lesson.videoUrl} />
          )}

          {/* EXTERNAL LINK */}
          {lesson.contentType === 'EXTERNAL_LINK' && lesson.videoUrl && (
            <div className="space-y-4">
              {lesson.content && (
                <div className="p-4 bg-muted rounded-lg">
                  <MarkdownContent content={lesson.content} />
                </div>
              )}
              <Button asChild size="lg" className="w-full">
                <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-5 w-5" />
                  Acceder a la ressource externe
                </a>
              </Button>
            </div>
          )}

          {/* DRAG & DROP */}
          {lesson.contentType === 'DRAG_DROP' && parsedContent.zones && parsedContent.items && (
            <DragDropExercise
              zones={parsedContent.zones}
              items={parsedContent.items as { id: string; text: string; zone: string }[]}
              onComplete={handleExerciseComplete}
            />
          )}

          {/* MATCHING */}
          {lesson.contentType === 'MATCHING' && parsedContent.pairs && (
            <MatchingExercise
              pairs={parsedContent.pairs}
              onComplete={handleExerciseComplete}
            />
          )}

          {/* FILL IN THE BLANK */}
          {lesson.contentType === 'FILL_BLANK' && parsedContent.text && parsedContent.answers && (
            <FillBlankExercise
              text={parsedContent.text}
              answers={parsedContent.answers}
              onComplete={handleExerciseComplete}
            />
          )}

          {/* FLASHCARDS */}
          {lesson.contentType === 'FLASHCARDS' && parsedContent.cards && (
            <FlashcardsExercise
              cards={parsedContent.cards}
            />
          )}

          {/* SORTING */}
          {lesson.contentType === 'SORTING' && parsedContent.items && (
            <SortingExercise
              items={parsedContent.items as { id: string; text: string; correctOrder: number }[]}
              onComplete={handleExerciseComplete}
            />
          )}

          {/* DOCUMENT */}
          {lesson.contentType === 'DOCUMENT' && lesson.content && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Ce document necessite votre lecture et comprehension avant de continuer.
                </p>
              </div>
              <MarkdownContent content={lesson.content} />
            </div>
          )}

          {/* INTERACTIVE_SCENARIO */}
          {lesson.contentType === 'INTERACTIVE_SCENARIO' && scenarioData && (
            <div className="space-y-4">
              <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                    <Play className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                      {scenarioData.title}
                    </h3>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                      Formation interactive avec {scenarioData.slides.length} section(s)
                    </p>
                    {scenarioData.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {scenarioData.description}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700"
                  size="lg"
                  onClick={() => setShowImmersivePlayer(true)}
                >
                  <Play className="mr-2 h-5 w-5" />
                  Lancer la formation
                </Button>
              </div>
            </div>
          )}

          {/* HOTSPOT - Coming soon */}
          {lesson.contentType === 'HOTSPOT' && (
            <div className="text-center py-12">
              <MousePointer className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Les zones cliquables seront bientot disponibles
              </p>
            </div>
          )}

          {/* Media attachments */}
          {lesson.media && lesson.media.length > 0 && (
            <div className="space-y-4 pt-6 border-t">
              <h3 className="font-semibold">Fichiers attaches</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {lesson.media.map((media) => (
                  <a
                    key={media.id}
                    href={media.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <File className="h-5 w-5 text-muted-foreground" />
                    <span className="flex-1 text-sm font-medium truncate">
                      {media.filename}
                    </span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* No content message */}
          {!lesson.content && !lesson.videoUrl && (!lesson.media || lesson.media.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun contenu pour cette lecon</p>
              <Button asChild className="mt-4" variant="outline">
                <Link href={`/dashboard/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`}>
                  Ajouter du contenu
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Immersive Player Modal */}
      {showImmersivePlayer && scenarioData && (
        <div className="fixed inset-0 z-50">
          <ImmersivePlayer
            scenario={scenarioData}
            onExit={() => setShowImmersivePlayer(false)}
            onComplete={() => {
              setShowImmersivePlayer(false)
              toast.success('Formation terminee !')
            }}
          />
        </div>
      )}
    </div>
  )
}
