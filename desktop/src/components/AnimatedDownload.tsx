import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useEffect } from 'react'

interface DownloadProps {
  className?: string
  isAnimating?: boolean
  onAnimationComplete?: () => void
  progress: number
  downloadedSize: string
  totalSize: string
  downloadSpeed: string
  timeRemaining: string
}

export function AnimatedDownload({
  className,
  isAnimating = false,
  onAnimationComplete,
  progress,
  downloadedSize,
  totalSize,
  downloadSpeed,
  timeRemaining,
}: DownloadProps) {
  const shouldReduceMotion = useReducedMotion()

  // Call onAnimationComplete when download reaches 100%
  useEffect(() => {
    if (progress >= 100 && onAnimationComplete) {
      onAnimationComplete()
    }
  }, [progress, onAnimationComplete])

  // Animation variants
  const containerVariants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.3 : 0.6,
        ease: 'easeOut',
      },
    },
  } as const

  // Chevron animations
  const chevronVariants: Variants = {
    idle: { y: 0, opacity: 0.7 },
    animating: {
      y: shouldReduceMotion ? 0 : [0, 8, 0],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: shouldReduceMotion ? 0.5 : 1.5,
        ease: 'easeInOut',
        repeat: Infinity,
        repeatType: 'loop',
      },
    },
  }

  const chevron2Variants: Variants = {
    idle: { y: 14, opacity: 0.5 },
    animating: {
      y: shouldReduceMotion ? 8 : [14, 18, 14],
      opacity: [0.5, 0.8, 0.5],
      transition: {
        duration: shouldReduceMotion ? 0.5 : 1.5,
        ease: 'easeInOut',
        repeat: Infinity,
        repeatType: 'loop',
        delay: 0.1,
      },
    },
  }

  return (
    <motion.div
      className={`relative flex flex-col items-center justify-center w-full max-w-md mx-auto ${className || ''}`}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Animated chevrons */}
      <div className="relative w-24 h-24 mb-6">
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          variants={chevronVariants}
          animate={isAnimating ? 'animating' : 'idle'}
        >
          <ChevronDown className="w-12 h-12 text-blue-400" />
        </motion.div>
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          variants={chevron2Variants}
          animate={isAnimating ? 'animating' : 'idle'}
        >
          <ChevronDown className="w-12 h-12 text-blue-300" />
        </motion.div>
      </div>

      {/* Download status */}
      <div className="w-full max-w-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white/80">
            {isAnimating ? 'Downloading...' : 'Ready'}
          </span>
          <span className="text-sm font-mono text-white/60">
            {Math.round(progress)}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ duration: shouldReduceMotion ? 0.3 : 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Progress details */}
        <div className="flex justify-between mt-3 text-xs text-white/50">
          <span>{downloadedSize} / {totalSize}</span>
          <span>{downloadSpeed}/s</span>
          <span>{timeRemaining} left</span>
        </div>
      </div>
    </motion.div>
  )
}
