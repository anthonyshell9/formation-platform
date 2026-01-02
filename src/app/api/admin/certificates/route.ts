import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma/client'
import { Role } from '@prisma/client'

// GET all certificate templates
export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const templates = await prisma.certificateTemplate.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        course: {
          select: { id: true, title: true, status: true }
        }
      }
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching certificate templates:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST create new certificate template
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user || !([Role.ADMIN, Role.TRAINER] as Role[]).includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const {
      courseId,
      title,
      description,
      signatoryName,
      signatoryTitle,
      signatureUrl,
      logoUrl,
      backgroundColor,
      textColor,
      borderColor,
      validityMonths,
      minScore,
      requireAllLessons,
    } = body

    if (!courseId || !title) {
      return NextResponse.json({ error: 'Cours et titre requis' }, { status: 400 })
    }

    // Check if template already exists for this course
    const existing = await prisma.certificateTemplate.findUnique({
      where: { courseId }
    })

    if (existing) {
      return NextResponse.json({ error: 'Un modèle de certificat existe déjà pour ce cours' }, { status: 400 })
    }

    const template = await prisma.certificateTemplate.create({
      data: {
        courseId,
        title,
        description,
        signatoryName,
        signatoryTitle,
        signatureUrl,
        logoUrl,
        backgroundColor: backgroundColor || '#ffffff',
        textColor: textColor || '#000000',
        borderColor: borderColor || '#d4af37',
        validityMonths,
        minScore: minScore || 70,
        requireAllLessons: requireAllLessons ?? true,
      },
      include: {
        course: {
          select: { id: true, title: true }
        }
      }
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Error creating certificate template:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
