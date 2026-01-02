import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma/client'
import { Role, BadgeTrigger } from '@prisma/client'

// GET badges for a course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { courseId } = await params

    const courseBadges = await prisma.courseBadge.findMany({
      where: { courseId },
      include: {
        badge: true
      }
    })

    return NextResponse.json(courseBadges)
  } catch (error) {
    console.error('Error fetching course badges:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST add badge to course
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user || !([Role.ADMIN, Role.TRAINER] as Role[]).includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { courseId } = await params
    const body = await request.json()
    const { badgeId, trigger, minScore } = body

    if (!badgeId) {
      return NextResponse.json({ error: 'Badge requis' }, { status: 400 })
    }

    // Check if already linked
    const existing = await prisma.courseBadge.findUnique({
      where: { courseId_badgeId: { courseId, badgeId } }
    })

    if (existing) {
      return NextResponse.json({ error: 'Ce badge est déjà lié à ce cours' }, { status: 400 })
    }

    const courseBadge = await prisma.courseBadge.create({
      data: {
        courseId,
        badgeId,
        trigger: trigger || BadgeTrigger.COURSE_COMPLETION,
        minScore,
      },
      include: {
        badge: true
      }
    })

    return NextResponse.json(courseBadge, { status: 201 })
  } catch (error) {
    console.error('Error adding course badge:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE remove badge from course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user || !([Role.ADMIN, Role.TRAINER] as Role[]).includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { courseId } = await params
    const { searchParams } = new URL(request.url)
    const badgeId = searchParams.get('badgeId')

    if (!badgeId) {
      return NextResponse.json({ error: 'Badge ID requis' }, { status: 400 })
    }

    await prisma.courseBadge.delete({
      where: { courseId_badgeId: { courseId, badgeId } }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing course badge:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
