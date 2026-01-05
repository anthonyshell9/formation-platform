'use client'

import { useState, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Upload,
  X,
  FileVideo,
  Image as ImageIcon,
  FileText,
  Loader2,
  Link as LinkIcon,
  Check,
} from 'lucide-react'

export type FileType = 'image' | 'video' | 'document' | 'any'

interface UploadedFile {
  url: string
  blobName: string
  filename: string
  size: number
  mimeType: string
}

interface FileUploadProps {
  value?: string // Current URL
  onChange: (value: string | null, uploaded?: UploadedFile | null) => void
  fileType?: FileType
  label?: string
  placeholder?: string
  accept?: string
  maxSize?: number // in MB
  className?: string
  disabled?: boolean
  showUrlOption?: boolean // Whether to show URL input tab
}

const FILE_TYPE_CONFIG: Record<FileType, { accept: string; container: string; icon: React.ReactNode }> = {
  image: {
    accept: 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml',
    container: 'images',
    icon: <ImageIcon className="w-8 h-8" />,
  },
  video: {
    accept: 'video/mp4,video/webm,video/ogg,video/quicktime',
    container: 'videos',
    icon: <FileVideo className="w-8 h-8" />,
  },
  document: {
    accept: 'application/pdf',
    container: 'documents',
    icon: <FileText className="w-8 h-8" />,
  },
  any: {
    accept: '*/*',
    container: 'documents',
    icon: <Upload className="w-8 h-8" />,
  },
}

