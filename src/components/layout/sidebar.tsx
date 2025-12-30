'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  BookOpen,
  FileQuestion,
  Users,
  Calendar,
  BarChart3,
  Settings,
  Award,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { Role } from '@prisma/client'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: Role[]
}

const navItems: NavItem[] = [
  { title: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Formations', href: '/dashboard/courses', icon: BookOpen },
  { title: 'Mes formations', href: '/dashboard/my-courses', icon: GraduationCap },
  { title: 'Quiz', href: '/dashboard/quizzes', icon: FileQuestion, roles: [Role.ADMIN, Role.TRAINER] },
  { title: 'Groupes', href: '/dashboard/groups', icon: Users, roles: [Role.ADMIN, Role.MANAGER] },
  { title: 'Calendrier', href: '/dashboard/calendar', icon: Calendar },
  { title: 'Badges', href: '/dashboard/badges', icon: Award },
  { title: 'Rapports', href: '/dashboard/reports', icon: BarChart3, roles: [Role.ADMIN, Role.MANAGER] },
  { title: 'Paramètres', href: '/dashboard/settings', icon: Settings, roles: [Role.ADMIN] },
]

interface SidebarProps {
  userRole: Role
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const filteredItems = navItems.filter(
    item => !item.roles || item.roles.includes(userRole)
  )

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Formation</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(collapsed && 'mx-auto')}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {filteredItems.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.title : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
