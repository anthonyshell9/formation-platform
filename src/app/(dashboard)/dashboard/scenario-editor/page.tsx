'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ScenarioEditor } from '@/components/scenario/editor'
import { ImmersivePlayer } from '@/components/scenario'
import type { Scenario } from '@/types/scenario'
import { DEFAULT_THEME, DEFAULT_SETTINGS } from '@/types/scenario'
import { toast } from 'sonner'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

function ScenarioEditorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const courseId = searchParams.get('courseId')
  const moduleId = searchParams.get('moduleId')

  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [moduleTitle, setModuleTitle] = useState('')

  useEffect(() => {
    if (courseId && moduleId) {
      loadModuleScenario()
    } else {
      // Create new empty scenario
      setScenario({
        version: '1.0',
        title: 'Nouvelle formation',
        theme: DEFAULT_THEME,
        settings: DEFAULT_SETTINGS,
        slides: [
          {
            id: 'slide-1',
            type: 'title',
            order: 0,
            title: 'Nouvelle formation',
            subtitle: 'Cliquez pour commencer',
            background: {
              type: 'gradient',
              colors: ['#0A4D4A', '#00A693'],
              direction: 'to-bottom-right',
            },
          },
        ],
      })
      setIsLoading(false)
    }
  }, [courseId, moduleId])

  const loadModuleScenario = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}`)
      if (!response.ok) throw new Error('Erreur de chargement')
      const data = await response.json()
      setModuleTitle(data.title || '')

      if (data.content && data.contentType === 'INTERACTIVE_SCENARIO') {
        try {
          const parsed = JSON.parse(data.content) as Scenario
          setScenario(parsed)
        } catch {
          // Create new scenario with module title
          setScenario({
            version: '1.0',
            title: data.title || 'Nouvelle formation',
            theme: DEFAULT_THEME,
            settings: DEFAULT_SETTINGS,
            slides: [
              {
                id: 'slide-1',
                type: 'title',
                order: 0,
                title: data.title || 'Nouvelle formation',
                subtitle: 'Cliquez pour commencer',
                background: {
                  type: 'gradient',
                  colors: ['#0A4D4A', '#00A693'],
                  direction: 'to-bottom-right',
                },
              },
            ],
          })
        }
      } else {
        setScenario({
          version: '1.0',
          title: data.title || 'Nouvelle formation',
          theme: DEFAULT_THEME,
          settings: DEFAULT_SETTINGS,
          slides: [
            {
              id: 'slide-1',
              type: 'title',
              order: 0,
              title: data.title || 'Nouvelle formation',
              subtitle: 'Cliquez pour commencer',
              background: {
                type: 'gradient',
                colors: ['#0A4D4A', '#00A693'],
                direction: 'to-bottom-right',
              },
            },
          ],
        })
      }
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors du chargement')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (updatedScenario: Scenario) => {
    if (!courseId || !moduleId) {
      // Just update local state if no module context
      setScenario(updatedScenario)
      toast.success('Scenario mis a jour localement')
      return
    }

    try {
      const response = await fetch(`/api/courses/${courseId}/modules/${moduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: JSON.stringify(updatedScenario),
          contentType: 'INTERACTIVE_SCENARIO',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur')
      }

      setScenario(updatedScenario)
      toast.success('Scenario enregistre!')
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handlePreview = (scenarioToPreview: Scenario) => {
    setScenario(scenarioToPreview)
    setShowPreview(true)
  }

  const backUrl = courseId && moduleId
    ? `/dashboard/courses/${courseId}/modules/${moduleId}`
    : '/dashboard/courses'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (showPreview && scenario) {
    return (
      <ImmersivePlayer
        scenario={scenario}
        onExit={() => setShowPreview(false)}
        onComplete={() => setShowPreview(false)}
      />
    )
  }

  if (!scenario) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Erreur lors du chargement du scenario</p>
        <Button asChild>
          <Link href={backUrl}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Back Button Header */}
      <div className="flex items-center gap-4 px-4 py-2 border-b bg-background">
        <Button variant="ghost" size="sm" asChild>
          <Link href={backUrl}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Link>
        </Button>
        {moduleTitle && (
          <span className="text-sm text-muted-foreground">
            Module: {moduleTitle}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <ScenarioEditor
          initialScenario={scenario}
          onSave={handleSave}
          onPreview={handlePreview}
        />
      </div>
    </div>
  )
}

export default function ScenarioEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ScenarioEditorContent />
    </Suspense>
  )
}
