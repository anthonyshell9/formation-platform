'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Volume2, VolumeX, Play, Pause } from 'lucide-react'
import type { AudioConfig, Subtitle } from '@/types/scenario'

interface AudioPlayerProps {
  audio?: AudioConfig
  subtitles?: Subtitle[]
  showSubtitles?: boolean
  subtitleStyle?: {
    backgroundColor?: string
    textColor?: string
    position?: 'top' | 'center' | 'bottom'
  }
  onTimeUpdate?: (time: number) => void
  onEnded?: () => void
  className?: string
}

export function AudioPlayer({
  audio,
  subtitles = [],
  showSubtitles = true,
  subtitleStyle,
  onTimeUpdate,
  onEnded,
  className,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('')

  // Find current subtitle based on time
  useEffect(() => {
    if (!subtitles.length) {
      setCurrentSubtitle('')
      return
    }

    const subtitle = subtitles.find(
      (s) => currentTime >= s.start && currentTime <= s.end
    )
    setCurrentSubtitle(subtitle?.text || '')
  }, [currentTime, subtitles])

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime
      setCurrentTime(time)
      onTimeUpdate?.(time)
    }
  }, [onTimeUpdate])

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }, [])

  const handleEnded = useCallback(() => {
    setIsPlaying(false)
    onEnded?.()
  }, [onEnded])

  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }, [isPlaying])

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }, [isMuted])

  // Auto-play if configured
  useEffect(() => {
    if (audio?.autoplay && audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlaying(true)
      }).catch(() => {
        // Autoplay blocked by browser
      })
    }
  }, [audio?.autoplay])

  if (!audio?.url) {
    return null
  }

  const positionClass = {
    top: 'top-8',
    center: 'top-1/2 -translate-y-1/2',
    bottom: 'bottom-24',
  }[subtitleStyle?.position || 'bottom']

  return (
    <>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audio.url}
        loop={audio.loop}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Audio Controls */}
      <div
        className={cn(
          'fixed bottom-6 left-6 flex items-center gap-2 z-50',
          className
        )}
      >
        <button
          onClick={togglePlay}
          className="p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5 text-white" />
          ) : (
            <Play className="h-5 w-5 text-white" />
          )}
        </button>

        <button
          onClick={toggleMute}
          className="p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5 text-white" />
          ) : (
            <Volume2 className="h-5 w-5 text-white" />
          )}
        </button>

        {/* Progress bar */}
        {duration > 0 && (
          <div className="w-24 h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Subtitles */}
      {showSubtitles && currentSubtitle && (
        <div
          className={cn(
            'fixed left-1/2 -translate-x-1/2 z-40 transition-opacity duration-300',
            positionClass
          )}
        >
          <div
            className="px-6 py-3 rounded-2xl max-w-2xl text-center"
            style={{
              backgroundColor: subtitleStyle?.backgroundColor || 'rgba(0,0,0,0.8)',
              color: subtitleStyle?.textColor || '#ffffff',
            }}
          >
            <p className="text-lg font-medium leading-relaxed">
              {currentSubtitle}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
