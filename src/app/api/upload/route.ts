import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { uploadFile, ContainerType } from '@/lib/utils/storage'
import { Role } from '@prisma/client'

const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB for videos
const ALLOWED_TYPES: Record<ContainerType, string[]> = {
  videos: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  certificates: ['application/pdf'],
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    if (!([Role.ADMIN, Role.TRAINER] as Role[]).includes(session.user.role)) {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const containerType = formData.get('type') as ContainerType | null

    if (!file) {
      return NextResponse.json({ error: 'Fichier requis' }, { status: 400 })
    }

    if (!containerType || !ALLOWED_TYPES[containerType]) {
      return NextResponse.json({ error: 'Type de conteneur invalide' }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES[containerType].includes(file.type)) {
      return NextResponse.json({
        error: `Type de fichier non autorisé. Types acceptés: ${ALLOWED_TYPES[containerType].join(', ')}`,
      }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: `Fichier trop volumineux. Taille maximale: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const { url, blobName } = await uploadFile(buffer, file.name, containerType, file.type)

    return NextResponse.json({
      url,
      blobName,
      filename: file.name,
      size: file.size,
      mimeType: file.type,
    })
  } catch (error) {
    console.error('POST /api/upload error:', error)
    return NextResponse.json({ error: 'Erreur lors du téléchargement' }, { status: 500 })
  }
}
