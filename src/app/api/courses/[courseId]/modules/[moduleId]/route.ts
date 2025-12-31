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

    const { courseId, moduleId } = await params

    const module = await prisma.module.findFirst({
      where: { id: moduleId, courseId },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          include: {
            quiz: { select: { id: true, title: true } },
          },
        },
      },
    })

    if (!module) {
      return NextResponse.json({ error: 'Module non trouvé' }, { status: 404 })
    }

    return NextResponse.json(module)
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

    const { courseId, moduleId } = await params
    const body = await request.json()

    const module = await prisma.module.update({
      where: { id: moduleId },
      data: {
        title: body.title,
        description: body.description,
        order: body.order,
      },
    })

    return NextResponse.json(module)
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

    const { courseId, moduleId } = await params

    await prisma.module.delete({
      where: { id: moduleId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE module error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
