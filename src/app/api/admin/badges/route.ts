import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma/client'
import { Role } from '@prisma/client'

// GET all badges
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const badges = await prisma.badge.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { users: true, courseBadges: true }
        }
      }
    })

    return NextResponse.json(badges)
  } catch (error) {
    console.error('Error fetching badges:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST create new badge
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user || !([Role.ADMIN, Role.TRAINER] as Role[]).includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, imageUrl, points, category } = body

    if (!name || !imageUrl) {
      return NextResponse.json({ error: 'Nom et image requis' }, { status: 400 })
    }

    const badge = await prisma.badge.create({
      data: {
        name,
        description,
        imageUrl,
        points: points || 0,
        category,
      }
    })

    return NextResponse.json(badge, { status: 201 })
  } catch (error) {
    console.error('Error creating badge:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
