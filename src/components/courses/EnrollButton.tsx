'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Play, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface EnrollButtonProps {
  courseId: string
}

export function EnrollButton({ courseId }: EnrollButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleEnroll() {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de l\'inscription')
      }

      toast.success('Inscription reussie!')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'inscription')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleEnroll} disabled={isLoading}>
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Play className="mr-2 h-4 w-4" />
      )}
      Rejoindre
    </Button>
  )
}
