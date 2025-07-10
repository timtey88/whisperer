import { useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';

export default function AnimatedLoader({ size = 200, strokeWidth = 8 }) {
  const controls = useAnimation();
  const circleRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const animate = async () => {
      await controls.start({
        rotate: 360,
        transition: { duration: 2, ease: 'linear', repeat: Infinity }
      });
    };
    
    animate();
    
    // Pulsing effect
    const interval = setInterval(() => {
      if (circleRef.current) {
        circleRef.current.style.transition = 'all 0.5s ease-in-out';
        circleRef.current.style.strokeWidth = (strokeWidth * 1.5).toString();
        
        setTimeout(() => {
          if (circleRef.current) {
            circleRef.current.style.transition = 'all 0.5s ease-in-out';
            circleRef.current.style.strokeWidth = strokeWidth.toString();
          }
        }, 300);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [controls, strokeWidth]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference * 0.2; // Starting point for the arc

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg className="absolute" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
        />
      </svg>
      
      {/* Animated arc */}
      <motion.svg 
        className="absolute" 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`}
        animate={controls}
        style={{ originX: '50%', originY: '50%' }}
      >
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="50%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#9333ea" />
          </linearGradient>
        </defs>
        <circle
          ref={circleRef}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </motion.svg>
      
      {/* Glow effect */}
      <div 
        className="absolute rounded-full"
        style={{
          width: size * 0.7,
          height: size * 0.7,
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, rgba(99, 102, 241, 0) 70%)',
          filter: 'blur(8px)'
        }}
      />
    </div>
  );
}
