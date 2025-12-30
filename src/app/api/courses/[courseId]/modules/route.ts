import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'
import { moduleSchema } from '@/lib/validators/course'
import { createAuditLog, AuditActions } from '@/lib/utils/audit'
import { Role } from '@prisma/client'

interface RouteParams {
  params: Promise<{ courseId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { courseId } = await params

    const modules = await prisma.module.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          select: { id: true, title: true, contentType: true, order: true },
        },
        _count: { select: { lessons: true } },
      },
    })

    return NextResponse.json(modules)
  } catch (error) {
    console.error('GET /api/courses/[courseId]/modules error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    if (![Role.ADMIN, Role.TRAINER].includes(session.user.role)) {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })
    }

    const { courseId } = await params

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    })

    if (!course) {
      return NextResponse.json({ error: 'Formation non trouvée' }, { status: 404 })
    }

    if (session.user.role !== Role.ADMIN && course.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = moduleSchema.parse({ ...body, courseId })

    // Get the next order number
    const lastModule = await prisma.module.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' },
    })
    const order = (lastModule?.order ?? -1) + 1

    const module = await prisma.module.create({
      data: {
        ...validatedData,
        order,
      },
      include: {
        lessons: true,
      },
    })

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.MODULE_CREATE,
      resource: 'module',
      resourceId: module.id,
      details: { title: module.title, courseId },
    })

    return NextResponse.json(module, { status: 201 })
  } catch (error) {
    console.error('POST /api/courses/[courseId]/modules error:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Données invalides', details: error }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
