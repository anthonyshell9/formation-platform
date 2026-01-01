'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  requiresAck: boolean
  module: {
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

interface Stats {
  totalDocuments: number
  totalAcknowledgments: number
  pendingAcknowledgments: number
}

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentLesson[]>([])
  const [acknowledgments, setAcknowledgments] = useState<DocumentAck[]>([])
  const [stats, setStats] = useState<Stats>({
    totalDocuments: 0,
    totalAcknowledgments: 0,
    pendingAcknowledgments: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [courseFilter, setCourseFilter] = useState('ALL')
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([])
  const [view, setView] = useState<'documents' | 'acknowledgments'>('documents')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [docsRes, acksRes] = await Promise.all([
        fetch('/api/admin/documents'),
        fetch('/api/admin/documents/acknowledgments'),
      ])

      if (docsRes.ok) {
        const data = await docsRes.json()
        setDocuments(data.documents)
        setStats(data.stats)

        // Extract unique courses
        const uniqueCourses = Array.from(
          new Map(
            data.documents.map((d: DocumentLesson) => [
              d.module.course.id,
              { id: d.module.course.id, title: d.module.course.title },
            ])
          ).values()
        )
        setCourses(uniqueCourses as { id: string; title: string }[])
      }

      if (acksRes.ok) {
        const data = await acksRes.json()
        setAcknowledgments(data.acknowledgments)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground">
            Gestion des documents et suivi des prises en compte
          </p>
        </div>
        <Button onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Exporter audit
        </Button>
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
                  {courses.map(course => (
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
                  <TableHead>Chapitre</TableHead>
                  <TableHead>Signatures</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Aucun document
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments.map(doc => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.title}</TableCell>
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : filteredAcks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Aucune signature
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
    </div>
  )
}
