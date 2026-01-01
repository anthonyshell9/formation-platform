import { NextRequest, NextResponse } from 'next/server'
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

    if (!([Role.ADMIN, Role.MANAGER] as Role[]).includes(session.user.role)) {
      return NextResponse.json({ error: 'Acces interdit' }, { status: 403 })
    }

    const groups = await prisma.group.findMany({
      orderBy: { name: 'asc' },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        _count: {
          select: {
            members: true,
            assignments: true,
          },
        },
      },
    })

    return NextResponse.json(groups)
  } catch (error) {
    console.error('GET groups error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    if (!([Role.ADMIN, Role.MANAGER] as Role[]).includes(session.user.role)) {
      return NextResponse.json({ error: 'Acces interdit' }, { status: 403 })
    }

    const body = await request.json()

    const group = await prisma.group.create({
      data: {
        name: body.name,
        description: body.description,
        color: body.color || '#3B82F6',
      },
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    console.error('POST group error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
