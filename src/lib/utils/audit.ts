import { prisma } from '@/lib/prisma/client'
import { headers } from 'next/headers'

interface AuditLogParams {
  userId?: string | null
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, unknown>
}

export async function createAuditLog(params: AuditLogParams) {
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
  const userAgent = headersList.get('user-agent') || 'unknown'

  return prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      details: params.details,
      ip,
      userAgent,
    },
  })
}

export const AuditActions = {
  // Auth
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',

  // Courses
  COURSE_CREATE: 'COURSE_CREATE',
  COURSE_UPDATE: 'COURSE_UPDATE',
  COURSE_DELETE: 'COURSE_DELETE',
  COURSE_PUBLISH: 'COURSE_PUBLISH',
  COURSE_ARCHIVE: 'COURSE_ARCHIVE',

  // Modules
  MODULE_CREATE: 'MODULE_CREATE',
  MODULE_UPDATE: 'MODULE_UPDATE',
  MODULE_DELETE: 'MODULE_DELETE',

  // Lessons
  LESSON_CREATE: 'LESSON_CREATE',
  LESSON_UPDATE: 'LESSON_UPDATE',
  LESSON_DELETE: 'LESSON_DELETE',

  // Quizzes
  QUIZ_CREATE: 'QUIZ_CREATE',
  QUIZ_UPDATE: 'QUIZ_UPDATE',
  QUIZ_DELETE: 'QUIZ_DELETE',
  QUIZ_ATTEMPT_START: 'QUIZ_ATTEMPT_START',
  QUIZ_ATTEMPT_SUBMIT: 'QUIZ_ATTEMPT_SUBMIT',

  // Groups
  GROUP_CREATE: 'GROUP_CREATE',
  GROUP_UPDATE: 'GROUP_UPDATE',
  GROUP_DELETE: 'GROUP_DELETE',
  GROUP_MEMBER_ADD: 'GROUP_MEMBER_ADD',
  GROUP_MEMBER_REMOVE: 'GROUP_MEMBER_REMOVE',

  // Enrollments
  ENROLLMENT_CREATE: 'ENROLLMENT_CREATE',
  ENROLLMENT_COMPLETE: 'ENROLLMENT_COMPLETE',
  ENROLLMENT_CANCEL: 'ENROLLMENT_CANCEL',

  // Assignments
  ASSIGNMENT_CREATE: 'ASSIGNMENT_CREATE',
  ASSIGNMENT_UPDATE: 'ASSIGNMENT_UPDATE',
  ASSIGNMENT_DELETE: 'ASSIGNMENT_DELETE',

  // Badges & Certificates
  BADGE_EARN: 'BADGE_EARN',
  CERTIFICATE_ISSUE: 'CERTIFICATE_ISSUE',

  // Users
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_ROLE_CHANGE: 'USER_ROLE_CHANGE',
} as const
