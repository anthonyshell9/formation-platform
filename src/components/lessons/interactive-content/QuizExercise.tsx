'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
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
  passingScore: number
  showCorrectAnswers: boolean
  questions: Question[]
}

interface QuizExerciseProps {
  quizId: string
  onComplete?: (score: number) => void
  darkMode?: boolean
}

export function QuizExercise({ quizId, onComplete, darkMode = true }: QuizExerciseProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<{
    score: number
    passed: boolean
    correctCount: number
  } | null>(null)

  useEffect(() => {
    async function loadQuiz() {
      try {
        const res = await fetch(`/api/quizzes/${quizId}`)
        if (!res.ok) throw new Error('Quiz non trouve')
        const data = await res.json()
        const quizData = data.quiz || data
        setQuiz(quizData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }
    if (quizId) {
      loadQuiz()
    }
  }, [quizId])

  const handleSingleChoice = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: [optionId] }))
  }

  const handleMultipleChoice = (questionId: string, optionId: string, checked: boolean) => {
    setAnswers((prev) => {
      const current = prev[questionId] || []
      if (checked) {
        return { ...prev, [questionId]: [...current, optionId] }
      } else {
        return { ...prev, [questionId]: current.filter((id) => id !== optionId) }
      }
    })
  }

  const calculateScore = () => {
    if (!quiz) return { score: 0, passed: false, correctCount: 0 }

    let correctCount = 0
    let totalPoints = 0
    let earnedPoints = 0

    quiz.questions.forEach((question) => {
      totalPoints += question.points
      const userAnswer = answers[question.id] || []
      const correctOptions = question.options.filter((o) => o.isCorrect).map((o) => o.id)

      const isCorrect =
        userAnswer.length === correctOptions.length &&
        userAnswer.every((a) => correctOptions.includes(a))

      if (isCorrect) {
        correctCount++
        earnedPoints += question.points
      }
    })

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
    const passed = score >= quiz.passingScore

    return { score, passed, correctCount }
  }

  const handleSubmit = () => {
    const result = calculateScore()
    setResult(result)
    setSubmitted(true)
    onComplete?.(result.score)
  }

  const handleRetry = () => {
    setAnswers({})
    setCurrentQuestion(0)
    setSubmitted(false)
    setResult(null)
  }

  const textColor = darkMode ? 'text-white' : 'text-gray-900'
  const mutedColor = darkMode ? 'text-white/70' : 'text-gray-600'
  const bgColor = darkMode ? 'bg-white/10' : 'bg-gray-100'
  const borderColor = darkMode ? 'border-white/20' : 'border-gray-200'

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center gap-3', textColor)}>
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Chargement du quiz...</span>
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div className={cn('text-center space-y-2', textColor)}>
        <XCircle className="h-12 w-12 mx-auto text-red-400" />
        <p>{error || 'Quiz non disponible'}</p>
      </div>
    )
  }

  // Show results
  if (submitted && result) {
    return (
      <div className={cn('text-center space-y-6 max-w-md mx-auto', textColor)}>
        {result.passed ? (
          <CheckCircle2 className="h-16 w-16 mx-auto text-green-400" />
        ) : (
          <XCircle className="h-16 w-16 mx-auto text-red-400" />
        )}

        <div className="space-y-2">
          <h3 className="text-2xl font-bold">
            {result.passed ? 'Felicitations !' : 'Essayez encore'}
          </h3>
          <p className={mutedColor}>
            {result.passed
              ? 'Vous avez reussi le quiz'
              : `Score minimum requis: ${quiz.passingScore}%`}
          </p>
        </div>

        <div className={cn('rounded-lg p-6', bgColor)}>
          <div className="text-4xl font-bold mb-2">{result.score}%</div>
          <p className={mutedColor}>
            {result.correctCount} / {quiz.questions.length} questions correctes
          </p>
        </div>

        <Button onClick={handleRetry} variant="outline" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Recommencer
        </Button>
      </div>
    )
  }

  const question = quiz.questions[currentQuestion]
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100
  const currentAnswer = answers[question.id] || []
  const canProceed = currentAnswer.length > 0

  return (
    <div className={cn('w-full max-w-2xl mx-auto space-y-6', textColor)}>
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className={mutedColor}>
            Question {currentQuestion + 1} sur {quiz.questions.length}
          </span>
          <span className={mutedColor}>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question */}
      <div className={cn('rounded-lg p-6', bgColor)}>
        <h3 className="text-lg font-medium mb-6">{question.question}</h3>

        {/* Single Choice / True False */}
        {(question.type === 'SINGLE_CHOICE' || question.type === 'TRUE_FALSE') && (
          <RadioGroup
            value={currentAnswer[0] || ''}
            onValueChange={(value) => handleSingleChoice(question.id, value)}
            className="space-y-3"
          >
            {question.options.map((option) => (
              <div
                key={option.id}
                className={cn(
                  'flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer',
                  borderColor,
                  currentAnswer.includes(option.id)
                    ? darkMode
                      ? 'bg-white/20 border-white/40'
                      : 'bg-blue-50 border-blue-300'
                    : darkMode
                    ? 'hover:bg-white/10'
                    : 'hover:bg-gray-50'
                )}
                onClick={() => handleSingleChoice(question.id, option.id)}
              >
                <RadioGroupItem value={option.id} id={option.id} />
                <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {/* Multiple Choice */}
        {question.type === 'MULTIPLE_CHOICE' && (
          <div className="space-y-3">
            {question.options.map((option) => (
              <div
                key={option.id}
                className={cn(
                  'flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer',
                  borderColor,
                  currentAnswer.includes(option.id)
                    ? darkMode
                      ? 'bg-white/20 border-white/40'
                      : 'bg-blue-50 border-blue-300'
                    : darkMode
                    ? 'hover:bg-white/10'
                    : 'hover:bg-gray-50'
                )}
                onClick={() =>
                  handleMultipleChoice(
                    question.id,
                    option.id,
                    !currentAnswer.includes(option.id)
                  )
                }
              >
                <Checkbox
                  id={option.id}
                  checked={currentAnswer.includes(option.id)}
                  onCheckedChange={(checked) =>
                    handleMultipleChoice(question.id, option.id, !!checked)
                  }
                />
                <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                  {option.text}
                </Label>
              </div>
            ))}
            <p className={cn('text-sm', mutedColor)}>
              Plusieurs reponses possibles
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion((p) => p - 1)}
          disabled={currentQuestion === 0}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Precedent
        </Button>

        {currentQuestion < quiz.questions.length - 1 ? (
          <Button
            onClick={() => setCurrentQuestion((p) => p + 1)}
            disabled={!canProceed}
            className="gap-2"
          >
            Suivant
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canProceed}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle2 className="h-4 w-4" />
            Terminer
          </Button>
        )}
      </div>
    </div>
  )
}

export default QuizExercise
