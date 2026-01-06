'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Loader2,
  Save,
  Video,
  FileText,
  FileQuestion,
  Puzzle,
  ArrowRightLeft,
  TextCursor,
  ArrowUpDown,
  Layers,
  Link as LinkIcon,
  File,
  Play,
  Settings,
} from 'lucide-react'
import Link from 'next/link'
import { FileUpload } from '@/components/ui/file-upload'
import { QuizEditor } from '@/components/quiz/QuizEditor'

interface Quiz {
  id: string
  title: string
  description?: string
  timeLimit?: number
  passingScore: number
  shuffleQuestions: boolean
  showCorrectAnswers: boolean
  maxAttempts?: number
  questions: {
    id: string
    type: string
    question: string
    explanation?: string
    points: number
    order: number
    options: {
      id: string
      text: string
      isCorrect: boolean
      order: number
    }[]
  }[]
}

interface Module {
  id: string
  title: string
  description?: string
  order: number
  courseId: string
  contentType?: string
  content?: string
  videoUrl?: string
  videoDuration?: number
  requiresAck?: boolean
  quiz?: Quiz
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
  const [contentType, setContentType] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [requiresAck, setRequiresAck] = useState(false)

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
      setContentType(data.contentType || null)
      setContent(data.content || '')
      setVideoUrl(data.videoUrl || '')
      setRequiresAck(data.requiresAck || false)
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
        body: JSON.stringify({
          title,
          description,
          contentType,
          content,
          videoUrl: videoUrl || null,
          requiresAck,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur de sauvegarde')
      }
      const updatedModule = await response.json()
      setModule(updatedModule)
      toast.success('Module enregistre avec succes')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  function handleFileUpload(value: string | null) {
    if (!value) return
    if (contentType === 'VIDEO') {
      setVideoUrl(value)
    } else if (contentType === 'PDF' || contentType === 'DOCUMENT') {
      setContent(value)
    }
  }

  const selectedTypeInfo = contentTypes.find(t => t.value === contentType)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!module) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Module non trouve</p>
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
            <h1 className="text-2xl font-bold">Editer le module</h1>
            <p className="text-muted-foreground">Configurez le contenu de ce module</p>
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

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Titre du module</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Introduction a la cybersecurite"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Decrivez le contenu de ce module..."
              className="mt-1.5"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>Contenu du module</CardTitle>
          <CardDescription>
            Selectionnez le type de contenu et configurez-le
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Content Type Selection */}
          <div className="space-y-4">
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
                    const isSelected = contentType === type.value
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setContentType(isSelected ? null : type.value)}
                        className={`p-3 rounded-xl border-2 transition-all text-left group ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-md'
                            : 'border-muted hover:border-muted-foreground/50 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`p-2 rounded-lg ${type.color} shrink-0`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className={`font-medium text-sm ${isSelected ? 'text-primary' : ''}`}>
                              {type.label}
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

          {/* Content Editor based on selected type */}
          {contentType && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2 mb-4">
                {selectedTypeInfo && (
                  <>
                    <div className={`p-2 rounded-lg ${selectedTypeInfo.color}`}>
                      <selectedTypeInfo.icon className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{selectedTypeInfo.label}</span>
                  </>
                )}
              </div>

              {/* Video Content */}
              {contentType === 'VIDEO' && (
                <div className="space-y-4">
                  <FileUpload
                    value={videoUrl}
                    onChange={handleFileUpload}
                    fileType="video"
                    label="Video"
                    placeholder="Televersez une video ou entrez une URL (YouTube, Vimeo, MP4)"
                    showUrlOption={true}
                  />
                </div>
              )}

              {/* PDF Content */}
              {contentType === 'PDF' && (
                <div className="space-y-4">
                  <FileUpload
                    value={content}
                    onChange={handleFileUpload}
                    fileType="document"
                    label="Document PDF"
                    placeholder="Televersez un fichier PDF"
                    accept=".pdf"
                    showUrlOption={true}
                  />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Accuse de reception requis</Label>
                      <p className="text-xs text-muted-foreground">
                        L&apos;apprenant doit confirmer avoir lu le document
                      </p>
                    </div>
                    <Switch
                      checked={requiresAck}
                      onCheckedChange={setRequiresAck}
                    />
                  </div>
                </div>
              )}

              {/* Document with acknowledgment */}
              {contentType === 'DOCUMENT' && (
                <div className="space-y-4">
                  <FileUpload
                    value={content}
                    onChange={handleFileUpload}
                    fileType="document"
                    label="Document"
                    placeholder="Televersez un document"
                    showUrlOption={true}
                  />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Accuse de reception requis</Label>
                      <p className="text-xs text-muted-foreground">
                        L&apos;apprenant doit confirmer avoir lu le document
                      </p>
                    </div>
                    <Switch
                      checked={requiresAck}
                      onCheckedChange={setRequiresAck}
                    />
                  </div>
                </div>
              )}

              {/* Text Content (Markdown) */}
              {contentType === 'TEXT' && (
                <div className="space-y-2">
                  <Label>Contenu (Markdown supporte)</Label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Redigez votre contenu ici...

# Titre
## Sous-titre

- Point 1
- Point 2

**Texte en gras** et *texte en italique*"
                    rows={15}
                    className="font-mono text-sm"
                  />
                </div>
              )}

              {/* External Link */}
              {contentType === 'EXTERNAL_LINK' && (
                <div className="space-y-2">
                  <Label>URL externe</Label>
                  <Input
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="https://exemple.com/ressource"
                    type="url"
                  />
                  <p className="text-xs text-muted-foreground">
                    L&apos;apprenant sera redirige vers ce lien
                  </p>
                </div>
              )}

              {/* Interactive Scenario */}
              {contentType === 'INTERACTIVE_SCENARIO' && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                      Creez une experience de formation immersive avec slides, animations, narration audio et sous-titres.
                    </p>
                  </div>
                  <Link href={`/dashboard/scenario-editor?moduleId=${moduleId}&courseId=${courseId}`}>
                    <Button className="w-full" size="lg">
                      <Play className="mr-2 h-5 w-5" />
                      Ouvrir l&apos;editeur de scenarios
                    </Button>
                  </Link>
                  {content && (
                    <div className="text-sm text-muted-foreground">
                      Scenario existant detecte. Cliquez pour le modifier.
                    </div>
                  )}
                </div>
              )}

              {/* Quiz Editor */}
              {contentType === 'QUIZ' && (
                <QuizEditor
                  moduleId={moduleId}
                  initialData={module?.quiz ? {
                    id: module.quiz.id,
                    title: module.quiz.title,
                    description: module.quiz.description,
                    timeLimit: module.quiz.timeLimit,
                    passingScore: module.quiz.passingScore,
                    shuffleQuestions: module.quiz.shuffleQuestions,
                    showCorrectAnswers: module.quiz.showCorrectAnswers,
                    maxAttempts: module.quiz.maxAttempts,
                    questions: module.quiz.questions.map(q => ({
                      id: q.id,
                      type: q.type as 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER',
                      question: q.question,
                      explanation: q.explanation,
                      points: q.points,
                      options: q.options.map(o => ({
                        id: o.id,
                        text: o.text,
                        isCorrect: o.isCorrect,
                      })),
                    })),
                  } : undefined}
                  onQuizCreated={() => {
                    toast.success('Quiz cree et lie au module')
                    loadModule()
                  }}
                  compact={true}
                />
              )}

              {/* Interactive exercises placeholder */}
              {['FLASHCARDS', 'MATCHING', 'DRAG_DROP', 'FILL_BLANK', 'SORTING'].includes(contentType) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>La configuration de ce type d&apos;exercice sera bientot disponible.</p>
                </div>
              )}
            </div>
          )}

          {!contentType && (
            <div className="text-center py-8 text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Selectionnez un type de contenu pour commencer</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button at bottom */}
      <div className="flex justify-end pb-8">
        <Button onClick={saveModule} disabled={isSaving} size="lg">
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Enregistrer les modifications
        </Button>
      </div>
    </div>
  )
}
