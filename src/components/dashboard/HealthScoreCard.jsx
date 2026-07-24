import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HeartPulse, Loader2, Sparkles, ArrowRight } from 'lucide-react'
import {
  HEALTH_SCORE_KEYS,
  HEALTH_SCORE_META,
} from '../../services/healthScoreAnalysis'
import { HealthScoreSimpleTrend } from './HealthScoreTrendChart'

function scoreTone(score) {
  if (score >= 75) return { bar: 'bg-sage-500', ring: 'ring-sage-200', text: 'text-sage-700', glow: 'from-sage-400 to-emerald-500' }
  if (score >= 55) return { bar: 'bg-brand-500', ring: 'ring-brand-200', text: 'text-brand-700', glow: 'from-brand-400 to-brand-600' }
  if (score >= 40) return { bar: 'bg-amber-500', ring: 'ring-amber-200', text: 'text-amber-700', glow: 'from-amber-400 to-orange-500' }
  return { bar: 'bg-rose-500', ring: 'ring-rose-200', text: 'text-rose-700', glow: 'from-rose-400 to-rose-600' }
}

function DimensionCard({ scoreKey, score }) {
  const meta = HEALTH_SCORE_META[scoreKey]
  const tone = scoreTone(score ?? 0)
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-cream-100 bg-white/90 p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-cream-900">
          <span aria-hidden className="shrink-0 text-base leading-none">{meta.emoji}</span>
          <span className="truncate">{meta.label}</span>
        </span>
        <span className={`shrink-0 text-sm font-bold ${tone.text}`}>{score ?? '—'}</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-cream-100">
        <motion.div
          className={`h-full rounded-full ${tone.bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, score || 0))}%` }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

export default function HealthScoreCard({
  analysis,
  history = [],
  loading = false,
  complete = false,
  error = null,
}) {
  if (!complete) {
    return (
      <div className="overflow-hidden rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-sage-50/40 p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-700/70">
              <Sparkles className="h-3.5 w-3.5" /> YeniForm Sağlık Skoru
            </p>
            <h3 className="mt-1 font-display text-xl font-bold text-cream-900 sm:text-2xl">
              Kişisel sağlık analizinizi tamamlayın
            </h3>
            <p className="mt-1 text-sm text-cream-800/60 break-words">
              6 kategorilik analiziniz bittiğinde 8 boyutlu skorunuz panelde görünecek.
            </p>
          </div>
          <Link
            to="/health-test"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-600"
          >
            Analize git <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    )
  }

  const scores = analysis?.scores || {}
  const overall = analysis?.overallScore
  const tone = scoreTone(overall ?? 0)
  const showSkeleton = loading && overall == null

  return (
    <div className="min-w-0 overflow-hidden rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50/90 via-white to-sage-50/50 p-5 shadow-sm sm:p-6">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-700/70">
            <HeartPulse className="h-3.5 w-3.5" /> YeniForm Sağlık Skoru
          </p>
          <h3 className="mt-1 font-display text-xl font-bold text-cream-900 sm:text-2xl">
            Kişisel sağlık profiliniz
          </h3>
          {analysis?.summary ? (
            <p className="mt-1 text-sm leading-relaxed text-cream-800/65 break-words">{analysis.summary}</p>
          ) : (
            <p className="mt-1 text-sm text-cream-800/55">Cevaplarınıza göre 8 boyutta değerlendirildiniz.</p>
          )}
          {error && (
            <p className="mt-2 text-xs text-amber-700">{error}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className={`relative flex h-20 w-20 flex-col items-center justify-center rounded-2xl bg-white shadow-md ring-2 ${tone.ring}`}>
            {showSkeleton ? (
              <Loader2 className={`h-6 w-6 animate-spin ${tone.text}`} />
            ) : (
              <>
                <span className={`font-display text-3xl font-bold ${tone.text}`}>{overall ?? '—'}</span>
                <span className="text-[10px] font-semibold uppercase text-cream-800/45">/100</span>
              </>
            )}
            <span className={`pointer-events-none absolute inset-x-2 bottom-0 h-1 rounded-full bg-gradient-to-r ${tone.glow} opacity-70`} />
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {HEALTH_SCORE_KEYS.map((key) => (
          <DimensionCard key={key} scoreKey={key} score={scores[key]} />
        ))}
      </div>

      <HealthScoreSimpleTrend history={history} />
    </div>
  )
}
