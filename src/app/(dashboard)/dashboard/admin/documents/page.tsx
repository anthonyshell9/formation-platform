'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileText,
  Search,
  Download,
  CheckCircle2,
  Clock,
  Users,
  FileCheck,
  Plus,
  Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'

interface DocumentAck {
  id: string
  acknowledgedAt: string
  ipAddress: string | null
  signatureHash: string | null
  user: {
    id: string
    name: string | null
    email: string
  }
  lesson: {
    id: string
    title: string
    module: {
      title: string
      course: {
        id: string
        title: string
      }
    }
  }
}

interface DocumentLesson {
  id: string
  title: string
  description: string | null
  requiresAck: boolean
  videoUrl: string | null
  module: {
    id: string
    title: string
    course: {
      id: string
      title: string
    }
  }
  _count: {
    acknowledgments: number
  }
}

interface Course {
  id: string
  title: string
  modules: {
    id: string
    title: string
  }[]
}

interface Stats {
  totalDocuments: number
  totalAcknowledgments: number
  pendingAcknowledgments: number
}

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentLesson[]>([])
  const [acknowledgments, setAcknowledgments] = useState<DocumentAck[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [stats, setStats] = useState<Stats>({
    totalDocuments: 0,
    totalAcknowledgments: 0,
    pendingAcknowledgments: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [courseFilter, setCourseFilter] = useState('ALL')
  const [view, setView] = useState<'documents' | 'acknowledgments'>('documents')

  // Create document state
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newDocument, setNewDocument] = useState({
    title: '',
    description: '',
    courseId: '',
    moduleId: '',
    requiresAck: true,
    fileUrl: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [docsRes, acksRes, coursesRes] = await Promise.all([
        fetch('/api/admin/documents'),
        fetch('/api/admin/documents/acknowledgments'),
        fetch('/api/courses'),
      ])

      if (docsRes.ok) {
        const data = await docsRes.json()
        setDocuments(data.documents)
        setStats(data.stats)
      }

      if (acksRes.ok) {
        const data = await acksRes.json()
        setAcknowledgments(data.acknowledgments)
      }

      if (coursesRes.ok) {
        const data = await coursesRes.json()
        const coursesData = data.courses || data
        setCourses(coursesData.map((c: Course & { modules?: { id: string; title: string }[] }) => ({
          id: c.id,
          title: c.title,
          modules: c.modules || [],
        })))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateDocument() {
    if (!newDocument.title || !newDocument.courseId || !newDocument.moduleId) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch(
        `/api/courses/${newDocument.courseId}/modules/${newDocument.moduleId}/lessons`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newDocument.title,
            description: newDocument.description,
            contentType: 'DOCUMENT',
            videoUrl: newDocument.fileUrl || null,
            requiresAck: newDocument.requiresAck,
            order: 999,
          }),
        }
      )

      if (response.ok) {
        toast.success('Document cree avec succes')
        setCreateDialogOpen(false)
        setNewDocument({
          title: '',
          description: '',
          courseId: '',
          moduleId: '',
          requiresAck: true,
          fileUrl: '',
        })
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la creation')
      }
    } catch (error) {
      toast.error('Erreur lors de la creation')
    } finally {
      setIsCreating(false)
    }
  }

  const selectedCourse = courses.find(c => c.id === newDocument.courseId)

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.module.course.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCourse = courseFilter === 'ALL' || doc.module.course.id === courseFilter
    return matchesSearch && matchesCourse
  })

  const filteredAcks = acknowledgments.filter(ack => {
    const matchesSearch =
      ack.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ack.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ack.lesson.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCourse = courseFilter === 'ALL' || ack.lesson.module.course.id === courseFilter
    return matchesSearch && matchesCourse
  })

  // Extract unique courses from documents for filter
  const uniqueCourses = Array.from(
    new Map(
      documents.map((d) => [
        d.module.course.id,
        { id: d.module.course.id, title: d.module.course.title },
      ])
    ).values()
  )

  function exportToCSV() {
    const headers = ['Date', 'Utilisateur', 'Email', 'Document', 'Formation', 'IP', 'Signature Hash']
    const rows = acknowledgments.map(ack => [
      format(new Date(ack.acknowledgedAt), 'dd/MM/yyyy HH:mm:ss'),
      ack.user.name || '',
      ack.user.email,
      ack.lesson.title,
      ack.lesson.module.course.title,
      ack.ipAddress || '',
      ack.signatureHash || '',
    ])

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `audit-documents-${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground">
            Gestion des documents et suivi des prises en compte
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exporter audit
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau document
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDocuments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Signatures</CardTitle>
            <FileCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalAcknowledgments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingAcknowledgments}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex gap-2">
              <Button
                variant={view === 'documents' ? 'default' : 'outline'}
                onClick={() => setView('documents')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Documents
              </Button>
              <Button
                variant={view === 'acknowledgments' ? 'default' : 'outline'}
                onClick={() => setView('acknowledgments')}
              >
                <Users className="h-4 w-4 mr-2" />
                Signatures
              </Button>
            </div>
            <div className="flex-1 flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Formation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Toutes les formations</SelectItem>
                  {uniqueCourses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {view === 'documents' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Formation</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Signatures</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Aucun document</p>
                      <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Creer un document
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments.map(doc => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{doc.title}</p>
                          {doc.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{doc.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{doc.module.course.title}</TableCell>
                      <TableCell>{doc.module.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {doc._count.acknowledgments} signature(s)
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {doc.requiresAck ? (
                          <Badge className="bg-blue-500">Signature requise</Badge>
                        ) : (
                          <Badge variant="secondary">Information</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Formation</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAcks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Aucune signature</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAcks.map(ack => (
                    <TableRow key={ack.id}>
                      <TableCell>
                        {format(new Date(ack.acknowledgedAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{ack.user.name || '-'}</p>
                          <p className="text-sm text-muted-foreground">{ack.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{ack.lesson.title}</TableCell>
                      <TableCell>
                        <p className="text-sm">{ack.lesson.module.course.title}</p>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">{ack.ipAddress || '-'}</code>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs truncate max-w-[100px] block" title={ack.signatureHash || ''}>
                          {ack.signatureHash?.substring(0, 12)}...
                        </code>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Document Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau document</DialogTitle>
            <DialogDescription>
              Creez un document qui sera affiche aux apprenants pour prise en compte.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Titre *</Label>
              <Input
                value={newDocument.title}
                onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                placeholder="Politique de securite informatique"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={newDocument.description}
                onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                placeholder="Description du document..."
                rows={3}
              />
            </div>

            <div>
              <Label>Formation *</Label>
              <Select
                value={newDocument.courseId}
                onValueChange={(v) => setNewDocument({ ...newDocument, courseId: v, moduleId: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner une formation" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCourse && selectedCourse.modules.length > 0 && (
              <div>
                <Label>Module *</Label>
                <Select
                  value={newDocument.moduleId}
                  onValueChange={(v) => setNewDocument({ ...newDocument, moduleId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner un module" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCourse.modules.map(module => (
                      <SelectItem key={module.id} value={module.id}>
                        {module.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedCourse && selectedCourse.modules.length === 0 && (
              <p className="text-sm text-yellow-600">
                Cette formation n&apos;a pas encore de modules. Creez d&apos;abord un module dans la formation.
              </p>
            )}

            <div>
              <Label>URL du fichier (PDF, etc.)</Label>
              <Input
                value={newDocument.fileUrl}
                onChange={(e) => setNewDocument({ ...newDocument, fileUrl: e.target.value })}
                placeholder="https://example.com/document.pdf"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Lien vers le fichier a telecharger
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="requiresAck"
                checked={newDocument.requiresAck}
                onCheckedChange={(checked) =>
                  setNewDocument({ ...newDocument, requiresAck: checked === true })
                }
              />
              <Label htmlFor="requiresAck" className="font-normal">
                Signature requise (pour audit)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreateDocument}
              disabled={isCreating || !newDocument.title || !newDocument.courseId || !newDocument.moduleId}
            >
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Creer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
