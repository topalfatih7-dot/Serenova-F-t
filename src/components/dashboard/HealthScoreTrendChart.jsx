import { memo, useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { HEALTH_SCORE_KEYS, HEALTH_SCORE_META } from '../../services/healthScoreAnalysis'

function dayLabel(iso) {
  const s = String(iso || '').slice(0, 10)
  if (!s) return ''
  const [, m, d] = s.split('-')
  return `${d}.${m}`
}

function toChartRows(history = [], limit = 12) {
  return (history || [])
    .filter((h) => h?.overallScore != null || h?.overallScore === 0)
    .slice(-limit)
    .map((h) => ({
      label: dayLabel(h.at),
      at: h.at,
      overall: h.overallScore,
      ...(h.scores || {}),
    }))
}

/** Üye dashboard — yalnızca overall trend. */
export const HealthScoreSimpleTrend = memo(function HealthScoreSimpleTrend({ history = [] }) {
  const data = useMemo(() => toChartRows(history, 12), [history])
  if (data.length < 2) return null

  return (
    <div className="mt-5 border-t border-brand-100/80 pt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-700/60">Skor trendi</p>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#efe8de" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={36} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="overall"
              name="Genel skor"
              stroke="#d44d8a"
              strokeWidth={2}
              dot={{ fill: '#d44d8a', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
})

const DETAIL_LINES = [
  { key: 'overall', name: 'Genel', color: '#d44d8a' },
  { key: 'nutrition', name: HEALTH_SCORE_META.nutrition.label, color: '#5a9e6f' },
  { key: 'movement', name: HEALTH_SCORE_META.movement.label, color: '#d97706' },
  { key: 'sleep', name: HEALTH_SCORE_META.sleep.label, color: '#0284c7' },
  { key: 'stress', name: HEALTH_SCORE_META.stress.label, color: '#7c3aed' },
]

/** Koç / diyetisyen — overall + seçilebilir boyutlar. */
export const HealthScoreDetailedTrend = memo(function HealthScoreDetailedTrend({ history = [] }) {
  const data = useMemo(() => toChartRows(history, 24), [history])
  const [visible, setVisible] = useState(() => new Set(['overall', 'nutrition', 'movement']))

  if (data.length < 2) {
    return (
      <p className="text-xs text-cream-800/45">Trend için en az iki skor kaydı gerekir.</p>
    )
  }

  const toggle = (key) => {
    setVisible((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        if (next.size <= 1) return next
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {DETAIL_LINES.map((line) => {
          const on = visible.has(line.key)
          return (
            <button
              key={line.key}
              type="button"
              onClick={() => toggle(line.key)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                on ? 'bg-brand-500 text-white' : 'bg-cream-100 text-cream-800/70 hover:bg-cream-200'
              }`}
            >
              {line.name}
            </button>
          )
        })}
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#efe8de" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={36} />
            <Tooltip />
            <Legend />
            {DETAIL_LINES.filter((l) => visible.has(l.key)).map((line) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.name}
                stroke={line.color}
                strokeWidth={2}
                dot={{ r: 2.5, fill: line.color }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-[10px] text-cream-800/40">
        Boyutlar: {HEALTH_SCORE_KEYS.map((k) => HEALTH_SCORE_META[k].label).join(' · ')}
      </p>
    </div>
  )
})
