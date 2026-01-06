import { getSession } from '@/lib/auth/session'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Users,
  Play,
  CheckCircle2,
  Lock,
  FileText,
  Video,
  FileQuestion,
  Edit,
  Puzzle,
  ArrowRightLeft,
  TextCursor,
  MousePointer,
  ArrowUpDown,
  Layers,
  Link as LinkIcon,
} from 'lucide-react'
import Link from 'next/link'
import { Role, CourseStatus } from '@prisma/client'
import { EnrollButton } from '@/components/courses/EnrollButton'

interface Props {
  params: Promise<{ courseId: string }>
}

export default async function CourseDetailPage({ params }: Props) {
  const session = await getSession()
  if (!session?.user) return null

  const { courseId } = await params

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      modules: {
        orderBy: { order: 'asc' },
      },
      _count: { select: { enrollments: true } },
    },
  })

  if (!course) notFound()

  // Check access
  const isCreator = ([Role.ADMIN, Role.TRAINER] as Role[]).includes(session.user.role)
  if (course.status !== CourseStatus.PUBLISHED && !isCreator && course.creatorId !== session.user.id) {
    notFound()
  }

  // Get enrollment and progress
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId,
      },
    },
  })

  const progress = await prisma.courseProgress.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId,
      },
    },
  })

  const totalModules = course.modules.length
  // Progress tracking will be implemented when migrating to module-based progress
  const completedModules = 0

  const contentTypeIcon: Record<string, typeof Video> = {
    VIDEO: Video,
    TEXT: FileText,
    PDF: FileText,
    QUIZ: FileQuestion,
    EXTERNAL_LINK: LinkIcon,
    DRAG_DROP: Puzzle,
    MATCHING: ArrowRightLeft,
    FILL_BLANK: TextCursor,
    HOTSPOT: MousePointer,
    SORTING: ArrowUpDown,
    FLASHCARDS: Layers,
    INTERACTIVE_SCENARIO: Play,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/courses">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-2">
              {course.status !== 'PUBLISHED' && (
                <Badge variant="secondary">
                  {course.status === 'DRAFT' ? 'Brouillon' : 'Archivé'}
                </Badge>
              )}
              {course.difficulty && (
                <Badge variant="outline">{course.difficulty}</Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <p className="text-muted-foreground mt-2">{course.description}</p>
          </div>
        </div>
        {(isCreator || course.creatorId === session.user.id) && (
          <Button asChild variant="outline">
            <Link href={`/dashboard/courses/${courseId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Link>
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{course.modules.length}</p>
              <p className="text-sm text-muted-foreground">Modules</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{course._count.enrollments}</p>
              <p className="text-sm text-muted-foreground">Inscrits</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Clock className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{course.duration || '?'}</p>
              <p className="text-sm text-muted-foreground">Minutes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress & Enrollment */}
      {enrollment ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Votre progression</h3>
                <p className="text-sm text-muted-foreground">
                  {completedModules} / {totalModules} modules terminés
                </p>
              </div>
              <span className="text-2xl font-bold">
                {Math.round(progress?.progressPercent || 0)}%
              </span>
            </div>
            <Progress value={progress?.progressPercent || 0} className="h-3" />
            {course.modules.length > 0 && (
              <Button asChild className="mt-4 w-full">
                <Link href={`/dashboard/courses/${courseId}/modules/${course.modules[0].id}/view`}>
                  <Play className="mr-2 h-4 w-4" />
                  {(progress?.progressPercent || 0) > 0 ? 'Continuer la formation' : 'Commencer la formation'}
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Commencez cette formation</h3>
              <p className="text-sm text-muted-foreground">
                Inscrivez-vous pour acceder au contenu
              </p>
            </div>
            <EnrollButton courseId={courseId} />
          </CardContent>
        </Card>
      )}

      {/* Modules */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Contenu de la formation</h2>
        {course.modules.length === 0 ? (
          <Card className="p-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun module pour le moment</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {course.modules.map((module, moduleIndex) => {
              const Icon = module.contentType ? contentTypeIcon[module.contentType] || FileText : FileText
              // Progress tracking to be implemented
              const isCompleted = false
              const isLocked = !enrollment

              return (
                <Link
                  key={module.id}
                  href={
                    isLocked
                      ? '#'
                      : `/dashboard/courses/${courseId}/modules/${module.id}/view`
                  }
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                    isLocked
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-accent'
                  }`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground font-medium">
                    {moduleIndex + 1}
                  </span>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      isCompleted
                        ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                        : 'bg-accent'
                    }`}
                  >
                    {isLocked ? (
                      <Lock className="h-5 w-5" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{module.title}</p>
                    {module.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {module.description}
                      </p>
                    )}
                  </div>
                  {module.contentType && (
                    <Badge variant="outline" className="text-xs">
                      {module.contentType}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
