'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Plus,
  Calendar,
  BookOpen,
  Users,
  User,
  Trash2,
  Mail,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Course {
  id: string
  title: string
  status: string
}

interface Group {
  id: string
  name: string
  color: string
  _count: { members: number }
}

interface UserType {
  id: string
  name: string | null
  email: string
}

interface Assignment {
  id: string
  courseId: string
  groupId: string | null
  userId: string | null
  startDate: string
  endDate: string | null
  mandatory: boolean
  notificationSent: boolean
  course: { title: string }
  group: { name: string; color: string } | null
  user: { name: string | null; email: string } | null
}

export default function AdminAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [assignmentType, setAssignmentType] = useState<'group' | 'user'>('group')
  const [formData, setFormData] = useState({
    courseId: '',
    groupId: '',
    userId: '',
    startDate: '',
    endDate: '',
    mandatory: false,
    sendNotification: true,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [assignmentsRes, coursesRes, groupsRes, usersRes] = await Promise.all([
        fetch('/api/admin/assignments'),
        fetch('/api/courses?status=PUBLISHED'),
        fetch('/api/admin/groups'),
        fetch('/api/admin/users'),
      ])

      if (assignmentsRes.ok) setAssignments(await assignmentsRes.json())
      if (coursesRes.ok) {
        const data = await coursesRes.json()
        setCourses(data.courses || data || [])
      }
      if (groupsRes.ok) setGroups(await groupsRes.json())
      if (usersRes.ok) {
        const data = await usersRes.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.courseId || !formData.startDate) {
      toast.error('Veuillez remplir les champs obligatoires')
      return
    }

    if (assignmentType === 'group' && !formData.groupId) {
      toast.error('Veuillez selectionner un groupe')
      return
    }

    if (assignmentType === 'user' && !formData.userId) {
      toast.error('Veuillez selectionner un utilisateur')
      return
    }

    try {
      const response = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: formData.courseId,
          groupId: assignmentType === 'group' ? formData.groupId : null,
          userId: assignmentType === 'user' ? formData.userId : null,
          startDate: formData.startDate,
          endDate: formData.endDate || null,
          mandatory: formData.mandatory,
          sendNotification: formData.sendNotification,
        }),
      })

      if (response.ok) {
        toast.success('Formation planifiee avec succes')
        if (formData.sendNotification) {
          toast.info('Notifications envoyees aux utilisateurs')
        }
        setIsCreateOpen(false)
        resetForm()
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la planification')
      }
    } catch (error) {
      toast.error('Erreur lors de la planification')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette planification ?')) return

    try {
      const response = await fetch(`/api/admin/assignments/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Planification supprimee')
        fetchData()
      } else {
        toast.error('Erreur lors de la suppression')
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const resetForm = () => {
    setFormData({
      courseId: '',
      groupId: '',
      userId: '',
      startDate: '',
      endDate: '',
      mandatory: false,
      sendNotification: true,
    })
    setAssignmentType('group')
  }

  const upcomingAssignments = assignments.filter(
    a => new Date(a.startDate) > new Date()
  ).length

  const activeAssignments = assignments.filter(
    a => new Date(a.startDate) <= new Date() && (!a.endDate || new Date(a.endDate) >= new Date())
  ).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planification des formations</h1>
          <p className="text-muted-foreground">Assignez des formations aux groupes ou utilisateurs</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Planifier une formation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Planifier une formation</DialogTitle>
              <DialogDescription>
                Assignez une formation a un groupe ou un utilisateur
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Formation *</Label>
                <Select
                  value={formData.courseId}
                  onValueChange={(v) => setFormData({ ...formData, courseId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner une formation" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Assigner a</Label>
                <div className="flex gap-4 mt-2">
                  <Button
                    type="button"
                    variant={assignmentType === 'group' ? 'default' : 'outline'}
                    onClick={() => setAssignmentType('group')}
                    className="flex-1"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Groupe
                  </Button>
                  <Button
                    type="button"
                    variant={assignmentType === 'user' ? 'default' : 'outline'}
                    onClick={() => setAssignmentType('user')}
                    className="flex-1"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Utilisateur
                  </Button>
                </div>
              </div>

              {assignmentType === 'group' ? (
                <div>
                  <Label>Groupe *</Label>
                  <Select
                    value={formData.groupId}
                    onValueChange={(v) => setFormData({ ...formData, groupId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selectionner un groupe" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: group.color }}
                            />
                            {group.name} ({group._count.members} membres)
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div>
                  <Label>Utilisateur *</Label>
                  <Select
                    value={formData.userId}
                    onValueChange={(v) => setFormData({ ...formData, userId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selectionner un utilisateur" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date de debut *</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Date de fin</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mandatory"
                  checked={formData.mandatory}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, mandatory: checked as boolean })
                  }
                />
                <label htmlFor="mandatory" className="text-sm">
                  Formation obligatoire
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notification"
                  checked={formData.sendNotification}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, sendNotification: checked as boolean })
                  }
                />
                <label htmlFor="notification" className="text-sm">
                  Envoyer une notification par email
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreate}>Planifier</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total planifications</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A venir</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAssignments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <Badge className="bg-green-500">Actif</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAssignments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assignments.filter(a => a.notificationSent).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments List */}
      <Card>
        <CardHeader>
          <CardTitle>Planifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Formation</TableHead>
                  <TableHead>Assigne a</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : assignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Aucune planification
                    </TableCell>
                  </TableRow>
                ) : (
                  assignments.map((assignment) => {
                    const now = new Date()
                    const start = new Date(assignment.startDate)
                    const end = assignment.endDate ? new Date(assignment.endDate) : null
                    const isUpcoming = start > now
                    const isActive = start <= now && (!end || end >= now)
                    const isExpired = end && end < now

                    return (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{assignment.course.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {assignment.group ? (
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: assignment.group.color }}
                              />
                              <Users className="h-4 w-4" />
                              {assignment.group.name}
                            </div>
                          ) : assignment.user ? (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {assignment.user.name || assignment.user.email}
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{format(start, 'dd MMM yyyy', { locale: fr })}</p>
                            {end && (
                              <p className="text-muted-foreground">
                                au {format(end, 'dd MMM yyyy', { locale: fr })}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {isUpcoming && <Badge className="bg-blue-500">A venir</Badge>}
                          {isActive && <Badge className="bg-green-500">En cours</Badge>}
                          {isExpired && <Badge variant="secondary">Terminee</Badge>}
                          {assignment.mandatory && (
                            <Badge variant="destructive" className="ml-1">Obligatoire</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(assignment.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
