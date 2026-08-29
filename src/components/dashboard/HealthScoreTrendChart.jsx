import { memo, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { useChartColors } from '../../context/ThemeContext'

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
  const colors = useChartColors()
  if (data.length < 2) return null

  return (
    <div className="mt-5 border-t border-brand-100/80 pt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-700/60">Skor trendi</p>
      <div className="h-40 w-full min-w-0">
        {/* Sabit yükseklik: gizli/0 boyutlu kapsayıcıda width/height -1 uyarısını önler */}
        <ResponsiveContainer width="100%" height={160} minWidth={0}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: colors.tick }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: colors.tick }} width={36} />
            <Tooltip
              contentStyle={{
                backgroundColor: colors.tooltipBg,
                border: `1px solid ${colors.tooltipBorder}`,
                color: colors.tooltipColor,
              }}
            />
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
