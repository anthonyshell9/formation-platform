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

// Content types supported for direct module content
const contentTypes = [
  'VIDEO',
  'TEXT',
  'PDF',
  'QUIZ',
  'EXTERNAL_LINK',
  'DRAG_DROP',
  'MATCHING',
  'FILL_BLANK',
  'FLASHCARDS',
  'SORTING',
  'HOTSPOT',
  'DOCUMENT',
  'INTERACTIVE_SCENARIO',
] as const

export const moduleSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(200),
  description: z.string().optional(),
  order: z.number().int().min(0),
  courseId: z.string().cuid(),
  // Direct content fields
  contentType: z.enum(contentTypes).optional().nullable(),
  content: z.string().optional().nullable(),
  videoUrl: z.string().url().optional().nullable(),
  videoDuration: z.number().int().optional().nullable(),
  requiresAck: z.boolean().optional(),
})

export const moduleUpdateSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(200).optional(),
  description: z.string().optional().nullable(),
  order: z.number().int().min(0).optional(),
  // Direct content fields
  contentType: z.enum(contentTypes).optional().nullable(),
  content: z.string().optional().nullable(),
  videoUrl: z.string().url().optional().nullable(),
  videoDuration: z.number().int().optional().nullable(),
  requiresAck: z.boolean().optional(),
})

export const moduleMediaSchema = z.object({
  type: z.enum(['image', 'video', 'pdf', 'attachment']),
  url: z.string().url().optional().nullable(),
  blobName: z.string().optional().nullable(),
  filename: z.string().min(1, 'Le nom de fichier est requis'),
  size: z.number().int().optional().nullable(),
  mimeType: z.string().optional().nullable(),
  order: z.number().int().min(0).optional(),
})

export const lessonSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(200),
  description: z.string().optional(),
  contentType: z.enum(contentTypes),
  content: z.string().optional(),
  videoUrl: z.string().url().optional().nullable(),
  videoDuration: z.number().int().optional().nullable(),
  order: z.number().int().min(0),
  moduleId: z.string().cuid(),
  quizId: z.string().cuid().optional().nullable(),
  requiresAck: z.boolean().optional(),
})

export type CourseInput = z.infer<typeof courseSchema>
export type ModuleInput = z.infer<typeof moduleSchema>
export type ModuleUpdateInput = z.infer<typeof moduleUpdateSchema>
export type ModuleMediaInput = z.infer<typeof moduleMediaSchema>
export type LessonInput = z.infer<typeof lessonSchema>
