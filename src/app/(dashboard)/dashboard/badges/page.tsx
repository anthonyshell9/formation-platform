import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Award, Trophy, Star, Target, BookOpen } from 'lucide-react'

const SKIP_AUTH = process.env.SKIP_AUTH === 'true'

export default async function BadgesPage() {
  const session = await getSession()
  if (!session?.user) return null

  // Get all badges (no user-specific query needed)
  const allBadges = await prisma.badge.findMany({
    orderBy: [{ category: 'asc' }, { points: 'asc' }],
  })

  // Skip user-specific queries in SKIP_AUTH mode
  let userBadges: { badge: typeof allBadges[0]; earnedAt: Date; badgeId: string }[] = []
  let completedCourses = 0
  let passedQuizzes = 0

  if (!SKIP_AUTH) {
    const [fetchedUserBadges, userStats] = await Promise.all([
      prisma.userBadge.findMany({
        where: { userId: session.user.id },
        include: { badge: true },
        orderBy: { earnedAt: 'desc' },
      }),
      prisma.$transaction([
        prisma.enrollment.count({
          where: { userId: session.user.id, status: 'COMPLETED' },
        }),
        prisma.quizAttempt.count({
          where: { userId: session.user.id, passed: true },
        }),
      ]),
    ])
    userBadges = fetchedUserBadges
    completedCourses = userStats[0]
    passedQuizzes = userStats[1]
  }
  const earnedBadgeIds = new Set(userBadges.map(ub => ub.badgeId))
  const totalPoints = userBadges.reduce((acc, ub) => acc + ub.badge.points, 0)

  // Group badges by category
  const badgesByCategory = allBadges.reduce((acc, badge) => {
    const category = badge.category || 'Général'
    if (!acc[category]) acc[category] = []
    acc[category].push(badge)
    return acc
  }, {} as Record<string, typeof allBadges>)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Badges et Récompenses</h1>
        <p className="text-muted-foreground">
          Débloquez des badges en progressant dans vos formations
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 border-yellow-200 dark:border-yellow-800">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
              <Trophy className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{userBadges.length}</p>
              <p className="text-sm text-muted-foreground">Badges obtenus</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalPoints}</p>
              <p className="text-sm text-muted-foreground">Points totaux</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedCourses}</p>
              <p className="text-sm text-muted-foreground">Formations terminées</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{passedQuizzes}</p>
              <p className="text-sm text-muted-foreground">Quiz réussis</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Badges */}
      {userBadges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Derniers badges obtenus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {userBadges.slice(0, 6).map(({ badge, earnedAt }) => (
                <div
                  key={badge.id}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 border border-yellow-200 dark:border-yellow-800"
                >
                  <div className="relative">
                    <img
                      src={badge.imageUrl}
                      alt={badge.name}
                      className="h-16 w-16 object-contain"
                    />
                    <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500 text-xs font-bold text-white">
                      {badge.points}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-sm">{badge.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(earnedAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Badges by Category */}
      {Object.entries(badgesByCategory).map(([category, badges]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              {category}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {badges.map(badge => {
                const isEarned = earnedBadgeIds.has(badge.id)

                return (
                  <div
                    key={badge.id}
                    className={`relative flex items-start gap-4 p-4 rounded-lg border transition-all ${
                      isEarned
                        ? 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 border-yellow-200 dark:border-yellow-800'
                        : 'opacity-60 grayscale'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={badge.imageUrl}
                        alt={badge.name}
                        className="h-12 w-12 object-contain"
                      />
                      {isEarned && (
                        <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500">
                          <svg
                            className="h-3 w-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm truncate">{badge.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {badge.points} pts
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {badge.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {allBadges.length === 0 && (
        <Card className="p-12 text-center">
          <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun badge disponible</h3>
          <p className="text-muted-foreground">
            Les badges seront bientôt disponibles
          </p>
        </Card>
      )}
    </div>
  )
}
