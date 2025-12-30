import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'
import { groupSchema } from '@/lib/validators/group'
import { createAuditLog, AuditActions } from '@/lib/utils/audit'
import { Role } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: Record<string, unknown> = {}

    // Learners can only see groups they belong to
    if (session.user.role === Role.LEARNER) {
      where.members = { some: { userId: session.user.id } }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [groups, total] = await Promise.all([
      prisma.group.findMany({
        where,
        include: {
          _count: { select: { members: true, assignments: true } },
          members: {
            take: 5,
            include: {
              user: { select: { id: true, name: true, image: true } },
            },
          },
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.group.count({ where }),
    ])

    return NextResponse.json({
      groups,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/groups error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    if (![Role.ADMIN, Role.MANAGER].includes(session.user.role)) {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = groupSchema.parse(body)

    const group = await prisma.group.create({
      data: validatedData,
      include: {
        _count: { select: { members: true, assignments: true } },
      },
    })

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.GROUP_CREATE,
      resource: 'group',
      resourceId: group.id,
      details: { name: group.name },
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    console.error('POST /api/groups error:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Données invalides', details: error }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
