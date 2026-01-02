import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'
import { Role, EnrollmentStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    if (session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Acces interdit' }, { status: 403 })
    }

    const period = request.nextUrl.searchParams.get('period') || '30'
    const daysAgo = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)

    // Get basic stats
    const [
      totalUsers,
      totalCourses,
      totalEnrollments,
      activeUsersCount,
      newCoursesCount,
      newEnrollmentsCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.course.count({ where: { status: 'PUBLISHED' } }),
      prisma.enrollment.count(),
      prisma.user.count({
        where: {
          enrollments: {
            some: {
              updatedAt: { gte: startDate },
            },
          },
        },
      }),
      prisma.course.count({
        where: {
          createdAt: { gte: startDate },
        },
      }),
      prisma.enrollment.count({
        where: {
          enrolledAt: { gte: startDate },
        },
      }),
    ])

    // Get completion stats
    const completedEnrollments = await prisma.enrollment.count({
      where: { status: EnrollmentStatus.COMPLETED },
    })

    const progressData = await prisma.courseProgress.aggregate({
      _avg: { progressPercent: true },
    })

    const completionRate = totalEnrollments > 0
      ? Math.round((completedEnrollments / totalEnrollments) * 100)
      : 0

    // Get course reports
    const courses = await prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        _count: { select: { enrollments: true } },
        enrollments: {
          where: { status: EnrollmentStatus.COMPLETED },
        },
      },
      orderBy: { enrollments: { _count: 'desc' } },
      take: 10,
    })

    const courseReports = await Promise.all(
      courses.map(async (course) => {
        const progress = await prisma.courseProgress.aggregate({
          where: { courseId: course.id },
          _avg: { progressPercent: true },
        })

        return {
          id: course.id,
          title: course.title,
          enrollments: course._count.enrollments,
          completions: course.enrollments.length,
          averageProgress: progress._avg.progressPercent || 0,
        }
      })
    )

    // Get user activity
    const users = await prisma.user.findMany({
      where: {
        enrollments: { some: {} },
      },
      include: {
        _count: { select: { enrollments: true } },
        enrollments: {
          where: { status: EnrollmentStatus.COMPLETED },
        },
      },
      orderBy: { enrollments: { _count: 'desc' } },
      take: 10,
    })

    const userActivity = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      enrolledCourses: user._count.enrollments,
      completedCourses: user.enrollments.length,
      lastActive: user.updatedAt?.toISOString() || null,
    }))

    return NextResponse.json({
      stats: {
        totalUsers,
        totalCourses,
        totalEnrollments,
        completionRate,
        activeUsers: activeUsersCount,
        coursesThisMonth: newCoursesCount,
        enrollmentsThisMonth: newEnrollmentsCount,
        averageProgress: Math.round(progressData._avg.progressPercent || 0),
      },
      courseReports,
      userActivity,
    })
  } catch (error) {
    console.error('GET /api/admin/reports error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
