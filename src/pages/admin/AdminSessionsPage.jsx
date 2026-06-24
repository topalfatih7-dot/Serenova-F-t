import StatsCard from '../../components/ui/StatsCard'
import { useApp } from '../../context/AppContext'
import { isPaidMembership } from '../../data/membershipPlans'
import { Calendar, Video, CheckCircle, AlertTriangle } from 'lucide-react'

export default function AdminSessionsPage() {
  const { platform, sessionStats } = useApp()

  const sessions = platform.members
    .filter((m) => isPaidMembership(m.membership) && m.membershipStatus === 'active')
    .flatMap((m) => [
      ...(m.coachSessions || []).map((s) => ({ ...s, memberName: m.name, sessionType: 'Koç' })),
      ...(m.dietitianSessions || []).map((s) => ({ ...s, memberName: m.name, sessionType: 'Diyetisyen' })),
    ])
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream-900">Seans Yönetimi</h1>
        <p className="mt-1 text-sm text-cream-800/60">Premium üye seansları</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Koç (Haftalık)" value={sessionStats.coachThisWeek} icon={Video} accent="brand" />
        <StatsCard label="Diyetisyen (Aylık)" value={sessionStats.dietitianThisMonth} icon={Calendar} accent="sage" />
        <StatsCard label="Ücretli Aktif" value={platform.members.filter((m) => paidPlans.includes(m.membership) && m.membershipStatus === 'active').length} icon={CheckCircle} accent="gold" />
        <StatsCard label="Açık Talep" value={sessionStats.noResponseAlerts} icon={AlertTriangle} accent="cream" />
      </div>

      {sessions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-cream-200 py-12 text-center text-sm text-cream-800/50">
          Premium üye olmadığı için seans yok. Premium kayıt oluşturun.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-cream-200 bg-white p-6">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-cream-100 text-left">
                <th className="pb-3 font-medium text-cream-800/60">Üye</th>
                <th className="pb-3 font-medium text-cream-800/60">Tür</th>
                <th className="pb-3 font-medium text-cream-800/60">Başlık</th>
                <th className="pb-3 font-medium text-cream-800/60">Uzman</th>
                <th className="pb-3 font-medium text-cream-800/60">Durum</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-b border-cream-50">
                  <td className="py-3 font-medium">{s.memberName}</td>
                  <td className="py-3"><span className={s.sessionType === 'Koç' ? 'text-brand-600' : 'text-sage-600'}>{s.sessionType}</span></td>
                  <td className="py-3">{s.title}</td>
                  <td className="py-3 text-cream-800/70">{s.coach}</td>
                  <td className="py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.status === 'scheduled' ? 'bg-brand-50 text-brand-700' : s.status === 'completed' ? 'bg-sage-50 text-sage-700' : 'bg-red-50 text-red-600'}`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
