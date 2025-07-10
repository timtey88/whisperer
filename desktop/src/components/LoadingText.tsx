import { motion } from 'framer-motion';

export default function LoadingText() {
  return (
    <div className="relative flex items-center justify-center space-x-1 mb-8">
      <motion.span 
        className="text-2xl font-bold text-white"
        initial={{ opacity: 0.6 }}
        animate={{ 
          opacity: [0.6, 1, 0.6],
        }}
        transition={{ 
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        L
      </motion.span>
      <motion.span 
        className="text-2xl font-bold text-white"
        initial={{ opacity: 0.6 }}
        animate={{ 
          opacity: [0.6, 1, 0.6],
        }}
        transition={{ 
          duration: 1.5,
          delay: 0.1,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        o
      </motion.span>
      <motion.span 
        className="text-2xl font-bold text-white"
        initial={{ opacity: 0.6 }}
        animate={{ 
          opacity: [0.6, 1, 0.6],
        }}
        transition={{ 
          duration: 1.5,
          delay: 0.2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        a
      </motion.span>
      <motion.span 
        className="text-2xl font-bold text-white"
        initial={{ opacity: 0.6 }}
        animate={{ 
          opacity: [0.6, 1, 0.6],
        }}
        transition={{ 
          duration: 1.5,
          delay: 0.3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        d
      </motion.span>
      <motion.span 
        className="text-2xl font-bold text-white"
        initial={{ opacity: 0.6 }}
        animate={{ 
          opacity: [0.6, 1, 0.6],
        }}
        transition={{ 
          duration: 1.5,
          delay: 0.4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        i
      </motion.span>
      <motion.span 
        className="text-2xl font-bold text-white"
        initial={{ opacity: 0.6 }}
        animate={{ 
          opacity: [0.6, 1, 0.6],
        }}
        transition={{ 
          duration: 1.5,
          delay: 0.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        n
      </motion.span>
      <motion.span 
        className="text-2xl font-bold text-white"
        initial={{ opacity: 0.6 }}
        animate={{ 
          opacity: [0.6, 1, 0.6],
        }}
        transition={{ 
          duration: 1.5,
          delay: 0.6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        g
      </motion.span>
      
      {/* Animated lines */}
      <div className="flex space-x-1 ml-2">
        {[0, 0.2, 0.4].map((delay) => (
          <motion.div
            key={delay}
            className="w-1 h-6 bg-white rounded-full"
            initial={{ height: 6 }}
            animate={{
              height: [6, 24, 6],
            }}
            transition={{
              duration: 1.2,
              delay: delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  );
}
