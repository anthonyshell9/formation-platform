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

    if (!([Role.ADMIN, Role.TRAINER, Role.MANAGER] as Role[]).includes(session.user.role)) {
      return NextResponse.json({ error: 'Acces interdit' }, { status: 403 })
    }

    const assignments = await prisma.courseAssignment.findMany({
      orderBy: { startDate: 'desc' },
      include: {
        course: { select: { title: true } },
        group: { select: { name: true, color: true } },
        user: { select: { name: true, email: true } },
      },
    })

    return NextResponse.json(assignments)
  } catch (error) {
    console.error('GET assignments error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    if (!([Role.ADMIN, Role.TRAINER, Role.MANAGER] as Role[]).includes(session.user.role)) {
      return NextResponse.json({ error: 'Acces interdit' }, { status: 403 })
    }

    const body = await request.json()

    const assignment = await prisma.courseAssignment.create({
      data: {
        courseId: body.courseId,
        groupId: body.groupId || null,
        userId: body.userId || null,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        mandatory: body.mandatory || false,
        notificationSent: body.sendNotification || false,
      },
    })

    // If assigning to a group, create enrollments for all group members
    if (body.groupId) {
      const groupMembers = await prisma.groupMember.findMany({
        where: { groupId: body.groupId },
        select: { userId: true },
      })

      for (const member of groupMembers) {
        await prisma.enrollment.upsert({
          where: {
            userId_courseId: {
              userId: member.userId,
              courseId: body.courseId,
            },
          },
          create: {
            userId: member.userId,
            courseId: body.courseId,
            deadline: body.endDate ? new Date(body.endDate) : null,
          },
          update: {
            deadline: body.endDate ? new Date(body.endDate) : null,
          },
        })
      }
    }

    // If assigning to a user, create enrollment
    if (body.userId) {
      await prisma.enrollment.upsert({
        where: {
          userId_courseId: {
            userId: body.userId,
            courseId: body.courseId,
          },
        },
        create: {
          userId: body.userId,
          courseId: body.courseId,
          deadline: body.endDate ? new Date(body.endDate) : null,
        },
        update: {
          deadline: body.endDate ? new Date(body.endDate) : null,
        },
      })
    }

    // TODO: Send email notifications if sendNotification is true

    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    console.error('POST assignment error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
