'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Video,
  FileText,
  FileQuestion,
  Puzzle,
  ArrowRightLeft,
  TextCursor,
  ArrowUpDown,
  Layers,
  Link as LinkIcon,
  Play,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import {
  DragDropExercise,
  MatchingExercise,
  FillBlankExercise,
  FlashcardsExercise,
  SortingExercise,
  QuizExercise,
} from '@/components/lessons/interactive-content'

interface Module {
  id: string
  title: string
  description?: string
  order: number
  contentType?: string
  content?: string
  videoUrl?: string
  videoDuration?: number
  requiresAck?: boolean
  courseId: string
  quiz?: {
    id: string
    title: string
  }
}

interface CourseModule {
  id: string
  title: string
  order: number
}

export default function ModuleViewPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string
  const moduleId = params.moduleId as string

  const [isLoading, setIsLoading] = useState(true)
  const [module, setModule] = useState<Module | null>(null)
  const [allModules, setAllModules] = useState<CourseModule[]>([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [isMarkingComplete, setIsMarkingComplete] = useState(false)
  const [hasAcknowledged, setHasAcknowledged] = useState(false)

  useEffect(() => {
    loadModuleData()
  }, [moduleId])

  async function loadModuleData() {
    try {
      // Load module details
      const moduleRes = await fetch(`/api/courses/${courseId}/modules/${moduleId}`)
      if (!moduleRes.ok) throw new Error('Erreur de chargement')
      const moduleData = await moduleRes.json()
      setModule(moduleData)

      // Load all modules for navigation
      const modulesRes = await fetch(`/api/courses/${courseId}/modules`)
      if (modulesRes.ok) {
        const modulesData = await modulesRes.json()
        setAllModules(modulesData)
      }

      // Check progress
      // This would need a proper progress tracking API
    } catch (error) {
      toast.error('Erreur lors du chargement du module')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  async function markAsComplete() {
    setIsMarkingComplete(true)
    try {
      // TODO: Implement progress tracking API
      setIsCompleted(true)
      toast.success('Module terminé!')

      // Navigate to next module if available
      const currentIndex = allModules.findIndex(m => m.id === moduleId)
      if (currentIndex < allModules.length - 1) {
        router.push(`/dashboard/courses/${courseId}/modules/${allModules[currentIndex + 1].id}/view`)
      } else {
        router.push(`/dashboard/courses/${courseId}`)
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour de la progression')
    } finally {
      setIsMarkingComplete(false)
    }
  }

  const currentIndex = allModules.findIndex(m => m.id === moduleId)
  const prevModule = currentIndex > 0 ? allModules[currentIndex - 1] : null
  const nextModule = currentIndex < allModules.length - 1 ? allModules[currentIndex + 1] : null

  const contentTypeIcon: Record<string, typeof Video> = {
    VIDEO: Video,
    TEXT: FileText,
    PDF: FileText,
    QUIZ: FileQuestion,
    EXTERNAL_LINK: LinkIcon,
    DRAG_DROP: Puzzle,
    MATCHING: ArrowRightLeft,
    FILL_BLANK: TextCursor,
    SORTING: ArrowUpDown,
    FLASHCARDS: Layers,
    INTERACTIVE_SCENARIO: Play,
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!module) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Module non trouvé</p>
        <Button asChild className="mt-4">
          <Link href={`/dashboard/courses/${courseId}`}>Retour au cours</Link>
        </Button>
      </div>
    )
  }

  const Icon = module.contentType ? contentTypeIcon[module.contentType] || FileText : FileText

  const renderContent = () => {
    switch (module.contentType) {
      case 'VIDEO':
        return (
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            {module.videoUrl?.includes('youtube') || module.videoUrl?.includes('youtu.be') ? (
              <iframe
                src={module.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                className="w-full h-full"
                allowFullScreen
              />
            ) : module.videoUrl?.includes('vimeo') ? (
              <iframe
                src={module.videoUrl.replace('vimeo.com/', 'player.vimeo.com/video/')}
                className="w-full h-full"
                allowFullScreen
              />
            ) : (
              <video
                src={module.videoUrl}
                controls
                className="w-full h-full"
              />
            )}
          </div>
        )

      case 'TEXT':
        return (
          <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
            {module.content || ''}
          </div>
        )

      case 'PDF':
        return (
          <div className="space-y-4">
            <iframe
              src={module.content}
              className="w-full h-[600px] rounded-lg border"
            />
            {module.requiresAck && !hasAcknowledged && (
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <input
                  type="checkbox"
                  id="acknowledge"
                  checked={hasAcknowledged}
                  onChange={(e) => setHasAcknowledged(e.target.checked)}
                  className="w-5 h-5"
                />
                <label htmlFor="acknowledge" className="text-sm">
                  Je confirme avoir lu et compris ce document
                </label>
              </div>
            )}
          </div>
        )

      case 'EXTERNAL_LINK':
        return (
          <div className="text-center py-12">
            <ExternalLink className="h-16 w-16 mx-auto text-primary mb-4" />
            <p className="text-lg mb-4">Ce module vous redirige vers une ressource externe</p>
            <Button asChild size="lg">
              <a href={module.content} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-5 w-5" />
                Ouvrir la ressource
              </a>
            </Button>
          </div>
        )

      case 'INTERACTIVE_SCENARIO':
        return (
          <div className="text-center py-12">
            <Play className="h-16 w-16 mx-auto text-primary mb-4" />
            <p className="text-lg mb-4">Scénario interactif</p>
            <Button asChild size="lg">
              <Link href={`/dashboard/scenario-player?moduleId=${moduleId}&courseId=${courseId}`}>
                <Play className="mr-2 h-5 w-5" />
                Lancer le scénario
              </Link>
            </Button>
          </div>
        )

      case 'QUIZ':
        if (module.quiz) {
          return (
            <QuizExercise
              quizId={module.quiz.id}
              onComplete={(score) => {
                if (score >= 70) {
                  markAsComplete()
                }
              }}
            />
          )
        }
        return <p className="text-muted-foreground text-center">Aucun quiz configuré</p>

      case 'DRAG_DROP':
        try {
          const config = JSON.parse(module.content || '{}')
          return (
            <DragDropExercise
              zones={config.zones || []}
              items={config.items || []}
              onComplete={(score) => {
                if (score >= 70) markAsComplete()
              }}
            />
          )
        } catch {
          return <p className="text-muted-foreground text-center">Configuration invalide</p>
        }

      case 'MATCHING':
        try {
          const config = JSON.parse(module.content || '{}')
          return (
            <MatchingExercise
              pairs={config.pairs || []}
              onComplete={(score) => {
                if (score >= 70) markAsComplete()
              }}
            />
          )
        } catch {
          return <p className="text-muted-foreground text-center">Configuration invalide</p>
        }

      case 'FILL_BLANK':
        try {
          const config = JSON.parse(module.content || '{}')
          return (
            <FillBlankExercise
              text={config.text || ''}
              answers={config.answers || []}
              onComplete={(score) => {
                if (score >= 70) markAsComplete()
              }}
            />
          )
        } catch {
          return <p className="text-muted-foreground text-center">Configuration invalide</p>
        }

      case 'FLASHCARDS':
        try {
          const config = JSON.parse(module.content || '{}')
          return <FlashcardsExercise cards={config.cards || []} />
        } catch {
          return <p className="text-muted-foreground text-center">Configuration invalide</p>
        }

      case 'SORTING':
        try {
          const config = JSON.parse(module.content || '{}')
          return (
            <SortingExercise
              items={config.items || []}
              onComplete={(score) => {
                if (score >= 70) markAsComplete()
              }}
            />
          )
        } catch {
          return <p className="text-muted-foreground text-center">Configuration invalide</p>
        }

      default:
        return (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>Aucun contenu configuré pour ce module</p>
          </div>
        )
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/courses/${courseId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-muted-foreground">
                Module {currentIndex + 1} / {allModules.length}
              </span>
              {module.contentType && (
                <Badge variant="outline" className="text-xs">
                  <Icon className="h-3 w-3 mr-1" />
                  {module.contentType}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold">{module.title}</h1>
          </div>
        </div>
        {isCompleted && (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Terminé
          </Badge>
        )}
      </div>

      {/* Progress */}
      <Progress value={((currentIndex + 1) / allModules.length) * 100} className="h-2" />

      {/* Description */}
      {module.description && (
        <p className="text-muted-foreground">{module.description}</p>
      )}

      {/* Content */}
      <Card>
        <CardContent className="p-6">
          {renderContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div>
          {prevModule && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/courses/${courseId}/modules/${prevModule.id}/view`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Précédent
              </Link>
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {!isCompleted && (
            <Button
              onClick={markAsComplete}
              disabled={isMarkingComplete || (module.requiresAck && !hasAcknowledged)}
            >
              {isMarkingComplete ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Marquer comme terminé
            </Button>
          )}
          {nextModule ? (
            <Button asChild>
              <Link href={`/dashboard/courses/${courseId}/modules/${nextModule.id}/view`}>
                Suivant
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href={`/dashboard/courses/${courseId}`}>
                Terminer
                <CheckCircle2 className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
