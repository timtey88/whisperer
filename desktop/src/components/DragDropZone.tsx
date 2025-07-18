import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as event from '@tauri-apps/api/event'
import { Upload, FileAudio, CheckCircle, XCircle } from 'lucide-react'
import { cx } from '~/lib/utils'

interface DragDropZoneProps {
  onFileSelect?: () => void
  hasFiles?: boolean
}

type DragState = 'idle' | 'dragover' | 'accepted' | 'rejected'

export default function DragDropZone({ onFileSelect, hasFiles = false }: DragDropZoneProps) {
  const { t } = useTranslation()
  const [dragState, setDragState] = useState<DragState>('idle')
  const listeners = useRef<event.UnlistenFn[]>([])
  const timeoutRef = useRef<NodeJS.Timeout>()

  const clearFeedbackTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  const setTemporaryState = (state: DragState, duration = 2000) => {
    setDragState(state)
    clearFeedbackTimeout()
    timeoutRef.current = setTimeout(() => {
      setDragState('idle')
    }, duration)
  }

  async function setupDragListeners() {
    // Drag enter - show drag state
    listeners.current.push(
      await event.listen('tauri://drag-enter', () => {
        clearFeedbackTimeout()
        setDragState('dragover')
      })
    )

    // Drag leave - reset to idle
    listeners.current.push(
      await event.listen('tauri://drag-leave', () => {
        clearFeedbackTimeout()
        setDragState('idle')
      })
    )

    // File drop - show feedback
    listeners.current.push(
      await event.listen<{ paths?: string[] }>('tauri://drag-drop', async (event) => {
        const { paths } = event.payload
        if (paths && paths.length > 0) {
          // Check if file is valid audio/video format
          const validExtensions = ['.mp3', '.mp4', '.wav', '.m4a', '.aac', '.flac', '.ogg', '.webm', '.mkv', '.avi', '.mov']
          const hasValidFile = paths.some(path => 
            validExtensions.some(ext => path.toLowerCase().endsWith(ext))
          )
          
          if (hasValidFile) {
            setTemporaryState('accepted', 1500)
          } else {
            setTemporaryState('rejected', 3000)
          }
        } else {
          setDragState('idle')
        }
      })
    )
  }

  useEffect(() => {
    setupDragListeners()
    return () => {
      clearFeedbackTimeout()
      listeners.current.forEach((unlisten) => unlisten())
    }
  }, [])

  // Don't show the drag zone if files are already selected
  if (hasFiles) {
    return null
  }

  const getIcon = () => {
    switch (dragState) {
      case 'dragover':
        return <FileAudio className="w-8 h-8" />
      case 'accepted':
        return <CheckCircle className="w-8 h-8 text-success" />
      case 'rejected':
        return <XCircle className="w-8 h-8 text-error" />
      default:
        return <Upload className="w-8 h-8" />
    }
  }

  const getText = () => {
    switch (dragState) {
      case 'dragover':
        return t('common.drop-files-here') || 'Drop your files here'
      case 'accepted':
        return t('common.file-received') || 'File received!'
      case 'rejected':
        return t('common.unsupported-file-type') || 'Unsupported file type'
      default:
        return t('common.drag-drop-or-click') || 'Drag & drop audio/video files here or click to select'
    }
  }

  const getSubtext = () => {
    switch (dragState) {
      case 'dragover':
        return t('common.release-to-upload') || 'Release to upload'
      case 'accepted':
        return t('common.processing-file') || 'Processing your file...'
      case 'rejected':
        return t('common.supported-formats') || 'Supported: MP3, MP4, WAV, M4A, AAC, FLAC, OGG, WebM, MKV, AVI, MOV'
      default:
        return t('common.supported-audio-video') || 'Supports audio and video files'
    }
  }

  return (
    <div className="my-6">
      <div
        onClick={onFileSelect}
        className={cx(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 ease-in-out',
          'hover:border-primary hover:bg-primary/5',
          dragState === 'idle' && 'border-base-300 bg-base-100',
          dragState === 'dragover' && 'border-primary bg-primary/10 scale-[1.02]',
          dragState === 'accepted' && 'border-success bg-success/10',
          dragState === 'rejected' && 'border-error bg-error/10'
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <div className={cx(
            'transition-all duration-300',
            dragState === 'idle' && 'text-base-content/70',
            dragState === 'dragover' && 'text-primary animate-pulse',
            dragState === 'accepted' && 'text-success',
            dragState === 'rejected' && 'text-error'
          )}>
            {getIcon()}
          </div>
          
          <div>
            <p className={cx(
              'font-medium transition-colors duration-300',
              dragState === 'idle' && 'text-base-content',
              dragState === 'dragover' && 'text-primary',
              dragState === 'accepted' && 'text-success',
              dragState === 'rejected' && 'text-error'
            )}>
              {getText()}
            </p>
            
            <p className={cx(
              'text-sm mt-1 transition-colors duration-300',
              dragState === 'idle' && 'text-base-content/60',
              dragState === 'dragover' && 'text-primary/80',
              dragState === 'accepted' && 'text-success/80',
              dragState === 'rejected' && 'text-error/80'
            )}>
              {getSubtext()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}