export function FileUpload({
  value,
  onChange,
  fileType = 'any',
  label,
  placeholder = 'Glissez un fichier ici ou cliquez pour sélectionner',
  accept,
  maxSize = 100, // 100MB default
  className,
  disabled = false,
  showUrlOption = true,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [urlInput, setUrlInput] = useState(value || '')
  const [activeTab, setActiveTab] = useState<string>(value ? 'url' : 'upload')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const config = FILE_TYPE_CONFIG[fileType]
  const acceptTypes = accept || config.accept

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const validateFile = (file: File): string | null => {
    // Check size
    if (file.size > maxSize * 1024 * 1024) {
      return `Le fichier est trop volumineux. Maximum: ${maxSize}MB`
    }

    // Check type if specific file type is required
    if (fileType !== 'any') {
      const allowedTypes = acceptTypes.split(',')
      if (!allowedTypes.some((type) => file.type.match(type.replace('*', '.*')))) {
        return `Type de fichier non supporté. Types acceptés: ${acceptTypes}`
      }
    }

    return null
  }

  const uploadFile = async (file: File) => {
    setError(null)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Validate file
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        setIsUploading(false)
        return
      }

      // Create form data
      const formData = new FormData()
      formData.append('file', file)
      formData.append('container', config.container)

      // Upload with progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors du téléchargement')
      }

      const data = await response.json()

      const uploaded: UploadedFile = {
        url: data.url,
        blobName: data.blobName,
        filename: data.filename || file.name,
        size: data.size || file.size,
        mimeType: data.mimeType || file.type,
      }

      setUploadedFile(uploaded)
      onChange(uploaded.url, uploaded)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du téléchargement')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      if (disabled) return

      const file = e.dataTransfer.files[0]
      if (file) {
        uploadFile(file)
      }
    },
    [disabled]
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadFile(file)
    }
  }

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim(), null)
    }
  }

  const handleClear = () => {
    setUploadedFile(null)
    setUrlInput('')
    setError(null)
    onChange(null, null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const currentValue = uploadedFile?.url || value

  return (
    <div className={cn('space-y-2', className)}>
      {label && <Label>{label}</Label>}

      {showUrlOption ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="upload" className="flex-1">
              <Upload className="w-4 h-4 mr-2" />
              Télécharger
            </TabsTrigger>
            <TabsTrigger value="url" className="flex-1">
              <LinkIcon className="w-4 h-4 mr-2" />
              URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-2">
            <UploadZone
              isDragging={isDragging}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              uploadedFile={uploadedFile}
              currentValue={currentValue}
              error={error}
              disabled={disabled}
              placeholder={placeholder}
              config={config}
              fileType={fileType}
              acceptTypes={acceptTypes}
              fileInputRef={fileInputRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onFileSelect={handleFileSelect}
              onClear={handleClear}
            />
          </TabsContent>

          <TabsContent value="url" className="mt-2">
            <div className="flex gap-2">
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://..."
                disabled={disabled}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleUrlSubmit}
                disabled={disabled || !urlInput.trim()}
              >
                <Check className="w-4 h-4" />
              </Button>
            </div>
            {value && activeTab === 'url' && (
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-green-500" />
                URL configurée
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-6 px-2"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <UploadZone
          isDragging={isDragging}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          uploadedFile={uploadedFile}
          currentValue={currentValue}
          error={error}
          disabled={disabled}
          placeholder={placeholder}
          config={config}
          fileType={fileType}
          acceptTypes={acceptTypes}
          fileInputRef={fileInputRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onFileSelect={handleFileSelect}
          onClear={handleClear}
        />
      )}
    </div>
  )
}

interface UploadZoneProps {
  isDragging: boolean
  isUploading: boolean
  uploadProgress: number
  uploadedFile: UploadedFile | null
  currentValue?: string
  error: string | null
  disabled: boolean
  placeholder: string
  config: { accept: string; container: string; icon: React.ReactNode }
  fileType: FileType
  acceptTypes: string
  fileInputRef: React.RefObject<HTMLInputElement>
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClear: () => void
}

function UploadZone({
  isDragging,
  isUploading,
  uploadProgress,
  uploadedFile,
  currentValue,
  error,
  disabled,
  placeholder,
  config,
  fileType,
  acceptTypes,
  fileInputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  onClear,
}: UploadZoneProps) {
  return (
    <div
      className={cn(
        'relative border-2 border-dashed rounded-lg p-6 transition-colors',
        isDragging && 'border-primary bg-primary/5',
        error && 'border-destructive',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && !isDragging && 'hover:border-primary/50 cursor-pointer'
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptTypes}
        onChange={onFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {isUploading ? (
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Téléchargement en cours...</p>
          <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
        </div>
      ) : uploadedFile || currentValue ? (
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-green-600">
            <Check className="w-5 h-5" />
            <span className="font-medium">
              {uploadedFile?.filename || 'Fichier configuré'}
            </span>
          </div>
          {uploadedFile && (
            <p className="text-xs text-muted-foreground">
              {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
          {fileType === 'image' && currentValue && (
            <img
              src={currentValue}
              alt="Preview"
              className="max-h-32 mx-auto rounded-lg object-contain"
            />
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onClear()
            }}
          >
            <X className="w-4 h-4 mr-1" />
            Supprimer
          </Button>
        </div>
      ) : (
        <div className="text-center space-y-2">
          <div className="mx-auto text-muted-foreground">{config.icon}</div>
          <p className="text-sm text-muted-foreground">{placeholder}</p>
          <p className="text-xs text-muted-foreground">
            {fileType === 'image' && 'JPG, PNG, GIF, WebP'}
            {fileType === 'video' && 'MP4, WebM, OGG'}
            {fileType === 'document' && 'PDF'}
            {fileType === 'any' && 'Tous types de fichiers'}
          </p>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-destructive text-center">{error}</p>
      )}
    </div>
  )
}

// Compact inline version for forms
export function InlineFileUpload({
  value,
  onChange,
  fileType = 'image',
  placeholder = 'Sélectionner un fichier...',
  disabled = false,
  className,
}: Omit<FileUploadProps, 'label' | 'showUrlOption'>) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const config = FILE_TYPE_CONFIG[fileType]

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('container', config.container)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Upload failed')

      const data = await response.json()
      onChange(data.url, {
        url: data.url,
        blobName: data.blobName,
        filename: file.name,
        size: file.size,
        mimeType: file.type,
      })
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Input
        value={value || ''}
        onChange={(e) => onChange(e.target.value, null)}
        placeholder={placeholder}
        disabled={disabled || isUploading}
        className="flex-1"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept={config.accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
      >
        {isUploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
      </Button>
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onChange(null, null)}
          disabled={disabled}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  )
}
