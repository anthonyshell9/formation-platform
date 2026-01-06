'use client'

import { useState, useCallback } from 'react'
import type { Scenario, Slide, ScenarioTheme } from '@/types/scenario'
import { DEFAULT_THEME, DEFAULT_SETTINGS } from '@/types/scenario'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Play,
  Save,
  Settings,
  Download,
  Upload,
  Undo,
  Redo,
  Eye,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import { SlideList } from './SlideList'
import { AddSlideDialog } from './AddSlideDialog'
import { PropertiesPanel } from './PropertiesPanel'
import { AnimatedBackground } from '../AnimatedBackground'
import { SlideRenderer } from '../slides'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ScenarioEditorProps {
  initialScenario?: Scenario
  onSave?: (scenario: Scenario) => void
  onPreview?: (scenario: Scenario) => void
  backUrl?: string
  moduleTitle?: string
}

const createEmptyScenario = (title: string = 'Nouvelle formation'): Scenario => ({
  version: '1.0',
  title,
  theme: DEFAULT_THEME,
  settings: DEFAULT_SETTINGS,
  slides: [
    {
      id: 'slide-1',
      type: 'title',
      order: 0,
      title: title,
      subtitle: 'Cliquez pour commencer',
      background: {
        type: 'gradient',
        colors: ['#0A4D4A', '#00A693'],
        direction: 'to-bottom-right',
      },
    },
  ],
})

