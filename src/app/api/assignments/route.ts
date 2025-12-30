import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'
import { courseAssignmentSchema } from '@/lib/validators/group'
import { createAuditLog, AuditActions } from '@/lib/utils/audit'
import { Role, EnrollmentStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const courseId = searchParams.get('courseId')
    const upcoming = searchParams.get('upcoming') === 'true'

    const where: Record<string, unknown> = {}

    if (groupId) where.groupId = groupId
    if (courseId) where.courseId = courseId
    if (upcoming) {
      where.startDate = { gte: new Date() }
    }

    // Filter by user's groups if learner
    if (session.user.role === Role.LEARNER) {
      const userGroups = await prisma.groupMember.findMany({
        where: { userId: session.user.id },
        select: { groupId: true },
      })
      where.groupId = { in: userGroups.map(g => g.groupId) }
    }

    const assignments = await prisma.courseAssignment.findMany({
      where,
      include: {
        course: {
          select: { id: true, title: true, thumbnail: true, difficulty: true },
        },
        group: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy: { startDate: 'asc' },
    })

    return NextResponse.json(assignments)
  } catch (error) {
    console.error('GET /api/assignments error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    if (![Role.ADMIN, Role.MANAGER, Role.TRAINER].includes(session.user.role)) {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = courseAssignmentSchema.parse(body)

    const course = await prisma.course.findUnique({
      where: { id: validatedData.courseId },
    })

    if (!course) {
      return NextResponse.json({ error: 'Formation non trouvée' }, { status: 404 })
    }

    if (validatedData.groupId) {
      const group = await prisma.group.findUnique({
        where: { id: validatedData.groupId },
        include: { members: true },
      })

      if (!group) {
        return NextResponse.json({ error: 'Groupe non trouvé' }, { status: 404 })
      }

      // Auto-enroll group members
      for (const member of group.members) {
        await prisma.enrollment.upsert({
          where: {
            userId_courseId: {
              userId: member.userId,
              courseId: validatedData.courseId,
            },
          },
          create: {
            userId: member.userId,
            courseId: validatedData.courseId,
            status: EnrollmentStatus.ENROLLED,
            deadline: validatedData.endDate ? new Date(validatedData.endDate) : null,
          },
          update: {
            deadline: validatedData.endDate ? new Date(validatedData.endDate) : null,
          },
        })

        // Create progress if not exists
        await prisma.courseProgress.upsert({
          where: {
            userId_courseId: {
              userId: member.userId,
              courseId: validatedData.courseId,
            },
          },
          create: {
            userId: member.userId,
            courseId: validatedData.courseId,
            progressPercent: 0,
          },
          update: {},
        })
      }
    }

    const assignment = await prisma.courseAssignment.create({
      data: {
        ...validatedData,
        startDate: new Date(validatedData.startDate),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
      },
      include: {
        course: {
          select: { id: true, title: true, thumbnail: true },
        },
        group: {
          select: { id: true, name: true, color: true },
        },
      },
    })

    await createAuditLog({
      userId: session.user.id,
      action: AuditActions.ASSIGNMENT_CREATE,
      resource: 'assignment',
      resourceId: assignment.id,
      details: {
        courseId: validatedData.courseId,
        groupId: validatedData.groupId,
        startDate: validatedData.startDate,
      },
    })

    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    console.error('POST /api/assignments error:', error)
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Données invalides', details: error }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
