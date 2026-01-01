import { z } from 'zod'

export const courseSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(200),
  description: z.string().optional(),
  thumbnail: z.string().url().optional().nullable(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
})

export const moduleSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(200),
  description: z.string().optional(),
  order: z.number().int().min(0),
  courseId: z.string().cuid(),
})

export const lessonSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(200),
  description: z.string().optional(),
  contentType: z.enum(['VIDEO', 'TEXT', 'PDF', 'QUIZ', 'EXTERNAL_LINK']),
  content: z.string().optional(),
  videoUrl: z.string().url().optional().nullable(),
  videoDuration: z.number().int().optional().nullable(),
  order: z.number().int().min(0),
  moduleId: z.string().cuid(),
  quizId: z.string().cuid().optional().nullable(),
})

export type CourseInput = z.infer<typeof courseSchema>
export type ModuleInput = z.infer<typeof moduleSchema>
export type LessonInput = z.infer<typeof lessonSchema>
