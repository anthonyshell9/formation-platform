import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'
import { createAuditLog } from '@/lib/utils/audit'
import crypto from 'crypto'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    // Get all document lessons from user's enrolled courses
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: session.user.id },
      select: { courseId: true },
    })

    const courseIds = enrollments.map(e => e.courseId)

    // Get all document-type lessons
    const documentLessons = await prisma.lesson.findMany({
      where: {
        contentType: 'DOCUMENT',
        module: {
          courseId: { in: courseIds },
        },
      },
      include: {
        module: {
          select: {
            title: true,
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        acknowledgments: {
          where: { userId: session.user.id },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Format response
    const documents = documentLessons.map(lesson => ({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      contentUrl: lesson.videoUrl,
      chapterTitle: lesson.module.title,
      courseTitle: lesson.module.course.title,
      courseId: lesson.module.course.id,
      requiresAck: lesson.requiresAck,
      isAcknowledged: lesson.acknowledgments.length > 0,
      acknowledgedAt: lesson.acknowledgments[0]?.acknowledgedAt || null,
      createdAt: lesson.createdAt,
    }))

    // Stats
    const stats = {
      total: documents.length,
      acknowledged: documents.filter(d => d.isAcknowledged).length,
      pending: documents.filter(d => d.requiresAck && !d.isAcknowledged).length,
    }

    return NextResponse.json({ documents, stats })
  } catch (error) {
    console.error('GET documents error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const body = await request.json()
    const { lessonId } = body

    if (!lessonId) {
      return NextResponse.json({ error: 'lessonId requis' }, { status: 400 })
    }

    // Verify lesson exists and is a document type
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: true,
          },
        },
      },
    })

    if (!lesson) {
      return NextResponse.json({ error: 'Document non trouve' }, { status: 404 })
    }

    if (lesson.contentType !== 'DOCUMENT') {
      return NextResponse.json({ error: 'Ce contenu n\'est pas un document' }, { status: 400 })
    }

    // Check if user is enrolled
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: lesson.module.courseId,
        },
      },
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'Non inscrit a cette formation' }, { status: 403 })
    }

    // Get request headers for audit
    const forwardedFor = request.headers.get('x-forwarded-for')
    const userAgent = request.headers.get('user-agent')
    const ipAddress = forwardedFor?.split(',')[0] || 'unknown'

    // Create signature hash for audit trail
    const signatureData = `${session.user.id}-${lessonId}-${new Date().toISOString()}-${ipAddress}`
    const signatureHash = crypto.createHash('sha256').update(signatureData).digest('hex')

    // Create or update acknowledgment
    const acknowledgment = await prisma.documentAcknowledgment.upsert({
      where: {
        lessonId_userId: {
          lessonId,
          userId: session.user.id,
        },
      },
      create: {
        lessonId,
        userId: session.user.id,
        ipAddress,
        userAgent: userAgent || undefined,
        signatureHash,
      },
      update: {
        acknowledgedAt: new Date(),
        ipAddress,
        userAgent: userAgent || undefined,
        signatureHash,
      },
    })

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: 'DOCUMENT_ACKNOWLEDGED',
      resource: 'DocumentAcknowledgment',
      resourceId: acknowledgment.id,
      details: {
        lessonId,
        lessonTitle: lesson.title,
        courseId: lesson.module.courseId,
        courseTitle: lesson.module.course.title,
        signatureHash,
        ipAddress,
      },
    })

    return NextResponse.json({
      success: true,
      acknowledgment: {
        id: acknowledgment.id,
        acknowledgedAt: acknowledgment.acknowledgedAt,
        signatureHash: acknowledgment.signatureHash,
      },
    })
  } catch (error) {
    console.error('POST acknowledgment error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
