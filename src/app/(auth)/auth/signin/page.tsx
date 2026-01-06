'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { GraduationCap, Loader2, AlertCircle, Shield } from 'lucide-react'

function SignInContent() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const error = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showMfa, setShowMfa] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  const errorMessages: Record<string, string> = {
    CredentialsSignin: 'Email ou mot de passe incorrect',
    MFA_REQUIRED: 'Code MFA requis',
    'Utilisateur non trouve': 'Aucun compte trouve avec cet email',
    'Compte desactive': 'Votre compte a ete desactive',
    'Mot de passe incorrect': 'Mot de passe incorrect',
    'Code MFA invalide': 'Code MFA invalide',
    'Veuillez utiliser la connexion Microsoft': 'Ce compte utilise la connexion Microsoft',
    // SSO restriction errors
    'UserNotRegistered': 'Votre compte n\'est pas enregistre. Contactez l\'administrateur.',
    'AccountDisabled': 'Votre compte a ete desactive. Contactez l\'administrateur.',
    'NoEmail': 'Impossible de recuperer l\'email depuis Microsoft. Contactez l\'administrateur.',
    'AccessDenied': 'Acces refuse. Seuls les utilisateurs pre-enregistres peuvent se connecter.',
  }

  async function handleCredentialsLogin(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setLoginError(null)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        mfaCode: showMfa ? mfaCode : undefined,
        redirect: false,
        callbackUrl,
      })

      if (result?.error) {
        if (result.error === 'MFA_REQUIRED') {
          setShowMfa(true)
          setLoginError(null)
        } else {
          setLoginError(errorMessages[result.error] || result.error)
        }
      } else if (result?.ok) {
        window.location.href = callbackUrl
      }
    } catch (error) {
      setLoginError('Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Formation Platform</CardTitle>
          <CardDescription>
            Connectez-vous pour acceder a vos formations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {errorMessages[error] || 'Erreur de connexion'}
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="microsoft" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="microsoft">Microsoft</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
            </TabsList>

            <TabsContent value="microsoft" className="space-y-4">
              <Button
                className="w-full"
                size="lg"
                onClick={() => signIn('azure-ad', { callbackUrl })}
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
                Recommande pour les utilisateurs de l&apos;entreprise
              </p>
            </TabsContent>

            <TabsContent value="email" className="space-y-4">
              <form onSubmit={handleCredentialsLogin} className="space-y-4">
                {loginError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{loginError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                {showMfa && (
                  <div className="space-y-2">
                    <Label htmlFor="mfaCode" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Code MFA
                    </Label>
                    <Input
                      id="mfaCode"
                      type="text"
                      placeholder="123456"
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      maxLength={6}
                      required
                      disabled={isLoading}
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground">
                      Entrez le code de votre application d&apos;authentification
                    </p>
                  </div>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {showMfa ? 'Verifier' : 'Se connecter'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-xs text-center text-muted-foreground">
            En vous connectant, vous acceptez nos conditions
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}
