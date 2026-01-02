import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma/client'

// GET certificate template for a course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { courseId } = await params

    const template = await prisma.certificateTemplate.findUnique({
      where: { courseId },
      include: {
        course: {
          select: { id: true, title: true }
        }
      }
    })

    if (!template) {
      return NextResponse.json(null)
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error fetching certificate template:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
