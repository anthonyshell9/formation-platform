import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen,
  Clock,
  Award,
  TrendingUp,
  CheckCircle2,
  PlayCircle,
} from 'lucide-react'
import Link from 'next/link'
import { Role } from '@prisma/client'

async function getDashboardData(userId: string, role: Role) {
  const [
    enrollments,
    completedCourses,
    totalBadges,
    recentProgress,
    upcomingAssignments,
  ] = await Promise.all([
    prisma.enrollment.count({
      where: { userId, status: { not: 'CANCELLED' } },
    }),
    prisma.enrollment.count({
      where: { userId, status: 'COMPLETED' },
    }),
    prisma.userBadge.count({
      where: { userId },
    }),
    prisma.courseProgress.findMany({
      where: { userId },
      include: {
        course: { select: { id: true, title: true, thumbnail: true } },
      },
      orderBy: { lastAccessedAt: 'desc' },
      take: 4,
    }),
    prisma.courseAssignment.findMany({
      where: {
        group: { members: { some: { userId } } },
        startDate: { gte: new Date() },
      },
      include: {
        course: { select: { id: true, title: true, thumbnail: true } },
        group: { select: { name: true, color: true } },
      },
      orderBy: { startDate: 'asc' },
      take: 5,
    }),
  ])

  // Admin/Trainer stats
  let adminStats = null
  if (([Role.ADMIN, Role.TRAINER] as Role[]).includes(role)) {
    adminStats = await Promise.all([
      prisma.course.count(),
      prisma.user.count(),
      prisma.quiz.count(),
      prisma.group.count(),
    ]).then(([courses, users, quizzes, groups]) => ({
      courses,
      users,
      quizzes,
      groups,
    }))
  }

  return {
    enrollments,
    completedCourses,
    totalBadges,
    recentProgress,
    upcomingAssignments,
    adminStats,
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null

  const data = await getDashboardData(session.user.id, session.user.role)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Bonjour, {session.user.name?.split(' ')[0]}
        </h1>
        <p className="text-muted-foreground">
          Voici un aperçu de votre progression
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Formations inscrites</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.enrollments}</div>
            <p className="text-xs text-muted-foreground">
              {data.completedCourses} terminées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Progression moyenne</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.recentProgress.length > 0
                ? Math.round(
                    data.recentProgress.reduce((acc, p) => acc + p.progressPercent, 0) /
                      data.recentProgress.length
                  )
                : 0}
              %
            </div>
            <Progress
              value={
                data.recentProgress.length > 0
                  ? data.recentProgress.reduce((acc, p) => acc + p.progressPercent, 0) /
                    data.recentProgress.length
                  : 0
              }
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Badges obtenus</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalBadges}</div>
            <p className="text-xs text-muted-foreground">
              Continuez pour en débloquer plus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Temps total</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                data.recentProgress.reduce((acc, p) => acc + p.timeSpent, 0) / 3600
              )}
              h
            </div>
            <p className="text-xs text-muted-foreground">De formation</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Stats */}
      {data.adminStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Formations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.adminStats.courses}</div>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.adminStats.users}</div>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Quiz créés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.adminStats.quizzes}</div>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Groupes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.adminStats.groups}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Formations en cours</CardTitle>
            <CardDescription>Continuez où vous en étiez</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.recentProgress.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune formation en cours.{' '}
                <Link href="/dashboard/courses" className="text-primary hover:underline">
                  Découvrir les formations
                </Link>
              </p>
            ) : (
              data.recentProgress.map(progress => (
                <Link
                  key={progress.id}
                  href={`/dashboard/courses/${progress.courseId}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    {progress.progressPercent === 100 ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : (
                      <PlayCircle className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{progress.course.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={progress.progressPercent} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground">
                        {Math.round(progress.progressPercent)}%
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Upcoming Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>Formations à venir</CardTitle>
            <CardDescription>Planifiées pour votre groupe</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.upcomingAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune formation planifiée
              </p>
            ) : (
              data.upcomingAssignments.map(assignment => (
                <div
                  key={assignment.id}
                  className="flex items-center gap-4 p-3 rounded-lg border"
                >
                  <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{assignment.course.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: assignment.group?.color,
                          color: assignment.group?.color,
                        }}
                      >
                        {assignment.group?.name}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(assignment.startDate).toLocaleDateString('fr-FR')}
                      </span>
                      {assignment.mandatory && (
                        <Badge variant="destructive" className="text-xs">
                          Obligatoire
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
