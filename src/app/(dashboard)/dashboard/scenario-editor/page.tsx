'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ScenarioEditor } from '@/components/scenario/editor'
import { ImmersivePlayer } from '@/components/scenario'
import type { Scenario } from '@/types/scenario'
import { DEFAULT_THEME, DEFAULT_SETTINGS } from '@/types/scenario'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

function ScenarioEditorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const lessonId = searchParams.get('lessonId')
  const courseId = searchParams.get('courseId')
  const moduleId = searchParams.get('moduleId')

  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (lessonId && courseId && moduleId) {
      loadLessonScenario()
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
  }, [lessonId, courseId, moduleId])

  const loadLessonScenario = async () => {
    try {
      const response = await fetch(
        `/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`
      )
      if (!response.ok) throw new Error('Erreur de chargement')
      const data = await response.json()

      if (data.content && data.contentType === 'INTERACTIVE_SCENARIO') {
        try {
          const parsed = JSON.parse(data.content) as Scenario
          setScenario(parsed)
        } catch {
          // Create new scenario with lesson title
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
    if (!lessonId || !courseId || !moduleId) {
      // Just update local state if no lesson context
      setScenario(updatedScenario)
      toast.success('Scénario mis à jour')
      return
    }

    try {
      const response = await fetch(
        `/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: JSON.stringify(updatedScenario),
          }),
        }
      )

      if (!response.ok) throw new Error('Erreur')
      setScenario(updatedScenario)
      toast.success('Scénario enregistré')
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  const handlePreview = (scenarioToPreview: Scenario) => {
    setScenario(scenarioToPreview)
    setShowPreview(true)
  }

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
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Erreur lors du chargement du scénario</p>
      </div>
    )
  }

  return (
    <ScenarioEditor
      initialScenario={scenario}
      onSave={handleSave}
      onPreview={handlePreview}
    />
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
