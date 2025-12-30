'use client'

import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap } from 'lucide-react'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Formation Platform</CardTitle>
          <CardDescription>
            Connectez-vous pour accéder à vos formations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full"
            size="lg"
            onClick={() => signIn('azure-ad', { callbackUrl: '/dashboard' })}
          >
            <svg
              className="mr-2 h-5 w-5"
              viewBox="0 0 21 21"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0 0H10V10H0V0Z" fill="#F25022" />
              <path d="M11 0H21V10H11V0Z" fill="#7FBA00" />
              <path d="M0 11H10V21H0V11Z" fill="#00A4EF" />
              <path d="M11 11H21V21H11V11Z" fill="#FFB900" />
            </svg>
            Se connecter avec Microsoft
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            En vous connectant, vous acceptez nos conditions
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