export function ScenarioEditor({
  initialScenario,
  onSave,
  onPreview,
  backUrl,
  moduleTitle,
}: ScenarioEditorProps) {
  const [scenario, setScenario] = useState<Scenario>(
    initialScenario || createEmptyScenario()
  )
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(
    scenario.slides[0]?.id || null
  )
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [undoStack, setUndoStack] = useState<Scenario[]>([])
  const [redoStack, setRedoStack] = useState<Scenario[]>([])
  const [isDirty, setIsDirty] = useState(false)

  const selectedSlide = scenario.slides.find((s) => s.id === selectedSlideId) || null

  // Update scenario with undo support
  const updateScenario = useCallback(
    (newScenario: Scenario) => {
      setUndoStack((prev) => [...prev.slice(-20), scenario])
      setRedoStack([])
      setScenario(newScenario)
      setIsDirty(true)
    },
    [scenario]
  )

  // Undo/Redo
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return
    const previous = undoStack[undoStack.length - 1]
    setRedoStack((prev) => [...prev, scenario])
    setUndoStack((prev) => prev.slice(0, -1))
    setScenario(previous)
  }, [undoStack, scenario])

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return
    const next = redoStack[redoStack.length - 1]
    setUndoStack((prev) => [...prev, scenario])
    setRedoStack((prev) => prev.slice(0, -1))
    setScenario(next)
  }, [redoStack, scenario])

  // Slide operations
  const handleAddSlide = useCallback(
    (newSlide: Slide) => {
      updateScenario({
        ...scenario,
        slides: [...scenario.slides, newSlide],
      })
      setSelectedSlideId(newSlide.id)
    },
    [scenario, updateScenario]
  )

  const handleDeleteSlide = useCallback(
    (slideId: string) => {
      if (scenario.slides.length <= 1) return // Keep at least one slide

      const index = scenario.slides.findIndex((s) => s.id === slideId)
      const newSlides = scenario.slides.filter((s) => s.id !== slideId)

      // Reorder remaining slides
      const reorderedSlides = newSlides.map((slide, i) => ({
        ...slide,
        order: i,
      }))

      updateScenario({ ...scenario, slides: reorderedSlides })

      // Select adjacent slide
      if (selectedSlideId === slideId) {
        const newIndex = Math.min(index, newSlides.length - 1)
        setSelectedSlideId(newSlides[newIndex]?.id || null)
      }
    },
    [scenario, selectedSlideId, updateScenario]
  )

  const handleDuplicateSlide = useCallback(
    (slideId: string) => {
      const slide = scenario.slides.find((s) => s.id === slideId)
      if (!slide) return

      const newSlide: Slide = {
        ...slide,
        id: `slide-${Date.now()}`,
        order: scenario.slides.length,
      }

      updateScenario({
        ...scenario,
        slides: [...scenario.slides, newSlide],
      })
      setSelectedSlideId(newSlide.id)
    },
    [scenario, updateScenario]
  )

  const handleSlideChange = useCallback(
    (updatedSlide: Slide) => {
      const newSlides = scenario.slides.map((s) =>
        s.id === updatedSlide.id ? updatedSlide : s
      )
      updateScenario({ ...scenario, slides: newSlides })
    },
    [scenario, updateScenario]
  )

  const handleThemeChange = useCallback(
    (theme: ScenarioTheme) => {
      updateScenario({ ...scenario, theme })
    },
    [scenario, updateScenario]
  )

  const handleReorderSlides = useCallback(
    (fromIndex: number, toIndex: number) => {
      const newSlides = [...scenario.slides]
      const [movedSlide] = newSlides.splice(fromIndex, 1)
      newSlides.splice(toIndex, 0, movedSlide)

      // Update order property
      const reorderedSlides = newSlides.map((slide, i) => ({
        ...slide,
        order: i,
      }))

      updateScenario({ ...scenario, slides: reorderedSlides })
    },
    [scenario, updateScenario]
  )

  // Export/Import
  const handleExport = useCallback(() => {
    try {
      const dataStr = JSON.stringify(scenario, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `${scenario.title.replace(/\s+/g, '-').toLowerCase() || 'scenario'}.json`
      a.style.display = 'none'

      // Append to body for better browser compatibility
      document.body.appendChild(a)
      a.click()

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Erreur lors de l\'export')
    }
  }, [scenario])

  const handleImport = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string) as Scenario
          updateScenario(imported)
          setSelectedSlideId(imported.slides[0]?.id || null)
        } catch {
          alert('Fichier invalide')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }, [updateScenario])

  const nextOrder = scenario.slides.length

  return (
    <div className="h-screen flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
        <div className="flex items-center gap-2">
          {backUrl && (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href={backUrl}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour
                </Link>
              </Button>
              {moduleTitle && (
                <span className="text-sm text-muted-foreground">
                  {moduleTitle}
                </span>
              )}
              <div className="w-px h-6 bg-border mx-2" />
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleUndo}
            disabled={undoStack.length === 0}
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
          >
            <Redo className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-2" />

          <Button variant="ghost" size="icon" onClick={handleImport}>
            <Upload className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleExport}>
            <Download className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Paramètres
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Paramètres de la formation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Navigation</Label>
                  <Select
                    value={scenario.settings.navigation}
                    onValueChange={(value) =>
                      updateScenario({
                        ...scenario,
                        settings: {
                          ...scenario.settings,
                          navigation: value as 'vertical' | 'horizontal' | 'free',
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vertical">Verticale</SelectItem>
                      <SelectItem value="horizontal">Horizontale</SelectItem>
                      <SelectItem value="free">Libre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Afficher la progression</Label>
                  <Switch
                    checked={scenario.settings.showProgress}
                    onCheckedChange={(checked) =>
                      updateScenario({
                        ...scenario,
                        settings: { ...scenario.settings, showProgress: checked },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Flèches de navigation</Label>
                  <Switch
                    checked={scenario.settings.showNavArrows}
                    onCheckedChange={(checked) =>
                      updateScenario({
                        ...scenario,
                        settings: { ...scenario.settings, showNavArrows: checked },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Navigation clavier</Label>
                  <Switch
                    checked={scenario.settings.allowKeyboardNavigation}
                    onCheckedChange={(checked) =>
                      updateScenario({
                        ...scenario,
                        settings: {
                          ...scenario.settings,
                          allowKeyboardNavigation: checked,
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Navigation tactile</Label>
                  <Switch
                    checked={scenario.settings.allowSwipeNavigation}
                    onCheckedChange={(checked) =>
                      updateScenario({
                        ...scenario,
                        settings: {
                          ...scenario.settings,
                          allowSwipeNavigation: checked,
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Bouton quitter</Label>
                  <Switch
                    checked={scenario.settings.showExitButton}
                    onCheckedChange={(checked) =>
                      updateScenario({
                        ...scenario,
                        settings: { ...scenario.settings, showExitButton: checked },
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Type de transition</Label>
                  <Select
                    value={scenario.settings.transitionType}
                    onValueChange={(value) =>
                      updateScenario({
                        ...scenario,
                        settings: {
                          ...scenario.settings,
                          transitionType: value as 'fade' | 'slide' | 'zoom' | 'none',
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fade">Fondu</SelectItem>
                      <SelectItem value="slide">Glissade</SelectItem>
                      <SelectItem value="zoom">Zoom</SelectItem>
                      <SelectItem value="none">Aucune</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {onPreview && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPreview(scenario)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Aperçu
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={() => onPreview?.(scenario)}>
            <Play className="w-4 h-4 mr-2" />
            Tester
          </Button>

          {onSave && (
            <Button size="sm" onClick={() => onSave(scenario)} disabled={!isDirty}>
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Slide List */}
        <div className="w-64 flex-shrink-0">
          <SlideList
            slides={scenario.slides}
            selectedSlideId={selectedSlideId}
            onSelectSlide={setSelectedSlideId}
            onAddSlide={() => setShowAddDialog(true)}
            onDeleteSlide={handleDeleteSlide}
            onDuplicateSlide={handleDuplicateSlide}
            onReorderSlides={handleReorderSlides}
          />
        </div>

        {/* Preview */}
        <div className="flex-1 bg-muted/50 p-4 overflow-auto">
          <div className="mx-auto max-w-4xl">
            <div
              className={cn(
                'aspect-video rounded-xl overflow-hidden shadow-2xl border',
                'bg-black relative'
              )}
            >
              {selectedSlide ? (
                <AnimatedBackground background={selectedSlide.background}>
                  <SlideRenderer slide={selectedSlide} />
                </AnimatedBackground>
              ) : (
                <div className="flex items-center justify-center h-full text-white/50">
                  Sélectionnez une slide
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-80 flex-shrink-0">
          <PropertiesPanel
            slide={selectedSlide}
            theme={scenario.theme}
            onSlideChange={handleSlideChange}
            onThemeChange={handleThemeChange}
          />
        </div>
      </div>

      {/* Add Slide Dialog */}
      <AddSlideDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAddSlide={handleAddSlide}
        nextOrder={nextOrder}
      />
    </div>
  )
}
