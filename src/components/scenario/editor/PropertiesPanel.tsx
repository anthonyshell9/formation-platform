'use client'

import { useState } from 'react'
import type { Slide, ScenarioTheme, ScenarioElement } from '@/types/scenario'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
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
import { BackgroundPicker } from './BackgroundPicker'
import { ColorPicker, InlineColorPicker } from './ColorPicker'
import { textColors, accentColors } from '@/lib/background-images'
import { Plus, Trash2, Image, Type, Video, Sparkles, Move, GripVertical } from 'lucide-react'

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

const animationTypes = [
  { value: 'none', label: 'Aucune' },
  { value: 'fade-in', label: 'Fondu' },
  { value: 'slide-up', label: 'Glisser (haut)' },
  { value: 'slide-down', label: 'Glisser (bas)' },
  { value: 'slide-left', label: 'Glisser (gauche)' },
  { value: 'slide-right', label: 'Glisser (droite)' },
  { value: 'zoom-in', label: 'Zoom avant' },
  { value: 'zoom-out', label: 'Zoom arrière' },
  { value: 'bounce', label: 'Rebond' },
  { value: 'pulse', label: 'Pulsation' },
  { value: 'shake', label: 'Secousse' },
  { value: 'rotate', label: 'Rotation' },
  { value: 'flip', label: 'Retournement' },
  { value: 'blur-in', label: 'Flou' },
]

