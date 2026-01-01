import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'
import { Role } from '@prisma/client'

interface RouteParams {
  params: Promise<{ groupId: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    if (!([Role.ADMIN, Role.MANAGER] as Role[]).includes(session.user.role)) {
      return NextResponse.json({ error: 'Acces interdit' }, { status: 403 })
    }

    const { groupId } = await params
    const body = await request.json()

    const group = await prisma.group.update({
      where: { id: groupId },
      data: {
        name: body.name,
        description: body.description,
        color: body.color,
      },
    })

    return NextResponse.json(group)
  } catch (error) {
    console.error('PATCH group error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    if (!([Role.ADMIN, Role.MANAGER] as Role[]).includes(session.user.role)) {
      return NextResponse.json({ error: 'Acces interdit' }, { status: 403 })
    }

    const { groupId } = await params

    await prisma.group.delete({
      where: { id: groupId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE group error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
