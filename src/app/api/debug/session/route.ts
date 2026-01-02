import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma/client'

// Debug endpoint to check session info
export async function GET() {
  try {
    // Check both methods to find discrepancy
    const sessionFromNextAuth = await getServerSession(authOptions)
    const sessionFromHelper = await getSession()

    // Check if SKIP_AUTH is set
    const skipAuth = process.env.SKIP_AUTH === 'true'

    const session = sessionFromNextAuth

    if (!session?.user) {
      return NextResponse.json({
        authenticated: false,
        message: 'No session found',
        skipAuth,
        sessionFromHelper: sessionFromHelper ? {
          userId: sessionFromHelper.user?.id,
          role: sessionFromHelper.user?.role,
        } : null,
      })
    }

    // Check if user exists in database by ID
    const userById = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, role: true },
    })

    // Check if user exists in database by email
    const userByEmail = session.user.email ? await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, name: true, role: true },
    }) : null

    return NextResponse.json({
      authenticated: true,
      skipAuth,
      sessionFromNextAuth: {
        userId: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        image: session.user.image,
      },
      sessionFromHelper: sessionFromHelper ? {
        userId: sessionFromHelper.user?.id,
        email: sessionFromHelper.user?.email,
        name: sessionFromHelper.user?.name,
        role: sessionFromHelper.user?.role,
      } : null,
      helperVsNextAuth: {
        sameUser: session.user.id === sessionFromHelper?.user?.id,
        sameRole: session.user.role === sessionFromHelper?.user?.role,
        discrepancy: session.user.role !== sessionFromHelper?.user?.role
          ? `NextAuth: ${session.user.role}, Helper: ${sessionFromHelper?.user?.role}`
          : null,
      },
      database: {
        foundById: !!userById,
        userById,
        foundByEmail: !!userByEmail,
        userByEmail,
        idsMatch: userById?.id === userByEmail?.id,
        sessionIdMatchesDb: userById?.id === session.user.id,
      },
      issue: !userById && !userByEmail
        ? 'User not found in database at all'
        : !userById && userByEmail
        ? 'User exists by email but session ID does not match database ID'
        : null,
    })
  } catch (error) {
    console.error('Debug session error:', error)
    return NextResponse.json({
      error: 'Error checking session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