export function PropertiesPanel({
  slide,
  theme,
  onSlideChange,
  onThemeChange,
}: PropertiesPanelProps) {
  const [activeSection, setActiveSection] = useState<string[]>(['content', 'background'])

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

  // Helper for scenario elements
  const updateElement = (elementId: string, updates: Partial<ScenarioElement>) => {
    if (slide.type !== 'scenario') return
    const newElements = slide.elements?.map((el) =>
      el.id === elementId ? { ...el, ...updates } : el
    )
    updateSlide({ elements: newElements })
  }

  const addElement = (type: ScenarioElement['type']) => {
    if (slide.type !== 'scenario') return
    const newElement: ScenarioElement = {
      id: generateId(),
      type,
      content: type === 'text' ? 'Nouveau texte' : type === 'icon' ? '🔒' : '',
      animation: { type: 'fade-in', duration: 500 },
    }
    updateSlide({ elements: [...(slide.elements || []), newElement] })
  }

  const removeElement = (elementId: string) => {
    if (slide.type !== 'scenario') return
    updateSlide({ elements: slide.elements?.filter((el) => el.id !== elementId) })
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
                <ColorPicker
                  label="Couleur du titre"
                  value={slide.titleColor || '#FFFFFF'}
                  onChange={(color) => updateSlide({ titleColor: color })}
                  presets={textColors}
                />
                <ColorPicker
                  label="Couleur du sous-titre"
                  value={slide.subtitleColor || '#FFFFFF'}
                  onChange={(color) => updateSlide({ subtitleColor: color })}
                  presets={textColors}
                />
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
                <ColorPicker
                  label="Couleur du titre"
                  value={slide.titleColor || '#FFFFFF'}
                  onChange={(color) => updateSlide({ titleColor: color })}
                  presets={textColors}
                />
                <div>
                  <Label>Texte</Label>
                  <Textarea
                    value={slide.text}
                    onChange={(e) => updateSlide({ text: e.target.value })}
                    rows={5}
                  />
                </div>
                <ColorPicker
                  label="Couleur du texte"
                  value={slide.textColor || '#E5E5E5'}
                  onChange={(color) => updateSlide({ textColor: color })}
                  presets={textColors}
                />
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
                <ColorPicker
                  label="Couleur de la citation"
                  value={slide.quoteColor || '#FFFFFF'}
                  onChange={(color) => updateSlide({ quoteColor: color })}
                  presets={textColors}
                />
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
                <ColorPicker
                  label="Couleur accent"
                  value={slide.accentColor || '#00A693'}
                  onChange={(color) => updateSlide({ accentColor: color })}
                  presets={accentColors}
                />
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
                <ColorPicker
                  label="Couleur du titre"
                  value={slide.titleColor || '#FFFFFF'}
                  onChange={(color) => updateSlide({ titleColor: color })}
                  presets={textColors}
                />
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
                <ColorPicker
                  label="Couleur du titre"
                  value={slide.titleColor || '#FFFFFF'}
                  onChange={(color) => updateSlide({ titleColor: color })}
                  presets={textColors}
                />
                <ColorPicker
                  label="Couleur des chiffres"
                  value={slide.valueColor || '#00A693'}
                  onChange={(color) => updateSlide({ valueColor: color })}
                  presets={accentColors}
                />
                <ColorPicker
                  label="Couleur des labels"
                  value={slide.labelColor || '#E5E5E5'}
                  onChange={(color) => updateSlide({ labelColor: color })}
                  presets={textColors}
                />
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
                      <div key={stat.id} className="flex gap-2 items-center">
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
                          value={stat.suffix || ''}
                          onChange={(e) => {
                            const newStats = [...slide.stats]
                            newStats[i] = { ...stat, suffix: e.target.value }
                            updateSlide({ stats: newStats })
                          }}
                          placeholder="%"
                          className="w-12"
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
                <ColorPicker
                  label="Couleur du titre"
                  value={slide.titleColor || '#FFFFFF'}
                  onChange={(color) => updateSlide({ titleColor: color })}
                  presets={textColors}
                />
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
                <ColorPicker
                  label="Couleur du titre"
                  value={slide.titleColor || '#FFFFFF'}
                  onChange={(color) => updateSlide({ titleColor: color })}
                  presets={textColors}
                />
                <ColorPicker
                  label="Couleur de la ligne"
                  value={slide.lineColor || '#00A693'}
                  onChange={(color) => updateSlide({ lineColor: color })}
                  presets={accentColors}
                />
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

            {/* Scenario slides - NEW COMPLETE EDITOR */}
            {slide.type === 'scenario' && (
              <>
                <div>
                  <Label>Titre de la scène</Label>
                  <Input
                    value={slide.title || ''}
                    onChange={(e) => updateSlide({ title: e.target.value })}
                    placeholder="Titre optionnel"
                  />
                </div>
                <ColorPicker
                  label="Couleur du titre"
                  value={slide.titleColor || '#FFFFFF'}
                  onChange={(color) => updateSlide({ titleColor: color })}
                  presets={textColors}
                />

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <Label>Éléments de la scène</Label>
                  </div>

                  {/* Add element buttons */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addElement('text')}
                    >
                      <Type className="w-4 h-4 mr-1" />
                      Texte
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addElement('image')}
                    >
                      <Image className="w-4 h-4 mr-1" />
                      Image
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addElement('icon')}
                    >
                      <Sparkles className="w-4 h-4 mr-1" />
                      Icône
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addElement('video')}
                    >
                      <Video className="w-4 h-4 mr-1" />
                      Vidéo
                    </Button>
                  </div>

                  {/* Elements list */}
                  <div className="space-y-3">
                    {(!slide.elements || slide.elements.length === 0) && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Ajoutez des éléments à votre scène
                      </p>
                    )}
                    {slide.elements?.map((element, i) => (
                      <div
                        key={element.id}
                        className="p-3 border rounded-lg space-y-3 bg-background"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium capitalize">
                              {element.type === 'text' && 'Texte'}
                              {element.type === 'image' && 'Image'}
                              {element.type === 'icon' && 'Icône'}
                              {element.type === 'video' && 'Vidéo'}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeElement(element.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>

                        {/* Content based on type */}
                        {element.type === 'text' && (
                          <>
                            <Textarea
                              value={element.content}
                              onChange={(e) =>
                                updateElement(element.id, { content: e.target.value })
                              }
                              placeholder="Votre texte..."
                              rows={2}
                            />
                            <div className="flex items-center gap-2">
                              <Label className="text-xs">Couleur</Label>
                              <InlineColorPicker
                                value={element.color || '#FFFFFF'}
                                onChange={(color) =>
                                  updateElement(element.id, { color })
                                }
                                presets={textColors}
                              />
                            </div>
                          </>
                        )}

                        {element.type === 'image' && (
                          <Input
                            value={element.content}
                            onChange={(e) =>
                              updateElement(element.id, { content: e.target.value })
                            }
                            placeholder="URL de l'image..."
                          />
                        )}

                        {element.type === 'icon' && (
                          <div className="flex gap-2">
                            <Input
                              value={element.content}
                              onChange={(e) =>
                                updateElement(element.id, { content: e.target.value })
                              }
                              placeholder="🔒 Emoji ou icône..."
                              className="flex-1"
                            />
                          </div>
                        )}

                        {element.type === 'video' && (
                          <Input
                            value={element.content}
                            onChange={(e) =>
                              updateElement(element.id, { content: e.target.value })
                            }
                            placeholder="URL de la vidéo..."
                          />
                        )}

                        {/* Position */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Position X (%)</Label>
                            <Slider
                              value={[element.position?.x || 50]}
                              min={0}
                              max={100}
                              step={1}
                              onValueChange={([x]) =>
                                updateElement(element.id, {
                                  position: { x, y: element.position?.y || 50 },
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Position Y (%)</Label>
                            <Slider
                              value={[element.position?.y || 50]}
                              min={0}
                              max={100}
                              step={1}
                              onValueChange={([y]) =>
                                updateElement(element.id, {
                                  position: { x: element.position?.x || 50, y },
                                })
                              }
                            />
                          </div>
                        </div>

                        {/* Size */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Largeur (%)</Label>
                            <Input
                              type="number"
                              value={element.size?.width || ''}
                              onChange={(e) =>
                                updateElement(element.id, {
                                  size: {
                                    width: Number(e.target.value) || undefined,
                                    height: element.size?.height,
                                  },
                                })
                              }
                              placeholder="Auto"
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Hauteur (%)</Label>
                            <Input
                              type="number"
                              value={element.size?.height || ''}
                              onChange={(e) =>
                                updateElement(element.id, {
                                  size: {
                                    width: element.size?.width,
                                    height: Number(e.target.value) || undefined,
                                  },
                                })
                              }
                              placeholder="Auto"
                              className="h-8"
                            />
                          </div>
                        </div>

                        {/* Animation */}
                        <div>
                          <Label className="text-xs">Animation</Label>
                          <Select
                            value={element.animation?.type || 'none'}
                            onValueChange={(value) =>
                              updateElement(element.id, {
                                animation: {
                                  ...element.animation,
                                  type: value as ScenarioElement['animation'] extends { type: infer T } ? T : never,
                                },
                              })
                            }
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {animationTypes.map((anim) => (
                                <SelectItem key={anim.value} value={anim.value}>
                                  {anim.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Timing */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Délai (ms)</Label>
                            <Input
                              type="number"
                              value={element.animation?.delay || 0}
                              onChange={(e) =>
                                updateElement(element.id, {
                                  animation: {
                                    ...element.animation,
                                    type: element.animation?.type || 'fade-in',
                                    delay: Number(e.target.value),
                                  },
                                })
                              }
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Durée (ms)</Label>
                            <Input
                              type="number"
                              value={element.animation?.duration || 500}
                              onChange={(e) =>
                                updateElement(element.id, {
                                  animation: {
                                    ...element.animation,
                                    type: element.animation?.type || 'fade-in',
                                    duration: Number(e.target.value),
                                  },
                                })
                              }
                              className="h-8"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Gallery slides */}
            {slide.type === 'gallery' && (
              <>
                <div>
                  <Label>Titre</Label>
                  <Input
                    value={slide.title || ''}
                    onChange={(e) => updateSlide({ title: e.target.value })}
                  />
                </div>
                <ColorPicker
                  label="Couleur du titre"
                  value={slide.titleColor || '#FFFFFF'}
                  onChange={(color) => updateSlide({ titleColor: color })}
                  presets={textColors}
                />
                <div>
                  <Label>Colonnes</Label>
                  <Select
                    value={String(slide.columns || 3)}
                    onValueChange={(value) => updateSlide({ columns: Number(value) as 2 | 3 | 4 })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 colonnes</SelectItem>
                      <SelectItem value="3">3 colonnes</SelectItem>
                      <SelectItem value="4">4 colonnes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Images</Label>
                  <div className="space-y-2 mt-2">
                    {slide.images.map((img, i) => (
                      <div key={img.id} className="flex gap-2">
                        <Input
                          value={img.url}
                          onChange={(e) => {
                            const newImages = [...slide.images]
                            newImages[i] = { ...img, url: e.target.value }
                            updateSlide({ images: newImages })
                          }}
                          placeholder="URL"
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newImages = slide.images.filter((_, idx) => idx !== i)
                            updateSlide({ images: newImages })
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
                          images: [...slide.images, { id: generateId(), url: '' }],
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

            {/* Interactive slides */}
            {slide.type === 'interactive' && (
              <>
                <div>
                  <Label>Titre</Label>
                  <Input
                    value={slide.title || ''}
                    onChange={(e) => updateSlide({ title: e.target.value })}
                  />
                </div>
                <ColorPicker
                  label="Couleur du titre"
                  value={slide.titleColor || '#FFFFFF'}
                  onChange={(color) => updateSlide({ titleColor: color })}
                  presets={textColors}
                />
                <div>
                  <Label>Instructions</Label>
                  <Textarea
                    value={slide.instructions || ''}
                    onChange={(e) => updateSlide({ instructions: e.target.value })}
                    placeholder="Instructions pour l'exercice..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Type d&apos;exercice</Label>
                  <Select
                    value={slide.interactiveType}
                    onValueChange={(value) =>
                      updateSlide({
                        interactiveType: value as typeof slide.interactiveType,
                        config: {}, // Reset config when type changes
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="drag-drop">Glisser-Déposer</SelectItem>
                      <SelectItem value="matching">Association</SelectItem>
                      <SelectItem value="fill-blank">Texte à trous</SelectItem>
                      <SelectItem value="hotspot">Zones cliquables</SelectItem>
                      <SelectItem value="sorting">Classement</SelectItem>
                      <SelectItem value="flashcards">Flashcards</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Quiz-specific config */}
                {slide.interactiveType === 'quiz' && (
                  <div>
                    <Label>ID du Quiz</Label>
                    <Input
                      value={(slide.config as Record<string, unknown>)?.quizId as string || ''}
                      onChange={(e) =>
                        updateSlide({
                          config: { ...slide.config, quizId: e.target.value },
                        })
                      }
                      placeholder="ID du quiz existant..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Entrez l&apos;ID d&apos;un quiz existant pour l&apos;intégrer
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label>Afficher le score</Label>
                  <Switch
                    checked={slide.showScore !== false}
                    onCheckedChange={(checked) => updateSlide({ showScore: checked })}
                  />
                </div>
              </>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Background Section */}
        <AccordionItem value="background">
          <AccordionTrigger>Arrière-plan</AccordionTrigger>
          <AccordionContent className="pt-2">
            <BackgroundPicker
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
              <Label>URL Audio (MP3)</Label>
              <Input
                value={slide.audio?.url || ''}
                onChange={(e) =>
                  updateSlide({
                    audio: e.target.value
                      ? { ...slide.audio, url: e.target.value }
                      : undefined,
                  })
                }
                placeholder="https://exemple.com/audio.mp3"
              />
            </div>
            {slide.audio?.url && (
              <>
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
                <div className="flex items-center justify-between">
                  <Label>Boucle</Label>
                  <Switch
                    checked={slide.audio?.loop || false}
                    onCheckedChange={(checked) =>
                      updateSlide({
                        audio: { ...slide.audio!, loop: checked },
                      })
                    }
                  />
                </div>
              </>
            )}

            <div className="pt-4 border-t">
              <Label>Sous-titres</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Ajoutez des sous-titres synchronisés avec l&apos;audio (format: début-fin en secondes)
              </p>
              <div className="space-y-2">
                {(slide.subtitles || []).map((subtitle, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        value={subtitle.start}
                        onChange={(e) => {
                          const newSubtitles = [...(slide.subtitles || [])]
                          newSubtitles[i] = { ...subtitle, start: Number(e.target.value) }
                          updateSlide({ subtitles: newSubtitles })
                        }}
                        placeholder="0"
                        className="w-16 h-8 text-xs"
                      />
                      <Input
                        type="number"
                        value={subtitle.end}
                        onChange={(e) => {
                          const newSubtitles = [...(slide.subtitles || [])]
                          newSubtitles[i] = { ...subtitle, end: Number(e.target.value) }
                          updateSlide({ subtitles: newSubtitles })
                        }}
                        placeholder="5"
                        className="w-16 h-8 text-xs"
                      />
                    </div>
                    <Input
                      value={subtitle.text}
                      onChange={(e) => {
                        const newSubtitles = [...(slide.subtitles || [])]
                        newSubtitles[i] = { ...subtitle, text: e.target.value }
                        updateSlide({ subtitles: newSubtitles })
                      }}
                      placeholder="Texte du sous-titre..."
                      className="flex-1 h-8 text-xs"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        const newSubtitles = (slide.subtitles || []).filter((_, idx) => idx !== i)
                        updateSlide({ subtitles: newSubtitles })
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const lastEnd = slide.subtitles?.length
                      ? slide.subtitles[slide.subtitles.length - 1].end
                      : 0
                    updateSlide({
                      subtitles: [
                        ...(slide.subtitles || []),
                        { start: lastEnd, end: lastEnd + 5, text: '' },
                      ],
                    })
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un sous-titre
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Theme Section */}
        <AccordionItem value="theme">
          <AccordionTrigger>Thème global</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <ColorPicker
              label="Couleur principale"
              value={theme.primaryColor}
              onChange={(color) => onThemeChange({ ...theme, primaryColor: color })}
              presets={accentColors}
            />
            <ColorPicker
              label="Couleur secondaire"
              value={theme.secondaryColor}
              onChange={(color) => onThemeChange({ ...theme, secondaryColor: color })}
              presets={accentColors}
            />
            <ColorPicker
              label="Couleur du texte"
              value={theme.textColor || '#FFFFFF'}
              onChange={(color) => onThemeChange({ ...theme, textColor: color })}
              presets={textColors}
            />
            <ColorPicker
              label="Couleur d'accent"
              value={theme.accentColor || '#00A693'}
              onChange={(color) => onThemeChange({ ...theme, accentColor: color })}
              presets={accentColors}
            />
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
