import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BookOpen, Clock, Users, Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { Role } from '@prisma/client'

interface Props {
  searchParams: Promise<{ [key: string]: string | undefined }>
}

export default async function CoursesPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null

  const params = await searchParams
  const search = params.search || ''
  const category = params.category || ''
  const difficulty = params.difficulty || ''

  const isCreator = ([Role.ADMIN, Role.TRAINER] as Role[]).includes(session.user.role)

  const where: Record<string, unknown> = {
    status: isCreator ? undefined : 'PUBLISHED',
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (category) {
    where.category = category
  }

  if (difficulty) {
    where.difficulty = difficulty
  }

  const [courses, categories] = await Promise.all([
    prisma.course.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true, image: true } },
        _count: { select: { enrollments: true, modules: true } },
        enrollments: {
          where: { userId: session.user.id },
          select: { status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.course.groupBy({
      by: ['category'],
      where: { category: { not: null } },
    }),
  ])

  const difficultyColors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  }

  const difficultyLabels: Record<string, string> = {
    beginner: 'Débutant',
    intermediate: 'Intermédiaire',
    advanced: 'Avancé',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Formations</h1>
          <p className="text-muted-foreground">
            {isCreator ? 'Gérez et créez des formations' : 'Découvrez nos formations'}
          </p>
        </div>
        {isCreator && (
          <Button asChild>
            <Link href="/dashboard/courses/create">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle formation
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <form>
            <Input
              name="search"
              placeholder="Rechercher une formation..."
              defaultValue={search}
              className="pl-9"
            />
          </form>
        </div>
        <Select defaultValue={category}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Toutes</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.category} value={cat.category || ''}>
                {cat.category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select defaultValue={difficulty}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Difficulté" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Toutes</SelectItem>
            <SelectItem value="beginner">Débutant</SelectItem>
            <SelectItem value="intermediate">Intermédiaire</SelectItem>
            <SelectItem value="advanced">Avancé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucune formation trouvée</h3>
          <p className="text-muted-foreground mb-4">
            {search ? 'Essayez avec d\'autres termes de recherche' : 'Commencez par créer une formation'}
          </p>
          {isCreator && (
            <Button asChild>
              <Link href="/dashboard/courses/create">
                <Plus className="mr-2 h-4 w-4" />
                Créer une formation
              </Link>
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map(course => (
            <Card key={course.id} className="overflow-hidden flex flex-col">
              <div className="aspect-video bg-accent relative">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                {course.status !== 'PUBLISHED' && (
                  <Badge className="absolute top-2 right-2" variant="secondary">
                    {course.status === 'DRAFT' ? 'Brouillon' : 'Archivé'}
                  </Badge>
                )}
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-tight line-clamp-2">
                    {course.title}
                  </h3>
                </div>
                {course.difficulty && (
                  <Badge className={difficultyColors[course.difficulty]} variant="outline">
                    {difficultyLabels[course.difficulty]}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {course.description || 'Aucune description'}
                </p>
              </CardContent>
              <CardFooter className="pt-0 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {course._count.enrollments}
                  </span>
                  {course.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {course.duration}min
                    </span>
                  )}
                </div>
                <Button asChild size="sm">
                  <Link href={`/dashboard/courses/${course.id}`}>
                    {course.enrollments.length > 0 ? 'Continuer' : 'Voir'}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
