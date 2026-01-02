import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma/client'
import { Role } from '@prisma/client'

// GET single badge
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ badgeId: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { badgeId } = await params

    const badge = await prisma.badge.findUnique({
      where: { id: badgeId },
      include: {
        _count: {
          select: { users: true, courseBadges: true }
        },
        courseBadges: {
          include: {
            course: {
              select: { id: true, title: true }
            }
          }
        }
      }
    })

    if (!badge) {
      return NextResponse.json({ error: 'Badge non trouvé' }, { status: 404 })
    }

    return NextResponse.json(badge)
  } catch (error) {
    console.error('Error fetching badge:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PATCH update badge
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ badgeId: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user || !([Role.ADMIN, Role.TRAINER] as Role[]).includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { badgeId } = await params
    const body = await request.json()
    const { name, description, imageUrl, points, category, isActive } = body

    const badge = await prisma.badge.update({
      where: { id: badgeId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(points !== undefined && { points }),
        ...(category !== undefined && { category }),
        ...(isActive !== undefined && { isActive }),
      }
    })

    return NextResponse.json(badge)
  } catch (error) {
    console.error('Error updating badge:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE badge
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ badgeId: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { badgeId } = await params

    await prisma.badge.delete({
      where: { id: badgeId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting badge:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
