'use client'

import { useState } from 'react'
import { useForm, useFieldArray, UseFormReturn } from 'react-hook-form'
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
import { Loader2, Plus, Trash2, GripVertical, Save } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

interface OptionInput {
  id?: string
  text: string
  isCorrect: boolean
  order?: number
}

interface QuestionInput {
  id?: string
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER'
  question: string
  explanation?: string
  points: number
  options: OptionInput[]
  order?: number
}

export interface QuizFormInput {
  id?: string
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
  { value: 'SHORT_ANSWER', label: 'Reponse courte' },
]

interface QuizEditorProps {
  moduleId?: string
  lessonId?: string
  initialData?: QuizFormInput
  onSave?: (quiz: QuizFormInput) => Promise<void>
  onQuizCreated?: (quizId: string) => void
  compact?: boolean
}

export function QuizEditor({
  moduleId,
  lessonId,
  initialData,
  onSave,
  onQuizCreated,
  compact = false,
}: QuizEditorProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<QuizFormInput>({
    defaultValues: initialData || {
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

  async function handleSubmit(data: QuizFormInput) {
    setIsLoading(true)
    try {
      if (onSave) {
        await onSave(data)
        return
      }

      // Transform data to match API schema
      const submitData = {
        ...data,
        moduleId: moduleId || undefined,
        lessonId: lessonId || undefined,
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

      const isUpdate = !!initialData?.id
      const url = isUpdate ? `/api/quizzes/${initialData.id}` : '/api/quizzes'
      const method = isUpdate ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la sauvegarde')
      }

      const quiz = await response.json()
      toast.success(isUpdate ? 'Quiz mis a jour' : 'Quiz cree avec succes')

      if (onQuizCreated && !isUpdate) {
        onQuizCreated(quiz.id)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* General Information */}
        <Card>
          <CardHeader className={compact ? 'pb-3' : undefined}>
            <CardTitle className={compact ? 'text-lg' : undefined}>Configuration du quiz</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre du quiz *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Quiz de validation du module" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!compact && (
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Decrivez l'objectif du quiz..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className={`grid gap-4 ${compact ? 'grid-cols-2' : 'sm:grid-cols-3'}`}>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temps (min)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Illimite"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
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
                        placeholder="Illimite"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
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

            <div className="flex flex-wrap gap-4">
              <FormField
                control={form.control}
                name="shuffleQuestions"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal text-sm">Melanger les questions</FormLabel>
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
                    <FormLabel className="font-normal text-sm">Afficher les corrections</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className={compact ? 'text-lg' : undefined}>Questions</CardTitle>
            <Button type="button" onClick={addQuestion} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {questionFields.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p>Aucune question</p>
                <p className="text-sm">Cliquez sur &quot;Ajouter&quot; pour creer une question</p>
              </div>
            ) : (
              questionFields.map((questionField, qIndex) => (
                <QuestionEditor
                  key={questionField.id}
                  index={qIndex}
                  form={form}
                  onRemove={() => removeQuestion(qIndex)}
                  compact={compact}
                />
              ))
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {initialData?.id ? 'Mettre a jour' : 'Enregistrer le quiz'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

interface QuestionEditorProps {
  index: number
  form: UseFormReturn<QuizFormInput>
  onRemove: () => void
  compact?: boolean
}

function QuestionEditor({ index, form, onRemove, compact }: QuestionEditorProps) {
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
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
            <span className="font-medium text-sm">Question {index + 1}</span>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="grid gap-3 grid-cols-2">
          <FormField
            control={form.control}
            name={`questions.${index}.type`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selectionner" />
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
                <FormLabel className="text-xs">Points</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    className="h-9"
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
              <FormLabel className="text-xs">Question *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Entrez votre question..."
                  className="min-h-[60px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!compact && (
          <FormField
            control={form.control}
            name={`questions.${index}.explanation`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Explication (optionnel)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Expliquez la bonne reponse..."
                    className="min-h-[50px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Options */}
        {questionType !== 'SHORT_ANSWER' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <FormLabel className="text-xs">Options de reponse</FormLabel>
              <Button type="button" variant="ghost" size="sm" onClick={addOption} className="h-7 text-xs">
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
                        <Input
                          placeholder={`Option ${oIndex + 1}`}
                          className="h-8"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {optionFields.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => removeOption(oIndex)}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                )}
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Cochez les bonnes reponses
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default QuizEditor
