import { getSession } from '@/lib/auth/session'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Video,
  FileText,
  HelpCircle,
  Puzzle,
  ArrowRightLeft,
  TextCursor,
  MousePointer,
  ArrowUpDown,
  Layers,
  Link as LinkIcon,
  File,
  ExternalLink,
  Clock,
  Target,
  XCircle,
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

interface Props {
  params: Promise<{ courseId: string; lessonId: string }>
}

const contentTypeConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  VIDEO: { icon: Video, label: 'Video', color: 'bg-red-100 text-red-700' },
  TEXT: { icon: FileText, label: 'Texte', color: 'bg-blue-100 text-blue-700' },
  PDF: { icon: File, label: 'PDF', color: 'bg-orange-100 text-orange-700' },
  QUIZ: { icon: HelpCircle, label: 'Quiz', color: 'bg-purple-100 text-purple-700' },
  EXTERNAL_LINK: { icon: LinkIcon, label: 'Lien', color: 'bg-gray-100 text-gray-700' },
  DRAG_DROP: { icon: Puzzle, label: 'Glisser-Deposer', color: 'bg-green-100 text-green-700' },
  MATCHING: { icon: ArrowRightLeft, label: 'Association', color: 'bg-cyan-100 text-cyan-700' },
  FILL_BLANK: { icon: TextCursor, label: 'Texte a trous', color: 'bg-yellow-100 text-yellow-700' },
  HOTSPOT: { icon: MousePointer, label: 'Zones cliquables', color: 'bg-pink-100 text-pink-700' },
  SORTING: { icon: ArrowUpDown, label: 'Classement', color: 'bg-indigo-100 text-indigo-700' },
  FLASHCARDS: { icon: Layers, label: 'Flashcards', color: 'bg-teal-100 text-teal-700' },
}

