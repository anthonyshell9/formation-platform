import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'
import { groupMemberSchema } from '@/lib/validators/group'
import { createAuditLog, AuditActions } from '@/lib/utils/audit'
import { Role } from '@prisma/client'

interface RouteParams {
  params: Promise<{ groupId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { groupId } = await params

    const members = await prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true, role: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error('GET /api/groups/[groupId]/members error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    if (![Role.ADMIN, Role.MANAGER].includes(session.user.role)) {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })
    }

    const { groupId } = await params
    const body = await request.json()
    const { userId, role } = groupMemberSchema.parse({ ...body, groupId })

    const group = await prisma.group.findUnique({
      where: { id: groupId },
    })

    if (!group) {
      return NextResponse.json({ error: 'Groupe non trouvé' }, { status: 404 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // Check if already member
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: { userId, groupId },
      },
    })

    if (existingMember) {
      return NextResponse.json({ error: 'Déjà membre du groupe' }, { status: 400 })
    }

    const member = await prisma.groupMember.create({
      data: {
        userId,
        groupId,
        role: role || 'member',
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true, role: true },
        },
      },
    })

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.GROUP_MEMBER_ADD,
      resource: 'group_member',
      resourceId: member.id,
      details: { groupId, userId, userName: user.name },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('POST /api/groups/[groupId]/members error:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Données invalides', details: error }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    if (![Role.ADMIN, Role.MANAGER].includes(session.user.role)) {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })
    }

    const { groupId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 })
    }

    const member = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: { userId, groupId },
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'Membre non trouvé' }, { status: 404 })
    }

    await prisma.groupMember.delete({
      where: { id: member.id },
    })

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.GROUP_MEMBER_REMOVE,
      resource: 'group_member',
      resourceId: member.id,
      details: { groupId, userId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/groups/[groupId]/members error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
