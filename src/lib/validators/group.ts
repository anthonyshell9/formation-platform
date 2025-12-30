import { z } from 'zod'

export const groupSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur invalide').default('#3B82F6'),
})

export const groupMemberSchema = z.object({
  userId: z.string().cuid(),
  groupId: z.string().cuid(),
  role: z.enum(['member', 'leader']).default('member'),
})

export const courseAssignmentSchema = z.object({
  courseId: z.string().cuid(),
  groupId: z.string().cuid().optional().nullable(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional().nullable(),
  mandatory: z.boolean().default(false),
  reminderDays: z.array(z.number().int()).default([7, 3, 1]),
})

export type GroupInput = z.infer<typeof groupSchema>
export type GroupMemberInput = z.infer<typeof groupMemberSchema>
export type CourseAssignmentInput = z.infer<typeof courseAssignmentSchema>
