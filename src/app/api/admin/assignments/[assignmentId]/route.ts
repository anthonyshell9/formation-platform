import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'
import { Role } from '@prisma/client'

interface RouteParams {
  params: Promise<{ assignmentId: string }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    if (!([Role.ADMIN, Role.TRAINER, Role.MANAGER] as Role[]).includes(session.user.role)) {
      return NextResponse.json({ error: 'Acces interdit' }, { status: 403 })
    }

    const { assignmentId } = await params

    await prisma.courseAssignment.delete({
      where: { id: assignmentId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE assignment error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
