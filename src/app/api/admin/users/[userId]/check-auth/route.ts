import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'
import { Role } from '@prisma/client'

interface RouteParams {
  params: Promise<{ userId: string }>
}

// Diagnostic endpoint to check user auth status
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    if (session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Acces interdit' }, { status: 403 })
    }

    const { userId } = await params

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        isPreregistered: true,
        password: true,
        mfaEnabled: true,
        mfaVerified: true,
        mfaSecret: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      isPreregistered: user.isPreregistered,
      hasPassword: !!user.password,
      passwordLength: user.password?.length || 0,
      passwordStartsWith: user.password?.substring(0, 7) || null, // Should show $2a$12$ or $2b$12$ for bcrypt
      mfaEnabled: user.mfaEnabled,
      mfaVerified: user.mfaVerified,
      hasMfaSecret: !!user.mfaSecret,
      createdAt: user.createdAt,
    })
  } catch (error) {
    console.error('Check auth error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
