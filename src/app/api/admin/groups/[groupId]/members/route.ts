import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'
import { Role } from '@prisma/client'

interface RouteParams {
  params: Promise<{ groupId: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
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
    const userIds: string[] = body.userIds || []

    // Delete existing members
    await prisma.groupMember.deleteMany({
      where: { groupId },
    })

    // Add new members
    if (userIds.length > 0) {
      await prisma.groupMember.createMany({
        data: userIds.map(userId => ({
          groupId,
          userId,
          role: 'member',
        })),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PUT group members error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
