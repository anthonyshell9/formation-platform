'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
} from 'lucide-react'

interface Option {
  id: string
  text: string
  isCorrect: boolean
}

interface Question {
  id: string
  question: string
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE'
  points: number
  explanation?: string
  options: Option[]
}

interface Quiz {
  id: string
  title: string
  description?: string
  timeLimit?: number
  passingScore: number
  showCorrectAnswers: boolean
  questions: Question[]
}

interface QuizResult {
  score: number
  passed: boolean
  correctAnswers: number
  totalQuestions: number
  pointsEarned: number
  totalPoints: number
}

export default function QuizTakePage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const quizId = params.quizId as string
  const lessonId = searchParams.get('lessonId')
  const courseId = searchParams.get('courseId')

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [showReview, setShowReview] = useState(false)

  // Load quiz data
  useEffect(() => {
    async function loadQuiz() {
      try {
        const res = await fetch(`/api/quizzes/${quizId}`)
        if (!res.ok) throw new Error('Failed to load quiz')
        const data = await res.json()
        // API returns { quiz, attempts }
        const quizData = data.quiz || data
        setQuiz(quizData)
        if (quizData.timeLimit) {
          setTimeLeft(quizData.timeLimit * 60) // Convert minutes to seconds
        }
      } catch (error) {
        console.error(error)
        toast.error('Erreur lors du chargement du quiz')
      } finally {
        setLoading(false)
      }
    }
    loadQuiz()
  }, [quizId])

  // Timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || result) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer)
          // Auto-submit when time runs out
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, result])

  const handleSubmit = useCallback(async () => {
    if (!quiz || submitting) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          lessonId,
          courseId,
        }),
      })

      if (!res.ok) throw new Error('Failed to submit quiz')

      const data = await res.json()
      setResult(data)
      toast.success(data.passed ? 'Quiz réussi !' : 'Quiz terminé')
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors de la soumission')
    } finally {
      setSubmitting(false)
    }
  }, [quiz, quizId, answers, lessonId, courseId, submitting])

  const handleSingleAnswer = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: [optionId],
    }))
  }

  const handleMultipleAnswer = (questionId: string, optionId: string, checked: boolean) => {
    setAnswers((prev) => {
      const current = prev[questionId] || []
      if (checked) {
        return { ...prev, [questionId]: [...current, optionId] }
      } else {
        return { ...prev, [questionId]: current.filter((id) => id !== optionId) }
      }
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getBackUrl = () => {
    if (lessonId && courseId) {
      return `/dashboard/courses/${courseId}/lessons/${lessonId}`
    }
    return `/dashboard/quizzes/${quizId}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Quiz non trouvé</p>
        <Button asChild className="mt-4">
          <a href={getBackUrl()}>Retour</a>
        </Button>
      </div>
    )
  }

  // Show results
  if (result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className={result.passed ? 'border-green-500' : 'border-red-500'}>
          <CardHeader className="text-center">
            {result.passed ? (
              <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
            ) : (
              <XCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
            )}
            <CardTitle className="text-2xl">
              {result.passed ? 'Félicitations !' : 'Dommage !'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-4xl font-bold mb-2">{Math.round(result.score)}%</p>
              <p className="text-muted-foreground">
                {result.correctAnswers} / {result.totalQuestions} questions correctes
              </p>
              <p className="text-muted-foreground">
                {result.pointsEarned} / {result.totalPoints} points
              </p>
            </div>

            <div className="p-4 rounded-lg bg-muted">
              <p className="text-center">
                Score requis : <span className="font-bold">{quiz.passingScore}%</span>
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              {quiz.showCorrectAnswers && (
                <Button variant="outline" onClick={() => setShowReview(true)}>
                  Voir les réponses
                </Button>
              )}
              <Button onClick={() => router.push(getBackUrl())}>
                {result.passed ? 'Continuer' : 'Retour'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Review Section */}
        {showReview && (
          <Card>
            <CardHeader>
              <CardTitle>Revue des réponses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {quiz.questions.map((question, index) => {
                const userAnswer = answers[question.id] || []
                const isCorrect = question.options
                  .filter((o) => o.isCorrect)
                  .every((o) => userAnswer.includes(o.id)) &&
                  userAnswer.every((id) =>
                    question.options.find((o) => o.id === id)?.isCorrect
                  )

                return (
                  <div key={question.id} className="p-4 border rounded-lg">
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs text-white shrink-0 ${
                          isCorrect ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium">{question.question}</p>
                        <div className="mt-2 space-y-1">
                          {question.options.map((option) => {
                            const isSelected = userAnswer.includes(option.id)
                            return (
                              <div
                                key={option.id}
                                className={`flex items-center gap-2 text-sm p-2 rounded ${
                                  option.isCorrect
                                    ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                                    : isSelected
                                    ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                                    : 'bg-gray-50 dark:bg-gray-800'
                                }`}
                              >
                                {option.isCorrect && <CheckCircle2 className="h-4 w-4" />}
                                {isSelected && !option.isCorrect && (
                                  <XCircle className="h-4 w-4" />
                                )}
                                {option.text}
                              </div>
                            )
                          })}
                        </div>
                        {question.explanation && (
                          <p className="mt-2 text-sm text-muted-foreground italic">
                            {question.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  const question = quiz.questions[currentQuestion]
  const isLastQuestion = currentQuestion === quiz.questions.length - 1
  const answeredCount = Object.keys(answers).length

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          <p className="text-muted-foreground">
            Question {currentQuestion + 1} sur {quiz.questions.length}
          </p>
        </div>
        {timeLeft !== null && (
          <Badge
            variant={timeLeft < 60 ? 'destructive' : 'secondary'}
            className="text-lg px-4 py-2"
          >
            <Clock className="mr-2 h-4 w-4" />
            {formatTime(timeLeft)}
          </Badge>
        )}
      </div>

      {/* Progress */}
      <Progress value={((currentQuestion + 1) / quiz.questions.length) * 100} />

      {/* Question */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="outline">{question.points} points</Badge>
            <Badge variant="secondary">
              {question.type === 'SINGLE_CHOICE' && 'Choix unique'}
              {question.type === 'MULTIPLE_CHOICE' && 'Choix multiple'}
              {question.type === 'TRUE_FALSE' && 'Vrai/Faux'}
            </Badge>
          </div>
          <CardTitle className="text-xl mt-4">{question.question}</CardTitle>
        </CardHeader>
        <CardContent>
          {question.type === 'SINGLE_CHOICE' || question.type === 'TRUE_FALSE' ? (
            <RadioGroup
              value={answers[question.id]?.[0] || ''}
              onValueChange={(value: string) => handleSingleAnswer(question.id, value)}
              className="space-y-3"
            >
              {question.options.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => handleSingleAnswer(question.id, option.id)}
                >
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <div className="space-y-3">
              {question.options.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() =>
                    handleMultipleAnswer(
                      question.id,
                      option.id,
                      !answers[question.id]?.includes(option.id)
                    )
                  }
                >
                  <Checkbox
                    id={option.id}
                    checked={answers[question.id]?.includes(option.id) || false}
                    onCheckedChange={(checked) =>
                      handleMultipleAnswer(question.id, option.id, checked as boolean)
                    }
                  />
                  <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                    {option.text}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Précédent
        </Button>

        <p className="text-sm text-muted-foreground">
          {answeredCount} / {quiz.questions.length} réponses
        </p>

        {isLastQuestion ? (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Terminer le quiz
          </Button>
        ) : (
          <Button
            onClick={() =>
              setCurrentQuestion((prev) => Math.min(quiz.questions.length - 1, prev + 1))
            }
          >
            Suivant
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Warning if not all answered */}
      {answeredCount < quiz.questions.length && (
        <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-950 rounded-lg text-amber-700 dark:text-amber-300">
          <AlertTriangle className="h-5 w-5" />
          <p className="text-sm">
            {quiz.questions.length - answeredCount} question(s) sans réponse
          </p>
        </div>
      )}
    </div>
  )
}
