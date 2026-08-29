import { memo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { useChartColors } from '../../context/ThemeContext'

export const WeightChart = memo(function WeightChart({ data }) {
  const colors = useChartColors()
  return (
    <div className="h-56 w-full min-w-0">
      <ResponsiveContainer width="100%" height={224} minWidth={0}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: colors.tick }} />
          <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 12, fill: colors.tick }} />
          <Tooltip
            contentStyle={{
              backgroundColor: colors.tooltipBg,
              border: `1px solid ${colors.tooltipBorder}`,
              color: colors.tooltipColor,
            }}
          />
          <Line type="monotone" dataKey="value" name="Kilo (kg)" stroke="#d44d8a" strokeWidth={2} dot={{ fill: '#d44d8a' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
})
