import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const TONES = ['text-brand-600', 'text-brand-700', 'text-brand-500']

export default function FAQQuestionMarksBackground() {
  const reduceMotion = useReducedMotion()

  const marks = useMemo(() => {
    const rand = seededRandom(42)
    return Array.from({ length: 48 }, (_, i) => {
      const down = rand() > 0.35
      return {
        id: i,
        left: `${rand() * 94 + 3}%`,
        top: `${rand() * 92 + 4}%`,
        size: `${Math.floor(rand() * 32 + 16)}px`,
        opacity: 0.2 + rand() * 0.28,
        tone: TONES[Math.floor(rand() * TONES.length)],
        initialRotate: Math.floor(rand() * 360),
        driftX: (rand() - 0.5) * 48,
        driftY: down ? rand() * 70 + 35 : (rand() - 0.5) * 50,
        spin: (rand() - 0.5) * 40,
        duration: 9 + rand() * 14,
        delay: rand() * 6,
      }
    })
  }, [])

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-100/90 via-sky-100/70 to-brand-200/50" />

      {marks.map((m) => (
        <motion.span
          key={m.id}
          className={`absolute font-display font-bold leading-none select-none ${m.tone}`}
          style={{
            left: m.left,
            top: m.top,
            fontSize: m.size,
            opacity: m.opacity,
          }}
          initial={{
            x: 0,
            y: 0,
            rotate: m.initialRotate,
          }}
          animate={
            reduceMotion
              ? { rotate: m.initialRotate }
              : {
                  x: [0, m.driftX, -m.driftX * 0.6, m.driftX * 0.3, 0],
                  y: [0, m.driftY, m.driftY * 0.85, m.driftY * 1.15, 0],
                  rotate: [
                    m.initialRotate,
                    m.initialRotate + m.spin,
                    m.initialRotate - m.spin * 0.7,
                    m.initialRotate + m.spin * 0.4,
                    m.initialRotate,
                  ],
                }
          }
          transition={{
            duration: m.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: m.delay,
          }}
        >
          ?
        </motion.span>
      ))}

      <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-white/10 to-white/35" />
    </div>
  )
}
