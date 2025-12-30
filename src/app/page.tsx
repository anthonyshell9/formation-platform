import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { GraduationCap, BookOpen, Users, Award, Calendar, Play, BarChart3 } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl">Formation Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Next Generation Training Platform
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Train your teams with personalized learning paths, interactive quizzes and real-time tracking
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/signin">
                <Play className="mr-2 h-5 w-5" />
                Get Started
              </Link>
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-20">
          <div className="p-6 rounded-xl border bg-card">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Custom Courses</h3>
            <p className="text-muted-foreground">
              Create tailored training paths with modules, videos and documents
            </p>
          </div>

          <div className="p-6 rounded-xl border bg-card">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Award className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Interactive Quizzes</h3>
            <p className="text-muted-foreground">
              Assess knowledge with customizable quizzes and instant feedback
            </p>
          </div>

          <div className="p-6 rounded-xl border bg-card">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Group Management</h3>
            <p className="text-muted-foreground">
              Organize your learners into groups and assign targeted training
            </p>
          </div>

          <div className="p-6 rounded-xl border bg-card">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Advanced Scheduling</h3>
            <p className="text-muted-foreground">
              Plan your training over time with an integrated calendar
            </p>
          </div>

          <div className="p-6 rounded-xl border bg-card">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Reports & Analytics</h3>
            <p className="text-muted-foreground">
              Track your teams progress with detailed dashboards
            </p>
          </div>

          <div className="p-6 rounded-xl border bg-card">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Award className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Gamification</h3>
            <p className="text-muted-foreground">
              Motivate your learners with badges and rewards
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
              Formation Platform - 2024. All rights reserved.
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
