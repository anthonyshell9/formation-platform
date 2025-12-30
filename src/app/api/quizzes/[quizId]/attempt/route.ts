import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'
import { quizSubmissionSchema } from '@/lib/validators/quiz'
import { createAuditLog, AuditActions } from '@/lib/utils/audit'

interface RouteParams {
  params: Promise<{ quizId: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { quizId } = await params

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: { options: true },
        },
      },
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 })
    }

    // Check max attempts
    if (quiz.maxAttempts) {
      const attemptCount = await prisma.quizAttempt.count({
        where: {
          quizId,
          userId: session.user.id,
          completedAt: { not: null },
        },
      })

      if (attemptCount >= quiz.maxAttempts) {
        return NextResponse.json({ error: 'Nombre maximum de tentatives atteint' }, { status: 400 })
      }
    }

    // Create new attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: session.user.id,
        quizId,
      },
    })

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.QUIZ_ATTEMPT_START,
      resource: 'quiz_attempt',
      resourceId: attempt.id,
      details: { quizId, quizTitle: quiz.title },
    })

    return NextResponse.json(attempt, { status: 201 })
  } catch (error) {
    console.error('POST /api/quizzes/[quizId]/attempt error:', error)
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
    const body = await request.json()
    const { answers } = quizSubmissionSchema.parse({ quizId, answers: body.answers })

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: { options: true },
        },
      },
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 })
    }

    // Find active attempt
    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        quizId,
        userId: session.user.id,
        completedAt: null,
      },
      orderBy: { startedAt: 'desc' },
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Aucune tentative active' }, { status: 400 })
    }

    // Calculate score
    let totalPoints = 0
    let earnedPoints = 0

    const questionAnswers = await Promise.all(
      answers.map(async (ans) => {
        const question = quiz.questions.find(q => q.id === ans.questionId)
        if (!question) return null

        totalPoints += question.points

        let isCorrect = false
        let pointsEarned = 0

        switch (question.type) {
          case 'SINGLE_CHOICE':
          case 'TRUE_FALSE': {
            const correctOption = question.options.find(o => o.isCorrect)
            isCorrect = correctOption?.id === ans.answer
            break
          }
          case 'MULTIPLE_CHOICE': {
            const selectedIds = JSON.parse(ans.answer) as string[]
            const correctIds = question.options.filter(o => o.isCorrect).map(o => o.id)
            isCorrect =
              selectedIds.length === correctIds.length &&
              selectedIds.every(id => correctIds.includes(id))
            break
          }
          case 'SHORT_ANSWER': {
            const correctOption = question.options.find(o => o.isCorrect)
            isCorrect =
              correctOption?.text.toLowerCase().trim() ===
              ans.answer.toLowerCase().trim()
            break
          }
          default:
            break
        }

        if (isCorrect) {
          pointsEarned = question.points
          earnedPoints += pointsEarned
        }

        return prisma.quizAnswer.create({
          data: {
            attemptId: attempt.id,
            questionId: ans.questionId,
            answer: ans.answer,
            isCorrect,
            pointsEarned,
          },
        })
      })
    )

    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0
    const passed = score >= quiz.passingScore
    const timeSpent = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000)

    // Update attempt with results
    const completedAttempt = await prisma.quizAttempt.update({
      where: { id: attempt.id },
      data: {
        score,
        passed,
        completedAt: new Date(),
        timeSpent,
      },
      include: {
        answers: {
          include: {
            question: {
              include: { options: true },
            },
          },
        },
      },
    })

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.QUIZ_ATTEMPT_SUBMIT,
      resource: 'quiz_attempt',
      resourceId: attempt.id,
      details: { quizId, score, passed },
    })

    return NextResponse.json({
      attempt: completedAttempt,
      score,
      passed,
      earnedPoints,
      totalPoints,
    })
  } catch (error) {
    console.error('PUT /api/quizzes/[quizId]/attempt error:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Données invalides', details: error }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
