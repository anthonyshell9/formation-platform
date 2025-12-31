import { getSession } from '@/lib/auth/session'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Clock,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Edit,
  Target,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { Role } from '@prisma/client'

interface Props {
  params: Promise<{ quizId: string }>
}

export default async function QuizDetailPage({ params }: Props) {
  const session = await getSession()
  if (!session?.user) return null

  const { quizId } = await params

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      questions: {
        orderBy: { order: 'asc' },
        include: {
          options: { orderBy: { order: 'asc' } },
        },
      },
      attempts: {
        where: { userId: session.user.id },
        orderBy: { startedAt: 'desc' },
        take: 5,
      },
      _count: { select: { attempts: true } },
    },
  })

  if (!quiz) notFound()

  const isCreator = ([Role.ADMIN, Role.TRAINER] as Role[]).includes(session.user.role)
  const canEdit = isCreator || quiz.creatorId === session.user.id

  // Calculate stats
  const allAttempts = await prisma.quizAttempt.findMany({
    where: { quizId },
    select: { passed: true, score: true },
  })

  const passedCount = allAttempts.filter(a => a.passed).length
  const averageScore = allAttempts.length > 0
    ? Math.round(allAttempts.reduce((acc, a) => acc + (a.score || 0), 0) / allAttempts.length)
    : null

  const userBestAttempt = quiz.attempts.find(a => a.passed) || quiz.attempts[0]
  const attemptsRemaining = quiz.maxAttempts
    ? quiz.maxAttempts - quiz.attempts.length
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/quizzes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{quiz.title}</h1>
            {quiz.description && (
              <p className="text-muted-foreground mt-2">{quiz.description}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Créé par {quiz.creator.name}
            </p>
          </div>
        </div>
        {canEdit && (
          <Button asChild variant="outline">
            <Link href={`/dashboard/quizzes/${quizId}/edit`}>
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
            <HelpCircle className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{quiz.questions.length}</p>
              <p className="text-sm text-muted-foreground">Questions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Clock className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{quiz.timeLimit || '-'}</p>
              <p className="text-sm text-muted-foreground">Min. limite</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Target className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{quiz.passingScore}%</p>
              <p className="text-sm text-muted-foreground">Score requis</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{quiz._count.attempts}</p>
              <p className="text-sm text-muted-foreground">Tentatives</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Global Stats (for creators) */}
      {canEdit && allAttempts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Statistiques globales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-medium">{passedCount} réussites</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="font-medium">{allAttempts.length - passedCount} échecs</span>
              </div>
              {averageScore !== null && (
                <div>
                  <span className="text-muted-foreground">Score moyen: </span>
                  <span className="font-medium">{averageScore}%</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User's attempts */}
      {quiz.attempts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vos tentatives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {quiz.attempts.map((attempt) => (
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
          </CardContent>
        </Card>
      )}

      {/* Start Quiz */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">
                {quiz.attempts.length > 0 ? 'Repasser le quiz' : 'Commencer le quiz'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {quiz.questions.length} questions
                {quiz.timeLimit && ` - ${quiz.timeLimit} minutes`}
                {attemptsRemaining !== null && ` - ${attemptsRemaining} tentatives restantes`}
              </p>
            </div>
            {attemptsRemaining === 0 ? (
              <Button disabled>
                Plus de tentatives disponibles
              </Button>
            ) : (
              <Button asChild>
                <Link href={`/dashboard/quizzes/${quizId}/take`}>
                  Démarrer
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Questions Preview (for creators) */}
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Aperçu des questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quiz.questions.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">
                Aucune question. Modifiez le quiz pour en ajouter.
              </p>
            ) : (
              quiz.questions.map((question, index) => (
                <div key={question.id} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium">{question.question}</p>
                      <div className="mt-2 space-y-1">
                        {question.options.map((option) => (
                          <div
                            key={option.id}
                            className={`flex items-center gap-2 text-sm p-2 rounded ${
                              option.isCorrect
                                ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                                : 'bg-gray-50 dark:bg-gray-800'
                            }`}
                          >
                            {option.isCorrect && <CheckCircle2 className="h-4 w-4" />}
                            {option.text}
                          </div>
                        ))}
                      </div>
                    </div>
                    <Badge variant="outline">{question.points} pts</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
