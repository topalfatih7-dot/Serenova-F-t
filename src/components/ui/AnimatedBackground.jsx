import { memo, useMemo } from 'react'
import { useMediaQuery } from '../../hooks/useMediaQuery'

const FLOAT_CLASSES = ['panel-float-a', 'panel-float-b', 'panel-float-c']

const ORB_PRESETS = {
  member: [
    { className: 'left-[-6%] top-[-4%] h-80 w-80 bg-brand-400/35', dur: '15s' },
    { className: 'right-[-8%] top-[15%] h-96 w-96 bg-violet-400/28', dur: '19s' },
    { className: 'bottom-[-10%] left-[20%] h-80 w-80 bg-sage-400/30', dur: '17s' },
    { className: 'right-[15%] bottom-[5%] h-72 w-72 bg-warm-400/25', dur: '21s' },
  ],
  staff: [
    { className: 'left-[-8%] top-[-6%] h-80 w-80 bg-brand-300/28', dur: '16s' },
    { className: 'right-[-6%] bottom-[-8%] h-72 w-72 bg-sage-300/26', dur: '20s' },
  ],
  admin: [
    { className: 'right-[-6%] top-[-6%] h-80 w-80 bg-brand-200/30', dur: '18s' },
    { className: 'left-[-8%] bottom-[-10%] h-72 w-72 bg-cream-300/40', dur: '15s' },
  ],
}

/**
 * Panellerin arkasında yumuşak, animasyonlu bir atmosfer oluşturur:
 * blur'lu gradient orb'lar + sektöre uygun yüzen emojiler.
 * pointer-events yok, içerik etkilenmez. prefers-reduced-motion'a saygılıdır.
 */
function AnimatedBackground({ emojis = [], accent = 'member', className = '' }) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const orbs = ORB_PRESETS[accent] || ORB_PRESETS.member

  const items = useMemo(
    () =>
      emojis.map((emoji, i) => {
        const left = (i * 13.7 + 5) % 92
        const top = (i * 19.3 + 6) % 90
        const size = 26 + (i % 4) * 12
        const dur = 16 + (i % 5) * 3
        const delay = (i % 6) * -2.6
        const opacity = 0.1 + (i % 3) * 0.035
        return {
          key: `${emoji}-${i}`,
          emoji,
          left,
          top,
          size,
          dur,
          delay,
          opacity,
          floatClass: FLOAT_CLASSES[i % FLOAT_CLASSES.length],
        }
      }),
    [emojis],
  )

  // Mobilde animasyonlu orb/emoji yok — GPU/termal maliyet; shell gradient yeter.
  if (!isDesktop) return null

  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {orbs.map((orb, i) => (
        <span
          key={`orb-${i}`}
          className={`panel-orb ${orb.className}`}
          style={{ '--orb-dur': orb.dur, animationDelay: `${i * -3}s` }}
        />
      ))}
      {items.map((it) => (
        <span
          key={it.key}
          className={`panel-emoji ${it.floatClass}`}
          style={{
            left: `${it.left}%`,
            top: `${it.top}%`,
            fontSize: `${it.size}px`,
            opacity: it.opacity,
            '--float-dur': `${it.dur}s`,
            animationDelay: `${it.delay}s`,
          }}
        >
          {it.emoji}
        </span>
      ))}
    </div>
  )
}

export default memo(AnimatedBackground)
