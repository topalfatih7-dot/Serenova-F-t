import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Dumbbell, Apple } from 'lucide-react'

export default function TeamCarousel({ members }) {
  const scrollRef = useRef(null)

  // Slider, satırın tam ortasından başlasın
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2)
  }, [members])

  const scrollBy = (dir) => {
    const el = scrollRef.current
    if (!el) return
    const amount = Math.max(el.clientWidth * 0.8, 280)
    el.scrollBy({ left: dir * amount, behavior: 'smooth' })
  }

  return (
    <div className="relative mx-auto max-w-6xl">
      <div className="mb-5 flex items-center justify-end gap-2 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Sola kaydır"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-cream-200 bg-white text-cream-800 shadow-sm transition hover:border-brand-300 hover:text-brand-600"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Sağa kaydır"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-cream-200 bg-white text-cream-800 shadow-sm transition hover:border-brand-300 hover:text-brand-600"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 pb-4 sm:px-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {members.map((m, i) => {
          const isCoach = m.role === 'coach'
          const RoleIcon = isCoach ? Dumbbell : Apple
          return (
            <motion.article
              key={m.id || `${m.name}-${i}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 4) * 0.08 }}
              className="group w-[260px] shrink-0 snap-start overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-sm transition hover:shadow-xl sm:w-[280px]"
            >
              <div className="relative h-72 overflow-hidden bg-cream-100">
                {m.photo ? (
                  <img
                    src={m.photo}
                    alt={m.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
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
                  <p className="mt-3 text-sm leading-relaxed text-cream-800/65">{m.bio || m.description}</p>
                )}
              </div>
            </motion.article>
          )
        })}
      </div>
    </div>
  )
}
