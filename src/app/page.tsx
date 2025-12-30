import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/options'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { GraduationCap, BookOpen, Users, Award, Calendar, Play } from 'lucide-react'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl">Formation Platform</span>
          </div>
          <Button asChild>
            <Link href="/auth/signin">Se connecter</Link>
          </Button>
        </nav>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Formez vos équipes avec{' '}
            <span className="text-primary">efficacité</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Une plateforme complète pour créer, distribuer et suivre des formations
            en ligne. Quiz interactifs, vidéos, calendrier de planification et suivi
            de progression.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/signin">
                <Play className="mr-2 h-5 w-5" />
                Commencer
              </Link>
            </Button>
            <Button size="lg" variant="outline">
              En savoir plus
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          <div className="p-6 rounded-xl border bg-card">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Formations interactives</h3>
            <p className="text-muted-foreground">
              Créez des formations modulaires avec vidéos, textes et documents.
            </p>
          </div>

          <div className="p-6 rounded-xl border bg-card">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Award className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Quiz et évaluations</h3>
            <p className="text-muted-foreground">
              Évaluez les connaissances avec des quiz variés et obtenez des rapports.
            </p>
          </div>

          <div className="p-6 rounded-xl border bg-card">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Gestion des groupes</h3>
            <p className="text-muted-foreground">
              Organisez vos apprenants en groupes et assignez des formations.
            </p>
          </div>

          <div className="p-6 rounded-xl border bg-card">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Planification</h3>
            <p className="text-muted-foreground">
              Planifiez les formations dans le temps avec le calendrier intégré.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-20 border-t">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Formation Platform - 2024
            </span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground">
              Conditions d&apos;utilisation
            </Link>
            <Link href="#" className="hover:text-foreground">
              Confidentialité
            </Link>
            <Link href="#" className="hover:text-foreground">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
