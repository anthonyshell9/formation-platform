import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Role } from '@prisma/client'

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
