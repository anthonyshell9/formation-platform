import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/options'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Role } from '@prisma/client'

// TEMPORARY: Skip auth for testing
const SKIP_AUTH = process.env.SKIP_AUTH === 'true'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let userRole: Role = Role.ADMIN

  if (!SKIP_AUTH) {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      redirect('/auth/signin')
    }
    userRole = session.user.role || Role.LEARNER
  }

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
