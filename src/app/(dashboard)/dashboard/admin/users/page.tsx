'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  UserPlus,
  MoreVertical,
  Search,
  Trash2,
  Shield,
  Users,
  UserCheck,
  UserX,
  Clock,
  Key,
  ShieldCheck,
  ShieldOff,
  Mail,
  Lock,
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
  isActive: boolean
  isPreregistered: boolean
  hasPassword: boolean
  mfaEnabled: boolean
  mfaVerified: boolean
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
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [authType, setAuthType] = useState<'sso' | 'local'>('sso')
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    role: 'LEARNER' as Role,
    password: '',
    mfaEnabled: true,
  })
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    trainers: 0,
    learners: 0,
    preregistered: 0,
  })

  // Password dialog state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
        setStats({
          ...data.stats,
          preregistered: data.users.filter((u: User) => u.isPreregistered).length,
        })
      }
    } catch (error) {
      toast.error(tCommon('error'))
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!newUser.email) {
      toast.error('Veuillez entrer une adresse email')
      return
    }

    if (authType === 'local' && (!newUser.password || newUser.password.length < 8)) {
      toast.error('Le mot de passe doit contenir au moins 8 caracteres')
      return
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newUser,
          authType,
        }),
      })

      if (response.ok) {
        toast.success('Utilisateur cree avec succes')
        setIsCreateOpen(false)
        setNewUser({ email: '', name: '', role: 'LEARNER', password: '', mfaEnabled: true })
        setAuthType('sso')
        fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la creation')
      }
    } catch (error) {
      toast.error('Erreur lors de la creation')
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

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })

      if (response.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, isActive } : u))
        toast.success(isActive ? 'Utilisateur active' : 'Utilisateur desactive')
      } else {
        toast.error(tCommon('error'))
      }
    } catch (error) {
      toast.error(tCommon('error'))
    }
  }

  const handleToggleMfa = async (userId: string, mfaEnabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mfaEnabled }),
      })

      if (response.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, mfaEnabled } : u))
        toast.success(mfaEnabled ? 'MFA active' : 'MFA desactive')
      } else {
        toast.error(tCommon('error'))
      }
    } catch (error) {
      toast.error(tCommon('error'))
    }
  }

  const handleSetPassword = async () => {
    if (!selectedUserId) return

    if (newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${selectedUserId}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      })

      if (response.ok) {
        setUsers(users.map(u =>
          u.id === selectedUserId ? { ...u, hasPassword: true, isPreregistered: false } : u
        ))
        toast.success('Mot de passe defini avec succes')
        setPasswordDialogOpen(false)
        setNewPassword('')
        setConfirmPassword('')
        setSelectedUserId(null)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la definition du mot de passe')
      }
    } catch (error) {
      toast.error('Erreur lors de la definition du mot de passe')
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

  const getAuthBadge = (user: User) => {
    if (user.hasPassword) {
      return (
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <Mail className="h-3 w-3 mr-1" />
            Local
          </Badge>
          {user.mfaEnabled ? (
            <Badge variant="outline" className="text-green-600 border-green-600">
              <ShieldCheck className="h-3 w-3 mr-1" />
              MFA
            </Badge>
          ) : (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              <ShieldOff className="h-3 w-3 mr-1" />
              Sans MFA
            </Badge>
          )}
        </div>
      )
    }
    if (user.isPreregistered) {
      return (
        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
          <Clock className="h-3 w-3 mr-1" />
          En attente SSO
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-purple-600 border-purple-600">
        <Shield className="h-3 w-3 mr-1" />
        Microsoft SSO
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('users')}</h1>
          <p className="text-muted-foreground">{t('usersList')}</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              {t('createUser')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t('createUser')}</DialogTitle>
              <DialogDescription>
                Creez un compte utilisateur avec SSO Microsoft ou authentification locale.
              </DialogDescription>
            </DialogHeader>

            <Tabs value={authType} onValueChange={(v) => setAuthType(v as 'sso' | 'local')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sso">
                  <Shield className="h-4 w-4 mr-2" />
                  Microsoft SSO
                </TabsTrigger>
                <TabsTrigger value="local">
                  <Mail className="h-4 w-4 mr-2" />
                  Email / Mot de passe
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sso" className="space-y-4">
                <div>
                  <Label htmlFor="email-sso">Email *</Label>
                  <Input
                    id="email-sso"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="utilisateur@entreprise.com"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Doit correspondre a son compte Microsoft
                  </p>
                </div>
                <div>
                  <Label htmlFor="name-sso">Nom</Label>
                  <Input
                    id="name-sso"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Prenom Nom"
                  />
                </div>
                <div>
                  <Label htmlFor="role-sso">Role</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(v) => setNewUser({ ...newUser, role: v as Role })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LEARNER">{t('roles.learner')}</SelectItem>
                      <SelectItem value="TRAINER">{t('roles.trainer')}</SelectItem>
                      <SelectItem value="MANAGER">{t('roles.manager')}</SelectItem>
                      <SelectItem value="ADMIN">{t('roles.admin')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="local" className="space-y-4">
                <div>
                  <Label htmlFor="email-local">Email *</Label>
                  <Input
                    id="email-local"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="utilisateur@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="name-local">Nom</Label>
                  <Input
                    id="name-local"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Prenom Nom"
                  />
                </div>
                <div>
                  <Label htmlFor="password-local">Mot de passe *</Label>
                  <Input
                    id="password-local"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Minimum 8 caracteres"
                  />
                </div>
                <div>
                  <Label htmlFor="role-local">Role</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(v) => setNewUser({ ...newUser, role: v as Role })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LEARNER">{t('roles.learner')}</SelectItem>
                      <SelectItem value="TRAINER">{t('roles.trainer')}</SelectItem>
                      <SelectItem value="MANAGER">{t('roles.manager')}</SelectItem>
                      <SelectItem value="ADMIN">{t('roles.admin')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="mfa-toggle">Authentification MFA</Label>
                    <p className="text-sm text-muted-foreground">
                      Exiger un code TOTP pour la connexion
                    </p>
                  </div>
                  <Switch
                    id="mfa-toggle"
                    checked={newUser.mfaEnabled}
                    onCheckedChange={(checked) => setNewUser({ ...newUser, mfaEnabled: checked })}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                {tCommon('cancel')}
              </Button>
              <Button onClick={handleCreateUser}>{tCommon('create')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Definir le mot de passe</DialogTitle>
            <DialogDescription>
              Definissez un mot de passe pour permettre a cet utilisateur de se connecter avec email/mot de passe.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 caracteres"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retapez le mot de passe"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleSetPassword}>
              <Key className="h-4 w-4 mr-2" />
              Definir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente SSO</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.preregistered}</div>
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
                  <TableHead>Authentification</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('createdAt')}</TableHead>
                  <TableHead className="text-right">{tCommon('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      {tCommon('loading')}
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
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
                        {getAuthBadge(user)}
                      </TableCell>
                      <TableCell>
                        {user.isActive ? (
                          <Badge className="bg-green-500">Actif</Badge>
                        ) : (
                          <Badge variant="secondary">Inactif</Badge>
                        )}
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
                              onClick={() => {
                                setSelectedUserId(user.id)
                                setPasswordDialogOpen(true)
                              }}
                            >
                              <Key className="h-4 w-4 mr-2" />
                              {user.hasPassword ? 'Changer mot de passe' : 'Definir mot de passe'}
                            </DropdownMenuItem>
                            {user.hasPassword && (
                              <DropdownMenuItem
                                onClick={() => handleToggleMfa(user.id, !user.mfaEnabled)}
                              >
                                {user.mfaEnabled ? (
                                  <>
                                    <ShieldOff className="h-4 w-4 mr-2" />
                                    Desactiver MFA
                                  </>
                                ) : (
                                  <>
                                    <ShieldCheck className="h-4 w-4 mr-2" />
                                    Activer MFA
                                  </>
                                )}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleToggleActive(user.id, !user.isActive)}
                            >
                              {user.isActive ? 'Desactiver' : 'Activer'}
                            </DropdownMenuItem>
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
