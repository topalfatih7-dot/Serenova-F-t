import { memo, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

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
