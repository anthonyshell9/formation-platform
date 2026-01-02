'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Plus, Trash2, GripVertical, Save, Award, FileCheck, X } from 'lucide-react'
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

interface BadgeOption {
  id: string
  name: string
  description: string | null
  imageUrl: string
  points: number
  category: string | null
}

interface CourseBadge {
  id: string
  badgeId: string
  trigger: string
  minScore: number | null
  badge: BadgeOption
}

interface CertificateTemplate {
  id: string
  courseId: string
  enabled: boolean
  title: string
  description: string | null
  signatoryName: string | null
  signatoryTitle: string | null
  minScore: number
  requireAllLessons: boolean
}

const BADGE_TRIGGERS = [
  { value: 'COURSE_COMPLETION', label: 'Complétion du cours' },
  { value: 'QUIZ_PASS', label: 'Réussite du quiz (score minimum)' },
  { value: 'PERFECT_QUIZ', label: 'Score parfait au quiz (100%)' },
]

export default function EditCoursePage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [course, setCourse] = useState<Course | null>(null)
  const [modules, setModules] = useState<ModuleInput[]>([])

  // Badges & Certificates
  const [allBadges, setAllBadges] = useState<BadgeOption[]>([])
  const [courseBadges, setCourseBadges] = useState<CourseBadge[]>([])
  const [certificateTemplate, setCertificateTemplate] = useState<CertificateTemplate | null>(null)
  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false)
  const [selectedBadgeId, setSelectedBadgeId] = useState('')
  const [selectedTrigger, setSelectedTrigger] = useState('COURSE_COMPLETION')
  const [minScore, setMinScore] = useState(70)

  // Certificate form
  const [certEnabled, setCertEnabled] = useState(false)
  const [certTitle, setCertTitle] = useState('')
  const [certSignatoryName, setCertSignatoryName] = useState('')
  const [certSignatoryTitle, setCertSignatoryTitle] = useState('')
  const [certMinScore, setCertMinScore] = useState(70)
  const [certRequireAllLessons, setCertRequireAllLessons] = useState(true)
  const [savingCert, setSavingCert] = useState(false)

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
        // Load course, badges, and certificate template in parallel
        const [courseRes, badgesRes, courseBadgesRes] = await Promise.all([
          fetch(`/api/courses/${courseId}`),
          fetch('/api/admin/badges'),
          fetch(`/api/courses/${courseId}/badges`),
        ])

        if (!courseRes.ok) throw new Error('Erreur de chargement')

        const data = await courseRes.json()
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

        // Load badges
        if (badgesRes.ok) {
          const badges = await badgesRes.json()
          setAllBadges(badges.filter((b: BadgeOption & { isActive?: boolean }) => b.isActive !== false))
        }

        // Load course badges
        if (courseBadgesRes.ok) {
          const cBadges = await courseBadgesRes.json()
          setCourseBadges(cBadges)
        }

        // Load certificate template
        const certRes = await fetch(`/api/courses/${courseId}/certificate`)
        if (certRes.ok) {
          const cert = await certRes.json()
          if (cert) {
            setCertificateTemplate(cert)
            setCertEnabled(cert.enabled)
            setCertTitle(cert.title || '')
            setCertSignatoryName(cert.signatoryName || '')
            setCertSignatoryTitle(cert.signatoryTitle || '')
            setCertMinScore(cert.minScore || 70)
            setCertRequireAllLessons(cert.requireAllLessons ?? true)
          }
        }
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

  // Badge functions
  const addBadgeToCourse = async () => {
    if (!selectedBadgeId) return

    try {
      const res = await fetch(`/api/courses/${courseId}/badges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          badgeId: selectedBadgeId,
          trigger: selectedTrigger,
          minScore: selectedTrigger === 'QUIZ_PASS' ? minScore : null,
        }),
      })

      if (res.ok) {
        const newCourseBadge = await res.json()
        setCourseBadges([...courseBadges, newCourseBadge])
        setBadgeDialogOpen(false)
        setSelectedBadgeId('')
        setSelectedTrigger('COURSE_COMPLETION')
        setMinScore(70)
        toast.success('Badge ajouté à la formation')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Erreur')
      }
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors de l\'ajout du badge')
    }
  }

  const removeBadgeFromCourse = async (badgeId: string) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/badges?badgeId=${badgeId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setCourseBadges(courseBadges.filter(cb => cb.badgeId !== badgeId))
        toast.success('Badge retiré')
      }
    } catch (error) {
      console.error(error)
      toast.error('Erreur')
    }
  }

  // Certificate functions
  const saveCertificateTemplate = async () => {
    setSavingCert(true)
    try {
      const payload = {
        courseId,
        enabled: certEnabled,
        title: certTitle || `Certificat de réussite - ${course?.title}`,
        signatoryName: certSignatoryName,
        signatoryTitle: certSignatoryTitle,
        minScore: certMinScore,
        requireAllLessons: certRequireAllLessons,
      }

      const url = certificateTemplate
        ? `/api/admin/certificates/${certificateTemplate.id}`
        : '/api/admin/certificates'
      const method = certificateTemplate ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const data = await res.json()
        setCertificateTemplate(data)
        toast.success('Configuration du certificat enregistrée')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Erreur')
      }
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSavingCert(false)
    }
  }

  // Get badges not yet added to this course
  const availableBadges = allBadges.filter(
    badge => !courseBadges.some(cb => cb.badgeId === badge.id)
  )

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

      {/* Badges */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Badges
            </CardTitle>
            <CardDescription>
              Attribuez des badges aux apprenants qui terminent cette formation
            </CardDescription>
          </div>
          <Dialog open={badgeDialogOpen} onOpenChange={setBadgeDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={availableBadges.length === 0}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un badge
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un badge à la formation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Badge</Label>
                  <Select value={selectedBadgeId} onValueChange={setSelectedBadgeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un badge" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBadges.map((badge) => (
                        <SelectItem key={badge.id} value={badge.id}>
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            <span>{badge.name}</span>
                            <Badge variant="secondary" className="ml-2">{badge.points} pts</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Condition d&apos;obtention</Label>
                  <Select value={selectedTrigger} onValueChange={setSelectedTrigger}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BADGE_TRIGGERS.map((trigger) => (
                        <SelectItem key={trigger.value} value={trigger.value}>
                          {trigger.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTrigger === 'QUIZ_PASS' && (
                  <div>
                    <Label>Score minimum (%)</Label>
                    <Input
                      type="number"
                      value={minScore}
                      onChange={(e) => setMinScore(parseInt(e.target.value) || 0)}
                      min={0}
                      max={100}
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setBadgeDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={addBadgeToCourse} disabled={!selectedBadgeId}>
                    Ajouter
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {courseBadges.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun badge configuré</p>
              <p className="text-sm">Les apprenants ne recevront pas de badge pour cette formation</p>
            </div>
          ) : (
            <div className="space-y-3">
              {courseBadges.map((cb) => (
                <div
                  key={cb.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <Award className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium">{cb.badge.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {BADGE_TRIGGERS.find(t => t.value === cb.trigger)?.label}
                        {cb.minScore && ` (${cb.minScore}%)`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{cb.badge.points} pts</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeBadgeFromCourse(cb.badgeId)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Certificat */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Certificat
              </CardTitle>
              <CardDescription>
                Délivrez un certificat aux apprenants qui terminent avec succès
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="cert-enabled">Activer le certificat</Label>
              <Switch
                id="cert-enabled"
                checked={certEnabled}
                onCheckedChange={setCertEnabled}
              />
            </div>
          </div>
        </CardHeader>
        {certEnabled && (
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cert-title">Titre du certificat</Label>
              <Input
                id="cert-title"
                value={certTitle}
                onChange={(e) => setCertTitle(e.target.value)}
                placeholder={`Certificat de réussite - ${course?.title}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cert-signatory">Nom du signataire</Label>
                <Input
                  id="cert-signatory"
                  value={certSignatoryName}
                  onChange={(e) => setCertSignatoryName(e.target.value)}
                  placeholder="Jean Dupont"
                />
              </div>
              <div>
                <Label htmlFor="cert-signatory-title">Titre du signataire</Label>
                <Input
                  id="cert-signatory-title"
                  value={certSignatoryTitle}
                  onChange={(e) => setCertSignatoryTitle(e.target.value)}
                  placeholder="Directeur de la Formation"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cert-min-score">Score minimum requis (%)</Label>
                <Input
                  id="cert-min-score"
                  type="number"
                  value={certMinScore}
                  onChange={(e) => setCertMinScore(parseInt(e.target.value) || 0)}
                  min={0}
                  max={100}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  id="cert-all-lessons"
                  checked={certRequireAllLessons}
                  onCheckedChange={setCertRequireAllLessons}
                />
                <Label htmlFor="cert-all-lessons">
                  Toutes les leçons doivent être complétées
                </Label>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={saveCertificateTemplate} disabled={savingCert}>
                {savingCert && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer le certificat
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" asChild>
          <Link href={`/dashboard/courses/${courseId}`}>Voir la formation</Link>
        </Button>
      </div>
    </div>
  )
}
