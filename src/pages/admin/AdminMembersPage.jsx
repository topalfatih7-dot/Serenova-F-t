import { useState, useMemo } from 'react'
import { Search, Crown } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import { useApp } from '../../context/AppContext'

const STATUS_LABELS = { active: 'Aktif', paused: 'Duraklatıldı', cancelled: 'İptal', expiring: 'Sona Eriyor' }
const STATUS_STYLES = {
  active: 'bg-sage-50 text-sage-700',
  paused: 'bg-amber-50 text-amber-700',
  cancelled: 'bg-red-50 text-red-600',
  expiring: 'bg-orange-50 text-orange-700',
}

export default function AdminMembersPage() {
  const { platform } = useApp()
  const members = platform.members
  const [search, setSearch] = useState('')
  const [filterMembership, setFilterMembership] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const filtered = useMemo(() => members.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())
    const matchMem = filterMembership === 'all' || m.membership === filterMembership
    const matchStatus = filterStatus === 'all' || m.membershipStatus === filterStatus
    return matchSearch && matchMem && matchStatus
  }), [members, search, filterMembership, filterStatus])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream-900">Üye Yönetimi</h1>
        <p className="mt-1 text-sm text-cream-800/60">{members.length} kayıtlı üye · {filtered.length} gösteriliyor</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-800/40" />
          <input
            type="text"
            placeholder="İsim veya e-posta ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-cream-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-300"
          />
        </div>
        <select value={filterMembership} onChange={(e) => setFilterMembership(e.target.value)} className="rounded-xl border border-cream-200 px-4 py-2.5 text-sm">
          <option value="all">Tüm üyelikler</option>
          <option value="premium">Premium</option>
          <option value="free">Ücretsiz</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-xl border border-cream-200 px-4 py-2.5 text-sm">
          <option value="all">Tüm durumlar</option>
          <option value="active">Aktif</option>
          <option value="paused">Duraklatıldı</option>
          <option value="cancelled">İptal</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Üye bulunamadı" description="Kayıt oluşturduğunuzda burada görünecek." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-cream-200 bg-white">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-cream-100 bg-cream-50">
                <th className="px-4 py-3 font-semibold">Üye</th>
                <th className="px-4 py-3 font-semibold">Üyelik</th>
                <th className="px-4 py-3 font-semibold">Durum</th>
                <th className="px-4 py-3 font-semibold">Şehir</th>
                <th className="px-4 py-3 font-semibold">Seri</th>
                <th className="px-4 py-3 font-semibold">Kayıt</th>
                <th className="px-4 py-3 font-semibold">Son Aktif</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-b border-cream-50 hover:bg-cream-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{m.name}</p>
                    <p className="text-xs text-cream-800/50">{m.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${m.membership === 'premium' ? 'bg-brand-50 text-brand-700' : 'bg-cream-100 text-cream-800'}`}>
                      {m.membership === 'premium' && <Crown className="h-3 w-3" />}
                      {m.membership === 'premium' ? 'Premium' : 'Ücretsiz'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[m.membershipStatus]}`}>
                      {STATUS_LABELS[m.membershipStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-cream-800/70">{m.city || '—'}</td>
                  <td className="px-4 py-3">{m.streak || 0} gün</td>
                  <td className="px-4 py-3 text-cream-800/60">{m.joinedAt}</td>
                  <td className="px-4 py-3 text-cream-800/60">{m.lastActiveAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
