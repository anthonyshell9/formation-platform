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
  Award,
  Plus,
  Pencil,
  Trash2,
  Users,
  BookOpen,
  Star,
  Loader2,
} from 'lucide-react'

interface BadgeType {
  id: string
  name: string
  description: string | null
  imageUrl: string
  points: number
  category: string | null
  isActive: boolean
  createdAt: string
  _count: {
    users: number
    courseBadges: number
  }
}

const BADGE_CATEGORIES = [
  { value: 'progression', label: 'Progression' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'cybersecurite', label: 'Cybersécurité' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'special', label: 'Spécial' },
]

const DEFAULT_BADGE_ICONS = [
  '/badges/star.svg',
  '/badges/trophy.svg',
  '/badges/medal.svg',
  '/badges/crown.svg',
  '/badges/shield.svg',
  '/badges/rocket.svg',
]

export default function AdminBadgesPage() {
  const [badges, setBadges] = useState<BadgeType[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBadge, setEditingBadge] = useState<BadgeType | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    points: 10,
    category: '',
  })

  useEffect(() => {
    fetchBadges()
  }, [])

  const fetchBadges = async () => {
    try {
      const res = await fetch('/api/admin/badges')
      if (res.ok) {
        const data = await res.json()
        setBadges(data)
      }
    } catch (error) {
      console.error('Error fetching badges:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
      points: 10,
      category: '',
    })
    setEditingBadge(null)
  }

  const openEditDialog = (badge: BadgeType) => {
    setEditingBadge(badge)
    setFormData({
      name: badge.name,
      description: badge.description || '',
      imageUrl: badge.imageUrl,
      points: badge.points,
      category: badge.category || '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingBadge
        ? `/api/admin/badges/${editingBadge.id}`
        : '/api/admin/badges'
      const method = editingBadge ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        await fetchBadges()
        setDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error('Error saving badge:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (badgeId: string) => {
    if (!confirm('Supprimer ce badge ? Cette action est irréversible.')) return

    try {
      const res = await fetch(`/api/admin/badges/${badgeId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        await fetchBadges()
      }
    } catch (error) {
      console.error('Error deleting badge:', error)
    }
  }

  const toggleActive = async (badge: BadgeType) => {
    try {
      const res = await fetch(`/api/admin/badges/${badge.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !badge.isActive }),
      })
      if (res.ok) {
        await fetchBadges()
      }
    } catch (error) {
      console.error('Error toggling badge:', error)
    }
  }

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
          <h1 className="text-3xl font-bold">Gestion des Badges</h1>
          <p className="text-muted-foreground">
            Créez et gérez les badges que les utilisateurs peuvent obtenir
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Badge
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingBadge ? 'Modifier le badge' : 'Créer un badge'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nom du badge</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Champion des Quiz"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Décrivez comment obtenir ce badge..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="imageUrl">URL de l&apos;image</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                  required
                />
                <div className="mt-2 flex gap-2 flex-wrap">
                  {DEFAULT_BADGE_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: icon })}
                      className={`p-2 rounded border-2 ${formData.imageUrl === icon ? 'border-primary' : 'border-transparent'}`}
                    >
                      <Award className="h-6 w-6" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="points">Points</Label>
                  <Input
                    id="points"
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Catégorie</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                    <SelectContent>
                      {BADGE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingBadge ? 'Enregistrer' : 'Créer'}
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
            <Award className="h-10 w-10 text-primary" />
            <div>
              <p className="text-2xl font-bold">{badges.length}</p>
              <p className="text-sm text-muted-foreground">Badges créés</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <Users className="h-10 w-10 text-green-600" />
            <div>
              <p className="text-2xl font-bold">
                {badges.reduce((sum, b) => sum + b._count.users, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Badges attribués</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <Star className="h-10 w-10 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold">
                {badges.reduce((sum, b) => sum + b.points, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Points totaux</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Badges Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des badges</CardTitle>
          <CardDescription>
            Tous les badges disponibles dans la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent>
          {badges.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun badge créé</p>
              <p className="text-sm">Créez votre premier badge pour récompenser vos apprenants</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Badge</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="text-center">Points</TableHead>
                  <TableHead className="text-center">Attribués</TableHead>
                  <TableHead className="text-center">Cours liés</TableHead>
                  <TableHead className="text-center">Actif</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {badges.map((badge) => (
                  <TableRow key={badge.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Award className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{badge.name}</p>
                          {badge.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {badge.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {badge.category ? (
                        <Badge variant="outline">
                          {BADGE_CATEGORIES.find(c => c.value === badge.category)?.label || badge.category}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{badge.points} pts</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {badge._count.users}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        {badge._count.courseBadges}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={badge.isActive}
                        onCheckedChange={() => toggleActive(badge)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(badge)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(badge.id)}
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
    </div>
  )
}