export default async function LessonPage({ params }: Props) {
  const session = await getSession()
  if (!session?.user) redirect('/auth/signin')

  const { courseId, lessonId } = await params

  // Get lesson with module and course info
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        include: {
          course: true,
          lessons: {
            orderBy: { order: 'asc' },
            select: { id: true, title: true, order: true },
          },
        },
      },
      media: true,
      quiz: {
        include: {
          questions: {
            orderBy: { order: 'asc' },
            include: {
              options: { orderBy: { order: 'asc' } },
            },
          },
        },
      },
    },
  })

  // Get user's quiz attempts if this is a quiz lesson
  let quizAttempts: {
    id: string
    score: number | null
    passed: boolean | null
    startedAt: Date
    completedAt: Date | null
  }[] = []

  if (lesson?.quiz) {
    quizAttempts = await prisma.quizAttempt.findMany({
      where: {
        quizId: lesson.quiz.id,
        userId: session.user.id,
      },
      orderBy: { startedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        score: true,
        passed: true,
        startedAt: true,
        completedAt: true,
      },
    })
  }

  if (!lesson || lesson.module.courseId !== courseId) {
    notFound()
  }

  // Check enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId,
      },
    },
  })

  if (!enrollment) {
    redirect(`/dashboard/courses/${courseId}`)
  }

  // Get or create progress
  let courseProgress = await prisma.courseProgress.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId,
      },
    },
    include: { lessons: true },
  })

  if (!courseProgress) {
    courseProgress = await prisma.courseProgress.create({
      data: {
        userId: session.user.id,
        courseId,
        progressPercent: 0,
      },
      include: { lessons: true },
    })
  }

  // Mark lesson as started if not already
  const lessonProgress = courseProgress.lessons.find(l => l.lessonId === lessonId)
  if (!lessonProgress) {
    await prisma.lessonProgress.create({
      data: {
        courseProgressId: courseProgress.id,
        lessonId,
        completed: false,
      },
    })
  }

  // Get all lessons in course for navigation
  const allModules = await prisma.module.findMany({
    where: { courseId },
    orderBy: { order: 'asc' },
    include: {
      lessons: {
        orderBy: { order: 'asc' },
        select: { id: true },
      },
    },
  })

  const allLessonIds = allModules.flatMap(m => m.lessons.map(l => l.id))
  const currentIndex = allLessonIds.indexOf(lessonId)
  const prevLessonId = currentIndex > 0 ? allLessonIds[currentIndex - 1] : null
  const nextLessonId = currentIndex < allLessonIds.length - 1 ? allLessonIds[currentIndex + 1] : null

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
            <Link href={`/dashboard/courses/${courseId}`}>
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
        <Badge variant="outline" className={`flex items-center gap-1.5 ${typeConfig.color}`}>
          <TypeIcon className="h-3.5 w-3.5" />
          {typeConfig.label}
        </Badge>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Lecon {currentIndex + 1} sur {allLessonIds.length}
            </span>
            <span className="font-medium">
              {Math.round((currentIndex + 1) / allLessonIds.length * 100)}%
            </span>
          </div>
          <Progress value={(currentIndex + 1) / allLessonIds.length * 100} className="h-2 mt-2" />
        </CardContent>
      </Card>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>Contenu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* VIDEO */}
          {lesson.contentType === 'VIDEO' && lesson.videoUrl && (
            <VideoPlayer url={lesson.videoUrl} />
          )}

          {/* QUIZ */}
          {lesson.contentType === 'QUIZ' && lesson.quiz && (
            <div className="space-y-6">
              {/* Quiz Info */}
              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardContent className="flex items-center gap-4 p-4">
                    <HelpCircle className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-2xl font-bold">{lesson.quiz.questions.length}</p>
                      <p className="text-sm text-muted-foreground">Questions</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-4 p-4">
                    <Clock className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-2xl font-bold">{lesson.quiz.timeLimit || '-'}</p>
                      <p className="text-sm text-muted-foreground">Min. limite</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-4 p-4">
                    <Target className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-2xl font-bold">{lesson.quiz.passingScore}%</p>
                      <p className="text-sm text-muted-foreground">Score requis</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quiz Description */}
              {lesson.quiz.description && (
                <div className="p-4 bg-muted rounded-lg">
                  <p>{lesson.quiz.description}</p>
                </div>
              )}

              {/* Previous Attempts */}
              {quizAttempts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Vos tentatives précédentes</h4>
                  {quizAttempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-accent/50"
                    >
                      <div className="flex items-center gap-3">
                        {attempt.passed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <p className="font-medium">
                            Score: {Math.round(attempt.score || 0)}%
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(attempt.startedAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge variant={attempt.passed ? 'default' : 'destructive'}>
                        {attempt.passed ? 'Réussi' : 'Échoué'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Start Quiz Button */}
              <div className="flex justify-center">
                <Button asChild size="lg">
                  <Link href={`/dashboard/quizzes/${lesson.quiz.id}/take?lessonId=${lessonId}&courseId=${courseId}`}>
                    <HelpCircle className="mr-2 h-5 w-5" />
                    {quizAttempts.length > 0 ? 'Repasser le quiz' : 'Commencer le quiz'}
                  </Link>
                </Button>
              </div>
            </div>
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
                  Acceder a la ressource
                </a>
              </Button>
            </div>
          )}

          {/* DRAG & DROP */}
          {lesson.contentType === 'DRAG_DROP' && parsedContent.zones && parsedContent.items && (
            <DragDropExercise
              zones={parsedContent.zones}
              items={parsedContent.items as { id: string; text: string; zone: string }[]}
            />
          )}

          {/* MATCHING */}
          {lesson.contentType === 'MATCHING' && parsedContent.pairs && (
            <MatchingExercise pairs={parsedContent.pairs} />
          )}

          {/* FILL IN THE BLANK */}
          {lesson.contentType === 'FILL_BLANK' && parsedContent.text && parsedContent.answers && (
            <FillBlankExercise
              text={parsedContent.text}
              answers={parsedContent.answers}
            />
          )}

          {/* FLASHCARDS */}
          {lesson.contentType === 'FLASHCARDS' && parsedContent.cards && (
            <FlashcardsExercise cards={parsedContent.cards} />
          )}

          {/* SORTING */}
          {lesson.contentType === 'SORTING' && parsedContent.items && (
            <SortingExercise
              items={parsedContent.items as { id: string; text: string; correctOrder: number }[]}
            />
          )}

          {/* DOCUMENT */}
          {lesson.contentType === 'DOCUMENT' && lesson.content && (
            <MarkdownContent content={lesson.content} />
          )}

          {/* No content */}
          {!lesson.content && !lesson.videoUrl && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun contenu pour cette lecon</p>
            </div>
          )}

          {/* Media attachments */}
          {lesson.media && lesson.media.length > 0 && (
            <div className="space-y-4 pt-6 border-t">
              <h3 className="font-semibold">Fichiers joints</h3>
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
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        {prevLessonId ? (
          <Button variant="outline" asChild>
            <Link href={`/dashboard/courses/${courseId}/lessons/${prevLessonId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Precedent
            </Link>
          </Button>
        ) : (
          <div />
        )}

        <form
          action={async () => {
            'use server'
            const { checkAndAwardBadges } = await import('@/lib/services/awards')

            // Mark lesson as completed
            const progress = await prisma.courseProgress.findUnique({
              where: {
                userId_courseId: {
                  userId: session.user.id,
                  courseId,
                },
              },
            })

            if (progress) {
              await prisma.lessonProgress.upsert({
                where: {
                  courseProgressId_lessonId: {
                    courseProgressId: progress.id,
                    lessonId,
                  },
                },
                update: { completed: true, completedAt: new Date() },
                create: {
                  courseProgressId: progress.id,
                  lessonId,
                  completed: true,
                  completedAt: new Date(),
                },
              })

              // Update course progress
              const allLessons = await prisma.lesson.count({
                where: { module: { courseId } },
              })
              const completedLessons = await prisma.lessonProgress.count({
                where: {
                  courseProgressId: progress.id,
                  completed: true,
                },
              })

              const progressPercent = Math.round((completedLessons / allLessons) * 100)

              await prisma.courseProgress.update({
                where: { id: progress.id },
                data: { progressPercent },
              })

              // Check and award badges/certificates if course is complete
              if (progressPercent >= 100) {
                await checkAndAwardBadges(session.user.id, courseId)
              }

              // Revalidate the course page to show updated progress
              revalidatePath(`/dashboard/courses/${courseId}`)
              revalidatePath(`/dashboard/courses/${courseId}/lessons/${lessonId}`)
              revalidatePath('/dashboard/my-courses')
            }
          }}
        >
          <Button type="submit" variant="secondary">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Marquer comme termine
          </Button>
        </form>

        {nextLessonId ? (
          <Button asChild>
            <Link href={`/dashboard/courses/${courseId}/lessons/${nextLessonId}`}>
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
  )
}
