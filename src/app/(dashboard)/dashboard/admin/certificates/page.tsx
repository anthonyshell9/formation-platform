'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FileCheck,
  Plus,
  Pencil,
  Trash2,
  BookOpen,
  CheckCircle2,
  Loader2,
  Eye,
} from 'lucide-react'

interface Course {
  id: string
  title: string
  status: string
}

interface CertificateTemplate {
  id: string
  courseId: string
  enabled: boolean
  title: string
  description: string | null
  signatoryName: string | null
  signatoryTitle: string | null
  signatureUrl: string | null
  logoUrl: string | null
  backgroundColor: string
  textColor: string
  borderColor: string
  validityMonths: number | null
  minScore: number
  requireAllLessons: boolean
  createdAt: string
  course: Course
}

export default function AdminCertificatesPage() {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<CertificateTemplate | null>(null)
  const [saving, setSaving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    courseId: '',
    title: '',
    description: '',
    signatoryName: '',
    signatoryTitle: '',
    signatureUrl: '',
    logoUrl: '',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    borderColor: '#d4af37',
    validityMonths: '',
    minScore: 70,
    requireAllLessons: true,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [templatesRes, coursesRes] = await Promise.all([
        fetch('/api/admin/certificates'),
        fetch('/api/courses'),
      ])

      if (templatesRes.ok) {
        const data = await templatesRes.json()
        setTemplates(data)
      }

      if (coursesRes.ok) {
        const data = await coursesRes.json()
        setCourses(data.courses || data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      courseId: '',
      title: '',
      description: '',
      signatoryName: '',
      signatoryTitle: '',
      signatureUrl: '',
      logoUrl: '',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      borderColor: '#d4af37',
      validityMonths: '',
      minScore: 70,
      requireAllLessons: true,
    })
    setEditingTemplate(null)
  }

  const openEditDialog = (template: CertificateTemplate) => {
    setEditingTemplate(template)
    setFormData({
      courseId: template.courseId,
      title: template.title,
      description: template.description || '',
      signatoryName: template.signatoryName || '',
      signatoryTitle: template.signatoryTitle || '',
      signatureUrl: template.signatureUrl || '',
      logoUrl: template.logoUrl || '',
      backgroundColor: template.backgroundColor,
      textColor: template.textColor,
      borderColor: template.borderColor,
      validityMonths: template.validityMonths?.toString() || '',
      minScore: template.minScore,
      requireAllLessons: template.requireAllLessons,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingTemplate
        ? `/api/admin/certificates/${editingTemplate.id}`
        : '/api/admin/certificates'
      const method = editingTemplate ? 'PATCH' : 'POST'

      const payload = {
        ...formData,
        validityMonths: formData.validityMonths ? parseInt(formData.validityMonths) : null,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        await fetchData()
        setDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error('Error saving template:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (templateId: string) => {
    if (!confirm('Supprimer ce modèle de certificat ? Cette action est irréversible.')) return

    try {
      const res = await fetch(`/api/admin/certificates/${templateId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Error deleting template:', error)
    }
  }

  const toggleEnabled = async (template: CertificateTemplate) => {
    try {
      const res = await fetch(`/api/admin/certificates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !template.enabled }),
      })
      if (res.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Error toggling template:', error)
    }
  }

  // Get courses without templates
  const availableCourses = courses.filter(
    c => !templates.some(t => t.courseId === c.id)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Modèles de Certificats</h1>
          <p className="text-muted-foreground">
            Configurez les certificats délivrés à la fin des formations
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button disabled={availableCourses.length === 0 && !editingTemplate}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Modèle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Modifier le modèle' : 'Créer un modèle de certificat'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Course Selection */}
              {!editingTemplate && (
                <div>
                  <Label htmlFor="courseId">Formation</Label>
                  <Select
                    value={formData.courseId}
                    onValueChange={(value) => {
                      const course = courses.find(c => c.id === value)
                      setFormData({
                        ...formData,
                        courseId: value,
                        title: course ? `Certificat de réussite - ${course.title}` : '',
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une formation" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCourses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Title */}
              <div>
                <Label htmlFor="title">Titre du certificat</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Certificat de réussite"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description (optionnel)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ce certificat atteste que..."
                  rows={2}
                />
              </div>

              {/* Signatory */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="signatoryName">Nom du signataire</Label>
                  <Input
                    id="signatoryName"
                    value={formData.signatoryName}
                    onChange={(e) => setFormData({ ...formData, signatoryName: e.target.value })}
                    placeholder="Jean Dupont"
                  />
                </div>
                <div>
                  <Label htmlFor="signatoryTitle">Titre du signataire</Label>
                  <Input
                    id="signatoryTitle"
                    value={formData.signatoryTitle}
                    onChange={(e) => setFormData({ ...formData, signatoryTitle: e.target.value })}
                    placeholder="Directeur de la Formation"
                  />
                </div>
              </div>

              {/* URLs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="logoUrl">URL du logo</Label>
                  <Input
                    id="logoUrl"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label htmlFor="signatureUrl">URL de la signature</Label>
                  <Input
                    id="signatureUrl"
                    value={formData.signatureUrl}
                    onChange={(e) => setFormData({ ...formData, signatureUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="backgroundColor">Fond</Label>
                  <div className="flex gap-2">
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={formData.backgroundColor}
                      onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={formData.backgroundColor}
                      onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="textColor">Texte</Label>
                  <div className="flex gap-2">
                    <Input
                      id="textColor"
                      type="color"
                      value={formData.textColor}
                      onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={formData.textColor}
                      onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="borderColor">Bordure</Label>
                  <div className="flex gap-2">
                    <Input
                      id="borderColor"
                      type="color"
                      value={formData.borderColor}
                      onChange={(e) => setFormData({ ...formData, borderColor: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={formData.borderColor}
                      onChange={(e) => setFormData({ ...formData, borderColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minScore">Score minimum (%)</Label>
                  <Input
                    id="minScore"
                    type="number"
                    value={formData.minScore}
                    onChange={(e) => setFormData({ ...formData, minScore: parseInt(e.target.value) || 0 })}
                    min={0}
                    max={100}
                  />
                </div>
                <div>
                  <Label htmlFor="validityMonths">Validité (mois)</Label>
                  <Input
                    id="validityMonths"
                    type="number"
                    value={formData.validityMonths}
                    onChange={(e) => setFormData({ ...formData, validityMonths: e.target.value })}
                    placeholder="Illimité"
                    min={1}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="requireAllLessons"
                  checked={formData.requireAllLessons}
                  onCheckedChange={(checked) => setFormData({ ...formData, requireAllLessons: checked })}
                />
                <Label htmlFor="requireAllLessons">
                  Toutes les leçons doivent être complétées
                </Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingTemplate ? 'Enregistrer' : 'Créer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <FileCheck className="h-10 w-10 text-primary" />
            <div>
              <p className="text-2xl font-bold">{templates.length}</p>
              <p className="text-sm text-muted-foreground">Modèles créés</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
            <div>
              <p className="text-2xl font-bold">
                {templates.filter(t => t.enabled).length}
              </p>
              <p className="text-sm text-muted-foreground">Modèles actifs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <BookOpen className="h-10 w-10 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{courses.length}</p>
              <p className="text-sm text-muted-foreground">Formations totales</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Modèles de certificats</CardTitle>
          <CardDescription>
            Configuration des certificats par formation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun modèle de certificat</p>
              <p className="text-sm">Créez un modèle pour délivrer des certificats automatiquement</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Formation</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead className="text-center">Score min.</TableHead>
                  <TableHead className="text-center">Validité</TableHead>
                  <TableHead className="text-center">Actif</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{template.course.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>{template.title}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{template.minScore}%</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {template.validityMonths
                        ? `${template.validityMonths} mois`
                        : 'Illimité'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={template.enabled}
                        onCheckedChange={() => toggleEnabled(template)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingTemplate(template)
                            setPreviewOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(template)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Aperçu du certificat</DialogTitle>
          </DialogHeader>
          {editingTemplate && (
            <div
              className="aspect-[1.414/1] border-8 p-8 flex flex-col items-center justify-center text-center relative"
              style={{
                backgroundColor: editingTemplate.backgroundColor,
                color: editingTemplate.textColor,
                borderColor: editingTemplate.borderColor,
              }}
            >
              {editingTemplate.logoUrl && (
                <div className="absolute top-4 left-4 w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs">
                  Logo
                </div>
              )}
              <h2 className="text-2xl font-bold mb-4">{editingTemplate.title}</h2>
              <p className="mb-6">Ce certificat est décerné à</p>
              <p className="text-3xl font-bold mb-6">[Nom de l&apos;apprenant]</p>
              <p className="mb-4">
                Pour avoir complété avec succès la formation
              </p>
              <p className="text-xl font-semibold mb-8">
                {editingTemplate.course.title}
              </p>
              {editingTemplate.description && (
                <p className="text-sm mb-6">{editingTemplate.description}</p>
              )}
              <div className="mt-auto">
                <p className="text-sm">Délivré le [Date]</p>
                {editingTemplate.signatoryName && (
                  <div className="mt-4">
                    <div className="border-t border-current w-40 mx-auto pt-2">
                      <p className="font-semibold">{editingTemplate.signatoryName}</p>
                      {editingTemplate.signatoryTitle && (
                        <p className="text-sm">{editingTemplate.signatoryTitle}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
