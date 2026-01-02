import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'
import { Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        isActive: true,
        isPreregistered: true,
        password: true,
        mfaEnabled: true,
        mfaVerified: true,
        createdAt: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Map password to hasPassword boolean for security
    const usersWithAuthInfo = users.map(user => ({
      ...user,
      hasPassword: !!user.password,
      password: undefined, // Don't expose password hash
    }))

    const stats = {
      total: users.length,
      admins: users.filter(u => u.role === Role.ADMIN).length,
      trainers: users.filter(u => u.role === Role.TRAINER).length,
      learners: users.filter(u => u.role === Role.LEARNER).length,
    }

    return NextResponse.json({ users: usersWithAuthInfo, stats })
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const normalizedEmail = body.email?.toLowerCase().trim()

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Un utilisateur avec cet email existe deja' }, { status: 400 })
    }

    // Determine authentication type
    const authType = body.authType || 'sso' // 'sso' or 'local'
    let hashedPassword = null

    if (authType === 'local' && body.password) {
      if (body.password.length < 8) {
        return NextResponse.json(
          { error: 'Le mot de passe doit contenir au moins 8 caracteres' },
          { status: 400 }
        )
      }
      hashedPassword = await bcrypt.hash(body.password, 12)
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: body.name || null,
        role: body.role || Role.LEARNER,
        isActive: true,
        isPreregistered: authType === 'sso', // Only pre-registered for SSO users
        password: hashedPassword,
        mfaEnabled: authType === 'local' ? (body.mfaEnabled !== false) : false, // MFA enabled by default for local users
      },
    })

    return NextResponse.json({
      ...user,
      hasPassword: !!user.password,
      password: undefined,
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
