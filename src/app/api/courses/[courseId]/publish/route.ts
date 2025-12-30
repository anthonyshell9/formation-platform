import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'
import { createAuditLog, AuditActions } from '@/lib/utils/audit'
import { Role, CourseStatus } from '@prisma/client'

interface RouteParams {
  params: Promise<{ courseId: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { courseId } = await params

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            lessons: true,
          },
        },
      },
    })

    if (!course) {
      return NextResponse.json({ error: 'Formation non trouvée' }, { status: 404 })
    }

    if (session.user.role !== Role.ADMIN && course.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })
    }

    // Validate course has content
    if (course.modules.length === 0) {
      return NextResponse.json({ error: 'La formation doit avoir au moins un module' }, { status: 400 })
    }

    const hasLessons = course.modules.some(m => m.lessons.length > 0)
    if (!hasLessons) {
      return NextResponse.json({ error: 'La formation doit avoir au moins une leçon' }, { status: 400 })
    }

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        status: CourseStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    })

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.COURSE_PUBLISH,
      resource: 'course',
      resourceId: courseId,
      details: { title: course.title },
    })

    return NextResponse.json(updatedCourse)
  } catch (error) {
    console.error('POST /api/courses/[courseId]/publish error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
