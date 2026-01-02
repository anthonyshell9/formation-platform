import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma/client'
import { Role } from '@prisma/client'

// GET single certificate template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { templateId } = await params

    const template = await prisma.certificateTemplate.findUnique({
      where: { id: templateId },
      include: {
        course: {
          select: { id: true, title: true, status: true }
        }
      }
    })

    if (!template) {
      return NextResponse.json({ error: 'Modèle non trouvé' }, { status: 404 })
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error fetching certificate template:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PATCH update certificate template
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user || !([Role.ADMIN, Role.TRAINER] as Role[]).includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { templateId } = await params
    const body = await request.json()

    const template = await prisma.certificateTemplate.update({
      where: { id: templateId },
      data: {
        ...(body.enabled !== undefined && { enabled: body.enabled }),
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.signatoryName !== undefined && { signatoryName: body.signatoryName }),
        ...(body.signatoryTitle !== undefined && { signatoryTitle: body.signatoryTitle }),
        ...(body.signatureUrl !== undefined && { signatureUrl: body.signatureUrl }),
        ...(body.logoUrl !== undefined && { logoUrl: body.logoUrl }),
        ...(body.backgroundColor !== undefined && { backgroundColor: body.backgroundColor }),
        ...(body.textColor !== undefined && { textColor: body.textColor }),
        ...(body.borderColor !== undefined && { borderColor: body.borderColor }),
        ...(body.validityMonths !== undefined && { validityMonths: body.validityMonths }),
        ...(body.minScore !== undefined && { minScore: body.minScore }),
        ...(body.requireAllLessons !== undefined && { requireAllLessons: body.requireAllLessons }),
      },
      include: {
        course: {
          select: { id: true, title: true }
        }
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error updating certificate template:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE certificate template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { templateId } = await params

    await prisma.certificateTemplate.delete({
      where: { id: templateId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting certificate template:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
