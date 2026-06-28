import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, ChevronDown, Star, Quote, BadgeCheck } from 'lucide-react'
import SectionBackdrop, { SectionHeader } from './SectionBackdrop'

const PREVIEW_LIMIT = 180

function TestimonialCard({ item }) {
  const rating = item.rating || 5
  const quote = item.quote || ''
  const isLong = quote.length > PREVIEW_LIMIT
  const [expanded, setExpanded] = useState(false)

  return (
    <article className="relative flex h-full w-[min(85vw,340px)] shrink-0 snap-center flex-col overflow-hidden rounded-3xl border border-white/15 bg-white/95 p-6 shadow-lg backdrop-blur-md transition hover:shadow-xl sm:w-[360px] sm:p-7">
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br from-brand-100/80 to-sage-100/80" aria-hidden />

      <div className="relative flex items-center justify-between gap-3">
        <Quote className="h-8 w-8 shrink-0 text-brand-300" strokeWidth={1.5} />
        <div className="flex gap-0.5">
          {Array.from({ length: rating }).map((_, j) => (
            <Star key={j} className="h-4 w-4 fill-gold-400 text-gold-400" />
          ))}
        </div>
      </div>

      <div className="relative mt-5 flex-1">
        <blockquote
          className={`text-sm leading-relaxed text-cream-800/90 sm:text-[15px] sm:leading-7 ${
            !expanded && isLong ? 'line-clamp-4' : ''
          }`}
        >
          &ldquo;{quote}&rdquo;
        </blockquote>

        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 transition hover:text-brand-700"
            aria-expanded={expanded}
          >
            {expanded ? 'Daha az göster' : 'Devamını oku'}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
              strokeWidth={2.5}
            />
          </button>
        )}
      </div>

      <footer className="relative mt-6 flex items-center gap-3 border-t border-cream-100/80 pt-5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-sage-500 text-base font-bold text-white shadow-md">
          {item.name?.charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="font-semibold text-cream-900">{item.name}</p>
            <BadgeCheck className="h-4 w-4 shrink-0 text-brand-500" aria-label="Doğrulanmış üye" />
          </div>
          {item.role && (
            <p className="truncate text-xs text-cream-800/55">{item.role}</p>
          )}
        </div>
      </footer>
    </article>
  )
}

export default function TestimonialCarousel({ testimonials }) {
  const list = testimonials || []
  const count = list.length
  const scrollRef = useRef(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(true)

  const avgRating = useMemo(() => {
    if (!count) return 0
    const sum = list.reduce((acc, t) => acc + (t.rating || 5), 0)
    return (sum / count).toFixed(1)
  }, [list, count])

  const updateScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 8)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)
  }, [])

  useEffect(() => {
    updateScroll()
    const el = scrollRef.current
    if (!el) return undefined
    el.addEventListener('scroll', updateScroll, { passive: true })
    window.addEventListener('resize', updateScroll)
    return () => {
      el.removeEventListener('scroll', updateScroll)
      window.removeEventListener('resize', updateScroll)
    }
  }, [count, updateScroll])

  const scrollByDir = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 360, behavior: 'smooth' })
  }

  if (count === 0) return null

  const showArrows = count > 1

  return (
    <SectionBackdrop variant="testimonials" className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader
          dark
          badge="Referanslar"
          title="Üyelerimiz Ne Diyor?"
          subtitle="Gerçek deneyimler, gerçek dönüşümler — topluluğumuzdan sözler."
        />

        {count >= 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "50px" }}
            className="mx-auto mt-6 flex w-fit items-center gap-3 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 backdrop-blur-md"
          >
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-gold-400 text-gold-400" />
              ))}
            </div>
            <span className="text-lg font-bold text-white">{avgRating}</span>
            <span className="text-sm text-white/60">· {count} değerlendirme</span>
          </motion.div>
        )}

        <div className="relative mt-10">
          {showArrows && (
            <>
              <button
                type="button"
                onClick={() => scrollByDir(-1)}
                disabled={!canLeft}
                aria-label="Önceki yorum"
                className={`absolute -left-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white shadow-lg backdrop-blur-md transition hover:bg-white/30 sm:flex sm:h-12 sm:w-12 ${
                  canLeft ? 'opacity-100' : 'pointer-events-none opacity-30'
                }`}
              >
                <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={() => scrollByDir(1)}
                disabled={!canRight}
                aria-label="Sonraki yorum"
                className={`absolute -right-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white shadow-lg backdrop-blur-md transition hover:bg-white/30 sm:flex sm:h-12 sm:w-12 ${
                  canRight ? 'opacity-100' : 'pointer-events-none opacity-30'
                }`}
              >
                <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
              </button>
            </>
          )}

          <div
            ref={scrollRef}
            className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 pt-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:px-10 [&::-webkit-scrollbar]:hidden"
          >
            {list.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "50px" }}
                transition={{ delay: Math.min(i, 4) * 0.07, duration: 0.45 }}
                className="shrink-0"
              >
                <TestimonialCard item={item} />
              </motion.div>
            ))}
          </div>
        </div>

        {showArrows && (
          <p className="mt-3 text-center text-xs text-white/45 sm:hidden">
            Yorumları görmek için yana kaydırın →
          </p>
        )}
      </div>
    </SectionBackdrop>
  )
}
