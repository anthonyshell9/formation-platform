import { prisma } from '@/lib/prisma/client'
import { BadgeTrigger } from '@prisma/client'

/**
 * Check and award badges for a user based on course completion
 */
export async function checkAndAwardBadges(
  userId: string,
  courseId: string,
  quizScore?: number
): Promise<{ badgesAwarded: string[]; certificateIssued: boolean }> {
  const badgesAwarded: string[] = []
  let certificateIssued = false

  try {
    // Get course badges configuration
    const courseBadges = await prisma.courseBadge.findMany({
      where: { courseId },
      include: { badge: true }
    })

    // Get user's course progress
    const progress = await prisma.courseProgress.findUnique({
      where: {
        userId_courseId: { userId, courseId }
      },
      include: {
        lessons: true
      }
    })

    // Get total lessons in course
    const totalLessons = await prisma.lesson.count({
      where: { module: { courseId } }
    })

    const completedLessons = progress?.lessons.filter(l => l.completed).length || 0
    const isCourseComplete = completedLessons >= totalLessons && totalLessons > 0

    // Check each badge configuration
    for (const cb of courseBadges) {
      // Skip if user already has this badge
      const existingBadge = await prisma.userBadge.findUnique({
        where: { userId_badgeId: { userId, badgeId: cb.badgeId } }
      })

      if (existingBadge) continue

      let shouldAward = false

      switch (cb.trigger) {
        case BadgeTrigger.COURSE_COMPLETION:
          shouldAward = isCourseComplete
          break

        case BadgeTrigger.QUIZ_PASS:
          if (quizScore !== undefined && cb.minScore) {
            shouldAward = quizScore >= cb.minScore
          }
          break

        case BadgeTrigger.PERFECT_QUIZ:
          shouldAward = quizScore === 100
          break

        default:
          break
      }

      if (shouldAward) {
        await prisma.userBadge.create({
          data: {
            userId,
            badgeId: cb.badgeId,
            courseId,
            metadata: {
              trigger: cb.trigger,
              quizScore,
              completedAt: new Date().toISOString()
            }
          }
        })
        badgesAwarded.push(cb.badge.name)
      }
    }

    // Check and issue certificate
    if (isCourseComplete) {
      certificateIssued = await checkAndIssueCertificate(userId, courseId, quizScore)
    }
  } catch (error) {
    console.error('Error checking/awarding badges:', error)
  }

  return { badgesAwarded, certificateIssued }
}

/**
 * Check and issue certificate for a user
 */
export async function checkAndIssueCertificate(
  userId: string,
  courseId: string,
  quizScore?: number
): Promise<boolean> {
  try {
    // Check if certificate already exists
    const existingCert = await prisma.certificate.findUnique({
      where: { userId_courseId: { userId, courseId } }
    })

    if (existingCert) return false

    // Get certificate template
    const template = await prisma.certificateTemplate.findUnique({
      where: { courseId },
      include: { course: true }
    })

    if (!template || !template.enabled) return false

    // Check requirements
    const progress = await prisma.courseProgress.findUnique({
      where: { userId_courseId: { userId, courseId } },
      include: { lessons: true }
    })

    // Check all lessons completed if required
    if (template.requireAllLessons) {
      const totalLessons = await prisma.lesson.count({
        where: { module: { courseId } }
      })
      const completedLessons = progress?.lessons.filter(l => l.completed).length || 0

      if (completedLessons < totalLessons) return false
    }

    // Check minimum score
    if (template.minScore > 0) {
      // Get best quiz score for this course
      const quizAttempts = await prisma.quizAttempt.findMany({
        where: {
          userId,
          quiz: { lesson: { module: { courseId } } },
          passed: true
        },
        orderBy: { score: 'desc' },
        take: 1
      })

      const bestScore = quizAttempts[0]?.score ?? quizScore ?? 0
      if (bestScore < template.minScore) return false
    }

    // Generate certificate number
    const certNumber = `CERT-${courseId.slice(0, 4).toUpperCase()}-${Date.now()}`

    // Calculate expiration date if validity is set
    let expiresAt: Date | null = null
    if (template.validityMonths) {
      expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + template.validityMonths)
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true }
    })

    // Create certificate
    await prisma.certificate.create({
      data: {
        userId,
        courseId,
        certificateNumber: certNumber,
        title: template.title,
        expiresAt,
        verificationUrl: `/verify/${certNumber}`,
        metadata: {
          userName: user?.name || user?.email,
          courseName: template.course.title,
          issuedAt: new Date().toISOString(),
          signatoryName: template.signatoryName,
          signatoryTitle: template.signatoryTitle
        }
      }
    })

    return true
  } catch (error) {
    console.error('Error issuing certificate:', error)
    return false
  }
}

/**
 * Check global badges (not course-specific)
 */
export async function checkGlobalBadges(userId: string): Promise<string[]> {
  const badgesAwarded: string[] = []

  try {
    // Count completed courses
    const completedCourses = await prisma.courseProgress.count({
      where: {
        userId,
        progressPercent: 100
      }
    })

    // Count passed quizzes
    const passedQuizzes = await prisma.quizAttempt.count({
      where: {
        userId,
        passed: true
      }
    })

    // Check for "first course" badge
    if (completedCourses >= 1) {
      const badge = await prisma.badge.findFirst({
        where: {
          category: 'progression',
          courseBadges: { none: {} } // Global badge
        }
      })

      if (badge) {
        const exists = await prisma.userBadge.findUnique({
          where: { userId_badgeId: { userId, badgeId: badge.id } }
        })

        if (!exists) {
          await prisma.userBadge.create({
            data: { userId, badgeId: badge.id }
          })
          badgesAwarded.push(badge.name)
        }
      }
    }

    // Add more global badge checks as needed...
  } catch (error) {
    console.error('Error checking global badges:', error)
  }

  return badgesAwarded
}
