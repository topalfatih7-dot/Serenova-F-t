import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react'

export default function TestimonialCarousel({ testimonials, dark = false }) {
  const list = testimonials || []
  const [[index, dir], setState] = useState([0, 0])
  const count = list.length

  if (count === 0) return null

  const paginate = (d) => {
    setState(([i]) => [(i + d + count) % count, d])
  }

  const t = list[index]

  return (
    <div className="relative mx-auto max-w-2xl px-4 sm:px-6">
      <div className="relative min-h-[280px] overflow-hidden">
        <AnimatePresence initial={false} mode="wait" custom={dir}>
          <motion.div
            key={t.id}
            custom={dir}
            initial={{ opacity: 0, x: dir >= 0 ? 80 : -80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir >= 0 ? -80 : 80 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, info) => {
              if (info.offset.x < -60) paginate(1)
              else if (info.offset.x > 60) paginate(-1)
            }}
            className={`rounded-3xl border p-8 shadow-sm ${ dark ? 'border-white/15 bg-white/10 backdrop-blur-md' : 'border-cream-200 bg-white'}`}
            style={{ cursor: 'grab' }}
          >
            <Quote className="h-9 w-9 text-brand-200" />
            <div className="mt-3 flex gap-1">
              {Array.from({ length: t.rating }).map((_, j) => (
                <Star key={j} className="h-4 w-4 fill-gold-400 text-gold-400" />
              ))}
            </div>
            <p className={`mt-4 text-lg leading-relaxed ${ dark ? 'text-white/85' : 'text-cream-800/85'}`}>&ldquo;{t.quote}&rdquo;</p>
            <div className="mt-6 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-sage-400 text-base font-bold text-white">
                {t.name.charAt(0)}
              </span>
              <div>
                <p className={`font-semibold ${ dark ? 'text-white' : 'text-cream-900'}`}>{t.name}</p>
                <p className={`text-xs ${ dark ? 'text-white/50' : 'text-cream-800/50'}`}>{t.role}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => paginate(-1)}
          aria-label="Önceki yorum"
          className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition ${ dark ? 'border-white/20 bg-white/10 text-white hover:bg-white/20' : 'border-cream-200 bg-white text-cream-800 hover:border-brand-300 hover:text-brand-600'}`}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          {list.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setState([i, i > index ? 1 : -1])}
              aria-label={`${i + 1}. yorum`}
              className={`h-2 rounded-full transition-all ${
                i === index ? 'w-6 bg-brand-400' : dark ? 'w-2 bg-white/30 hover:bg-white/50' : 'w-2 bg-cream-300 hover:bg-cream-400'
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => paginate(1)}
          aria-label="Sonraki yorum"
          className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition ${ dark ? 'border-white/20 bg-white/10 text-white hover:bg-white/20' : 'border-cream-200 bg-white text-cream-800 hover:border-brand-300 hover:text-brand-600'}`}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
