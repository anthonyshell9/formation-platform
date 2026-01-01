'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
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
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Plus, Trash2, GripVertical, Save } from 'lucide-react'
import Link from 'next/link'

interface ModuleInput {
  id?: string
  title: string
  description?: string
  order: number
  lessons: LessonInput[]
}

interface LessonInput {
  id?: string
  title: string
  description?: string
  contentType: 'VIDEO' | 'TEXT' | 'PDF' | 'QUIZ' | 'EXTERNAL_LINK'
  content?: string
  videoUrl?: string
  order: number
}

interface CourseFormInput {
  title: string
  description?: string
  difficulty?: string
  category?: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
}

interface Course extends CourseFormInput {
  id: string
  modules: ModuleInput[]
}

export default function EditCoursePage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<ModuleInput[]>([])

  const form = useForm<CourseFormInput>({
    defaultValues: {
      title: '',
      description: '',
      difficulty: undefined,
      category: '',
      status: 'DRAFT',
    },
  })

  useEffect(() => {
    async function loadCourse() {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/courses/${courseId}`)
        if (!response.ok) throw new Error('Erreur de chargement')
        const data = await response.json()
        // API returns { course, progress } - extract course
        const courseData = data.course || data
        setCourse(courseData)
        setModules(courseData.modules || [])
        form.reset({
          title: courseData.title,
          description: courseData.description || '',
          difficulty: courseData.difficulty || undefined,
          category: courseData.category || '',
          status: courseData.status,
        })
      } catch (error) {
        toast.error('Erreur lors du chargement de la formation')
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }
    loadCourse()
  }, [courseId, form])

  async function onSubmit(data: CourseFormInput) {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la sauvegarde')
      }

      toast.success('Formation mise à jour')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const addModule = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Module ${modules.length + 1}`,
          order: modules.length,
        }),
      })

      if (!response.ok) throw new Error('Erreur')

      const newModule = await response.json()
      setModules([...modules, { ...newModule, lessons: [] }])
      toast.success('Module ajouté')
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du module')
      console.error(error)
    }
  }

  const deleteModule = async (moduleId: string, index: number) => {
    if (!confirm('Supprimer ce module ?')) return

    try {
      const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Erreur')

      setModules(modules.filter((_, i) => i !== index))
      toast.success('Module supprimé')
    } catch (error) {
      toast.error('Erreur lors de la suppression')
      console.error(error)
    }
  }

  const updateModuleTitle = (index: number, title: string) => {
    const updated = [...modules]
    updated[index].title = title
    setModules(updated)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Formation non trouvée</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/courses">Retour aux formations</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/courses/${courseId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Modifier la formation</h1>
            <p className="text-muted-foreground">{course.title}</p>
          </div>
        </div>
        <Button onClick={form.handleSubmit(onSubmit)} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Enregistrer
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      <Input {...field} />
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
                      <Textarea className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulté</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">Débutant</SelectItem>
                          <SelectItem value="intermediate">Intermédiaire</SelectItem>
                          <SelectItem value="advanced">Avancé</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DRAFT">Brouillon</SelectItem>
                          <SelectItem value="PUBLISHED">Publié</SelectItem>
                          <SelectItem value="ARCHIVED">Archivé</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Seules les formations publiées sont visibles
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>

      {/* Modules */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Modules</CardTitle>
          <Button onClick={addModule} variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un module
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {modules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucun module</p>
              <p className="text-sm">Ajoutez des modules pour structurer votre formation</p>
            </div>
          ) : (
            modules.map((module, index) => (
              <Card key={module.id || index} className="border-dashed">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <div className="flex-1">
                      <Input
                        value={module.title}
                        onChange={(e) => updateModuleTitle(index, e.target.value)}
                        className="font-medium"
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {module.lessons?.length || 0} leçons
                    </span>
                    {module.id && (
                      <>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/courses/${courseId}/modules/${module.id}`}>
                            Éditer
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteModule(module.id!, index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" asChild>
          <Link href={`/dashboard/courses/${courseId}`}>Voir la formation</Link>
        </Button>
      </div>
    </div>
  )
}
