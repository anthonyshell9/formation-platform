import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'
import { Role } from '@prisma/client'
import { createAuditLog } from '@/lib/utils/audit'
import bcrypt from 'bcryptjs'

interface RouteParams {
  params: Promise<{ userId: string }>
}

// Set or update user password
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    if (session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Acces interdit' }, { status: 403 })
    }

    const { userId } = await params
    const body = await request.json()
    const { password } = body

    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caracteres' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        isPreregistered: false, // User can now log in
      },
    })

    await createAuditLog({
      userId: session.user.id,
      action: 'SET_USER_PASSWORD',
      resource: 'User',
      resourceId: userId,
      details: { targetEmail: user.email },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST password error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
