import { motion } from 'framer-motion'
import { HeartPulse, Loader2, Clock3 } from 'lucide-react'
import {
  HEALTH_SCORE_KEYS,
  HEALTH_SCORE_META,
} from '../../services/healthScoreAnalysis'
import { HealthScoreSimpleTrend } from './HealthScoreTrendChart'
import { useTheme } from '../../context/ThemeContext'

function formatRetakeDate(date) {
  if (!date) return ''
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date instanceof Date ? date : new Date(date))
  } catch {
    return ''
  }
}

function scoreTone(score, isDark = false) {
  if (score >= 75) {
    return {
      bar: 'bg-sage-500',
      ring: 'ring-sage-200',
      text: 'text-sage-700',
      glow: 'from-sage-400 to-emerald-500',
      stroke: '#5a9e6f',
      track: isDark ? '#1a3324' : '#e8f2eb',
      label: 'Güçlü',
      chip: 'bg-sage-100 text-sage-800',
    }
  }
  if (score >= 55) {
    return {
      bar: 'bg-brand-500',
      ring: 'ring-brand-200',
      text: 'text-brand-700',
      glow: 'from-brand-400 to-brand-600',
      stroke: '#d44d8a',
      track: isDark ? '#3a2030' : '#fce8f0',
      label: 'İyi',
      chip: 'bg-brand-100 text-brand-800',
    }
  }
  if (score >= 40) {
    return {
      bar: 'bg-amber-500',
      ring: 'ring-amber-200',
      text: 'text-amber-700',
      glow: 'from-amber-400 to-orange-500',
      stroke: '#d97706',
      track: isDark ? '#3a2e18' : '#fef3c7',
      label: 'Orta',
      chip: 'bg-amber-100 text-amber-800',
    }
  }
  return {
    bar: 'bg-rose-500',
    ring: 'ring-rose-200',
    text: 'text-rose-700',
    glow: 'from-rose-400 to-rose-600',
    stroke: '#e11d48',
    track: isDark ? '#3a1c22' : '#ffe4e6',
    label: 'Gelişim alanı',
    chip: 'bg-rose-100 text-rose-800',
  }
}

function OverallGauge({ score, loading, tone }) {
  const size = 128
  const stroke = 10
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, Number(score) || 0))
  const offset = c - (pct / 100) * c

  return (
    <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone.track}
          strokeWidth={stroke}
        />
        {!loading && score != null && (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={tone.stroke}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {loading && score == null ? (
          <Loader2 className={`h-7 w-7 animate-spin ${tone.text}`} />
        ) : (
          <>
            <span className={`font-display text-4xl font-bold leading-none ${tone.text}`}>
              {score ?? '—'}
            </span>
            <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-cream-800/45">
              /100
            </span>
          </>
        )}
      </div>
    </div>
  )
}

function DimensionCard({ scoreKey, score, isDark }) {
  const meta = HEALTH_SCORE_META[scoreKey]
  const tone = scoreTone(score ?? 0, isDark)
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-cream-100 bg-white/90 p-2.5 shadow-sm sm:p-3">
      <div className="flex min-w-0 items-start justify-between gap-1.5">
        <span className="flex min-w-0 items-start gap-1 text-[11px] font-semibold leading-snug text-cream-900 sm:items-center sm:gap-1.5 sm:text-xs">
          <span aria-hidden className="shrink-0 text-sm leading-none sm:text-base">{meta.emoji}</span>
          <span className="min-w-0 break-words">{meta.label}</span>
        </span>
        <span className={`shrink-0 text-sm font-bold tabular-nums ${tone.text}`}>{score ?? '—'}</span>
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
  /** Ücretsiz üye: özet metin gizli; skorlar ve trend grafiği herkese açık */
  scoresOnly = false,
  /** 14 günlük kilit durumu — güncellenebilir tarih rozeti */
  lockState = null,
}) {
  const { isDark } = useTheme()
  if (!complete) return null

  const scores = analysis?.scores || {}
  const overall = analysis?.overallScore
  const tone = scoreTone(overall ?? 0, isDark)
  const showSkeleton = loading && overall == null

  return (
    <div className="min-w-0 overflow-hidden rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50/90 via-white to-sage-50/50 p-5 shadow-sm sm:p-6">
      <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-700/70">
            <HeartPulse className="h-3.5 w-3.5" /> YeniForm Sağlık Skoru
          </p>
          <h3 className="mt-1 font-display text-xl font-bold text-cream-900 sm:text-2xl">
            Genel puanınız
          </h3>
          {overall != null && !showSkeleton && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${tone.chip}`}>
                {tone.label}
              </span>
              {lockState?.locked && lockState?.lockedUntil && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                  <Clock3 className="h-3 w-3" />
                  Güncellenebilir: {formatRetakeDate(lockState.lockedUntil)}
                </span>
              )}
              {lockState?.canRetake && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-sage-100 px-2.5 py-1 text-xs font-semibold text-sage-800">
                  <Clock3 className="h-3 w-3" />
                  Yeniden çözebilirsiniz
                </span>
              )}
            </div>
          )}
          {!scoresOnly && analysis?.summary ? (
            <p className="mt-2 text-sm leading-relaxed text-cream-800/65 break-words">{analysis.summary}</p>
          ) : !scoresOnly ? (
            <p className="mt-2 text-sm text-cream-800/55">
              Sağlık analizi cevaplarınıza göre 8 boyutta değerlendirildiniz.
            </p>
          ) : null}
          {error && (
            <p className="mt-2 text-xs text-amber-700">{error}</p>
          )}
        </div>

        <OverallGauge score={overall} loading={showSkeleton} tone={tone} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {HEALTH_SCORE_KEYS.map((key) => (
          <DimensionCard key={key} scoreKey={key} score={scores[key]} isDark={isDark} />
        ))}
      </div>

      <HealthScoreSimpleTrend history={history} />
    </div>
  )
}
