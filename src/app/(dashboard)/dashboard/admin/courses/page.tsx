import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, BookOpen, Users, Clock, Edit, Eye } from 'lucide-react'
import Link from 'next/link'
import { Role, CourseStatus } from '@prisma/client'

export default async function AdminCoursesPage() {
  const session = await getSession()
  if (!session?.user) redirect('/auth/signin')

  if (!([Role.ADMIN, Role.TRAINER] as Role[]).includes(session.user.role)) {
    redirect('/dashboard')
  }

  const courses = await prisma.course.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      creator: { select: { id: true, name: true, image: true } },
      modules: { select: { id: true } },
      _count: { select: { enrollments: true } },
    },
  })

  const stats = {
    total: courses.length,
    published: courses.filter(c => c.status === CourseStatus.PUBLISHED).length,
    draft: courses.filter(c => c.status === CourseStatus.DRAFT).length,
    archived: courses.filter(c => c.status === CourseStatus.ARCHIVED).length,
  }

  const statusColors: Record<CourseStatus, string> = {
    DRAFT: 'bg-yellow-500',
    PUBLISHED: 'bg-green-500',
    ARCHIVED: 'bg-gray-500',
  }

  const statusLabels: Record<CourseStatus, string> = {
    DRAFT: 'Brouillon',
    PUBLISHED: 'Publiee',
    ARCHIVED: 'Archivee',
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
                  {course.difficulty && (
                    <Badge variant="outline">{course.difficulty}</Badge>
                  )}
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
    </div>
  )
}
