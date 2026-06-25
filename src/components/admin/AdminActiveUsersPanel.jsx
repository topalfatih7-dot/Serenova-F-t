import { useEffect, useState } from 'react'
import { Activity, Circle } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { formatActiveDuration, formatSessionStart, roleLabel, sessionDurationSeconds } from '../../utils/presenceFormat'

export default function AdminActiveUsersPanel() {
  const { activeUsers } = useApp()
  const [, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="rounded-2xl border border-sage-200 bg-gradient-to-br from-sage-50/80 to-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-sage-100 text-sage-700">
            <Activity className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-sage-500 ring-2 ring-white" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-cream-900">Anlık Aktif</h2>
            <p className="text-xs text-cream-800/55">Giriş yapmış ve şu an çevrimiçi kullanıcılar</p>
          </div>
        </div>
        <span className="rounded-full bg-sage-100 px-3 py-1 text-sm font-bold text-sage-700">
          {activeUsers.length} kişi
        </span>
      </div>

      {activeUsers.length === 0 ? (
        <p className="rounded-xl border border-dashed border-cream-200 bg-white/60 px-4 py-8 text-center text-sm text-cream-800/50">
          Şu an çevrimiçi kullanıcı yok
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-cream-100 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-cream-100 bg-cream-50/80">
                <th className="px-4 py-2.5 font-semibold">Kullanıcı</th>
                <th className="px-4 py-2.5 font-semibold">Rol</th>
                <th className="px-4 py-2.5 font-semibold">Giriş</th>
                <th className="px-4 py-2.5 font-semibold">Süre</th>
                <th className="px-4 py-2.5 font-semibold">Sayfa</th>
              </tr>
            </thead>
            <tbody>
              {activeUsers.map((u) => (
                <tr key={u.user_id} className="border-b border-cream-50 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Circle className="h-2.5 w-2.5 fill-sage-500 text-sage-500" />
                      <div>
                        <p className="font-medium text-cream-900">{u.name || u.email}</p>
                        <p className="text-xs text-cream-800/50">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-cream-100 px-2 py-0.5 text-xs font-medium text-cream-800">
                      {roleLabel(u.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-cream-800/70">{formatSessionStart(u.session_started_at)}</td>
                  <td className="px-4 py-3 font-medium tabular-nums text-sage-700">
                    {formatActiveDuration(sessionDurationSeconds(u.session_started_at))}
                  </td>
                  <td className="px-4 py-3 text-xs text-cream-800/50">{u.page_path || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
