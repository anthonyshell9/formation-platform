'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  UserPlus,
  MoreVertical,
  Search,
  Pencil,
  Trash2,
  Shield,
  Users,
  UserCheck,
  UserX
} from 'lucide-react'
import { Role } from '@prisma/client'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface User {
  id: string
  name: string | null
  email: string
  image: string | null
  role: Role
  createdAt: string
  _count?: {
    enrollments: number
  }
}

const roleColors: Record<Role, string> = {
  ADMIN: 'bg-red-500',
  TRAINER: 'bg-blue-500',
  MANAGER: 'bg-purple-500',
  LEARNER: 'bg-green-500',
}

export default function AdminUsersPage() {
  const t = useTranslations('admin')
  const tCommon = useTranslations('common')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    trainers: 0,
    learners: 0,
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
        setStats(data.stats)
      }
    } catch (error) {
      toast.error(tCommon('error'))
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
        toast.success(tCommon('success'))
      } else {
        toast.error(tCommon('error'))
      }
    } catch (error) {
      toast.error(tCommon('error'))
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(t('deleteUser') + '?')) return

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId))
        toast.success(tCommon('success'))
      } else {
        toast.error(tCommon('error'))
      }
    } catch (error) {
      toast.error(tCommon('error'))
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email[0].toUpperCase()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('users')}</h1>
          <p className="text-muted-foreground">{t('usersList')}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalUsers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('roles.admin')}</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('roles.trainer')}</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.trainers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('roles.learner')}</CardTitle>
            <UserX className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.learners}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={tCommon('search') + '...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as Role | 'ALL')}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={tCommon('filter')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{tCommon('viewAll')}</SelectItem>
                <SelectItem value="ADMIN">{t('roles.admin')}</SelectItem>
                <SelectItem value="TRAINER">{t('roles.trainer')}</SelectItem>
                <SelectItem value="MANAGER">{t('roles.manager')}</SelectItem>
                <SelectItem value="LEARNER">{t('roles.learner')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('userName')}</TableHead>
                  <TableHead>{t('userEmail')}</TableHead>
                  <TableHead>{t('userRole')}</TableHead>
                  <TableHead>{t('createdAt')}</TableHead>
                  <TableHead className="text-right">{tCommon('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      {tCommon('loading')}
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      {tCommon('noResults')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.image || undefined} />
                            <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.name || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(v) => handleRoleChange(user.id, v as Role)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <Badge className={`${roleColors[user.role]} text-white`}>
                              {t(`roles.${user.role.toLowerCase()}`)}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">{t('roles.admin')}</SelectItem>
                            <SelectItem value="TRAINER">{t('roles.trainer')}</SelectItem>
                            <SelectItem value="MANAGER">{t('roles.manager')}</SelectItem>
                            <SelectItem value="LEARNER">{t('roles.learner')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {format(new Date(user.createdAt), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {tCommon('delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
