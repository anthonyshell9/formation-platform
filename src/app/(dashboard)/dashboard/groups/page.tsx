import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, Plus, BookOpen, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { Role } from '@prisma/client'

const SKIP_AUTH = process.env.SKIP_AUTH === 'true'

export default async function GroupsPage() {
  const session = await getSession()
  if (!session?.user) return null

  // In SKIP_AUTH mode, treat as admin
  const isManager = SKIP_AUTH || ([Role.ADMIN, Role.MANAGER] as Role[]).includes(session.user.role)

  // In SKIP_AUTH mode or as manager, show all groups
  const groups = await prisma.group.findMany({
    where: (SKIP_AUTH || isManager)
      ? undefined
      : { members: { some: { userId: session.user.id } } },
    include: {
      _count: { select: { members: true, assignments: true } },
      members: {
        take: 5,
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Groupes</h1>
          <p className="text-muted-foreground">
            {isManager ? 'Gérez les groupes d\'apprenants' : 'Vos groupes de formation'}
          </p>
        </div>
        {isManager && (
          <Button asChild>
            <Link href="/dashboard/groups/create">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau groupe
            </Link>
          </Button>
        )}
      </div>

      {groups.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun groupe</h3>
          <p className="text-muted-foreground mb-4">
            {isManager
              ? 'Créez votre premier groupe pour organiser les apprenants'
              : 'Vous n\'êtes membre d\'aucun groupe'}
          </p>
          {isManager && (
            <Button asChild>
              <Link href="/dashboard/groups/create">
                <Plus className="mr-2 h-4 w-4" />
                Créer un groupe
              </Link>
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map(group => (
            <Card key={group.id} className="overflow-hidden">
              <div
                className="h-2"
                style={{ backgroundColor: group.color }}
              />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  {isManager && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/groups/${group.id}/edit`}>
                            Modifier
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/groups/${group.id}/members`}>
                            Gérer les membres
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                {group.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {group.description}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {group._count.members} membres
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {group._count.assignments} formations
                    </span>
                  </div>
                </div>

                {/* Member avatars */}
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {group.members.slice(0, 4).map(member => (
                      <Avatar
                        key={member.id}
                        className="h-8 w-8 border-2 border-background"
                      >
                        <AvatarImage src={member.user.image || ''} />
                        <AvatarFallback className="text-xs">
                          {member.user.name
                            ?.split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {group._count.members > 4 && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                        +{group._count.members - 4}
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="ml-auto" asChild>
                    <Link href={`/dashboard/groups/${group.id}`}>
                      Voir
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
