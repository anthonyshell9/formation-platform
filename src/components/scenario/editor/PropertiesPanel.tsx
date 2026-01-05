'use client'

import { useState } from 'react'
import type { Slide, Background, ScenarioTheme } from '@/types/scenario'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Plus, Trash2, Upload } from 'lucide-react'

interface PropertiesPanelProps {
  slide: Slide | null
  theme: ScenarioTheme
  onSlideChange: (slide: Slide) => void
  onThemeChange: (theme: ScenarioTheme) => void
}

// Helper to generate IDs
function generateId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Background editor component
function BackgroundEditor({
  background,
  onChange,
}: {
  background?: Background
  onChange: (bg: Background) => void
}) {
  const bgType = background?.type || 'solid'

  return (
    <div className="space-y-3">
      <div>
        <Label>Type de fond</Label>
        <Select
          value={bgType}
          onValueChange={(value) => {
            if (value === 'solid') {
              onChange({ type: 'solid', color: '#0A0A0A' })
            } else if (value === 'gradient') {
              onChange({
                type: 'gradient',
                colors: ['#0A4D4A', '#00A693'],
                direction: 'to-bottom-right',
              })
            } else if (value === 'image') {
              onChange({ type: 'image', url: '' })
            } else if (value === 'video') {
              onChange({ type: 'video', url: '' })
            }
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="solid">Couleur unie</SelectItem>
            <SelectItem value="gradient">Dégradé</SelectItem>
            <SelectItem value="image">Image</SelectItem>
            <SelectItem value="video">Vidéo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {background?.type === 'solid' && (
        <div>
          <Label>Couleur</Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={background.color}
              onChange={(e) => onChange({ ...background, color: e.target.value })}
              className="w-10 h-10 rounded border cursor-pointer"
            />
            <Input
              value={background.color}
              onChange={(e) => onChange({ ...background, color: e.target.value })}
              placeholder="#000000"
            />
          </div>
        </div>
      )}

      {background?.type === 'gradient' && (
        <>
          <div>
            <Label>Couleurs du dégradé</Label>
            <div className="flex gap-2">
              {background.colors.map((color, i) => (
                <div key={i} className="flex items-center gap-1">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => {
                      const newColors = [...background.colors]
                      newColors[i] = e.target.value
                      onChange({ ...background, colors: newColors })
                    }}
                    className="w-8 h-8 rounded border cursor-pointer"
                  />
                </div>
              ))}
              {background.colors.length < 4 && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    onChange({
                      ...background,
                      colors: [...background.colors, '#000000'],
                    })
                  }
                >
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          <div>
            <Label>Direction</Label>
            <Select
              value={background.direction || 'to-bottom'}
              onValueChange={(value) =>
                onChange({
                  ...background,
                  direction: value as Background & { type: 'gradient' } extends { direction: infer D } ? D : never,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="to-bottom">Vers le bas</SelectItem>
                <SelectItem value="to-right">Vers la droite</SelectItem>
                <SelectItem value="to-bottom-right">Diagonale (↘)</SelectItem>
                <SelectItem value="to-top-right">Diagonale (↗)</SelectItem>
                <SelectItem value="radial">Radial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {(background?.type === 'image' || background?.type === 'video') && (
        <>
          <div>
            <Label>URL {background.type === 'image' ? "de l'image" : 'de la vidéo'}</Label>
            <div className="flex gap-2">
              <Input
                value={background.url}
                onChange={(e) => onChange({ ...background, url: e.target.value })}
                placeholder="https://..."
              />
              <Button variant="outline" size="icon">
                <Upload className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label>Overlay (optionnel)</Label>
            <Input
              value={background.overlay || ''}
              onChange={(e) => onChange({ ...background, overlay: e.target.value })}
              placeholder="rgba(0,0,0,0.5)"
            />
          </div>
        </>
      )}
    </div>
  )
}

export function PropertiesPanel({
  slide,
  theme,
  onSlideChange,
  onThemeChange,
}: PropertiesPanelProps) {
  const [activeSection, setActiveSection] = useState<string[]>(['content'])

  if (!slide) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Sélectionnez une slide pour voir ses propriétés</p>
      </div>
    )
  }

  const updateSlide = (updates: Partial<Slide>) => {
    onSlideChange({ ...slide, ...updates } as Slide)
  }

  return (
    <div className="h-full overflow-y-auto border-l bg-muted/30">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Propriétés
        </h3>
      </div>

      <Accordion
        type="multiple"
        value={activeSection}
        onValueChange={setActiveSection}
        className="p-4"
      >
        {/* Content Section */}
        <AccordionItem value="content">
          <AccordionTrigger>Contenu</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            {/* Title slides */}
            {slide.type === 'title' && (
              <>
                <div>
                  <Label>Titre</Label>
                  <Input
                    value={slide.title}
                    onChange={(e) => updateSlide({ title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Sous-titre</Label>
                  <Input
                    value={slide.subtitle || ''}
                    onChange={(e) => updateSlide({ subtitle: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* Content slides */}
            {slide.type === 'content' && (
              <>
                <div>
                  <Label>Titre</Label>
                  <Input
                    value={slide.title || ''}
                    onChange={(e) => updateSlide({ title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Texte</Label>
                  <Textarea
                    value={slide.text}
                    onChange={(e) => updateSlide({ text: e.target.value })}
                    rows={5}
                  />
                </div>
                <div>
                  <Label>Layout</Label>
                  <Select
                    value={slide.layout}
                    onValueChange={(value) => updateSlide({ layout: value as typeof slide.layout })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text-left">Texte à gauche</SelectItem>
                      <SelectItem value="text-right">Texte à droite</SelectItem>
                      <SelectItem value="text-center">Centré</SelectItem>
                      <SelectItem value="split-50">50/50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>URL de l&apos;image</Label>
                  <Input
                    value={slide.image?.url || ''}
                    onChange={(e) =>
                      updateSlide({
                        image: { ...slide.image, url: e.target.value },
                      })
                    }
                    placeholder="https://..."
                  />
                </div>
              </>
            )}

            {/* Quote slides */}
            {slide.type === 'quote' && (
              <>
                <div>
                  <Label>Citation</Label>
                  <Textarea
                    value={slide.quote}
                    onChange={(e) => updateSlide({ quote: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Auteur</Label>
                  <Input
                    value={slide.author || ''}
                    onChange={(e) => updateSlide({ author: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Titre de l&apos;auteur</Label>
                  <Input
                    value={slide.authorTitle || ''}
                    onChange={(e) => updateSlide({ authorTitle: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* Video slides */}
            {slide.type === 'video' && (
              <>
                <div>
                  <Label>Titre</Label>
                  <Input
                    value={slide.title || ''}
                    onChange={(e) => updateSlide({ title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>URL de la vidéo</Label>
                  <Input
                    value={slide.videoUrl}
                    onChange={(e) => updateSlide({ videoUrl: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Lecture auto</Label>
                  <Switch
                    checked={slide.autoPlay || false}
                    onCheckedChange={(checked) => updateSlide({ autoPlay: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Boucle</Label>
                  <Switch
                    checked={slide.loop || false}
                    onCheckedChange={(checked) => updateSlide({ loop: checked })}
                  />
                </div>
              </>
            )}

            {/* Stats slides */}
            {slide.type === 'stats' && (
              <>
                <div>
                  <Label>Titre</Label>
                  <Input
                    value={slide.title || ''}
                    onChange={(e) => updateSlide({ title: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Animation des chiffres</Label>
                  <Switch
                    checked={slide.animateCountUp !== false}
                    onCheckedChange={(checked) =>
                      updateSlide({ animateCountUp: checked })
                    }
                  />
                </div>
                <div>
                  <Label>Statistiques</Label>
                  <div className="space-y-2 mt-2">
                    {slide.stats.map((stat, i) => (
                      <div key={stat.id} className="flex gap-2">
                        <Input
                          value={stat.value}
                          onChange={(e) => {
                            const newStats = [...slide.stats]
                            newStats[i] = {
                              ...stat,
                              value: isNaN(Number(e.target.value))
                                ? e.target.value
                                : Number(e.target.value),
                            }
                            updateSlide({ stats: newStats })
                          }}
                          placeholder="Valeur"
                          className="w-20"
                        />
                        <Input
                          value={stat.label}
                          onChange={(e) => {
                            const newStats = [...slide.stats]
                            newStats[i] = { ...stat, label: e.target.value }
                            updateSlide({ stats: newStats })
                          }}
                          placeholder="Label"
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newStats = slide.stats.filter(
                              (_, idx) => idx !== i
                            )
                            updateSlide({ stats: newStats })
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateSlide({
                          stats: [
                            ...slide.stats,
                            { id: generateId(), value: 0, label: 'Nouvelle stat' },
                          ],
                        })
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Carousel slides */}
            {slide.type === 'carousel' && (
              <>
                <div>
                  <Label>Titre</Label>
                  <Input
                    value={slide.title || ''}
                    onChange={(e) => updateSlide({ title: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Flèches</Label>
                  <Switch
                    checked={slide.showArrows !== false}
                    onCheckedChange={(checked) => updateSlide({ showArrows: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Points</Label>
                  <Switch
                    checked={slide.showDots !== false}
                    onCheckedChange={(checked) => updateSlide({ showDots: checked })}
                  />
                </div>
                <div>
                  <Label>Éléments</Label>
                  <div className="space-y-2 mt-2">
                    {slide.items.map((item, i) => (
                      <div key={item.id} className="p-2 border rounded space-y-2">
                        <Input
                          value={item.title}
                          onChange={(e) => {
                            const newItems = [...slide.items]
                            newItems[i] = { ...item, title: e.target.value }
                            updateSlide({ items: newItems })
                          }}
                          placeholder="Titre"
                        />
                        <Textarea
                          value={item.description || ''}
                          onChange={(e) => {
                            const newItems = [...slide.items]
                            newItems[i] = { ...item, description: e.target.value }
                            updateSlide({ items: newItems })
                          }}
                          placeholder="Description"
                          rows={2}
                        />
                        <Input
                          value={item.image || ''}
                          onChange={(e) => {
                            const newItems = [...slide.items]
                            newItems[i] = { ...item, image: e.target.value }
                            updateSlide({ items: newItems })
                          }}
                          placeholder="URL image"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => {
                            const newItems = slide.items.filter((_, idx) => idx !== i)
                            updateSlide({ items: newItems })
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateSlide({
                          items: [
                            ...slide.items,
                            { id: generateId(), title: 'Nouvel élément' },
                          ],
                        })
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Timeline slides */}
            {slide.type === 'timeline' && (
              <>
                <div>
                  <Label>Titre</Label>
                  <Input
                    value={slide.title || ''}
                    onChange={(e) => updateSlide({ title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Orientation</Label>
                  <Select
                    value={slide.orientation || 'vertical'}
                    onValueChange={(value) =>
                      updateSlide({ orientation: value as 'horizontal' | 'vertical' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vertical">Vertical</SelectItem>
                      <SelectItem value="horizontal">Horizontal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Événements</Label>
                  <div className="space-y-2 mt-2">
                    {slide.events.map((event, i) => (
                      <div key={event.id} className="p-2 border rounded space-y-2">
                        <Input
                          value={event.date || ''}
                          onChange={(e) => {
                            const newEvents = [...slide.events]
                            newEvents[i] = { ...event, date: e.target.value }
                            updateSlide({ events: newEvents })
                          }}
                          placeholder="Date"
                        />
                        <Input
                          value={event.title}
                          onChange={(e) => {
                            const newEvents = [...slide.events]
                            newEvents[i] = { ...event, title: e.target.value }
                            updateSlide({ events: newEvents })
                          }}
                          placeholder="Titre"
                        />
                        <Textarea
                          value={event.description || ''}
                          onChange={(e) => {
                            const newEvents = [...slide.events]
                            newEvents[i] = { ...event, description: e.target.value }
                            updateSlide({ events: newEvents })
                          }}
                          placeholder="Description"
                          rows={2}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => {
                            const newEvents = slide.events.filter((_, idx) => idx !== i)
                            updateSlide({ events: newEvents })
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateSlide({
                          events: [
                            ...slide.events,
                            { id: generateId(), title: 'Nouvel événement' },
                          ],
                        })
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter
                    </Button>
                  </div>
                </div>
              </>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Background Section */}
        <AccordionItem value="background">
          <AccordionTrigger>Arrière-plan</AccordionTrigger>
          <AccordionContent className="pt-2">
            <BackgroundEditor
              background={slide.background}
              onChange={(bg) => updateSlide({ background: bg })}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Audio Section */}
        <AccordionItem value="audio">
          <AccordionTrigger>Audio & Sous-titres</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <div>
              <Label>URL Audio</Label>
              <Input
                value={slide.audio?.url || ''}
                onChange={(e) =>
                  updateSlide({
                    audio: e.target.value ? { url: e.target.value } : undefined,
                  })
                }
                placeholder="https://..."
              />
            </div>
            {slide.audio?.url && (
              <div className="flex items-center justify-between">
                <Label>Lecture automatique</Label>
                <Switch
                  checked={slide.audio?.autoplay || false}
                  onCheckedChange={(checked) =>
                    updateSlide({
                      audio: { ...slide.audio!, autoplay: checked },
                    })
                  }
                />
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Theme Section */}
        <AccordionItem value="theme">
          <AccordionTrigger>Thème global</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <div>
              <Label>Couleur principale</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={theme.primaryColor}
                  onChange={(e) =>
                    onThemeChange({ ...theme, primaryColor: e.target.value })
                  }
                  className="w-10 h-10 rounded border cursor-pointer"
                />
                <Input
                  value={theme.primaryColor}
                  onChange={(e) =>
                    onThemeChange({ ...theme, primaryColor: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Couleur secondaire</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={theme.secondaryColor}
                  onChange={(e) =>
                    onThemeChange({ ...theme, secondaryColor: e.target.value })
                  }
                  className="w-10 h-10 rounded border cursor-pointer"
                />
                <Input
                  value={theme.secondaryColor}
                  onChange={(e) =>
                    onThemeChange({ ...theme, secondaryColor: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Police</Label>
              <Select
                value={theme.font || 'Inter'}
                onValueChange={(value) => onThemeChange({ ...theme, font: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter</SelectItem>
                  <SelectItem value="Roboto">Roboto</SelectItem>
                  <SelectItem value="Open Sans">Open Sans</SelectItem>
                  <SelectItem value="Poppins">Poppins</SelectItem>
                  <SelectItem value="Montserrat">Montserrat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
