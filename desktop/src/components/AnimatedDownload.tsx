import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { Download, Check, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'

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
  const [isComplete, setIsComplete] = useState(false)

  // Call onAnimationComplete when download reaches 100%
  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(() => {
        setIsComplete(true)
        if (onAnimationComplete) onAnimationComplete()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [progress, onAnimationComplete])

  // Container animation
  const containerVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.3 : 0.6,
        ease: 'easeOut',
      },
    },
  } as const

  // Icon animation
  const iconVariants: Variants = {
    initial: { scale: 1 },
    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    complete: {
      scale: [1, 1.2, 1],
      transition: { duration: 0.5 },
    },
  }

  // Progress bar glow effect
  const progressBarGlow: Variants = {
    initial: { opacity: 0.7 },
    animate: {
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    },
  }

  return (
    <motion.div
      className={`relative w-full max-w-lg mx-auto backdrop-blur-lg bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-8 border border-white/10 shadow-2xl overflow-hidden ${className || ''}`}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Background gradient elements */}
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-500/20 rounded-full filter blur-3xl opacity-30" />
      <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-cyan-400/20 rounded-full filter blur-3xl opacity-30" />
      
      {/* Main content */}
      <div className="relative z-10">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <motion.div
            className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-400/20 backdrop-blur-sm border border-white/10 flex items-center justify-center"
            variants={iconVariants}
            animate={isComplete ? 'complete' : isAnimating ? 'pulse' : 'initial'}
          >
            {isComplete ? (
              <Check className="w-12 h-12 text-green-400" strokeWidth={1.5} />
            ) : (
              <Download className="w-12 h-12 text-blue-400" strokeWidth={1.5} />
            )}
          </motion.div>
        </div>

        {/* Status text */}
        <div className="text-center mb-8">
          <h3 className="text-xl font-medium text-white mb-2">
            {isComplete ? 'Download Complete!' : 'Downloading Model'}
          </h3>
          <p className="text-white/60 text-sm">
            {isComplete 
              ? 'Your model is ready to use!'
              : 'Please wait while we prepare everything for you...'}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white/80">
              {isComplete ? 'Completed' : 'In Progress'}
            </span>
            <span className="text-sm font-mono text-blue-300">
              {Math.round(progress)}%
            </span>
          </div>

          <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ duration: shouldReduceMotion ? 0.3 : 0.8, ease: 'easeOut' }}
            >
              <motion.div
                className="absolute inset-0 bg-white/20"
                variants={progressBarGlow}
                initial="initial"
                animate={isAnimating ? 'animate' : 'initial'}
              />
            </motion.div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/5">
            <div className="text-xs text-white/50 mb-1">Downloaded</div>
            <div className="font-mono text-sm text-white">{downloadedSize}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/5">
            <div className="text-xs text-white/50 mb-1">Speed</div>
            <div className="font-mono text-sm text-white flex items-center">
              <Zap className="w-3 h-3 text-yellow-400 mr-1" />
              {downloadSpeed}/s
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/5">
            <div className="text-xs text-white/50 mb-1">Time Left</div>
            <div className="font-mono text-sm text-white">{timeRemaining}</div>
          </div>
        </div>

        {/* Total size */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-white/5 rounded-full border border-white/5">
            <span className="text-xs text-white/60 mr-2">Total Size:</span>
            <span className="text-sm font-medium text-white">{totalSize}</span>
          </div>
        </div>
      </div>

      {/* Animated border effect */}
      <motion.div 
        className="absolute inset-0 rounded-2xl border-2 border-transparent"
        style={{
          background: 'linear-gradient(90deg, rgba(99,102,241,0.2), rgba(56,189,248,0.2)) border-box',
          WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'destination-out',
          maskComposite: 'exclude',
        }}
        animate={{
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  )
}
