import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Star, Quote, BadgeCheck } from 'lucide-react'
import SectionBackdrop, { SectionHeader } from './SectionBackdrop'

function TestimonialCard({ item, featured = false }) {
  const rating = item.rating || 5

  return (
    <article
      className={`relative flex h-full flex-col overflow-hidden rounded-3xl border transition ${
        featured
          ? 'border-white/20 bg-white/95 p-7 shadow-2xl backdrop-blur-md sm:p-8'
          : 'border-white/15 bg-white/90 p-6 shadow-lg backdrop-blur-md hover:bg-white hover:shadow-xl'
      }`}
    >
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br from-brand-100/80 to-sage-100/80" aria-hidden />

      <div className="relative flex items-center justify-between gap-3">
        <Quote className="h-8 w-8 shrink-0 text-brand-300" strokeWidth={1.5} />
        <div className="flex gap-0.5">
          {Array.from({ length: rating }).map((_, j) => (
            <Star key={j} className="h-4 w-4 fill-gold-400 text-gold-400" />
          ))}
        </div>
      </div>

      <blockquote className="relative mt-5 flex-1 text-sm leading-relaxed text-cream-800/90 sm:text-base sm:leading-7">
        &ldquo;{item.quote}&rdquo;
      </blockquote>

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
  const [[index, dir], setState] = useState([0, 0])
  const count = list.length

  const avgRating = useMemo(() => {
    if (!count) return 0
    const sum = list.reduce((acc, t) => acc + (t.rating || 5), 0)
    return (sum / count).toFixed(1)
  }, [list, count])

  if (count === 0) return null

  const paginate = (d) => {
    setState(([i]) => [(i + d + count) % count, d])
  }

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
            viewport={{ once: true }}
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

        <div className="mt-12 hidden gap-5 lg:grid lg:grid-cols-3">
          {list.slice(0, 6).map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.45 }}
            >
              <TestimonialCard item={item} />
            </motion.div>
          ))}
        </div>

        <div className="mt-12 hidden gap-5 sm:grid sm:grid-cols-2 lg:hidden">
          {list.slice(0, 4).map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.45 }}
            >
              <TestimonialCard item={item} />
            </motion.div>
          ))}
        </div>

        <div className="relative mt-10 sm:hidden">
          <div className="relative min-h-[340px] overflow-hidden px-1">
            <AnimatePresence initial={false} mode="wait" custom={dir}>
              <motion.div
                key={list[index].id}
                custom={dir}
                initial={{ opacity: 0, x: dir >= 0 ? 48 : -48 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir >= 0 ? -48 : 48 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -50) paginate(1)
                  else if (info.offset.x > 50) paginate(-1)
                }}
                className="cursor-grab active:cursor-grabbing"
              >
                <TestimonialCard item={list[index]} featured />
              </motion.div>
            </AnimatePresence>
          </div>

          {count > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => paginate(-1)}
                aria-label="Önceki yorum"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
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
                      i === index ? 'w-6 bg-white' : 'w-2 bg-white/35 hover:bg-white/55'
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => paginate(1)}
                aria-label="Sonraki yorum"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </SectionBackdrop>
  )
}
