import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Award, Trophy, Star, Target, BookOpen, FileCheck, Download, ExternalLink, Calendar } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function BadgesPage() {
  const session = await getSession()
  if (!session?.user) return null

  // Get all data in parallel
  const [allBadges, userBadges, certificates, courseStats] = await Promise.all([
    prisma.badge.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { points: 'asc' }],
    }),
    prisma.userBadge.findMany({
      where: { userId: session.user.id },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    }),
    prisma.certificate.findMany({
      where: { userId: session.user.id },
      include: { course: true },
      orderBy: { issuedAt: 'desc' },
    }),
    prisma.$transaction([
      prisma.courseProgress.count({
        where: { userId: session.user.id, progressPercent: 100 },
      }),
      prisma.quizAttempt.count({
        where: { userId: session.user.id, passed: true },
      }),
    ]),
  ])

  const completedCourses = courseStats[0]
  const passedQuizzes = courseStats[1]
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
        <h1 className="text-3xl font-bold">Badges et Certificats</h1>
        <p className="text-muted-foreground">
          Vos récompenses et certifications obtenues
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 border-yellow-200 dark:border-yellow-800">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
              <Trophy className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{userBadges.length}</p>
              <p className="text-sm text-muted-foreground">Badges</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <FileCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{certificates.length}</p>
              <p className="text-sm text-muted-foreground">Certificats</p>
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
              <p className="text-sm text-muted-foreground">Points</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedCourses}</p>
              <p className="text-sm text-muted-foreground">Formations</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
              <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{passedQuizzes}</p>
              <p className="text-sm text-muted-foreground">Quiz réussis</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Certificates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Mes Certificats
          </CardTitle>
          <CardDescription>
            Certificats obtenus en complétant des formations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {certificates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun certificat obtenu</p>
              <p className="text-sm">Complétez des formations pour obtenir vos certificats</p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/my-courses">Voir les formations</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="relative p-6 border-4 rounded-lg bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950"
                  style={{ borderColor: '#d4af37' }}
                >
                  <div className="absolute top-2 right-2">
                    {cert.pdfUrl && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={cert.pdfUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>

                  <div className="text-center space-y-3">
                    <FileCheck className="h-10 w-10 mx-auto text-amber-600" />
                    <div>
                      <h3 className="font-bold text-lg">{cert.title}</h3>
                      <p className="text-sm text-muted-foreground">{cert.course.title}</p>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Délivré le {new Date(cert.issuedAt).toLocaleDateString('fr-FR')}
                    </div>

                    {cert.expiresAt && (
                      <Badge variant={new Date(cert.expiresAt) > new Date() ? 'secondary' : 'destructive'}>
                        {new Date(cert.expiresAt) > new Date()
                          ? `Valide jusqu'au ${new Date(cert.expiresAt).toLocaleDateString('fr-FR')}`
                          : 'Expiré'}
                      </Badge>
                    )}

                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground">
                        N° {cert.certificateNumber}
                      </p>
                      {cert.verificationUrl && (
                        <Button variant="link" size="sm" className="text-xs" asChild>
                          <a href={cert.verificationUrl}>
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Vérifier le certificat
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
                    <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
                      <Award className="h-8 w-8 text-amber-600" />
                    </div>
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
                      <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                        <Award className={`h-6 w-6 ${isEarned ? 'text-amber-600' : 'text-gray-400'}`} />
                      </div>
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
