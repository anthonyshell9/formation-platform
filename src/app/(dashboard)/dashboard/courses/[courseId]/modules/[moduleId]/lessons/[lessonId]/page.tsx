'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Loader2,
  Save,
  Plus,
  Trash2,
  Video,
  GripVertical,
  Image as ImageIcon,
  Eye,
  Upload,
  FileText,
  X,
  CheckCircle2,
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'

interface LessonMedia {
  id: string
  type: string
  url: string
  filename: string
}

interface Lesson {
  id: string
  title: string
  description?: string
  contentType: string
  content?: string
  videoUrl?: string
  videoDuration?: number
  moduleId: string
  media: LessonMedia[]
  module: {
    id: string
    title: string
    courseId: string
    course: { id: string; title: string }
  }
}

// Interactive content types need structured JSON content
interface DragDropItem {
  id: string
  text: string
  zone: string
}

interface DragDropZone {
  id: string
  label: string
}

interface MatchingPair {
  id: string
  left: string
  right: string
}

interface FillBlankItem {
  id: string
  text: string
  blanks: { position: number; answer: string }[]
}

interface FlashCard {
  id: string
  front: string
  back: string
}

interface SortingItem {
  id: string
  text: string
  correctOrder: number
}

export default function LessonEditorPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string
  const moduleId = params.moduleId as string
  const lessonId = params.lessonId as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [lesson, setLesson] = useState<Lesson | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [textContent, setTextContent] = useState('')

  // Interactive content state
  const [dragDropItems, setDragDropItems] = useState<DragDropItem[]>([])
  const [dragDropZones, setDragDropZones] = useState<DragDropZone[]>([])
  const [matchingPairs, setMatchingPairs] = useState<MatchingPair[]>([])
  const [fillBlankText, setFillBlankText] = useState('')
  const [fillBlankAnswers, setFillBlankAnswers] = useState<string[]>([])
  const [flashcards, setFlashcards] = useState<FlashCard[]>([])
  const [sortingItems, setSortingItems] = useState<SortingItem[]>([])

  // File upload state
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    loadLesson()
  }, [lessonId])

  async function loadLesson() {
    try {
      const response = await fetch(
        `/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`
      )
      if (!response.ok) throw new Error('Erreur de chargement')
      const data = await response.json()
      setLesson(data)
      setTitle(data.title)
      setDescription(data.description || '')
      setVideoUrl(data.videoUrl || '')

      // Extract filename from URL for PDF
      if (data.contentType === 'PDF' && data.videoUrl) {
        try {
          const url = new URL(data.videoUrl)
          const filename = decodeURIComponent(url.pathname.split('/').pop() || 'document.pdf')
          setUploadedFileName(filename)
        } catch {
          setUploadedFileName('Document PDF')
        }
      }

      // Parse content based on type
      if (data.content) {
        try {
          const parsed = JSON.parse(data.content)
          switch (data.contentType) {
            case 'TEXT':
              setTextContent(data.content)
              break
            case 'DRAG_DROP':
              setDragDropItems(parsed.items || [])
              setDragDropZones(parsed.zones || [])
              break
            case 'MATCHING':
              setMatchingPairs(parsed.pairs || [])
              break
            case 'FILL_BLANK':
              setFillBlankText(parsed.text || '')
              setFillBlankAnswers(parsed.answers || [])
              break
            case 'FLASHCARDS':
              setFlashcards(parsed.cards || [])
              break
            case 'SORTING':
              setSortingItems(parsed.items || [])
              break
            default:
              setTextContent(data.content)
          }
        } catch {
          setTextContent(data.content)
        }
      }
    } catch (error) {
      toast.error('Erreur lors du chargement')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  async function saveLesson() {
    if (!lesson) return
    setIsSaving(true)

    let content = textContent

    // Build content based on type
    switch (lesson.contentType) {
      case 'DRAG_DROP':
        content = JSON.stringify({ items: dragDropItems, zones: dragDropZones })
        break
      case 'MATCHING':
        content = JSON.stringify({ pairs: matchingPairs })
        break
      case 'FILL_BLANK':
        content = JSON.stringify({ text: fillBlankText, answers: fillBlankAnswers })
        break
      case 'FLASHCARDS':
        content = JSON.stringify({ cards: flashcards })
        break
      case 'SORTING':
        content = JSON.stringify({ items: sortingItems })
        break
    }

    try {
      const response = await fetch(
        `/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description,
            content,
            videoUrl: videoUrl || null,
          }),
        }
      )

      if (!response.ok) throw new Error('Erreur')
      toast.success('Leçon enregistrée')
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  // Helper functions for interactive content
  const addDragDropZone = () => {
    setDragDropZones([...dragDropZones, { id: crypto.randomUUID(), label: '' }])
  }

  const addDragDropItem = () => {
    setDragDropItems([...dragDropItems, { id: crypto.randomUUID(), text: '', zone: '' }])
  }

  const addMatchingPair = () => {
    setMatchingPairs([...matchingPairs, { id: crypto.randomUUID(), left: '', right: '' }])
  }

  const addFlashcard = () => {
    setFlashcards([...flashcards, { id: crypto.randomUUID(), front: '', back: '' }])
  }

  const addSortingItem = () => {
    setSortingItems([...sortingItems, {
      id: crypto.randomUUID(),
      text: '',
      correctOrder: sortingItems.length + 1
    }])
  }

  // File upload handler
  const handleFileUpload = async (file: File, type: 'documents' | 'videos' | 'images' = 'documents') => {
    if (!file) return

    // Validate file type for PDF
    if (type === 'documents' && !file.type.includes('pdf')) {
      toast.error('Seuls les fichiers PDF sont acceptes')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    // Simulate progress while uploading
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90))
    }, 200)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur upload')
      }

      const data = await response.json()
      setUploadProgress(100)
      setVideoUrl(data.url)
      setUploadedFileName(data.filename)
      toast.success('Fichier uploade avec succes')

      // Reset progress after a short delay
      setTimeout(() => {
        setUploadProgress(0)
        setIsUploading(false)
      }, 500)
    } catch (error) {
      clearInterval(progressInterval)
      setUploadProgress(0)
      setIsUploading(false)
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'upload')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent, type: 'documents' | 'videos' | 'images' = 'documents') => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileUpload(file, type)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'documents' | 'videos' | 'images' = 'documents') => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file, type)
    }
  }

  const removeUploadedFile = () => {
    setVideoUrl('')
    setUploadedFileName(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Leçon non trouvée</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/courses/${courseId}/modules/${moduleId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <p className="text-sm text-muted-foreground">
              {lesson.module.course.title} / {lesson.module.title}
            </p>
            <h1 className="text-2xl font-bold">Éditer la leçon</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/preview`}>
              <Eye className="mr-2 h-4 w-4" />
              Aperçu
            </Link>
          </Button>
          <Button onClick={saveLesson} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Titre de la leçon</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Introduction aux protocoles réseau"
            />
          </div>
          <div>
            <Label>Description (optionnel)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Une brève description de cette leçon..."
              className="min-h-[60px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Content Editor based on type */}
      <Card>
        <CardHeader>
          <CardTitle>Contenu</CardTitle>
          <CardDescription>
            Type: <span className="font-medium">{lesson.contentType}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* VIDEO */}
          {lesson.contentType === 'VIDEO' && (
            <div className="space-y-4">
              <div>
                <Label>URL de la vidéo (YouTube, Vimeo, ou lien direct)</Label>
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
              {videoUrl && (
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  {videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${extractYouTubeId(videoUrl)}`}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  ) : videoUrl.includes('vimeo.com') ? (
                    <iframe
                      src={`https://player.vimeo.com/video/${extractVimeoId(videoUrl)}`}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  ) : (
                    <video src={videoUrl} controls className="w-full h-full" />
                  )}
                </div>
              )}
              <div>
                <Label>Description / Transcription</Label>
                <Textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Ajoutez une transcription ou des notes..."
                  className="min-h-[150px]"
                />
              </div>
            </div>
          )}

          {/* TEXT */}
          {lesson.contentType === 'TEXT' && (
            <div>
              <Label>Contenu (Markdown supporté)</Label>
              <Textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="# Titre&#10;&#10;Votre contenu ici...&#10;&#10;- Point 1&#10;- Point 2"
                className="min-h-[400px] font-mono"
              />
            </div>
          )}

          {/* DRAG & DROP */}
          {lesson.contentType === 'DRAG_DROP' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Zones de dépôt</Label>
                  <Button size="sm" variant="outline" onClick={addDragDropZone}>
                    <Plus className="mr-1 h-3 w-3" />
                    Zone
                  </Button>
                </div>
                <div className="space-y-2">
                  {dragDropZones.map((zone, idx) => (
                    <div key={zone.id} className="flex gap-2">
                      <Input
                        value={zone.label}
                        onChange={(e) => {
                          const updated = [...dragDropZones]
                          updated[idx].label = e.target.value
                          setDragDropZones(updated)
                        }}
                        placeholder={`Zone ${idx + 1} (ex: Catégorie A)`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDragDropZones(dragDropZones.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Éléments à déplacer</Label>
                  <Button size="sm" variant="outline" onClick={addDragDropItem}>
                    <Plus className="mr-1 h-3 w-3" />
                    Élément
                  </Button>
                </div>
                <div className="space-y-2">
                  {dragDropItems.map((item, idx) => (
                    <div key={item.id} className="flex gap-2">
                      <Input
                        value={item.text}
                        onChange={(e) => {
                          const updated = [...dragDropItems]
                          updated[idx].text = e.target.value
                          setDragDropItems(updated)
                        }}
                        placeholder="Texte de l'élément"
                        className="flex-1"
                      />
                      <select
                        value={item.zone}
                        onChange={(e) => {
                          const updated = [...dragDropItems]
                          updated[idx].zone = e.target.value
                          setDragDropItems(updated)
                        }}
                        className="px-3 py-2 border rounded-md"
                      >
                        <option value="">Zone correcte...</option>
                        {dragDropZones.map((z) => (
                          <option key={z.id} value={z.id}>{z.label || 'Sans nom'}</option>
                        ))}
                      </select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDragDropItems(dragDropItems.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MATCHING */}
          {lesson.contentType === 'MATCHING' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Paires à associer</Label>
                <Button size="sm" variant="outline" onClick={addMatchingPair}>
                  <Plus className="mr-1 h-3 w-3" />
                  Paire
                </Button>
              </div>
              <div className="space-y-2">
                {matchingPairs.map((pair, idx) => (
                  <div key={pair.id} className="flex gap-2 items-center">
                    <Input
                      value={pair.left}
                      onChange={(e) => {
                        const updated = [...matchingPairs]
                        updated[idx].left = e.target.value
                        setMatchingPairs(updated)
                      }}
                      placeholder="Élément gauche"
                    />
                    <span className="text-muted-foreground">↔</span>
                    <Input
                      value={pair.right}
                      onChange={(e) => {
                        const updated = [...matchingPairs]
                        updated[idx].right = e.target.value
                        setMatchingPairs(updated)
                      }}
                      placeholder="Élément droit"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setMatchingPairs(matchingPairs.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FILL IN THE BLANK */}
          {lesson.contentType === 'FILL_BLANK' && (
            <div className="space-y-4">
              <div>
                <Label>Texte avec trous (utilisez [___] pour marquer les trous)</Label>
                <Textarea
                  value={fillBlankText}
                  onChange={(e) => setFillBlankText(e.target.value)}
                  placeholder="La capitale de la France est [___]. Elle est traversée par la [___]."
                  className="min-h-[150px]"
                />
              </div>
              <div>
                <Label>Réponses correctes (dans l&apos;ordre)</Label>
                <div className="space-y-2 mt-2">
                  {(fillBlankText.match(/\[___\]/g) || []).map((_, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="text-sm text-muted-foreground w-16">Trou {idx + 1}:</span>
                      <Input
                        value={fillBlankAnswers[idx] || ''}
                        onChange={(e) => {
                          const updated = [...fillBlankAnswers]
                          updated[idx] = e.target.value
                          setFillBlankAnswers(updated)
                        }}
                        placeholder="Réponse correcte"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* FLASHCARDS */}
          {lesson.contentType === 'FLASHCARDS' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Cartes mémoire</Label>
                <Button size="sm" variant="outline" onClick={addFlashcard}>
                  <Plus className="mr-1 h-3 w-3" />
                  Carte
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {flashcards.map((card, idx) => (
                  <Card key={card.id} className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => setFlashcards(flashcards.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    <CardContent className="pt-6 space-y-3">
                      <div>
                        <Label className="text-xs">Recto (question)</Label>
                        <Textarea
                          value={card.front}
                          onChange={(e) => {
                            const updated = [...flashcards]
                            updated[idx].front = e.target.value
                            setFlashcards(updated)
                          }}
                          placeholder="Question ou terme"
                          className="min-h-[60px]"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Verso (réponse)</Label>
                        <Textarea
                          value={card.back}
                          onChange={(e) => {
                            const updated = [...flashcards]
                            updated[idx].back = e.target.value
                            setFlashcards(updated)
                          }}
                          placeholder="Réponse ou définition"
                          className="min-h-[60px]"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* SORTING */}
          {lesson.contentType === 'SORTING' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Éléments à classer (dans l&apos;ordre correct)</Label>
                <Button size="sm" variant="outline" onClick={addSortingItem}>
                  <Plus className="mr-1 h-3 w-3" />
                  Élément
                </Button>
              </div>
              <div className="space-y-2">
                {sortingItems
                  .sort((a, b) => a.correctOrder - b.correctOrder)
                  .map((item, idx) => (
                    <div key={item.id} className="flex gap-2 items-center">
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground w-8">{idx + 1}.</span>
                      <Input
                        value={item.text}
                        onChange={(e) => {
                          const updated = [...sortingItems]
                          const index = updated.findIndex(i => i.id === item.id)
                          updated[index].text = e.target.value
                          setSortingItems(updated)
                        }}
                        placeholder="Élément à classer"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSortingItems(sortingItems.filter(i => i.id !== item.id))}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                L&apos;ordre ci-dessus est l&apos;ordre correct. Les éléments seront mélangés lors de l&apos;exercice.
              </p>
            </div>
          )}

          {/* PDF */}
          {lesson.contentType === 'PDF' && (
            <div className="space-y-4">
              {/* File already uploaded */}
              {videoUrl ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-200">
                          {uploadedFileName || 'Document PDF'}
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Fichier uploade avec succes
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeUploadedFile}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                  <iframe
                    src={videoUrl}
                    className="w-full h-[500px] border rounded-lg"
                    title="Apercu PDF"
                  />
                </div>
              ) : (
                /* Upload zone */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'documents')}
                  className={`
                    relative border-2 border-dashed rounded-xl p-8 text-center transition-all
                    ${isDragging
                      ? 'border-primary bg-primary/5 scale-[1.02]'
                      : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                    }
                    ${isUploading ? 'pointer-events-none opacity-75' : 'cursor-pointer'}
                  `}
                >
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => handleFileSelect(e, 'documents')}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploading}
                  />

                  {isUploading ? (
                    <div className="space-y-4">
                      <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
                      <div className="max-w-xs mx-auto">
                        <Progress value={uploadProgress} className="h-2" />
                        <p className="text-sm text-muted-foreground mt-2">
                          Upload en cours... {uploadProgress}%
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <Upload className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <p className="text-lg font-medium">
                          Glissez votre PDF ici
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          ou cliquez pour selectionner un fichier
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>Format accepte: PDF (max 500 MB)</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Alternative: URL input */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    ou entrez une URL
                  </span>
                </div>
              </div>
              <Input
                value={videoUrl}
                onChange={(e) => {
                  setVideoUrl(e.target.value)
                  setUploadedFileName(null)
                }}
                placeholder="https://example.com/document.pdf"
                disabled={isUploading}
              />
            </div>
          )}

          {/* EXTERNAL LINK */}
          {lesson.contentType === 'EXTERNAL_LINK' && (
            <div className="space-y-4">
              <div>
                <Label>URL externe</Label>
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://example.com/ressource"
                />
              </div>
              <div>
                <Label>Instructions (optionnel)</Label>
                <Textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Décrivez ce que l'apprenant doit faire sur ce lien..."
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}

          {/* HOTSPOT - simplified version */}
          {lesson.contentType === 'HOTSPOT' && (
            <div className="space-y-4">
              <div>
                <Label>URL de l&apos;image</Label>
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <Label>Configuration des zones (JSON)</Label>
                <Textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder='[{"x": 10, "y": 20, "width": 100, "height": 50, "label": "Zone 1"}]'
                  className="min-h-[150px] font-mono"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Helper functions
function extractYouTubeId(url: string): string {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : ''
}

function extractVimeoId(url: string): string {
  const match = url.match(/vimeo\.com\/(\d+)/)
  return match ? match[1] : ''
}
