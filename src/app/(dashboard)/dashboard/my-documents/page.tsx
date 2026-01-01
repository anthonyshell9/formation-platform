'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import {
  FileCheck,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'

interface Document {
  id: string
  title: string
  description: string | null
  contentUrl: string | null
  chapterTitle: string
  courseTitle: string
  courseId: string
  requiresAck: boolean
  isAcknowledged: boolean
  acknowledgedAt: string | null
  createdAt: string
}

interface Stats {
  total: number
  acknowledged: number
  pending: number
}

export default function MyDocumentsPage() {
  const t = useTranslations('common')
  const [documents, setDocuments] = useState<Document[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, acknowledged: 0, pending: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [isAckDialogOpen, setIsAckDialogOpen] = useState(false)
  const [hasRead, setHasRead] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchDocuments()
  }, [])

  async function fetchDocuments() {
    try {
      const response = await fetch('/api/documents/acknowledgments')
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
      toast.error('Erreur lors du chargement des documents')
    } finally {
      setLoading(false)
    }
  }

  async function handleAcknowledge() {
    if (!selectedDoc || !hasRead) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/documents/acknowledgments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: selectedDoc.id }),
      })

      if (response.ok) {
        toast.success('Document pris en compte avec succes')
        setIsAckDialogOpen(false)
        setSelectedDoc(null)
        setHasRead(false)
        fetchDocuments()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la signature')
      }
    } catch (error) {
      toast.error('Erreur lors de la signature')
    } finally {
      setIsSubmitting(false)
    }
  }

  const pendingDocs = documents.filter(d => d.requiresAck && !d.isAcknowledged)
  const acknowledgedDocs = documents.filter(d => d.isAcknowledged)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mes Documents</h1>
        <p className="text-muted-foreground">
          Documents a consulter et prendre en compte
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pris en compte</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.acknowledged}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Documents Alert */}
      {pendingDocs.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertCircle className="h-5 w-5" />
              Documents en attente de prise en compte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700 dark:text-yellow-300 mb-4">
              Vous avez {pendingDocs.length} document(s) a consulter et signer.
            </p>
            <div className="space-y-2">
              {pendingDocs.map(doc => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{doc.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {doc.courseTitle} - {doc.chapterTitle}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedDoc(doc)
                      setIsAckDialogOpen(true)
                    }}
                  >
                    <FileCheck className="h-4 w-4 mr-2" />
                    Consulter et signer
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tous les documents</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Formation</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date signature</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    {t('loading')}
                  </TableCell>
                </TableRow>
              ) : documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Aucun document disponible</p>
                  </TableCell>
                </TableRow>
              ) : (
                documents.map(doc => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{doc.title}</p>
                        {doc.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {doc.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{doc.courseTitle}</p>
                        <p className="text-xs text-muted-foreground">{doc.chapterTitle}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {doc.isAcknowledged ? (
                        <Badge className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Signe
                        </Badge>
                      ) : doc.requiresAck ? (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          <Clock className="h-3 w-3 mr-1" />
                          En attente
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Information</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {doc.acknowledgedAt ? (
                        format(new Date(doc.acknowledgedAt), 'dd/MM/yyyy HH:mm', { locale: fr })
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {doc.contentUrl && (
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <a href={doc.contentUrl} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {!doc.isAcknowledged && doc.requiresAck && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedDoc(doc)
                              setIsAckDialogOpen(true)
                            }}
                          >
                            Signer
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Acknowledgment Dialog */}
      <Dialog open={isAckDialogOpen} onOpenChange={setIsAckDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Prise en compte du document</DialogTitle>
            <DialogDescription>
              Veuillez consulter le document ci-dessous et confirmer votre prise en compte.
            </DialogDescription>
          </DialogHeader>

          {selectedDoc && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">{selectedDoc.title}</h3>
                {selectedDoc.description && (
                  <p className="text-sm text-muted-foreground mb-4">{selectedDoc.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <span>Formation: {selectedDoc.courseTitle}</span>
                  <span>Chapitre: {selectedDoc.chapterTitle}</span>
                </div>
              </div>

              {selectedDoc.contentUrl && (
                <div className="border rounded-lg p-4">
                  <Button variant="outline" asChild className="w-full">
                    <a href={selectedDoc.contentUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Telecharger et consulter le document
                    </a>
                  </Button>
                </div>
              )}

              <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
                <Checkbox
                  id="hasRead"
                  checked={hasRead}
                  onCheckedChange={(checked) => setHasRead(checked === true)}
                />
                <label
                  htmlFor="hasRead"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Je confirme avoir lu et pris connaissance du contenu de ce document
                </label>
              </div>

              <p className="text-xs text-muted-foreground">
                En cliquant sur &quot;Signer&quot;, vous confirmez avoir pris connaissance de ce document.
                Cette action est enregistree avec votre identifiant, l&apos;heure et l&apos;adresse IP
                a des fins d&apos;audit.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAckDialogOpen(false)
                setSelectedDoc(null)
                setHasRead(false)
              }}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleAcknowledge}
              disabled={!hasRead || isSubmitting}
            >
              <FileCheck className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Signature en cours...' : 'Signer et confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
