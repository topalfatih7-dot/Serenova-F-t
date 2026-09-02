import { useCallback, useEffect, useMemo, useState } from 'react'
import StatsCard from '../../components/ui/StatsCard'
import { useApp } from '../../context/AppContext'
import { fetchAdminSessionSummaries } from '../../services/supabaseDb'
import { isPaidMembership } from '../../data/membershipPlans'
import { sessionsKeyForRole } from '../../utils/staffRoles'
import { Calendar, Video, CheckCircle, AlertTriangle, Loader2, Ban } from 'lucide-react'

const TYPE_LABEL = { coach: 'Koç', dietitian: 'Diyetisyen' }

function collectAdminCancelPending(members) {
  const now = new Date()
  const out = []
  ;(members || []).forEach((m) => {
    ;['coach', 'dietitian'].forEach((type) => {
      const key = sessionsKeyForRole(type)
      ;(m[key] || []).forEach((s) => {
        if (s.status === 'admin_cancel_pending' && new Date(s.date) >= now) {
          out.push({
            ...s,
            memberId: m.id,
            memberName: m.name,
            sessionType: type,
            typeLabel: TYPE_LABEL[type],
          })
        }
      })
    })
  })
  return out.sort((a, b) => new Date(a.date) - new Date(b.date))
}

export default function AdminSessionsPage() {
  const { sessionStats, platform, respondAdminCancel, cancelSession } = useApp()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const adminCancelQueue = useMemo(
    () => collectAdminCancelPending(platform.members),
    [platform.members],
  )

  useEffect(() => {
    let active = true
    fetchAdminSessionSummaries()
      .then((rows) => {
        if (active) {
          setSessions(rows.sort((a, b) => new Date(b.date) - new Date(a.date)))
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [platform.members])

  const handleAdminRespond = useCallback(async (row, decision) => {
    setBusyId(row.id)
    try {
      const r = await respondAdminCancel({
        memberId: row.memberId,
        sessionId: row.id,
        sessionType: row.sessionType,
        decision,
      })
      if (r?.success === false) {
        window.alert(r.error || 'İşlem başarısız.')
        return
      }
    } finally {
      setBusyId(null)
    }
  }, [respondAdminCancel])

  const handleForceCancel = useCallback(async (row) => {
    if (!window.confirm('Bu randevuyu anında iptal etmek istiyor musunuz?')) return
    setBusyId(row.id)
    try {
      const r = await cancelSession(row.id, row.sessionType, {
        memberId: row.memberId,
        forceAdmin: true,
      })
      if (r?.success === false) {
        window.alert(r.error || 'İptal başarısız.')
      }
    } finally {
      setBusyId(null)
    }
  }, [cancelSession])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream-900">Seans Yönetimi</h1>
        <p className="mt-1 text-sm text-cream-800/60">Premium üye seansları</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Koç (Haftalık)" value={sessionStats.coachThisWeek} icon={Video} accent="brand" />
        <StatsCard label="Diyetisyen (Aylık)" value={sessionStats.dietitianThisMonth} icon={Calendar} accent="sage" />
        <StatsCard label="Ücretli Aktif" value={platform.members.filter((m) => isPaidMembership(m.membership) && m.membershipStatus === 'active').length} icon={CheckCircle} accent="gold" />
        <StatsCard label="Açık Talep" value={sessionStats.noResponseAlerts} icon={AlertTriangle} accent="cream" />
      </div>

      {adminCancelQueue.length > 0 && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50/40 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 font-semibold text-cream-900">
              <Ban className="h-4 w-4 text-orange-600" />
              Personel iptal talepleri (24 saatten az)
            </h3>
            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-800">
              {adminCancelQueue.length}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {adminCancelQueue.map((row) => (
              <div
                key={row.id}
                className="flex flex-col gap-3 rounded-xl border border-orange-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-cream-900">{row.memberName}</p>
                  <p className="mt-0.5 text-xs text-cream-800/60">
                    {row.typeLabel} · {row.title || 'Randevu'} · {new Date(row.date).toLocaleString('tr-TR')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => handleAdminRespond(row, 'approve')}
                    className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    İptali Onayla
                  </button>
                  <button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => handleAdminRespond(row, 'reject')}
                    className="rounded-lg border border-cream-200 bg-white px-3 py-2 text-xs font-semibold text-cream-800 hover:bg-cream-50 disabled:opacity-60"
                  >
                    Reddet
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <p className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-cream-200 py-12 text-sm text-cream-800/50">
          <Loader2 className="h-4 w-4 animate-spin" /> Seanslar yükleniyor…
        </p>
      ) : sessions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-cream-200 py-12 text-center text-sm text-cream-800/50">
          Premium üye olmadığı için seans yok. Premium kayıt oluşturun.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-cream-200 bg-white">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-cream-100 text-left">
                <th className="px-4 py-3 font-medium text-cream-800/60">Üye</th>
                <th className="px-4 py-3 font-medium text-cream-800/60">Tür</th>
                <th className="px-4 py-3 font-medium text-cream-800/60">Başlık</th>
                <th className="px-4 py-3 font-medium text-cream-800/60">Uzman</th>
                <th className="px-4 py-3 font-medium text-cream-800/60">Durum</th>
                <th className="px-4 py-3 font-medium text-cream-800/60">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const typeKey = s.sessionType === 'Koç' ? 'coach' : 'dietitian'
                const active = !['cancelled', 'completed', 'rejected'].includes(s.status)
                return (
                  <tr key={s.id} className="border-b border-cream-50">
                    <td className="px-4 py-3 font-medium">{s.memberName}</td>
                    <td className="px-4 py-3"><span className={s.sessionType === 'Koç' ? 'text-brand-600' : 'text-sage-600'}>{s.sessionType}</span></td>
                    <td className="px-4 py-3">{s.title}</td>
                    <td className="px-4 py-3 text-cream-800/70">{s.coach}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        s.status === 'scheduled' || s.status === 'rescheduled' ? 'bg-brand-50 text-brand-700'
                          : s.status === 'completed' ? 'bg-sage-50 text-sage-700'
                            : s.status === 'cancel_pending' || s.status === 'admin_cancel_pending' ? 'bg-orange-50 text-orange-800'
                              : 'bg-red-50 text-red-600'
                      }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {active && (
                        <button
                          type="button"
                          disabled={busyId === s.id}
                          onClick={() => handleForceCancel({
                            id: s.id,
                            memberId: s.memberId,
                            sessionType: typeKey,
                          })}
                          className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                        >
                          Anında iptal
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
