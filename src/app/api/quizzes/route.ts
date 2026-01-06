import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'
import { quizSchema } from '@/lib/validators/quiz'
import { createAuditLog, AuditActions } from '@/lib/utils/audit'
import { Role } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: Record<string, unknown> = {}

    if (session.user.role === Role.LEARNER) {
      // Learners can only see quizzes from their enrolled courses
      where.lesson = {
        module: {
          course: {
            enrollments: { some: { userId: session.user.id } },
          },
        },
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [quizzes, total] = await Promise.all([
      prisma.quiz.findMany({
        where,
        include: {
          creator: { select: { id: true, name: true, image: true } },
          _count: { select: { questions: true, attempts: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.quiz.count({ where }),
    ])

    return NextResponse.json({
      quizzes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/quizzes error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    if (!([Role.ADMIN, Role.TRAINER] as Role[]).includes(session.user.role)) {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })
    }

    const body = await request.json()
    const { questions, moduleId, ...quizData } = quizSchema.parse(body)

    // If moduleId is provided, check if module already has a quiz
    if (moduleId) {
      const existingQuiz = await prisma.quiz.findFirst({
        where: { moduleId },
      })
      if (existingQuiz) {
        return NextResponse.json(
          { error: 'Ce module a deja un quiz. Modifiez-le au lieu d\'en creer un nouveau.' },
          { status: 400 }
        )
      }
    }

    const quiz = await prisma.quiz.create({
      data: {
        ...quizData,
        creatorId: session.user.id,
        moduleId: moduleId || null,
        questions: questions
          ? {
              create: questions.map((q, index) => ({
                ...q,
                order: index,
                options: {
                  create: q.options.map((o, oIndex) => ({
                    ...o,
                    order: oIndex,
                  })),
                },
              })),
            }
          : undefined,
      },
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
      action: AuditActions.QUIZ_CREATE,
      resource: 'quiz',
      resourceId: quiz.id,
      details: { title: quiz.title },
    })

    return NextResponse.json(quiz, { status: 201 })
  } catch (error) {
    console.error('POST /api/quizzes error:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Données invalides', details: error }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
