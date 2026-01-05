'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  Save,
  Video,
  FileText,
  FileQuestion,
  Puzzle,
  ArrowRightLeft,
  TextCursor,
  MousePointer,
  ArrowUpDown,
  Layers,
  Link as LinkIcon,
  File,
  Play,
  Edit,
} from 'lucide-react'
import Link from 'next/link'

interface Lesson {
  id: string
  title: string
  description?: string
  contentType: string
  content?: string
  videoUrl?: string
  order: number
}

interface Module {
  id: string
  title: string
  description?: string
  order: number
  courseId: string
  lessons: Lesson[]
}

const contentTypeCategories = [
  {
    name: 'Formations immersives',
    description: 'Experiences interactives avec narration et animations',
    types: [
      { value: 'INTERACTIVE_SCENARIO', label: 'Scenario interactif', icon: Play, color: 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 dark:from-emerald-900 dark:to-teal-900 dark:text-emerald-300', description: 'Formation immersive avec slides, audio, animations et sous-titres' },
    ]
  },
  {
    name: 'Contenu principal',
    description: 'Les formats de base pour presenter votre contenu',
    types: [
      { value: 'VIDEO', label: 'Video', icon: Video, color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', description: 'Integrez des videos YouTube, Vimeo ou MP4' },
      { value: 'TEXT', label: 'Texte / Article', icon: FileText, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', description: 'Redigez du contenu avec mise en forme Markdown' },
      { value: 'PDF', label: 'Document PDF', icon: File, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300', description: 'Affichez un document PDF integre' },
      { value: 'EXTERNAL_LINK', label: 'Lien externe', icon: LinkIcon, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', description: 'Redirigez vers une ressource externe' },
    ]
  },
  {
    name: 'Exercices interactifs',
    description: 'Engagez vos apprenants avec des activites pratiques',
    types: [
      { value: 'FLASHCARDS', label: 'Flashcards', icon: Layers, color: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300', description: 'Cartes memoire retournables (question/reponse)' },
      { value: 'MATCHING', label: 'Association', icon: ArrowRightLeft, color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300', description: 'Reliez les elements correspondants' },
      { value: 'DRAG_DROP', label: 'Glisser-Deposer', icon: Puzzle, color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', description: 'Classez les elements dans les bonnes categories' },
      { value: 'FILL_BLANK', label: 'Texte a trous', icon: TextCursor, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300', description: 'Completez les mots manquants dans un texte' },
      { value: 'SORTING', label: 'Classement', icon: ArrowUpDown, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300', description: 'Ordonnez les elements dans le bon ordre' },
    ]
  },
  {
    name: 'Evaluation',
    description: 'Testez les connaissances acquises',
    types: [
      { value: 'QUIZ', label: 'Quiz', icon: FileQuestion, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300', description: 'Questions a choix multiples avec notation' },
    ]
  },
]

// Flat list for backwards compatibility
const contentTypes = contentTypeCategories.flatMap(cat => cat.types)

export default function ModuleEditPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string
  const moduleId = params.moduleId as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [module, setModule] = useState<Module | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isAddingLesson, setIsAddingLesson] = useState(false)
  const [newLessonType, setNewLessonType] = useState('')
  const [newLessonTitle, setNewLessonTitle] = useState('')

  useEffect(() => {
    loadModule()
  }, [moduleId])

  async function loadModule() {
    try {
      const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}`)
      if (!response.ok) throw new Error('Erreur de chargement')
      const data = await response.json()
      setModule(data)
      setTitle(data.title)
      setDescription(data.description || '')
    } catch (error) {
      toast.error('Erreur lors du chargement du module')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  async function saveModule() {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      })
      if (!response.ok) throw new Error('Erreur')
      toast.success('Module enregistré')
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  async function addLesson() {
    if (!newLessonTitle || !newLessonType) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    try {
      const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newLessonTitle,
          contentType: newLessonType,
          order: module?.lessons.length || 0,
        }),
      })

      if (!response.ok) throw new Error('Erreur')

      const newLesson = await response.json()
      setModule(prev => prev ? {
        ...prev,
        lessons: [...prev.lessons, newLesson]
      } : null)

      setNewLessonTitle('')
      setNewLessonType('')
      setIsAddingLesson(false)
      toast.success('Leçon ajoutée')

      // Redirect to lesson editor
      router.push(`/dashboard/courses/${courseId}/modules/${moduleId}/lessons/${newLesson.id}`)
    } catch (error) {
      toast.error('Erreur lors de l\'ajout')
      console.error(error)
    }
  }

  async function deleteLesson(lessonId: string) {
    if (!confirm('Supprimer cette leçon ?')) return

    try {
      const response = await fetch(
        `/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
        { method: 'DELETE' }
      )
      if (!response.ok) throw new Error('Erreur')

      setModule(prev => prev ? {
        ...prev,
        lessons: prev.lessons.filter(l => l.id !== lessonId)
      } : null)
      toast.success('Leçon supprimée')
    } catch (error) {
      toast.error('Erreur lors de la suppression')
      console.error(error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!module) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Module non trouvé</p>
        <Button asChild className="mt-4">
          <Link href={`/dashboard/courses/${courseId}/edit`}>Retour au cours</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/courses/${courseId}/edit`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Éditer le module</h1>
            <p className="text-muted-foreground text-sm">
              Ajoutez des leçons et du contenu interactif
            </p>
          </div>
        </div>
        <Button onClick={saveModule} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Enregistrer
        </Button>
      </div>

      {/* Module Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du module</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Titre du module</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Introduction aux concepts de base"
            />
          </div>
          <div>
            <Label>Description (optionnel)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez le contenu de ce module..."
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lessons */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Leçons ({module.lessons.length})</CardTitle>
          <Dialog open={isAddingLesson} onOpenChange={setIsAddingLesson}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une leçon
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nouvelle lecon</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <Label>Titre de la lecon</Label>
                  <Input
                    value={newLessonTitle}
                    onChange={(e) => setNewLessonTitle(e.target.value)}
                    placeholder="Ex: Les fondamentaux de la securite"
                    className="mt-1.5"
                  />
                </div>

                <div className="space-y-6">
                  <Label>Type de contenu</Label>
                  {contentTypeCategories.map((category) => (
                    <div key={category.name} className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm">{category.name}</h4>
                        <p className="text-xs text-muted-foreground">{category.description}</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {category.types.map((type) => {
                          const Icon = type.icon
                          const isSelected = newLessonType === type.value
                          return (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() => setNewLessonType(type.value)}
                              className={`p-4 rounded-xl border-2 transition-all text-left group ${
                                isSelected
                                  ? 'border-primary bg-primary/5 shadow-md'
                                  : 'border-muted hover:border-muted-foreground/50 hover:shadow-sm'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`p-2.5 rounded-lg ${type.color} shrink-0`}>
                                  <Icon className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                  <p className={`font-medium text-sm ${isSelected ? 'text-primary' : ''}`}>
                                    {type.label}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                    {type.description}
                                  </p>
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsAddingLesson(false)}>
                    Annuler
                  </Button>
                  <Button onClick={addLesson} disabled={!newLessonTitle || !newLessonType}>
                    Creer la lecon
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {module.lessons.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune leçon dans ce module</p>
              <p className="text-sm">Cliquez sur &quot;Ajouter une leçon&quot; pour commencer</p>
            </div>
          ) : (
            <div className="space-y-2">
              {module.lessons
                .sort((a, b) => a.order - b.order)
                .map((lesson, index) => {
                  const typeInfo = contentTypes.find(t => t.value === lesson.contentType)
                  const Icon = typeInfo?.icon || FileText

                  return (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                      <div className={`p-2 rounded-lg ${typeInfo?.color || 'bg-gray-100'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{lesson.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {typeInfo?.label || lesson.contentType}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <Link href={`/dashboard/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <Link href={`/dashboard/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}/preview`}>
                            <Play className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteLesson(lesson.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
