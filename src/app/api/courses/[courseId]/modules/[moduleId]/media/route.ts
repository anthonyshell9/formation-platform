import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'
import { Role } from '@prisma/client'
import { moduleMediaSchema } from '@/lib/validators/course'

interface RouteParams {
  params: Promise<{ courseId: string; moduleId: string }>
}

// GET all media for a module
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { moduleId } = await params

    const media = await prisma.moduleMedia.findMany({
      where: { moduleId },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(media)
  } catch (error) {
    console.error('GET module media error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST - Add media to a module
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

    // Validate input
    const validationResult = moduleMediaSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Get current max order
    const maxOrderResult = await prisma.moduleMedia.aggregate({
      where: { moduleId },
      _max: { order: true },
    })
    const nextOrder = (maxOrderResult._max.order ?? -1) + 1

    const media = await prisma.moduleMedia.create({
      data: {
        moduleId,
        type: data.type,
        url: data.url,
        blobName: data.blobName,
        filename: data.filename,
        size: data.size,
        mimeType: data.mimeType,
        order: data.order ?? nextOrder,
      },
    })

    return NextResponse.json(media, { status: 201 })
  } catch (error) {
    console.error('POST module media error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE - Remove all media from a module (for cleanup)
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
    const { searchParams } = new URL(request.url)
    const mediaId = searchParams.get('mediaId')

    if (mediaId) {
      // Delete specific media
      await prisma.moduleMedia.delete({
        where: { id: mediaId },
      })
    } else {
      // Delete all media for module
      await prisma.moduleMedia.deleteMany({
        where: { moduleId },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE module media error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
