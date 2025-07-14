import { motion, AnimatePresence } from 'framer-motion'
import { useMemo, useState, useEffect, useRef, useCallback } from 'react'

interface AnimatedNumberProps {
  value: number
  suffix?: string
  className?: string
  decimalPlaces?: number
  animationSpeed?: 'fast' | 'normal' | 'slow'
  maxDuration?: number
}

interface NumberDigit {
  character: string
  key: string
  isStatic: boolean
}

export default function AnimatedNumber({ 
  value, 
  suffix = '', 
  className = '', 
  decimalPlaces = 0,
  animationSpeed = 'normal',
  maxDuration = 2000
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const [isAnimating, setIsAnimating] = useState(false)
  const animationRef = useRef<number | null>(null)
  const previousValueRef = useRef(value)
  // Animation speed settings
  const getAnimationSettings = useCallback(() => {
    const settings = {
      fast: { incrementDelay: 30, minIncrement: 0.5 },
      normal: { incrementDelay: 50, minIncrement: 0.2 },
      slow: { incrementDelay: 80, minIncrement: 0.1 }
    }
    return settings[animationSpeed]
  }, [animationSpeed])

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current)
      }
    }
  }, [])

  // Handle value changes with incremental animation
  useEffect(() => {
    if (value === previousValueRef.current || isAnimating) {
      return
    }

    const startValue = displayValue
    const targetValue = value
    const difference = targetValue - startValue

    // Don't animate tiny changes
    if (Math.abs(difference) < 0.1) {
      setDisplayValue(targetValue)
      previousValueRef.current = targetValue
      return
    }

    setIsAnimating(true)
    const { incrementDelay, minIncrement } = getAnimationSettings()
    
    // Calculate increment size based on difference and max duration
    const totalSteps = Math.min(Math.abs(difference), maxDuration / incrementDelay)
    const increment = difference / totalSteps
    const actualIncrement = Math.max(Math.abs(increment), minIncrement) * Math.sign(increment)

    let currentValue = startValue
    let stepCount = 0
    const maxSteps = Math.ceil(Math.abs(difference) / Math.abs(actualIncrement))

    const animateStep = () => {
      stepCount++
      currentValue += actualIncrement

      // Ensure we don't overshoot the target
      if ((increment > 0 && currentValue >= targetValue) || 
          (increment < 0 && currentValue <= targetValue) ||
          stepCount >= maxSteps) {
        setDisplayValue(targetValue)
        setIsAnimating(false)
        previousValueRef.current = targetValue
        return
      }

      setDisplayValue(currentValue)
      animationRef.current = setTimeout(animateStep, incrementDelay)
    }

    // Start animation
    animationRef.current = setTimeout(animateStep, incrementDelay)

  }, [value, displayValue, isAnimating, getAnimationSettings, maxDuration])

  // Format number with specified decimal places
  const formatNumber = (num: number) => {
    return num.toFixed(decimalPlaces)
  }

  // Split the formatted number into individual characters for animation
  const numberDigits = useMemo(() => {
    const numberString = formatNumber(displayValue) + suffix
    const digits: NumberDigit[] = []
    
    for (let i = 0; i < numberString.length; i++) {
      const char = numberString[i]
      const isStatic = char === '.' || char === '%' || char === '/' || char === 's'
      
      // Create unique keys for each position and character
      // This ensures proper animation when digits change
      const key = isStatic ? `static-${char}-${i}` : `digit-${char}-${i}-${displayValue}`
      
      digits.push({
        character: char,
        key,
        isStatic
      })
    }
    
    return digits
  }, [displayValue, suffix, decimalPlaces])

  const digitAnimation = {
    initial: { 
      y: -15, 
      opacity: 0,
      rotateX: -90,
      scale: 0.9
    },
    animate: { 
      y: 0, 
      opacity: 1,
      rotateX: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 600,
        damping: 30,
        duration: 0.3
      }
    },
    exit: { 
      y: 15, 
      opacity: 0,
      rotateX: 90,
      scale: 0.9,
      transition: {
        duration: 0.15,
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
        {numberDigits.map((digit) => (
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
                  minWidth: digit.character === '.' ? '0.2rem' : 
                           digit.character === '%' ? '0.7rem' : 
                           digit.character === '/' ? '0.3rem' :
                           digit.character === 's' ? '0.4rem' : '0.5rem',
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