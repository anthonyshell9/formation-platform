import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'
import { Role } from '@prisma/client'

// Diagnostic endpoint to check user auth status by email
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    if (session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Acces interdit' }, { status: 403 })
    }

    const email = request.nextUrl.searchParams.get('email')
    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
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
      // Try to find with exact email
      const userExact = await prisma.user.findUnique({
        where: { email: email },
        select: { id: true, email: true },
      })

      return NextResponse.json({
        found: false,
        searchedEmail: normalizedEmail,
        originalEmail: email,
        foundWithExactCase: !!userExact,
        exactCaseEmail: userExact?.email || null,
      })
    }

    return NextResponse.json({
      found: true,
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      isPreregistered: user.isPreregistered,
      hasPassword: !!user.password,
      passwordLength: user.password?.length || 0,
      passwordStartsWith: user.password?.substring(0, 7) || null,
      mfaEnabled: user.mfaEnabled,
      mfaVerified: user.mfaVerified,
      hasMfaSecret: !!user.mfaSecret,
      createdAt: user.createdAt,
    })
  } catch (error) {
    console.error('Check auth by email error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
