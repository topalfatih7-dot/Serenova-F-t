import { memo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

export const WeightChart = memo(function WeightChart({ data }) {
  return (
    <div className="h-56 w-full min-w-0">
      <ResponsiveContainer width="100%" height={224} minWidth={0}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#efe8de" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Line type="monotone" dataKey="value" name="Kilo (kg)" stroke="#d44d8a" strokeWidth={2} dot={{ fill: '#d44d8a' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
})
