'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { textColors } from '@/lib/background-images'
import { cn } from '@/lib/utils'
import { Check, Palette } from 'lucide-react'

interface ColorPickerProps {
  label?: string
  value?: string
  onChange: (color: string) => void
  presets?: Array<{ id: string; color: string; name: string }>
  showInput?: boolean
  className?: string
}

export function ColorPicker({
  label,
  value = '#FFFFFF',
  onChange,
  presets = textColors,
  showInput = true,
  className,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={cn('space-y-2', className)}>
      {label && <Label>{label}</Label>}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 h-10"
          >
            <div
              className="w-5 h-5 rounded border"
              style={{ backgroundColor: value }}
            />
            <span className="flex-1 text-left text-sm">{value}</span>
            <Palette className="w-4 h-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          <div className="space-y-3">
            <div className="grid grid-cols-8 gap-1.5">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    onChange(preset.color)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'w-6 h-6 rounded border transition-all hover:scale-110',
                    value === preset.color
                      ? 'ring-2 ring-primary ring-offset-1'
                      : 'border-muted-foreground/30'
                  )}
                  style={{ backgroundColor: preset.color }}
                  title={preset.name}
                >
                  {value === preset.color && (
                    <Check className="w-3 h-3 mx-auto text-white drop-shadow" />
                  )}
                </button>
              ))}
            </div>

            {showInput && (
              <div className="flex gap-2 pt-2 border-t">
                <input
                  type="color"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-10 h-8 rounded border cursor-pointer"
                />
                <Input
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder="#FFFFFF"
                  className="h-8 text-sm"
                />
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Compact inline color picker
export function InlineColorPicker({
  value = '#FFFFFF',
  onChange,
  presets = textColors,
}: Omit<ColorPickerProps, 'label' | 'showInput' | 'className'>) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="w-8 h-8 rounded border-2 border-muted-foreground/30 hover:border-primary transition-colors"
          style={{ backgroundColor: value }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="grid grid-cols-8 gap-1">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onChange(preset.color)}
              className={cn(
                'w-6 h-6 rounded border transition-all hover:scale-110',
                value === preset.color
                  ? 'ring-2 ring-primary ring-offset-1'
                  : 'border-muted-foreground/30'
              )}
              style={{ backgroundColor: preset.color }}
              title={preset.name}
            />
          ))}
        </div>
        <div className="flex gap-2 mt-2 pt-2 border-t">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-8 h-6 rounded border cursor-pointer"
          />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#FFFFFF"
            className="h-6 text-xs flex-1"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
