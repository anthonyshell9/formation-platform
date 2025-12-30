import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'
import { createAuditLog, AuditActions } from '@/lib/utils/audit'
import { CourseStatus, EnrollmentStatus } from '@prisma/client'

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
    })

    if (!course) {
      return NextResponse.json({ error: 'Formation non trouvée' }, { status: 404 })
    }

    if (course.status !== CourseStatus.PUBLISHED) {
      return NextResponse.json({ error: 'Formation non disponible' }, { status: 400 })
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId,
        },
      },
    })

    if (existingEnrollment) {
      return NextResponse.json({ error: 'Déjà inscrit à cette formation' }, { status: 400 })
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        userId: session.user.id,
        courseId,
        status: EnrollmentStatus.ENROLLED,
      },
    })

    // Create initial progress
    await prisma.courseProgress.create({
      data: {
        userId: session.user.id,
        courseId,
        progressPercent: 0,
      },
    })

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.ENROLLMENT_CREATE,
      resource: 'enrollment',
      resourceId: enrollment.id,
      details: { courseId, courseTitle: course.title },
    })

    return NextResponse.json(enrollment, { status: 201 })
  } catch (error) {
    console.error('POST /api/courses/[courseId]/enroll error:', error)
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

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId,
        },
      },
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'Inscription non trouvée' }, { status: 404 })
    }

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status: EnrollmentStatus.CANCELLED },
    })

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.ENROLLMENT_CANCEL,
      resource: 'enrollment',
      resourceId: enrollment.id,
      details: { courseId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/courses/[courseId]/enroll error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
