import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'
import { checkAndAwardBadges } from '@/lib/services/awards'

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
    const body = await request.json()
    const { answers, lessonId, courseId } = body as {
      answers: Record<string, string[]>
      lessonId?: string
      courseId?: string
    }

    // Get quiz with questions and options
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            options: true,
          },
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
        },
      })

      if (attemptCount >= quiz.maxAttempts) {
        return NextResponse.json(
          { error: 'Nombre maximum de tentatives atteint' },
          { status: 403 }
        )
      }
    }

    // Calculate score
    let correctAnswers = 0
    let totalPoints = 0
    let pointsEarned = 0

    for (const question of quiz.questions) {
      totalPoints += question.points
      const userAnswer = answers[question.id] || []
      const correctOptions = question.options.filter((o) => o.isCorrect)
      const correctOptionIds = correctOptions.map((o) => o.id)

      // Check if user's answer matches correct options exactly
      const isCorrect =
        userAnswer.length === correctOptionIds.length &&
        userAnswer.every((id) => correctOptionIds.includes(id))

      if (isCorrect) {
        correctAnswers++
        pointsEarned += question.points
      }
    }

    const score = totalPoints > 0 ? (pointsEarned / totalPoints) * 100 : 0
    const passed = score >= quiz.passingScore

    // Create attempt record
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        userId: session.user.id,
        score,
        passed,
        completedAt: new Date(),
        answers: answers as object,
      },
    })

    // If quiz is part of a lesson, mark lesson progress
    if (lessonId && courseId && passed) {
      const courseProgress = await prisma.courseProgress.findUnique({
        where: {
          userId_courseId: {
            userId: session.user.id,
            courseId,
          },
        },
      })

      if (courseProgress) {
        await prisma.lessonProgress.upsert({
          where: {
            courseProgressId_lessonId: {
              courseProgressId: courseProgress.id,
              lessonId,
            },
          },
          update: { completed: true, completedAt: new Date() },
          create: {
            courseProgressId: courseProgress.id,
            lessonId,
            completed: true,
            completedAt: new Date(),
          },
        })

        // Update course progress percentage
        const totalLessons = await prisma.lesson.count({
          where: { module: { courseId } },
        })
        const completedLessons = await prisma.lessonProgress.count({
          where: {
            courseProgressId: courseProgress.id,
            completed: true,
          },
        })

        const progressPercent = Math.round((completedLessons / totalLessons) * 100)

        await prisma.courseProgress.update({
          where: { id: courseProgress.id },
          data: { progressPercent },
        })

        // Check and award badges/certificates if course is complete
        if (progressPercent >= 100) {
          await checkAndAwardBadges(session.user.id, courseId, score)
        }
      }
    }

    return NextResponse.json({
      score,
      passed,
      correctAnswers,
      totalQuestions: quiz.questions.length,
      pointsEarned,
      totalPoints,
      attemptId: attempt.id,
    })
  } catch (error) {
    console.error('POST /api/quizzes/[quizId]/submit error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
