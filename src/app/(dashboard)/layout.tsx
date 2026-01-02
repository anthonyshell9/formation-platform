import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Role } from '@prisma/client'

// Force dynamic rendering to prevent caching of user role
export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const userRole: Role = session.user.role || Role.LEARNER

  // Debug: log the role being passed
  console.log('[Layout] Session user:', session.user.email, 'Role:', session.user.role, 'Using:', userRole)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar userRole={userRole} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
