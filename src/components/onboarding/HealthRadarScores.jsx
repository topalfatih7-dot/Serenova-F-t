import { motion } from 'framer-motion'
import { RADAR_SCORE_LABELS } from '../../services/aiAnalysis'

const DIMENSION_KEYS = [
  'metabolic',
  'nutrition',
  'activity',
  'sleep',
  'stress',
  'digestion',
  'lifestyle',
]

function scoreTone(score) {
  if (score >= 75) return 'bg-sage-500'
  if (score >= 55) return 'bg-brand-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-rose-500'
}

export default function HealthRadarScores({ radarScores, title = '360° Sağlık Analizi' }) {
  if (!radarScores || typeof radarScores !== 'object') return null
  const overall = radarScores.overall

  return (
    <div className="rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50/80 via-white to-sage-50/50 p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700/70">{title}</p>
          <p className="mt-1 font-display text-xl font-bold text-cream-900 sm:text-2xl">
            Genel değerlendirme
          </p>
          <p className="mt-1 text-sm text-cream-800/60">
            Cevaplarınıza göre yedi boyutta sağlık profiliniz.
          </p>
        </div>
        {overall != null && (
          <div className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-brand-100">
            <span className="font-display text-2xl font-bold text-brand-700">{overall}</span>
            <span className="text-[10px] font-semibold uppercase text-cream-800/45">/100</span>
          </div>
        )}
      </div>

      <div className="mt-5 space-y-3">
        {DIMENSION_KEYS.map((key, i) => {
          const score = radarScores[key]
          if (score == null) return null
          return (
            <div key={key}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-cream-900">{RADAR_SCORE_LABELS[key] || key}</span>
                <span className="font-semibold text-cream-800/70">{score}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-cream-100">
                <motion.div
                  className={`h-full rounded-full ${scoreTone(score)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ duration: 0.55, delay: i * 0.04, ease: 'easeOut' }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
