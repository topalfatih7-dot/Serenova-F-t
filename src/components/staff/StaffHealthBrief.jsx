import { FileText } from 'lucide-react'
import {
  HEALTH_SCORE_KEYS,
  HEALTH_SCORE_META,
  STAFF_BRIEF_KEYS,
  STAFF_BRIEF_META,
} from '../../services/healthScoreAnalysis'

function scoreTone(score) {
  if (score >= 75) {
    return {
      bar: 'bg-sage-500',
      ring: 'ring-sage-300',
      text: 'text-sage-800',
      chip: 'bg-sage-100 text-sage-800 ring-sage-200',
      glow: 'from-sage-400 to-emerald-500',
      track: 'bg-sage-100',
    }
  }
  if (score >= 55) {
    return {
      bar: 'bg-brand-500',
      ring: 'ring-brand-300',
      text: 'text-brand-800',
      chip: 'bg-brand-100 text-brand-800 ring-brand-200',
      glow: 'from-brand-400 to-brand-600',
      track: 'bg-brand-100',
    }
  }
  if (score >= 40) {
    return {
      bar: 'bg-amber-500',
      ring: 'ring-amber-300',
      text: 'text-amber-800',
      chip: 'bg-amber-100 text-amber-800 ring-amber-200',
      glow: 'from-amber-400 to-orange-500',
      track: 'bg-amber-100',
    }
  }
  return {
    bar: 'bg-rose-500',
    ring: 'ring-rose-300',
    text: 'text-rose-800',
    chip: 'bg-rose-100 text-rose-800 ring-rose-200',
    glow: 'from-rose-400 to-rose-600',
    track: 'bg-rose-100',
  }
}

function CategoryScoreCard({ scoreKey, score }) {
  const meta = HEALTH_SCORE_META[scoreKey]
  const tone = scoreTone(score ?? 0)
  const pct = Math.max(0, Math.min(100, Number(score) || 0))
  return (
    <div className={`rounded-xl border bg-white/95 p-3 shadow-sm ring-1 ${tone.ring}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-cream-900">
          <span aria-hidden className="shrink-0 text-base leading-none">{meta.emoji}</span>
          <span className="truncate">{meta.label}</span>
        </span>
        <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-sm font-bold ${tone.chip} ring-1`}>
          {score ?? '—'}
        </span>
      </div>
      <div className={`mt-2 h-2 w-full overflow-hidden rounded-full ${tone.track}`}>
        <div
          className={`h-full rounded-full bg-gradient-to-r ${tone.glow}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

/**
 * Koç / diyetisyen — tarihsel sağlık analizi (yeni AI skor üretimi yok).
 */
export default function StaffHealthBrief({ analysis }) {
  const brief = analysis?.staffBrief
  const hasBrief = brief && STAFF_BRIEF_KEYS.some((k) => brief[k])
  const scores = analysis?.scores || {}
  const overall = analysis?.overallScore
  const hasScores = HEALTH_SCORE_KEYS.some((k) => scores[k] != null) || overall != null
  const tone = scoreTone(overall ?? 0)

  if (!hasBrief && !hasScores) return null

  return (
    <div className="space-y-4 rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/50 via-white to-sage-50/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-cream-900">
          <FileText className="h-4 w-4 text-brand-500" /> Detaylı sağlık analizi
        </p>
        {overall != null && (
          <div className={`relative flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-md ring-2 ${tone.ring}`}>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wide text-cream-800/45">Genel skor</p>
              <p className={`font-display text-2xl font-bold leading-none ${tone.text}`}>
                {overall}
                <span className="ml-0.5 text-sm font-semibold text-cream-800/45">/100</span>
              </p>
            </div>
            <span className={`pointer-events-none absolute inset-x-2 bottom-0 h-1 rounded-full bg-gradient-to-r ${tone.glow} opacity-80`} />
          </div>
        )}
      </div>

      {hasScores && (
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-cream-800/50">
            Kategori puanları
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {HEALTH_SCORE_KEYS.map((key) => (
              <CategoryScoreCard key={key} scoreKey={key} score={scores[key]} />
            ))}
          </div>
        </div>
      )}

      {hasBrief && (
        <div className="space-y-3">
          {STAFF_BRIEF_KEYS.map((key) => {
            const text = brief[key]
            if (!text) return null
            return (
              <div key={key} className="rounded-xl border border-cream-100 bg-white/90 px-3.5 py-3 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700/70">
                  {STAFF_BRIEF_META[key]?.label || key}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-cream-800/80">{text}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
