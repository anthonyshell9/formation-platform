import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma/client'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { BookOpen, Clock, PlayCircle, CheckCircle2, Users, GraduationCap } from 'lucide-react'
import Link from 'next/link'

const SKIP_AUTH = process.env.SKIP_AUTH === 'true'

export default async function MyCoursesPage() {
  const session = await getSession()
  if (!session?.user) return null

  // Fetch all published courses
  const allCourses = await prisma.course.findMany({
    where: {
      status: 'PUBLISHED',
    },
    include: {
      creator: { select: { id: true, name: true } },
      _count: { select: { modules: true, enrollments: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Fetch user enrollments
  const enrollments = SKIP_AUTH ? [] : await prisma.enrollment.findMany({
    where: { userId: session.user.id },
  })

  const enrollmentMap = new Map(enrollments.map(e => [e.courseId, e]))

  // Fetch user progress
  const progressData = SKIP_AUTH ? [] : await prisma.courseProgress.findMany({
    where: { userId: session.user.id },
  })

  const progressMap = new Map(progressData.map(p => [p.courseId, p]))

  // Separate enrolled and available courses
  const enrolledCourses = allCourses.filter(c => enrollmentMap.has(c.id))
  const availableCourses = allCourses.filter(c => !enrollmentMap.has(c.id))

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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Mes formations</h1>
        <p className="text-muted-foreground">
          Suivez votre progression et découvrez de nouvelles formations
        </p>
      </div>

      {/* Enrolled courses section */}
      {enrolledCourses.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">En cours ({enrolledCourses.length})</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {enrolledCourses.map(course => {
              const enrollment = enrollmentMap.get(course.id)!
              const progress = progressMap.get(course.id)
              const progressPercent = progress?.progressPercent || 0

              return (
                <Card key={course.id} className="overflow-hidden flex flex-col border-primary/20">
                  <div className="aspect-video bg-accent relative">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                        <BookOpen className="h-12 w-12 text-primary/40" />
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
                      {course.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Par {course.creator.name}
                    </p>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.description || 'Aucune description'}
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
                        {course._count.modules} modules
                      </span>
                      {course.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {course.duration}min
                        </span>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button asChild className="w-full">
                      <Link href={`/dashboard/courses/${course.id}`}>
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
        </section>
      )}

      {/* Available courses section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">
            {enrolledCourses.length > 0 ? 'Autres formations disponibles' : 'Formations disponibles'}
            {availableCourses.length > 0 && ` (${availableCourses.length})`}
          </h2>
        </div>

        {availableCourses.length === 0 && enrolledCourses.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune formation disponible</h3>
            <p className="text-muted-foreground">
              De nouvelles formations seront bientôt disponibles
            </p>
          </Card>
        ) : availableCourses.length === 0 ? (
          <Card className="p-8 text-center bg-muted/30">
            <CheckCircle2 className="h-10 w-10 mx-auto text-green-500 mb-3" />
            <h3 className="text-lg font-medium mb-1">Vous êtes inscrit à toutes les formations !</h3>
            <p className="text-muted-foreground text-sm">
              Continuez votre progression dans vos formations en cours
            </p>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {availableCourses.map(course => (
              <Card key={course.id} className="overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-accent relative">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                      <BookOpen className="h-12 w-12 text-muted-foreground/40" />
                    </div>
                  )}
                  {course.category && (
                    <Badge className="absolute top-2 right-2" variant="secondary">
                      {course.category}
                    </Badge>
                  )}
                </div>
                <CardHeader className="pb-2">
                  <h3 className="font-semibold leading-tight line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Par {course.creator.name}
                  </p>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {course.description || 'Aucune description'}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {course._count.modules} modules
                    </span>
                    {course.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.duration}min
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {course._count.enrollments}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/dashboard/courses/${course.id}`}>
                      Voir le détail
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
