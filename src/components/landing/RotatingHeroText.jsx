import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const PHRASES = [
  'sizin ritminizde',
  'sizin elinizde',
  'sizin kontrolünüzde',
  'sizin yolunuzda',
  'sizin hızınızda',
]

const HOLD_MS = 3200
const TRANSITION = { duration: 0.55, ease: [0.22, 1, 0.36, 1] }

export default function RotatingHeroText({ className = '' }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % PHRASES.length)
    }, HOLD_MS)
    return () => clearInterval(id)
  }, [])

  const phrase = PHRASES[index]

  return (
    <span className={`relative inline-block min-h-[1.2em] align-bottom ${className}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={phrase}
          initial={{ opacity: 0, y: 18, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -14, filter: 'blur(4px)' }}
          transition={TRANSITION}
          className="inline-block bg-gradient-to-r from-brand-300 via-sage-300 to-brand-200 bg-clip-text text-transparent"
        >
          {phrase}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
