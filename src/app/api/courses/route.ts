import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'
import { courseSchema } from '@/lib/validators/course'
import { createAuditLog, AuditActions } from '@/lib/utils/audit'
import { Role } from '@prisma/client'

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    } else if (session.user.role === Role.LEARNER) {
      where.status = 'PUBLISHED'
    }

    if (category) {
      where.category = category
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          creator: { select: { id: true, name: true, image: true } },
          modules: { select: { id: true } },
          enrollments: { where: { userId: session.user.id }, select: { status: true } },
          _count: { select: { enrollments: true, modules: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.course.count({ where }),
    ])

    return NextResponse.json({
      courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/courses error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    if (![Role.ADMIN, Role.TRAINER].includes(session.user.role)) {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = courseSchema.parse(body)

    let slug = generateSlug(validatedData.title)
    const existingSlug = await prisma.course.findUnique({ where: { slug } })
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`
    }

    const course = await prisma.course.create({
      data: {
        ...validatedData,
        slug,
        creatorId: session.user.id,
        tags: validatedData.tags || [],
      },
      include: {
        creator: { select: { id: true, name: true, image: true } },
      },
    })

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.COURSE_CREATE,
      resource: 'course',
      resourceId: course.id,
      details: { title: course.title },
    })

    return NextResponse.json(course, { status: 201 })
  } catch (error) {
    console.error('POST /api/courses error:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Données invalides', details: error }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
