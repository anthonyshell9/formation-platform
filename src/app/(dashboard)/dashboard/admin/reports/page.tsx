'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  BarChart3,
  Users,
  BookOpen,
  TrendingUp,
  Download,
  Calendar,
  Loader2,
  GraduationCap,
  Clock,
  Target,
} from 'lucide-react'

interface ReportStats {
  totalUsers: number
  totalCourses: number
  totalEnrollments: number
  completionRate: number
  activeUsers: number
  coursesThisMonth: number
  enrollmentsThisMonth: number
  averageProgress: number
}

interface CourseReport {
  id: string
  title: string
  enrollments: number
  completions: number
  averageProgress: number
}

interface UserActivity {
  id: string
  name: string
  email: string
  enrolledCourses: number
  completedCourses: number
  lastActive: string | null
}

export default function ReportsPage() {
  const [stats, setStats] = useState<ReportStats | null>(null)
  const [courseReports, setCourseReports] = useState<CourseReport[]>([])
  const [userActivity, setUserActivity] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')

  useEffect(() => {
    fetchReports()
  }, [period])

  async function fetchReports() {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/reports?period=${period}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setCourseReports(data.courseReports || [])
        setUserActivity(data.userActivity || [])
      } else {
        toast.error('Erreur lors du chargement des rapports')
      }
    } catch (error) {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  async function exportReport(type: 'csv' | 'pdf') {
    toast.info(`Export ${type.toUpperCase()} en cours...`)
    // TODO: Implement export
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rapports</h1>
          <p className="text-muted-foreground">
            Analysez les performances de votre plateforme
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 derniers jours</SelectItem>
              <SelectItem value="30">30 derniers jours</SelectItem>
              <SelectItem value="90">3 derniers mois</SelectItem>
              <SelectItem value="365">Cette annee</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => exportReport('csv')}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeUsers || 0} actifs ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Formations</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCourses || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.coursesThisMonth || 0} ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inscriptions</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEnrollments || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.enrollmentsThisMonth || 0} ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taux de completion</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Progression moyenne: {stats?.averageProgress || 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Course Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performances par formation
          </CardTitle>
          <CardDescription>
            Statistiques detaillees pour chaque formation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {courseReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune donnee disponible</p>
            </div>
          ) : (
            <div className="space-y-4">
              {courseReports.map(course => (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{course.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {course.enrollments} inscrits
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <p className="font-medium">{course.completions}</p>
                      <p className="text-xs text-muted-foreground">Completes</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{Math.round(course.averageProgress)}%</p>
                      <p className="text-xs text-muted-foreground">Prog. moy.</p>
                    </div>
                    <Badge variant={course.averageProgress >= 70 ? 'default' : 'secondary'}>
                      {course.averageProgress >= 70 ? 'Bon' : 'A ameliorer'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Activite des utilisateurs
          </CardTitle>
          <CardDescription>
            Utilisateurs les plus actifs sur la periode
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune activite recente</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userActivity.slice(0, 10).map(user => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{user.name || 'Sans nom'}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <p className="font-medium">{user.enrolledCourses}</p>
                      <p className="text-xs text-muted-foreground">Inscrit</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{user.completedCourses}</p>
                      <p className="text-xs text-muted-foreground">Complete</p>
                    </div>
                    {user.lastActive && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs">
                          {new Date(user.lastActive).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
