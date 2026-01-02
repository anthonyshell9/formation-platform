import { NextAuthOptions } from 'next-auth'
import AzureADProvider from 'next-auth/providers/azure-ad'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma/client'
import { Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions['adapter'],
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: 'openid email profile User.Read',
        },
      },
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'Email et mot de passe',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
        mfaCode: { label: 'Code MFA', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email et mot de passe requis')
        }

        console.log('[AUTH] Attempting login for:', credentials.email)

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        })

        if (!user) {
          console.log('[AUTH] User not found:', credentials.email)
          throw new Error('Utilisateur non trouve')
        }

        console.log('[AUTH] User found:', { id: user.id, email: user.email, hasPassword: !!user.password, isActive: user.isActive })

        if (!user.isActive) {
          console.log('[AUTH] User inactive:', user.email)
          throw new Error('Compte desactive')
        }

        if (!user.password) {
          console.log('[AUTH] User has no password (SSO only):', user.email)
          throw new Error('Veuillez utiliser la connexion Microsoft')
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        console.log('[AUTH] Password validation result:', isPasswordValid)

        if (!isPasswordValid) {
          console.log('[AUTH] Invalid password for:', user.email)
          throw new Error('Mot de passe incorrect')
        }

        // Check MFA if enabled and verified
        if (user.mfaEnabled && user.mfaVerified && user.mfaSecret) {
          if (!credentials.mfaCode) {
            // Return special error to trigger MFA prompt
            throw new Error('MFA_REQUIRED')
          }

          // Verify MFA code
          const { authenticator } = await import('otplib')
          const isValidMFA = authenticator.verify({
            token: credentials.mfaCode,
            secret: user.mfaSecret,
          })

          if (!isValidMFA) {
            throw new Error('Code MFA invalide')
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ account }) {
      // For credentials provider, user is already validated
      if (account?.provider === 'credentials') {
        return true
      }
      // For Azure AD, check if user exists or create
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        const userRole = (user as { role?: Role }).role
        if (userRole) {
          token.role = userRole
        }
      }
      if (account?.provider === 'credentials') {
        token.provider = 'credentials'
      }

      // Always fetch role from database if not set or on OAuth login
      if (!token.role || account?.provider === 'azure-ad') {
        try {
          const dbUser = await prisma.user.findFirst({
            where: {
              OR: [
                { id: token.id as string },
                { email: token.email as string },
              ],
            },
            select: { id: true, role: true },
          })
          if (dbUser) {
            token.id = dbUser.id
            token.role = dbUser.role
          } else {
            // Default to LEARNER if user not found
            token.role = Role.LEARNER
          }
        } catch (error) {
          console.error('JWT callback - fetch role error:', error)
          token.role = Role.LEARNER
        }
      }

      return token
    },
    async session({ session, token, user }) {
      // For JWT strategy (credentials)
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
      }
      // For database strategy (OAuth)
      if (user) {
        session.user.id = user.id
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true },
          })
          if (dbUser) {
            session.user.role = dbUser.role
          }
        } catch (error) {
          console.error('Session callback error:', error)
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt', // Use JWT for credentials provider compatibility
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}
