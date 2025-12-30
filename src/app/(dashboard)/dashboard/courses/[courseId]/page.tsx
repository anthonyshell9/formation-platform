import { getServerSession } from 'next-auth'
import { notFound, redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/options'
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
} from 'lucide-react'
import Link from 'next/link'
import { Role, CourseStatus } from '@prisma/client'

interface Props {
  params: Promise<{ courseId: string }>
}

export default async function CourseDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth/signin')

  const { courseId } = await params

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            include: {
              quiz: { select: { id: true, title: true } },
            },
          },
        },
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
    include: {
      lessons: true,
    },
  })

  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0)
  const completedLessons = progress?.lessons.filter(l => l.completed).length || 0

  const contentTypeIcon = {
    VIDEO: Video,
    TEXT: FileText,
    PDF: FileText,
    QUIZ: FileQuestion,
    EXTERNAL_LINK: FileText,
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
      <div className="grid gap-4 sm:grid-cols-4">
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
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{totalLessons}</p>
              <p className="text-sm text-muted-foreground">Leçons</p>
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
                  {completedLessons} / {totalLessons} leçons terminées
                </p>
              </div>
              <span className="text-2xl font-bold">
                {Math.round(progress?.progressPercent || 0)}%
              </span>
            </div>
            <Progress value={progress?.progressPercent || 0} className="h-3" />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Commencez cette formation</h3>
              <p className="text-sm text-muted-foreground">
                Inscrivez-vous pour accéder au contenu
              </p>
            </div>
            <form
              action={async () => {
                'use server'
                await prisma.enrollment.create({
                  data: {
                    userId: session.user.id,
                    courseId,
                  },
                })
                await prisma.courseProgress.create({
                  data: {
                    userId: session.user.id,
                    courseId,
                    progressPercent: 0,
                  },
                })
              }}
            >
              <Button type="submit">
                <Play className="mr-2 h-4 w-4" />
                Rejoindre
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Modules & Lessons */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Contenu de la formation</h2>
        {course.modules.length === 0 ? (
          <Card className="p-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun module pour le moment</p>
          </Card>
        ) : (
          course.modules.map((module, moduleIndex) => (
            <Card key={module.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {moduleIndex + 1}
                  </span>
                  {module.title}
                </CardTitle>
                {module.description && (
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {module.lessons.map((lesson) => {
                    const Icon = contentTypeIcon[lesson.contentType]
                    const lessonProgress = progress?.lessons.find(
                      l => l.lessonId === lesson.id
                    )
                    const isCompleted = lessonProgress?.completed
                    const isLocked = !enrollment

                    return (
                      <Link
                        key={lesson.id}
                        href={
                          isLocked
                            ? '#'
                            : `/dashboard/courses/${courseId}/lessons/${lesson.id}`
                        }
                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                          isLocked
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-accent'
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            isCompleted
                              ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                              : 'bg-accent'
                          }`}
                        >
                          {isLocked ? (
                            <Lock className="h-4 w-4" />
                          ) : isCompleted ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Icon className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{lesson.title}</p>
                          {lesson.videoDuration && (
                            <p className="text-xs text-muted-foreground">
                              {Math.floor(lesson.videoDuration / 60)}:
                              {String(lesson.videoDuration % 60).padStart(2, '0')}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {lesson.contentType}
                        </Badge>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
