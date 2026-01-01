import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'
import { Role } from '@prisma/client'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    if (!([Role.ADMIN, Role.TRAINER] as Role[]).includes(session.user.role)) {
      return NextResponse.json({ error: 'Acces interdit' }, { status: 403 })
    }

    // Get all document-type lessons
    const documents = await prisma.lesson.findMany({
      where: {
        contentType: 'DOCUMENT',
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
        _count: {
          select: {
            acknowledgments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get total enrolled users for documents that require ack
    const documentsWithAck = documents.filter(d => d.requiresAck)
    let totalPending = 0

    for (const doc of documentsWithAck) {
      const enrolledCount = await prisma.enrollment.count({
        where: { courseId: doc.module.course.id },
      })
      totalPending += enrolledCount - doc._count.acknowledgments
    }

    const totalAcknowledgments = await prisma.documentAcknowledgment.count()

    const stats = {
      totalDocuments: documents.length,
      totalAcknowledgments,
      pendingAcknowledgments: Math.max(0, totalPending),
    }

    return NextResponse.json({ documents, stats })
  } catch (error) {
    console.error('GET admin documents error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
