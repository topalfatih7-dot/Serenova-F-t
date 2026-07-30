import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

/** Hero vurgusu — kontrol, süreklilik ve kişiselleştirme sinyalleri */
const PHRASES = [
  'sizin ritminizde',
  'sizin temposunuzda',
  'sizin kontrolünüzde',
  'sizin hedeflerinizle',
  'sizin yolculuğunuzda',
  'evde veya salonda',
  'adım adım',
  'güvenle ilerleyin',
  'ilk günden itibaren',
  'sizin programınızla',
  'sürekli destekle',
  'ölçülebilir ilerlemeyle',
]

const HOLD_MS = 2800
const TRANSITION = { duration: 0.45, ease: [0.22, 1, 0.36, 1] }

/**
 * Dönen hero vurgusu — her zaman alt satırda, sabit 1 satır yüksekliği.
 * Animasyon absolute; h1/layout şişmez.
 */
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
    <span
      className={`relative mt-1 block h-[1.2em] w-full overflow-hidden ${className}`}
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={phrase}
          initial={{ opacity: 0, y: '40%' }}
          animate={{ opacity: 1, y: '0%' }}
          exit={{ opacity: 0, y: '-40%' }}
          transition={TRANSITION}
          className="absolute inset-x-0 top-0 block truncate bg-gradient-to-r from-brand-300 via-sage-300 to-brand-200 bg-clip-text text-transparent"
        >
          {phrase}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
