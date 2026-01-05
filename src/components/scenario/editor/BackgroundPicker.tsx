'use client'

import { useState } from 'react'
// Using <img> for dynamic URLs from user content
import type { Background } from '@/types/scenario'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getAllBackgroundImages,
  presetGradients,
  presetColors,
} from '@/lib/background-images'
import { ImageIcon, Palette, Sparkles, Video, Plus, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BackgroundPickerProps {
  background?: Background
  onChange: (bg: Background) => void
}

export function BackgroundPicker({ background, onChange }: BackgroundPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<string>(background?.type || 'solid')
  const [searchQuery, setSearchQuery] = useState('')

  const allImages = getAllBackgroundImages()
  const filteredImages = searchQuery
    ? allImages.filter(
        (img) =>
          img.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
          img.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allImages

  const handleSelectImage = (url: string) => {
    onChange({ type: 'image', url, overlay: 'rgba(0,0,0,0.5)' })
    setIsOpen(false)
  }

  const handleSelectGradient = (colors: string[]) => {
    onChange({ type: 'gradient', colors, direction: 'to-bottom-right' })
    setIsOpen(false)
  }

  const handleSelectSolid = (color: string) => {
    onChange({ type: 'solid', color })
    setIsOpen(false)
  }

  const getCurrentPreview = () => {
    if (!background) return null

    switch (background.type) {
      case 'solid':
        return (
          <div
            className="w-full h-20 rounded-lg border"
            style={{ backgroundColor: background.color }}
          />
        )
      case 'gradient':
        return (
          <div
            className="w-full h-20 rounded-lg border"
            style={{
              background: `linear-gradient(${
                background.direction === 'to-bottom'
                  ? '180deg'
                  : background.direction === 'to-right'
                    ? '90deg'
                    : background.direction === 'to-bottom-right'
                      ? '135deg'
                      : background.direction === 'radial'
                        ? 'circle'
                        : '45deg'
              }, ${background.colors.join(', ')})`,
            }}
          />
        )
      case 'image':
        return (
          <div className="relative w-full h-20 rounded-lg border overflow-hidden">
            <img
              src={background.url}
              alt="Background"
              className="w-full h-full object-cover"
            />
            {background.overlay && (
              <div
                className="absolute inset-0"
                style={{ backgroundColor: background.overlay }}
              />
            )}
          </div>
        )
      case 'video':
        return (
          <div className="w-full h-20 rounded-lg border bg-gray-900 flex items-center justify-center">
            <Video className="w-8 h-8 text-gray-400" />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-3">
      <Label>Arrière-plan</Label>

      {/* Current Preview */}
      {getCurrentPreview()}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Palette className="w-4 h-4 mr-2" />
            Changer l&apos;arrière-plan
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Choisir un arrière-plan</DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="solid" className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-r from-gray-800 to-gray-600" />
                Couleur
              </TabsTrigger>
              <TabsTrigger value="gradient" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Dégradé
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Images
              </TabsTrigger>
              <TabsTrigger value="video" className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                Vidéo
              </TabsTrigger>
            </TabsList>

            {/* Solid Colors */}
            <TabsContent value="solid" className="space-y-4">
              <div className="grid grid-cols-8 gap-2">
                {presetColors.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectSolid(preset.color)}
                    className={cn(
                      'w-full aspect-square rounded-lg border-2 transition-all hover:scale-105',
                      background?.type === 'solid' && background.color === preset.color
                        ? 'border-primary ring-2 ring-primary/50'
                        : 'border-transparent hover:border-muted-foreground/50'
                    )}
                    style={{ backgroundColor: preset.color }}
                    title={preset.name}
                  >
                    {background?.type === 'solid' && background.color === preset.color && (
                      <Check className="w-4 h-4 text-white mx-auto" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <Label>Couleur personnalisée</Label>
                <div className="flex gap-2 flex-1">
                  <input
                    type="color"
                    value={background?.type === 'solid' ? background.color : '#000000'}
                    onChange={(e) => handleSelectSolid(e.target.value)}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={background?.type === 'solid' ? background.color : ''}
                    onChange={(e) => handleSelectSolid(e.target.value)}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Gradients */}
            <TabsContent value="gradient" className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                {presetGradients.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectGradient(preset.colors)}
                    className={cn(
                      'h-20 rounded-lg border-2 transition-all hover:scale-105 relative overflow-hidden',
                      background?.type === 'gradient' &&
                        JSON.stringify(background.colors) === JSON.stringify(preset.colors)
                        ? 'border-primary ring-2 ring-primary/50'
                        : 'border-transparent hover:border-muted-foreground/50'
                    )}
                    style={{
                      background: `linear-gradient(135deg, ${preset.colors.join(', ')})`,
                    }}
                  >
                    <span className="absolute bottom-1 left-1 right-1 text-xs text-white bg-black/50 rounded px-1 truncate">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>

              <div className="space-y-3 pt-4 border-t">
                <Label>Dégradé personnalisé</Label>
                <div className="flex gap-2 items-center">
                  {(background?.type === 'gradient' ? background.colors : ['#000000', '#333333']).map(
                    (color, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => {
                            const currentColors =
                              background?.type === 'gradient'
                                ? [...background.colors]
                                : ['#000000', '#333333']
                            currentColors[i] = e.target.value
                            onChange({ type: 'gradient', colors: currentColors, direction: 'to-bottom-right' })
                          }}
                          className="w-8 h-8 rounded border cursor-pointer"
                        />
                      </div>
                    )
                  )}
                  {(background?.type !== 'gradient' || background.colors.length < 4) && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const currentColors =
                          background?.type === 'gradient'
                            ? [...background.colors]
                            : ['#000000', '#333333']
                        onChange({
                          type: 'gradient',
                          colors: [...currentColors, '#666666'],
                          direction: 'to-bottom-right',
                        })
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <Select
                  value={background?.type === 'gradient' ? background.direction : 'to-bottom-right'}
                  onValueChange={(value) => {
                    if (background?.type === 'gradient') {
                      onChange({ ...background, direction: value as Background & { type: 'gradient' } extends { direction: infer D } ? D : never })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Direction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="to-bottom">Vers le bas ↓</SelectItem>
                    <SelectItem value="to-right">Vers la droite →</SelectItem>
                    <SelectItem value="to-bottom-right">Diagonale ↘</SelectItem>
                    <SelectItem value="to-top-right">Diagonale ↗</SelectItem>
                    <SelectItem value="radial">Radial ●</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Images */}
            <TabsContent value="image" className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Rechercher des images..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
              </div>

              <ScrollArea className="h-[400px]">
                <div className="grid grid-cols-5 gap-2 pr-4">
                  {filteredImages.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => handleSelectImage(img.url)}
                      className={cn(
                        'relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-105',
                        background?.type === 'image' && background.url === img.url
                          ? 'border-primary ring-2 ring-primary/50'
                          : 'border-transparent hover:border-muted-foreground/50'
                      )}
                    >
                      <img
                        src={img.thumbnail}
                        alt={img.category}
                        className="w-full h-full object-cover"
                      />
                      {background?.type === 'image' && background.url === img.url && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Check className="w-6 h-6 text-white drop-shadow-lg" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex items-center gap-3 pt-4 border-t">
                <Label>URL personnalisée</Label>
                <Input
                  value={background?.type === 'image' ? background.url : ''}
                  onChange={(e) =>
                    onChange({ type: 'image', url: e.target.value, overlay: 'rgba(0,0,0,0.5)' })
                  }
                  placeholder="https://..."
                  className="flex-1"
                />
              </div>

              {background?.type === 'image' && (
                <div className="flex items-center gap-3">
                  <Label>Overlay</Label>
                  <Input
                    value={background.overlay || ''}
                    onChange={(e) => onChange({ ...background, overlay: e.target.value })}
                    placeholder="rgba(0,0,0,0.5)"
                    className="flex-1"
                  />
                </div>
              )}
            </TabsContent>

            {/* Video */}
            <TabsContent value="video" className="space-y-4">
              <div>
                <Label>URL de la vidéo</Label>
                <Input
                  value={background?.type === 'video' ? background.url : ''}
                  onChange={(e) =>
                    onChange({ type: 'video', url: e.target.value, overlay: 'rgba(0,0,0,0.5)' })
                  }
                  placeholder="https://..."
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Utilisez une URL de vidéo MP4 pour un fond animé
                </p>
              </div>

              {background?.type === 'video' && (
                <div>
                  <Label>Overlay</Label>
                  <Input
                    value={background.overlay || ''}
                    onChange={(e) => onChange({ ...background, overlay: e.target.value })}
                    placeholder="rgba(0,0,0,0.5)"
                    className="mt-1.5"
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
