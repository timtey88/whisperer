import { motion, AnimatePresence } from 'framer-motion'
import { useMemo } from 'react'

interface AnimatedNumberProps {
  value: number
  suffix?: string
  className?: string
  decimalPlaces?: number
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
  decimalPlaces = 0 
}: AnimatedNumberProps) {
  // Format number with specified decimal places
  const formatNumber = (num: number) => {
    return num.toFixed(decimalPlaces)
  }

  // Split the formatted number into individual characters for animation
  const numberDigits = useMemo(() => {
    const numberString = formatNumber(value) + suffix
    const digits: NumberDigit[] = []
    
    for (let i = 0; i < numberString.length; i++) {
      const char = numberString[i]
      const isStatic = char === '.' || char === '%' || char === '/' || char === 's'
      
      // Create unique keys for each position and character
      // This ensures proper animation when digits change
      const key = isStatic ? `static-${char}-${i}` : `digit-${char}-${i}-${value}`
      
      digits.push({
        character: char,
        key,
        isStatic
      })
    }
    
    return digits
  }, [value, suffix, decimalPlaces])

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