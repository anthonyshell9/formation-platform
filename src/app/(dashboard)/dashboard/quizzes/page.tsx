import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileQuestion,
  Plus,
  Clock,
  HelpCircle,
  MoreVertical,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { Role } from '@prisma/client'

export default async function QuizzesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/auth/signin')

  const isCreator = ([Role.ADMIN, Role.TRAINER] as Role[]).includes(session.user.role)

  if (!isCreator) {
    redirect('/dashboard')
  }

  const quizzes = await prisma.quiz.findMany({
    include: {
      creator: { select: { id: true, name: true, image: true } },
      _count: { select: { questions: true, attempts: true } },
      attempts: {
        select: { passed: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quiz</h1>
          <p className="text-muted-foreground">
            Créez et gérez vos quiz pour évaluer les apprenants
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/quizzes/create">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau quiz
          </Link>
        </Button>
      </div>

      {quizzes.length === 0 ? (
        <Card className="p-12 text-center">
          <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun quiz</h3>
          <p className="text-muted-foreground mb-4">
            Créez votre premier quiz pour évaluer les apprenants
          </p>
          <Button asChild>
            <Link href="/dashboard/quizzes/create">
              <Plus className="mr-2 h-4 w-4" />
              Créer un quiz
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map(quiz => {
            const passedCount = quiz.attempts.filter(a => a.passed).length
            const failedCount = quiz.attempts.filter(a => a.passed === false).length
            const passRate =
              quiz.attempts.length > 0
                ? Math.round((passedCount / quiz.attempts.length) * 100)
                : null

            return (
              <Card key={quiz.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <FileQuestion className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg line-clamp-1">
                          {quiz.title}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          Par {quiz.creator.name}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/quizzes/${quiz.id}/edit`}>
                            Modifier
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/quizzes/${quiz.id}/results`}>
                            Voir les résultats
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {quiz.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {quiz.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="gap-1">
                      <HelpCircle className="h-3 w-3" />
                      {quiz._count.questions} questions
                    </Badge>
                    {quiz.timeLimit && (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {quiz.timeLimit} min
                      </Badge>
                    )}
                    <Badge variant="outline">
                      Score: {quiz.passingScore}%
                    </Badge>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {quiz._count.attempts} tentatives
                      </span>
                      {passRate !== null && (
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            {passedCount}
                          </span>
                          <span className="flex items-center gap-1 text-red-600">
                            <XCircle className="h-4 w-4" />
                            {failedCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/dashboard/quizzes/${quiz.id}`}>
                      Voir le quiz
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
