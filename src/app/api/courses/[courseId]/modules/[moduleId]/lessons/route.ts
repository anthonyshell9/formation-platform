import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'
import { Role } from '@prisma/client'

interface RouteParams {
  params: Promise<{ courseId: string; moduleId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { moduleId } = await params

    const lessons = await prisma.lesson.findMany({
      where: { moduleId },
      orderBy: { order: 'asc' },
      include: {
        quiz: { select: { id: true, title: true } },
        media: true,
      },
    })

    return NextResponse.json(lessons)
  } catch (error) {
    console.error('GET lessons error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    if (!([Role.ADMIN, Role.TRAINER] as Role[]).includes(session.user.role)) {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })
    }

    const { moduleId } = await params
    const body = await request.json()

    const lesson = await prisma.lesson.create({
      data: {
        title: body.title,
        description: body.description,
        contentType: body.contentType,
        content: body.content,
        videoUrl: body.videoUrl,
        order: body.order || 0,
        moduleId,
      },
    })

    return NextResponse.json(lesson, { status: 201 })
  } catch (error) {
    console.error('POST lesson error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
