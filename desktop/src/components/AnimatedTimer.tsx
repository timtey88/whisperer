import { motion, AnimatePresence } from 'framer-motion'
import { useMemo } from 'react'

interface AnimatedTimerProps {
  elapsedTime: number
  className?: string
}

interface TimerDigit {
  character: string
  key: string
  isStatic: boolean
}

export default function AnimatedTimer({ elapsedTime, className = "" }: AnimatedTimerProps) {
  // Format elapsed time into display string
  const formatElapsedTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return minutes > 0 
      ? `${minutes}:${remainingSeconds.toString().padStart(2, '0')}` 
      : `${seconds}s`
  }

  // Split the formatted time into individual characters for animation
  const timeDigits = useMemo(() => {
    const timeString = formatElapsedTime(elapsedTime)
    const digits: TimerDigit[] = []
    
    for (let i = 0; i < timeString.length; i++) {
      const char = timeString[i]
      const isStatic = char === ':' || char === 's'
      
      // Create unique keys for each position and character
      // This ensures proper animation when digits change
      const key = isStatic ? `static-${char}-${i}` : `digit-${char}-${i}-${Math.floor(elapsedTime / 1000)}`
      
      digits.push({
        character: char,
        key,
        isStatic
      })
    }
    
    return digits
  }, [elapsedTime])

  const digitAnimation = {
    initial: { 
      y: -20, 
      opacity: 0,
      rotateX: -90,
      scale: 0.8
    },
    animate: { 
      y: 0, 
      opacity: 1,
      rotateX: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        duration: 0.4
      }
    },
    exit: { 
      y: 20, 
      opacity: 0,
      rotateX: 90,
      scale: 0.8,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    }
  }

  const staticAnimation = {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
    exit: { opacity: 1 }
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex items-center" style={{ perspective: '1000px' }}>
        {timeDigits.map((digit) => (
          <div key={digit.key} className="relative inline-block">
            <AnimatePresence mode="wait">
              <motion.span
                key={digit.key}
                variants={digit.isStatic ? staticAnimation : digitAnimation}
                initial="initial"
                animate="animate"
                exit="exit"
                className="inline-block"
                style={{
                  transformStyle: 'preserve-3d',
                  minWidth: digit.character === ':' ? '0.25rem' : digit.character === 's' ? '0.5rem' : '0.6rem',
                  textAlign: 'center'
                }}
              >
                {digit.character}
              </motion.span>
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  )
}