'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Calendar,
  BarChart3,
  Settings,
  Award,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserCog,
  FolderOpen,
  FileCheck,
  UsersRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { Role } from '@prisma/client'

interface NavItem {
  titleKey: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: Role[]
}

// Items visible to all users
const userItems: NavItem[] = [
  { titleKey: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { titleKey: 'myCourses', href: '/dashboard/my-courses', icon: GraduationCap },
  { titleKey: 'myDocuments', href: '/dashboard/my-documents', icon: FileCheck },
  { titleKey: 'calendar', href: '/dashboard/calendar', icon: Calendar },
  { titleKey: 'badges', href: '/dashboard/badges', icon: Award },
]

// Admin section items
const adminItems: NavItem[] = [
  { titleKey: 'courses', href: '/dashboard/admin/courses', icon: BookOpen, roles: [Role.ADMIN, Role.TRAINER] },
  { titleKey: 'documents', href: '/dashboard/admin/documents', icon: FolderOpen, roles: [Role.ADMIN, Role.TRAINER] },
  { titleKey: 'assignments', href: '/dashboard/admin/assignments', icon: Calendar, roles: [Role.ADMIN, Role.TRAINER, Role.MANAGER] },
  { titleKey: 'groups', href: '/dashboard/admin/groups', icon: UsersRound, roles: [Role.ADMIN, Role.MANAGER] },
  { titleKey: 'users', href: '/dashboard/admin/users', icon: UserCog, roles: [Role.ADMIN] },
  { titleKey: 'reports', href: '/dashboard/admin/reports', icon: BarChart3, roles: [Role.ADMIN, Role.MANAGER] },
  { titleKey: 'settings', href: '/dashboard/admin/settings', icon: Settings, roles: [Role.ADMIN] },
]

interface SidebarProps {
  userRole: Role
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const t = useTranslations('nav')

  // Debug log for role checking
  console.log('[Sidebar] userRole received:', userRole, 'type:', typeof userRole)
  console.log('[Sidebar] Role.LEARNER:', Role.LEARNER, 'Comparison:', userRole === Role.LEARNER, userRole === 'LEARNER')

  // Only show admin section for non-LEARNER roles
  // Use string comparison to handle serialization issues
  const roleStr = String(userRole)
  const isAdmin = roleStr && roleStr !== 'LEARNER' &&
    ['ADMIN', 'TRAINER', 'MANAGER'].includes(roleStr)

  const filteredAdminItems = isAdmin ? adminItems.filter(
    item => !item.roles || item.roles.map(r => String(r)).includes(roleStr)
  ) : []

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

      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {/* User section */}
        {!collapsed && (
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Users className="h-3 w-3" />
            {t('mySpace')}
          </div>
        )}
        {userItems.map(item => {
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
              title={collapsed ? t(item.titleKey) : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{t(item.titleKey)}</span>}
            </Link>
          )
        })}

        {/* Admin section */}
        {isAdmin && filteredAdminItems.length > 0 && (
          <>
            <div className={cn('my-4 border-t', collapsed && 'mx-2')} />
            {!collapsed && (
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Shield className="h-3 w-3" />
                {t('admin')}
              </div>
            )}
            {filteredAdminItems.map(item => {
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
                  title={collapsed ? t(item.titleKey) : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{t(item.titleKey)}</span>}
                </Link>
              )
            })}
          </>
        )}
      </nav>
    </aside>
  )
}
