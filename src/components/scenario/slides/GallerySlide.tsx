'use client'

import { useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { GallerySlide as GallerySlideType } from '@/types/scenario'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface GallerySlideProps {
  slide: GallerySlideType
}

export function GallerySlide({ slide }: GallerySlideProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const { images, layout = 'grid', columns = 3 } = slide

  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setIsVisible(true)
    })
    return () => cancelAnimationFrame(timer)
  }, [])

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index)
  }, [])

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null)
  }, [])

  const goToPrevious = useCallback(() => {
    if (lightboxIndex === null) return
    setLightboxIndex(lightboxIndex === 0 ? images.length - 1 : lightboxIndex - 1)
  }, [lightboxIndex, images.length])

  const goToNext = useCallback(() => {
    if (lightboxIndex === null) return
    setLightboxIndex((lightboxIndex + 1) % images.length)
  }, [lightboxIndex, images.length])

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') goToPrevious()
      if (e.key === 'ArrowRight') goToNext()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxIndex, closeLightbox, goToPrevious, goToNext])

  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  }[Math.min(columns, 4)]

  return (
    <>
      <div className="flex flex-col h-full px-8 md:px-16 py-12 overflow-auto">
        {slide.title && (
          <h2
            className={cn(
              'text-3xl md:text-4xl font-bold text-white text-center mb-8 transition-all duration-700',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            )}
          >
            {slide.title}
          </h2>
        )}

        <div
          className={cn(
            'grid gap-4',
            layout === 'carousel' ? 'flex overflow-x-auto snap-x' : gridColsClass
          )}
        >
          {images.map((image, index) => (
            <div
              key={image.id}
              className={cn(
                'relative group cursor-pointer overflow-hidden rounded-xl transition-all duration-700',
                layout === 'carousel'
                  ? 'flex-shrink-0 w-80 snap-center'
                  : 'aspect-square',
                isVisible
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-95'
              )}
              style={{ transitionDelay: `${index * 100}ms` }}
              onClick={() => openLightbox(index)}
            >
              <img
                src={image.url}
                alt={image.alt || image.caption || ''}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300">
                {image.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white text-sm">{image.caption}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
            onClick={closeLightbox}
            aria-label="Fermer"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Previous button */}
          {images.length > 1 && (
            <button
              className="absolute left-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
              onClick={(e) => {
                e.stopPropagation()
                goToPrevious()
              }}
              aria-label="Image précédente"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}

          {/* Image */}
          <div
            className="max-w-[90vw] max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[lightboxIndex].url}
              alt={images[lightboxIndex].alt || ''}
              className="max-w-full max-h-[80vh] object-contain"
            />
            {images[lightboxIndex].caption && (
              <p className="mt-4 text-white/80 text-center max-w-xl">
                {images[lightboxIndex].caption}
              </p>
            )}
            <p className="mt-2 text-white/50 text-sm">
              {lightboxIndex + 1} / {images.length}
            </p>
          </div>

          {/* Next button */}
          {images.length > 1 && (
            <button
              className="absolute right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
              onClick={(e) => {
                e.stopPropagation()
                goToNext()
              }}
              aria-label="Image suivante"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}
        </div>
      )}
    </>
  )
}
