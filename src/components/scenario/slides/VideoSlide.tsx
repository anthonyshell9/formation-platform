'use client'

import { useEffect, useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import type { VideoSlide as VideoSlideType } from '@/types/scenario'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react'

interface VideoSlideProps {
  slide: VideoSlideType
  onComplete?: () => void
}

export function VideoSlide({ slide, onComplete }: VideoSlideProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(slide.muted || false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setIsVisible(true)
    })

    if (slide.autoPlay && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay blocked
      })
    }

    return () => cancelAnimationFrame(timer)
  }, [slide.autoPlay])

  // Hide controls after inactivity
  useEffect(() => {
    if (!isPlaying) return

    const timer = setTimeout(() => setShowControls(false), 3000)
    return () => clearTimeout(timer)
  }, [isPlaying, showControls])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const toggleFullscreen = async () => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const { currentTime, duration } = videoRef.current
      setProgress((currentTime / duration) * 100)
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    onComplete?.()
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return

    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    videoRef.current.currentTime = percent * videoRef.current.duration
  }

  // Check if it's a YouTube/Vimeo URL
  const isExternalVideo = slide.videoUrl.includes('youtube.com') ||
                          slide.videoUrl.includes('youtu.be') ||
                          slide.videoUrl.includes('vimeo.com')

  if (isExternalVideo) {
    // Extract video ID and create embed URL
    let embedUrl = slide.videoUrl

    if (slide.videoUrl.includes('youtube.com/watch')) {
      const videoId = new URL(slide.videoUrl).searchParams.get('v')
      embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${slide.autoPlay ? 1 : 0}&mute=${slide.muted ? 1 : 0}`
    } else if (slide.videoUrl.includes('youtu.be')) {
      const videoId = slide.videoUrl.split('/').pop()
      embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${slide.autoPlay ? 1 : 0}&mute=${slide.muted ? 1 : 0}`
    } else if (slide.videoUrl.includes('vimeo.com')) {
      const videoId = slide.videoUrl.split('/').pop()
      embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=${slide.autoPlay ? 1 : 0}&muted=${slide.muted ? 1 : 0}`
    }

    return (
      <div className="flex flex-col h-full px-8 md:px-16 py-12">
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
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-5xl aspect-video rounded-xl overflow-hidden bg-black">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allowFullScreen
              allow="autoplay; fullscreen; picture-in-picture"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full px-8 md:px-16 py-12">
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
        ref={containerRef}
        className="flex-1 flex items-center justify-center relative group"
        onMouseMove={() => setShowControls(true)}
      >
        <div className="relative w-full max-w-5xl aspect-video rounded-xl overflow-hidden bg-black">
          <video
            ref={videoRef}
            src={slide.videoUrl}
            poster={slide.poster}
            loop={slide.loop}
            muted={isMuted}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={togglePlay}
          />

          {/* Play overlay */}
          {!isPlaying && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
              onClick={togglePlay}
            >
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:scale-110 transition-transform">
                <Play className="w-10 h-10 text-white ml-1" />
              </div>
            </div>
          )}

          {/* Controls */}
          {slide.controls !== false && (
            <div
              className={cn(
                'absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent transition-opacity',
                showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
              )}
            >
              {/* Progress bar */}
              <div
                className="w-full h-1 bg-white/30 rounded-full cursor-pointer mb-3"
                onClick={handleSeek}
              >
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Control buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlay}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 text-white" />
                    ) : (
                      <Play className="w-5 h-5 text-white" />
                    )}
                  </button>
                  <button
                    onClick={toggleMute}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5 text-white" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-white" />
                    )}
                  </button>
                </div>

                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? (
                    <Minimize className="w-5 h-5 text-white" />
                  ) : (
                    <Maximize className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
