import { useRef, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Sparkles, ChevronLeft, ChevronRight, BadgeCheck } from 'lucide-react'

const AVATAR_RINGS = [
  'from-brand-400 to-brand-600',
  'from-sage-400 to-emerald-600',
  'from-amber-400 to-orange-500',
]

function StoryPhoto({ className = '', variant = 'banner' }) {
  const aspectClass = variant === 'sidebar' ? 'aspect-[4/5] w-full' : 'aspect-[16/10] w-full'

  return (
    <div className={`relative overflow-hidden rounded-3xl shadow-2xl shadow-brand-900/15 ring-1 ring-black/5 ${className}`}>
      <div className={aspectClass}>
        <img
          src="/success-stories-bg.jpg"
          alt="Antrenman yapan erkek üye — dönüşüm hikayesi"
          className="h-full w-full object-cover object-[30%_center]"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-brand-900/30 via-transparent to-transparent" />
      <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/30 bg-white/15 px-4 py-3 backdrop-blur-md">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Gerçek dönüşüm</p>
        <p className="mt-0.5 text-sm font-medium text-white">Topluluğumuzdan ilham alın</p>
      </div>
    </div>
  )
}

function StoryCard({ story, index }) {
  const ring = AVATAR_RINGS[index % AVATAR_RINGS.length]
  const initial = story.name?.charAt(0)?.toUpperCase() || '?'

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
      className="group flex h-[380px] w-[min(85vw,320px)] shrink-0 snap-center flex-col rounded-3xl border border-cream-200/90 bg-white p-6 text-center shadow-lg shadow-brand-900/[0.06] ring-1 ring-black/[0.03] transition-shadow hover:shadow-xl sm:w-[300px]"
    >
      {/* Avatar — merkez */}
      <div className="mx-auto shrink-0">
        <div className={`rounded-full bg-gradient-to-br p-[3px] ${ring} shadow-md`}>
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-xl font-bold text-cream-900">
            {initial}
          </span>
        </div>
      </div>

      <h3 className="mt-4 font-display text-base font-bold text-cream-900">{story.name}</h3>
      {story.duration && (
        <p className="mt-1 text-xs font-medium text-brand-600/80">{story.duration} program</p>
      )}

      {/* Simetrik ayırıcı */}
      <div className="mx-auto mt-4 flex w-12 items-center gap-1.5">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-cream-200" />
        <Sparkles className="h-3 w-3 text-brand-300" />
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-cream-200" />
      </div>

      {/* Hikaye metni — dengeli padding */}
      <blockquote className="mt-4 flex flex-1 flex-col justify-center px-1">
        <p className="text-sm leading-relaxed text-cream-800/75 line-clamp-5">
          &ldquo;{story.story || story.highlight}&rdquo;
        </p>
      </blockquote>

      {/* Alt rozet — merkez */}
      <div className="mt-4 flex shrink-0 justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-50 px-3 py-1.5 text-[11px] font-semibold text-sage-700 ring-1 ring-sage-100">
          <BadgeCheck className="h-3.5 w-3.5 text-sage-500" />
          Onaylı hikaye
        </span>
      </div>
    </motion.article>
  )
}

export default function SuccessStoriesPreview({ stories = [] }) {
  const approved = stories.filter((s) => s.approved)
  const scrollRef = useRef(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(true)

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
  }, [approved.length, updateScroll])

  const scrollByDir = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' })
  }

  if (approved.length === 0) return null

  const showArrows = approved.length > 1

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-warm-50/40 to-sage-50/30 py-14 sm:py-20">
      {/* CSS-only dekoratif orb — JS animasyonu kaldırıldı */}
      <div
        aria-hidden
        className="landing-orb-b absolute -left-32 top-1/4 h-80 w-80 rounded-full bg-sage-200/40 blur-3xl"
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "50px" }}
          className="relative mb-10 overflow-hidden rounded-3xl lg:hidden"
        >
          <StoryPhoto variant="banner" />
        </motion.div>

        <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="min-w-0 lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "50px" }}
              className="text-center lg:text-left"
            >
              <span className="section-badge inline-flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5" />
                Dönüşümler
              </span>
              <h2 className="section-title mt-4">Gerçek Başarı Hikayeleri</h2>
              <p className="section-subtitle mx-auto !mt-3 max-w-xl lg:mx-0">
                Topluluğumuzdan ilham veren yolculuklar. Sonuçlar kişiden kişiye değişir.
              </p>
            </motion.div>

            <div className="relative mt-6">
              {showArrows && (
                <>
                  <button
                    type="button"
                    onClick={() => scrollByDir(-1)}
                    disabled={!canLeft}
                    aria-label="Önceki hikaye"
                    className={`absolute left-0 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border-2 border-brand-200 bg-white text-brand-700 shadow-lg shadow-brand-900/10 transition hover:border-brand-400 hover:bg-brand-50 hover:shadow-xl sm:h-12 sm:w-12 ${
                      canLeft ? 'opacity-100' : 'pointer-events-none opacity-30'
                    }`}
                  >
                    <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollByDir(1)}
                    disabled={!canRight}
                    aria-label="Sonraki hikaye"
                    className={`absolute right-0 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border-2 border-brand-200 bg-white text-brand-700 shadow-lg shadow-brand-900/10 transition hover:border-brand-400 hover:bg-brand-50 hover:shadow-xl sm:h-12 sm:w-12 ${
                      canRight ? 'opacity-100' : 'pointer-events-none opacity-30'
                    }`}
                  >
                    <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
                  </button>
                </>
              )}

              <div
                ref={scrollRef}
                className={`-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 pt-2 [scrollbar-width:thin] lg:mx-0 ${
                  showArrows ? 'px-14 sm:px-16' : 'px-4 lg:px-0'
                }`}
              >
                {approved.map((story, i) => (
                  <motion.div
                    key={story.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "50px" }}
                    transition={{ delay: i * 0.07, duration: 0.45 }}
                    className="shrink-0"
                  >
                    <StoryCard story={story} index={i} />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "50px" }}
            transition={{ duration: 0.6 }}
            className="relative hidden lg:col-span-5 lg:block"
          >
            <div className="sticky top-24">
              <StoryPhoto variant="sidebar" />
            </div>
            <div
              aria-hidden
              className="absolute -bottom-3 -left-3 -z-10 h-[calc(100%-0.5rem)] w-[calc(100%-0.5rem)] rounded-3xl bg-gradient-to-br from-brand-100 to-sage-100"
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
