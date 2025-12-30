import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma/client'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { BookOpen, Clock, PlayCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

const SKIP_AUTH = process.env.SKIP_AUTH === 'true'

export default async function MyCoursesPage() {
  const session = await getSession()
  if (!session?.user) return null

  // In SKIP_AUTH mode, show empty state
  if (SKIP_AUTH) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mes formations</h1>
          <p className="text-muted-foreground">
            Suivez votre progression dans vos formations
          </p>
        </div>

        <Card className="p-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucune formation en cours</h3>
          <p className="text-muted-foreground mb-4">
            Inscrivez-vous à une formation pour commencer
          </p>
          <Button asChild>
            <Link href="/dashboard/courses">
              Découvrir les formations
            </Link>
          </Button>
        </Card>
      </div>
    )
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.user.id },
    include: {
      course: {
        include: {
          creator: { select: { id: true, name: true } },
          _count: { select: { modules: true } },
        },
      },
    },
    orderBy: { enrolledAt: 'desc' },
  })

  const progressData = await prisma.courseProgress.findMany({
    where: { userId: session.user.id },
  })

  const progressMap = new Map(progressData.map(p => [p.courseId, p]))

  const statusLabels: Record<string, string> = {
    ENROLLED: 'Inscrit',
    IN_PROGRESS: 'En cours',
    COMPLETED: 'Terminé',
    CANCELLED: 'Annulé',
  }

  const statusColors: Record<string, string> = {
    ENROLLED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mes formations</h1>
        <p className="text-muted-foreground">
          Suivez votre progression dans vos formations
        </p>
      </div>

      {enrollments.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucune formation en cours</h3>
          <p className="text-muted-foreground mb-4">
            Inscrivez-vous à une formation pour commencer
          </p>
          <Button asChild>
            <Link href="/dashboard/courses">
              Découvrir les formations
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map(enrollment => {
            const progress = progressMap.get(enrollment.courseId)
            const progressPercent = progress?.progressPercent || 0

            return (
              <Card key={enrollment.id} className="overflow-hidden flex flex-col">
                <div className="aspect-video bg-accent relative">
                  {enrollment.course.thumbnail ? (
                    <img
                      src={enrollment.course.thumbnail}
                      alt={enrollment.course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <Badge
                    className={`absolute top-2 right-2 ${statusColors[enrollment.status]}`}
                    variant="outline"
                  >
                    {statusLabels[enrollment.status]}
                  </Badge>
                </div>
                <CardHeader className="pb-2">
                  <h3 className="font-semibold leading-tight line-clamp-2">
                    {enrollment.course.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Par {enrollment.course.creator.name}
                  </p>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {enrollment.course.description || 'Aucune description'}
                  </p>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progression</span>
                      <span className="font-medium">{Math.round(progressPercent)}%</span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {enrollment.course._count.modules} modules
                    </span>
                    {enrollment.course.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {enrollment.course.duration}min
                      </span>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button asChild className="w-full">
                    <Link href={`/dashboard/courses/${enrollment.courseId}`}>
                      {progressPercent === 100 ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Revoir
                        </>
                      ) : progressPercent > 0 ? (
                        <>
                          <PlayCircle className="mr-2 h-4 w-4" />
                          Continuer
                        </>
                      ) : (
                        <>
                          <PlayCircle className="mr-2 h-4 w-4" />
                          Commencer
                        </>
                      )}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
