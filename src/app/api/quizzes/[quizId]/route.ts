import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'
import { quizSchema } from '@/lib/validators/quiz'
import { createAuditLog, AuditActions } from '@/lib/utils/audit'
import { Role } from '@prisma/client'

interface RouteParams {
  params: Promise<{ quizId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

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
        _count: { select: { attempts: true } },
      },
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 })
    }

    // Get user's attempts
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        quizId,
        userId: session.user.id,
      },
      orderBy: { startedAt: 'desc' },
    })

    // If learner, hide correct answers if quiz doesn't show them
    if (session.user.role === Role.LEARNER && !quiz.showCorrectAnswers) {
      quiz.questions = quiz.questions.map(q => ({
        ...q,
        options: q.options.map(o => ({ ...o, isCorrect: false })),
      }))
    }

    return NextResponse.json({ quiz, attempts })
  } catch (error) {
    console.error('GET /api/quizzes/[quizId] error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { quizId } = await params

    const existingQuiz = await prisma.quiz.findUnique({
      where: { id: quizId },
    })

    if (!existingQuiz) {
      return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 })
    }

    if (session.user.role !== Role.ADMIN && existingQuiz.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })
    }

    const body = await request.json()
    const { questions, ...quizData } = quizSchema.partial().parse(body)

    // Update quiz (questions handled separately)
    const quiz = await prisma.quiz.update({
      where: { id: quizId },
      data: quizData,
      include: {
        creator: { select: { id: true, name: true, image: true } },
        questions: {
          include: { options: true },
          orderBy: { order: 'asc' },
        },
      },
    })

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.QUIZ_UPDATE,
      resource: 'quiz',
      resourceId: quiz.id,
      details: { changes: quizData },
    })

    return NextResponse.json(quiz)
  } catch (error) {
    console.error('PUT /api/quizzes/[quizId] error:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Données invalides', details: error }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { quizId } = await params

    const existingQuiz = await prisma.quiz.findUnique({
      where: { id: quizId },
    })

    if (!existingQuiz) {
      return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 })
    }

    if (session.user.role !== Role.ADMIN && existingQuiz.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })
    }

    await prisma.quiz.delete({ where: { id: quizId } })

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.QUIZ_DELETE,
      resource: 'quiz',
      resourceId: quizId,
      details: { title: existingQuiz.title },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/quizzes/[quizId] error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
