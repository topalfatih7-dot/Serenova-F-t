import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Dumbbell, Apple } from 'lucide-react'

export default function TeamCarousel({ members }) {
  const list = members || []
  const [index, setIndex] = useState(0)
  const count = list.length

  if (count === 0) return null

  const go = (dir) => {
    setIndex((i) => (i + dir + count) % count)
  }

  // Ekranda görünecek 3 pozisyon: sol (soluk), orta (aktif), sağ (soluk)
  const positions = [-1, 0, 1].map((offset) => {
    const idx = (index + offset + count) % count
    return { offset, member: list[idx], key: `${list[idx].id || list[idx].name}-${idx}` }
  })

  return (
    <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
      <div className="relative flex h-[420px] items-center justify-center">
        {/* Kaydırma alanı (mobil için drag) */}
        <motion.div
          className="absolute inset-0 z-20"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(e, info) => {
            if (info.offset.x < -60) go(1)
            else if (info.offset.x > 60) go(-1)
          }}
          style={{ cursor: 'grab' }}
        />

        <AnimatePresence initial={false}>
          {positions.map(({ offset, member: m, key }) => {
            const isCenter = offset === 0
            const isCoach = m.role === 'coach'
            const RoleIcon = isCoach ? Dumbbell : Apple
            return (
              <motion.article
                key={key}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: isCenter ? 1 : 0.4,
                  scale: isCenter ? 1 : 0.82,
                  x: `${offset * 62}%`,
                  filter: isCenter ? 'blur(0px)' : 'blur(1.5px)',
                  zIndex: isCenter ? 10 : 5,
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                onClick={() => !isCenter && go(offset)}
                className={`absolute w-[260px] overflow-hidden rounded-3xl border bg-white shadow-sm sm:w-[300px] ${
                  isCenter ? 'border-brand-200 shadow-xl' : 'cursor-pointer border-cream-200'
                }`}
              >
                <div className="relative h-64 overflow-hidden bg-cream-100 sm:h-72">
                  {m.photo ? (
                    <img src={m.photo} alt={m.name} className="h-full w-full object-cover" draggable={false} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 to-sage-100">
                      <span className="font-display text-5xl font-bold text-brand-500/70">{m.name?.charAt(0)}</span>
                    </div>
                  )}
                  <span className={`absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur ${isCoach ? 'bg-brand-500/90' : 'bg-sage-500/90'}`}>
                    <RoleIcon className="h-3.5 w-3.5" />
                    {isCoach ? 'Koç' : 'Diyetisyen'}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold text-cream-900">{m.name}</h3>
                  {m.specialty && <p className="mt-0.5 text-xs font-semibold text-brand-600">{m.specialty}</p>}
                  {(m.bio || m.description) && (
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-cream-800/65">{m.bio || m.description}</p>
                  )}
                </div>
              </motion.article>
            )
          })}
        </AnimatePresence>

        {/* Yön butonları */}
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Önceki"
          className="absolute left-0 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-cream-200 bg-white/90 text-cream-800 shadow-md backdrop-blur transition hover:border-brand-300 hover:text-brand-600 sm:-left-2"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Sonraki"
          className="absolute right-0 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-cream-200 bg-white/90 text-cream-800 shadow-md backdrop-blur transition hover:border-brand-300 hover:text-brand-600 sm:-right-2"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Noktalar */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {list.map((m, i) => (
          <button
            key={m.id || i}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`${i + 1}. ekip üyesi`}
            className={`h-2 rounded-full transition-all ${
              i === index ? 'w-6 bg-brand-500' : 'w-2 bg-cream-300 hover:bg-cream-400'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
