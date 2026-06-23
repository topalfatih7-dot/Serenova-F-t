import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

export function WeightChart({ data }) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
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
}

export function WorkoutChart({ data }) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#efe8de" />
          <XAxis dataKey="week" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="completed" name="Tamamlanan" fill="#5f9270" radius={[4, 4, 0, 0]} />
          <Bar dataKey="planned" name="Planlanan" fill="#e6efe8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function MealChart({ data }) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#efe8de" />
          <XAxis dataKey="week" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="completed" name="Tamamlanan öğün" fill="#7c9a6e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="planned" name="Planlanan öğün" fill="#eef4ea" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function MoodChart({ data }) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#efe8de" />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="energy" name="Enerji" stroke="#b8924f" strokeWidth={2} />
          <Line type="monotone" dataKey="mood" name="Ruh hali" stroke="#d44d8a" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
