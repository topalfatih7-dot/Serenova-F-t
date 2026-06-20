import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trophy, ArrowRight, Quote, Sparkles } from 'lucide-react'
import SectionBackdrop, { SectionHeader } from './SectionBackdrop'

const CARD_ACCENTS = [
  'from-brand-500 to-brand-600',
  'from-sage-500 to-emerald-600',
  'from-warm-400 to-amber-500',
]

export default function SuccessStoriesPreview({ stories = [] }) {
  const approved = stories.filter((s) => s.approved).slice(0, 3)
  if (approved.length === 0) return null

  return (
    <SectionBackdrop variant="stories" className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <SectionHeader
            badge="Dönüşümler"
            badgeIcon={Trophy}
            title="Gerçek Başarı Hikayeleri"
            subtitle="Topluluğumuzdan ilham veren yolculuklar. Sonuçlar kişiden kişiye değişir."
            align="left"
            className="sm:flex-1"
          />
          <Link
            to="/stories"
            className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-brand-200 bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 shadow-sm transition hover:border-brand-300 hover:shadow-md"
          >
            Tümünü gör
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className={`mt-10 grid gap-5 ${approved.length === 1 ? 'max-w-md' : approved.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
          {approved.map((story, i) => (
            <motion.article
              key={story.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.45 }}
              className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/80 bg-white shadow-lg shadow-brand-900/[0.06] transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className={`h-1.5 bg-gradient-to-r ${CARD_ACCENTS[i % CARD_ACCENTS.length]}`} />
              <div className="flex flex-1 flex-col p-6 sm:p-7">
                <div className="flex items-start justify-between gap-3">
                  <Quote className="h-9 w-9 text-brand-200 transition group-hover:text-brand-300" />
                  <span className="inline-flex items-center gap-1 rounded-full bg-sage-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-sage-700">
                    <Sparkles className="h-3 w-3" />
                    Onaylı
                  </span>
                </div>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-cream-800/85 sm:text-[0.9375rem] sm:leading-7 line-clamp-6">
                  {story.story || story.highlight}
                </p>
                <div className="mt-6 flex items-center gap-3 border-t border-cream-100 pt-5">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${CARD_ACCENTS[i % CARD_ACCENTS.length]} text-sm font-bold text-white shadow-md`}>
                    {story.name?.charAt(0)}
                  </span>
                  <div>
                    <p className="font-semibold text-cream-900">{story.name}</p>
                    {story.duration && (
                      <p className="text-xs text-cream-800/50">{story.duration} program süresi</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </SectionBackdrop>
  )
}
