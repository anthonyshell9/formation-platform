import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'
import { Role } from '@prisma/client'

interface RouteParams {
  params: Promise<{ courseId: string; moduleId: string; lessonId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { lessonId } = await params

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        quiz: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
              include: { options: { orderBy: { order: 'asc' } } },
            },
          },
        },
        media: { orderBy: { order: 'asc' } },
        module: {
          include: {
            course: { select: { id: true, title: true } },
          },
        },
      },
    })

    if (!lesson) {
      return NextResponse.json({ error: 'Leçon non trouvée' }, { status: 404 })
    }

    return NextResponse.json(lesson)
  } catch (error) {
    console.error('GET lesson error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    if (!([Role.ADMIN, Role.TRAINER] as Role[]).includes(session.user.role)) {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })
    }

    const { lessonId } = await params
    const body = await request.json()

    const lesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        title: body.title,
        description: body.description,
        content: body.content,
        videoUrl: body.videoUrl,
        videoDuration: body.videoDuration,
        order: body.order,
      },
      include: {
        media: true,
      },
    })

    return NextResponse.json(lesson)
  } catch (error) {
    console.error('PATCH lesson error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    if (!([Role.ADMIN, Role.TRAINER] as Role[]).includes(session.user.role)) {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })
    }

    const { lessonId } = await params

    await prisma.lesson.delete({
      where: { id: lessonId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE lesson error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
