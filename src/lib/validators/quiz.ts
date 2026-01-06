import { z } from 'zod'

export const optionSchema = z.object({
  text: z.string().min(1, 'Le texte est requis'),
  isCorrect: z.boolean().default(false),
  order: z.number().int().min(0),
  matchText: z.string().optional().nullable(),
})

export const questionSchema = z.object({
  type: z.enum(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'MATCHING']),
  question: z.string().min(1, 'La question est requise'),
  explanation: z.string().optional(),
  points: z.number().int().min(1).default(1),
  order: z.number().int().min(0),
  mediaUrl: z.string().url().optional().nullable(),
  options: z.array(optionSchema).min(2, 'Au moins 2 options sont requises'),
})

export const quizSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(200),
  description: z.string().optional(),
  timeLimit: z.number().int().min(1).optional().nullable(),
  passingScore: z.number().int().min(0).max(100).default(70),
  shuffleQuestions: z.boolean().default(false),
  showCorrectAnswers: z.boolean().default(true),
  maxAttempts: z.number().int().min(1).optional().nullable(),
  moduleId: z.string().cuid().optional().nullable(),
  questions: z.array(questionSchema).optional(),
})

export const quizAnswerSchema = z.object({
  questionId: z.string().cuid(),
  answer: z.string(), // JSON stringified for multiple choice
})

export const quizSubmissionSchema = z.object({
  quizId: z.string().cuid(),
  answers: z.array(quizAnswerSchema),
})

export type OptionInput = z.infer<typeof optionSchema>
export type QuestionInput = z.infer<typeof questionSchema>
export type QuizInput = z.infer<typeof quizSchema>
export type QuizSubmission = z.infer<typeof quizSubmissionSchema>
