import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'
import { courseSchema } from '@/lib/validators/course'
import { createAuditLog, AuditActions } from '@/lib/utils/audit'
import { Role, CourseStatus } from '@prisma/client'

interface RouteParams {
  params: Promise<{ courseId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { courseId } = await params

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        creator: { select: { id: true, name: true, image: true } },
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              include: {
                quiz: { select: { id: true, title: true } },
                media: true,
              },
            },
          },
        },
        _count: { select: { enrollments: true } },
      },
    })

    if (!course) {
      return NextResponse.json({ error: 'Formation non trouvée' }, { status: 404 })
    }

    // Check access for non-published courses
    if (course.status !== CourseStatus.PUBLISHED) {
      if (![Role.ADMIN, Role.TRAINER].includes(session.user.role) && course.creatorId !== session.user.id) {
        return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })
      }
    }

    // Get user progress if enrolled
    const progress = await prisma.courseProgress.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId,
        },
      },
      include: {
        lessons: true,
      },
    })

    return NextResponse.json({ course, progress })
  } catch (error) {
    console.error('GET /api/courses/[courseId] error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { courseId } = await params

    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
    })

    if (!existingCourse) {
      return NextResponse.json({ error: 'Formation non trouvée' }, { status: 404 })
    }

    if (![Role.ADMIN].includes(session.user.role) && existingCourse.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = courseSchema.partial().parse(body)

    const course = await prisma.course.update({
      where: { id: courseId },
      data: validatedData,
      include: {
        creator: { select: { id: true, name: true, image: true } },
      },
    })

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.COURSE_UPDATE,
      resource: 'course',
      resourceId: course.id,
      details: { changes: validatedData },
    })

    return NextResponse.json(course)
  } catch (error) {
    console.error('PUT /api/courses/[courseId] error:', error)
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

    const { courseId } = await params

    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
    })

    if (!existingCourse) {
      return NextResponse.json({ error: 'Formation non trouvée' }, { status: 404 })
    }

    if (session.user.role !== Role.ADMIN && existingCourse.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })
    }

    await prisma.course.delete({ where: { id: courseId } })

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.COURSE_DELETE,
      resource: 'course',
      resourceId: courseId,
      details: { title: existingCourse.title },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/courses/[courseId] error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
