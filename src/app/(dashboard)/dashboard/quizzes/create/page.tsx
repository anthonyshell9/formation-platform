'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Plus, Trash2, GripVertical } from 'lucide-react'
import Link from 'next/link'
import { Checkbox } from '@/components/ui/checkbox'

interface OptionInput {
  text: string
  isCorrect: boolean
}

interface QuestionInput {
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER'
  question: string
  explanation?: string
  points: number
  options: OptionInput[]
}

interface QuizFormInput {
  title: string
  description?: string
  timeLimit?: number | null
  passingScore: number
  shuffleQuestions: boolean
  showCorrectAnswers: boolean
  maxAttempts?: number | null
  questions: QuestionInput[]
}

const questionTypes = [
  { value: 'SINGLE_CHOICE', label: 'Choix unique' },
  { value: 'MULTIPLE_CHOICE', label: 'Choix multiple' },
  { value: 'TRUE_FALSE', label: 'Vrai/Faux' },
  { value: 'SHORT_ANSWER', label: 'Réponse courte' },
]

export default function CreateQuizPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<QuizFormInput>({
    defaultValues: {
      title: '',
      description: '',
      timeLimit: null,
      passingScore: 70,
      shuffleQuestions: false,
      showCorrectAnswers: true,
      maxAttempts: null,
      questions: [],
    },
  })

  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control: form.control,
    name: 'questions',
  })

  const addQuestion = () => {
    appendQuestion({
      type: 'SINGLE_CHOICE' as const,
      question: '',
      explanation: '',
      points: 1,
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ],
    })
  }

  async function onSubmit(data: QuizFormInput) {
    setIsLoading(true)
    try {
      // Transform data to match API schema
      const submitData = {
        ...data,
        timeLimit: data.timeLimit || null,
        maxAttempts: data.maxAttempts || null,
        questions: data.questions?.map((q, qIndex) => ({
          ...q,
          order: qIndex,
          options: q.options.map((o, oIndex) => ({
            ...o,
            order: oIndex,
          })),
        })),
      }

      const response = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la création')
      }

      const quiz = await response.json()
      toast.success('Quiz créé avec succès')
      router.push(`/dashboard/quizzes/${quiz.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/quizzes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nouveau quiz</h1>
          <p className="text-muted-foreground">
            Créez un quiz pour évaluer les apprenants
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* General Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre *</FormLabel>
                    <FormControl>
                      <Input placeholder="Quiz sur les bases de la cybersécurité" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Décrivez l'objectif du quiz..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="timeLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temps limite (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Illimité"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormDescription>Laissez vide pour illimité</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="passingScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Score minimum (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormDescription>Pour réussir le quiz</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxAttempts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tentatives max</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Illimité"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormDescription>Laissez vide pour illimité</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-6">
                <FormField
                  control={form.control}
                  name="shuffleQuestions"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="font-normal">Mélanger les questions</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="showCorrectAnswers"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="font-normal">Afficher les réponses correctes</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Questions</CardTitle>
              <Button type="button" onClick={addQuestion} variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une question
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {questionFields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Aucune question ajoutée</p>
                  <p className="text-sm">Cliquez sur &quot;Ajouter une question&quot; pour commencer</p>
                </div>
              ) : (
                questionFields.map((questionField, qIndex) => (
                  <QuestionEditor
                    key={questionField.id}
                    index={qIndex}
                    form={form}
                    onRemove={() => removeQuestion(qIndex)}
                  />
                ))
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/quizzes">Annuler</Link>
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer le quiz
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

interface QuestionEditorProps {
  index: number
  form: ReturnType<typeof useForm<QuizFormInput>>
  onRemove: () => void
}

function QuestionEditor({ index, form, onRemove }: QuestionEditorProps) {
  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
    control: form.control,
    name: `questions.${index}.options`,
  })

  const questionType = form.watch(`questions.${index}.type`)

  const addOption = () => {
    appendOption({ text: '', isCorrect: false })
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
            <span className="font-medium">Question {index + 1}</span>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name={`questions.${index}.type`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type de question</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {questionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`questions.${index}.points`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Points</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    value={field.value}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name={`questions.${index}.question`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question *</FormLabel>
              <FormControl>
                <Textarea placeholder="Entrez votre question..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`questions.${index}.explanation`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Explication (optionnel)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Expliquez la bonne réponse..."
                  className="min-h-[60px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>Sera affichée après la réponse</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Options */}
        {questionType !== 'SHORT_ANSWER' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <FormLabel>Options de réponse</FormLabel>
              <Button type="button" variant="outline" size="sm" onClick={addOption}>
                <Plus className="mr-1 h-3 w-3" />
                Option
              </Button>
            </div>
            {optionFields.map((optionField, oIndex) => (
              <div key={optionField.id} className="flex items-center gap-2">
                <FormField
                  control={form.control}
                  name={`questions.${index}.options.${oIndex}.isCorrect`}
                  render={({ field }) => (
                    <FormItem className="flex items-center space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`questions.${index}.options.${oIndex}.text`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder={`Option ${oIndex + 1}`} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {optionFields.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(oIndex)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Cochez les réponses correctes
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
