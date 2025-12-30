import { getServerSession } from 'next-auth'
import { authOptions } from './options'
import { Role } from '@prisma/client'

// TEMPORARY: Skip auth for testing
const SKIP_AUTH = process.env.SKIP_AUTH === 'true'

export interface MockSession {
  user: {
    id: string
    name: string
    email: string
    role: Role
    image?: string
  }
  expires: string
}

const MOCK_SESSION: MockSession = {
  user: {
    id: 'mock-user-id',
    name: 'Test Admin',
    email: 'admin@test.com',
    role: Role.ADMIN,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}

export async function getSession() {
  if (SKIP_AUTH) {
    return MOCK_SESSION
  }
  return getServerSession(authOptions)
}

export async function requireSession() {
  const session = await getSession()
  if (!session?.user) {
    return null
  }
  return session
}
