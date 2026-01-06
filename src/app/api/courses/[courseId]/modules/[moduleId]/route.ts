import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'
import { Role } from '@prisma/client'
import { moduleUpdateSchema } from '@/lib/validators/course'

interface RouteParams {
  params: Promise<{ courseId: string; moduleId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { courseId, moduleId } = await params

    const courseModule = await prisma.module.findFirst({
      where: { id: moduleId, courseId },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          include: {
            quiz: { select: { id: true, title: true } },
          },
        },
        media: {
          orderBy: { order: 'asc' },
        },
        quiz: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
              include: {
                options: {
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
      },
    })

    if (!courseModule) {
      return NextResponse.json({ error: 'Module non trouvé' }, { status: 404 })
    }

    return NextResponse.json(courseModule)
  } catch (error) {
    console.error('GET module error:', error)
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

    const { moduleId } = await params
    const body = await request.json()

    // Validate input
    const validationResult = moduleUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.order !== undefined) updateData.order = data.order
    if (data.contentType !== undefined) updateData.contentType = data.contentType
    if (data.content !== undefined) updateData.content = data.content
    if (data.videoUrl !== undefined) updateData.videoUrl = data.videoUrl
    if (data.videoDuration !== undefined) updateData.videoDuration = data.videoDuration
    if (data.requiresAck !== undefined) updateData.requiresAck = data.requiresAck

    const courseModule = await prisma.module.update({
      where: { id: moduleId },
      data: updateData,
      include: {
        media: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json(courseModule)
  } catch (error) {
    console.error('PATCH module error:', error)
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

    const { moduleId } = await params

    await prisma.module.delete({
      where: { id: moduleId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE module error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
