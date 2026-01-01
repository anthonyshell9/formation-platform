'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Plus,
  BookOpen,
  Users,
  Clock,
  Edit,
  Eye,
  Trash2,
  MoreVertical,
  CalendarPlus,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Course {
  id: string
  title: string
  description: string | null
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  difficulty: string | null
  duration: number | null
  modules: { id: string }[]
  _count: { enrollments: number }
  creator: { id: string; name: string | null }
}

interface Group {
  id: string
  name: string
  color: string
}

interface User {
  id: string
  name: string | null
  email: string
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)

  // Assignment form state
  const [assignType, setAssignType] = useState<'group' | 'user'>('group')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [mandatory, setMandatory] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [coursesRes, groupsRes, usersRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/admin/groups'),
        fetch('/api/admin/users'),
      ])

      if (coursesRes.ok) {
        const data = await coursesRes.json()
        setCourses(data.courses || data)
      }
      if (groupsRes.ok) {
        const data = await groupsRes.json()
        setGroups(data.groups || data)
      }
      if (usersRes.ok) {
        const data = await usersRes.json()
        setUsers(data.users || data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!selectedCourse) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/courses/${selectedCourse.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setCourses(courses.filter(c => c.id !== selectedCourse.id))
        toast.success('Formation supprimee avec succes')
        setDeleteDialogOpen(false)
        setSelectedCourse(null)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleAssign() {
    if (!selectedCourse) return
    if (!startDate) {
      toast.error('La date de debut est obligatoire')
      return
    }
    if (assignType === 'group' && !selectedGroupId) {
      toast.error('Veuillez selectionner un groupe')
      return
    }
    if (assignType === 'user' && !selectedUserId) {
      toast.error('Veuillez selectionner un utilisateur')
      return
    }

    setIsAssigning(true)
    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          groupId: assignType === 'group' ? selectedGroupId : null,
          userId: assignType === 'user' ? selectedUserId : null,
          startDate: new Date(startDate).toISOString(),
          endDate: endDate ? new Date(endDate).toISOString() : null,
          mandatory,
        }),
      })

      if (response.ok) {
        toast.success('Formation attribuee avec succes')
        setAssignDialogOpen(false)
        resetAssignForm()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de l\'attribution')
      }
    } catch (error) {
      toast.error('Erreur lors de l\'attribution')
    } finally {
      setIsAssigning(false)
    }
  }

  function resetAssignForm() {
    setSelectedCourse(null)
    setAssignType('group')
    setSelectedGroupId('')
    setSelectedUserId('')
    setStartDate('')
    setEndDate('')
    setMandatory(false)
  }

  const stats = {
    total: courses.length,
    published: courses.filter(c => c.status === 'PUBLISHED').length,
    draft: courses.filter(c => c.status === 'DRAFT').length,
    archived: courses.filter(c => c.status === 'ARCHIVED').length,
  }

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-yellow-500',
    PUBLISHED: 'bg-green-500',
    ARCHIVED: 'bg-gray-500',
  }

  const statusLabels: Record<string, string> = {
    DRAFT: 'Brouillon',
    PUBLISHED: 'Publiee',
    ARCHIVED: 'Archivee',
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
          <h1 className="text-3xl font-bold tracking-tight">Gestion des formations</h1>
          <p className="text-muted-foreground">Creez et gerez vos formations</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/admin/courses/create">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle formation
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Publiees</CardTitle>
            <Badge className="bg-green-500">Actif</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.published}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Brouillons</CardTitle>
            <Badge className="bg-yellow-500">En cours</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archivees</CardTitle>
            <Badge className="bg-gray-500">Inactif</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.archived}</div>
          </CardContent>
        </Card>
      </div>

      {/* Courses List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.length === 0 ? (
          <Card className="col-span-full p-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Aucune formation pour le moment</p>
            <Button asChild>
              <Link href="/dashboard/admin/courses/create">
                <Plus className="mr-2 h-4 w-4" />
                Creer une formation
              </Link>
            </Button>
          </Card>
        ) : (
          courses.map((course) => (
            <Card key={course.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Badge className={`${statusColors[course.status]} text-white`}>
                    {statusLabels[course.status]}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/courses/${course.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/courses/${course.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedCourse(course)
                          setAssignDialogOpen(true)
                        }}
                      >
                        <CalendarPlus className="mr-2 h-4 w-4" />
                        Attribuer
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => {
                          setSelectedCourse(course)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle className="line-clamp-2 mt-2">{course.title}</CardTitle>
                {course.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {course.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {course.modules.length} modules
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {course._count.enrollments} inscrits
                  </div>
                  {course.duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {course.duration} min
                    </div>
                  )}
                </div>
              </CardContent>
              <div className="p-4 pt-0 flex gap-2">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href={`/dashboard/courses/${course.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    Voir
                  </Link>
                </Button>
                <Button asChild size="sm" className="flex-1">
                  <Link href={`/dashboard/courses/${course.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier
                  </Link>
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la formation</DialogTitle>
            <DialogDescription>
              Etes-vous sur de vouloir supprimer la formation &quot;{selectedCourse?.title}&quot;?
              Cette action est irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={(open) => {
        setAssignDialogOpen(open)
        if (!open) resetAssignForm()
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attribuer la formation</DialogTitle>
            <DialogDescription>
              Attribuez &quot;{selectedCourse?.title}&quot; a un groupe ou un utilisateur.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Attribuer a</Label>
              <Select value={assignType} onValueChange={(v) => setAssignType(v as 'group' | 'user')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="group">Un groupe</SelectItem>
                  <SelectItem value="user">Un utilisateur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {assignType === 'group' ? (
              <div>
                <Label>Groupe</Label>
                <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner un groupe" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map(group => (
                      <SelectItem key={group.id} value={group.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: group.color }}
                          />
                          {group.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label>Utilisateur</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner un utilisateur" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Date de debut *</Label>
                <Input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Date de fin</Label>
                <Input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="mandatory"
                checked={mandatory}
                onChange={(e) => setMandatory(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="mandatory" className="font-normal">
                Formation obligatoire
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAssign} disabled={isAssigning}>
              {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Attribuer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
