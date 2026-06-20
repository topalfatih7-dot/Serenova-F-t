import { useState, useMemo } from 'react'
import { Search, Crown, Pause, Play, XCircle, RefreshCw, Dumbbell, Apple, Target, Circle } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import AdminActiveUsersPanel from '../../components/admin/AdminActiveUsersPanel'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { getRemainingDays } from '../../services/premiumMembership'
import { describeHealthTest } from '../../data/healthTest'

const STATUS_LABELS = { active: 'Aktif', paused: 'Duraklatıldı', cancelled: 'İptal', expiring: 'Sona Eriyor' }
const STATUS_STYLES = {
  active: 'bg-sage-50 text-sage-700',
  paused: 'bg-amber-50 text-amber-700',
  cancelled: 'bg-red-50 text-red-600',
  expiring: 'bg-orange-50 text-orange-700',
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-cream-800/55">{label}</span>
      <span className="text-right font-medium text-cream-900">{value || '—'}</span>
    </div>
  )
}

export default function AdminMembersPage() {
  const { platform, adminPatchMember, activeUsers } = useApp()
  const { toast } = useToast()
  const members = platform.members
  const staff = platform.staff || []
  const [search, setSearch] = useState('')
  const [filterMembership, setFilterMembership] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [busy, setBusy] = useState(false)

  const selected = useMemo(() => members.find((m) => m.id === selectedId) || null, [members, selectedId])
  const staffName = (id) => staff.find((s) => s.id === id)?.name || '—'
  const onlineIds = useMemo(() => new Set(activeUsers.map((u) => u.user_id)), [activeUsers])
  const isOnline = (memberId) => onlineIds.has(memberId)

  const filtered = useMemo(() => members.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())
    const matchMem = filterMembership === 'all' || m.membership === filterMembership
    const matchStatus = filterStatus === 'all' || m.membershipStatus === filterStatus
    return matchSearch && matchMem && matchStatus
  }), [members, search, filterMembership, filterStatus])

  const act = async (patch, msg) => {
    if (!selected) return
    setBusy(true)
    try {
      await adminPatchMember(selected.id, patch)
      toast(msg, 'success')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream-900">Üye Yönetimi</h1>
        <p className="mt-1 text-sm text-cream-800/60">{members.length} kayıtlı üye · {filtered.length} gösteriliyor</p>
      </div>

      <AdminActiveUsersPanel />

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
          <option value="expiring">Sona Eriyor</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Üye bulunamadı" description="Kayıt oluşturduğunuzda burada görünecek." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-cream-200 bg-white">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-cream-100 bg-cream-50">
                <th className="px-4 py-3 font-semibold">Üye</th>
                <th className="px-4 py-3 font-semibold">Aktif</th>
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
                <tr
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className="cursor-pointer border-b border-cream-50 hover:bg-cream-50/50"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{m.name}</p>
                    <p className="text-xs text-cream-800/50">{m.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {isOnline(m.id) ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-50 px-2.5 py-0.5 text-xs font-medium text-sage-700">
                        <Circle className="h-2 w-2 fill-sage-500 text-sage-500" />
                        Çevrimiçi
                      </span>
                    ) : (
                      <span className="text-xs text-cream-800/40">Çevrimdışı</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${m.membership !== 'free' ? 'bg-brand-50 text-brand-700' : 'bg-cream-100 text-cream-800'}`}>
                      {m.membership !== 'free' && <Crown className="h-3 w-3" />}
                      {m.membership === 'free' ? 'Ücretsiz' : m.membership === 'gumus' ? 'Gümüş' : m.membership === 'altin' ? 'Altın' : m.membership === 'platinum' ? 'Platinum' : 'Premium'}
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

      <Modal open={!!selected} onClose={() => setSelectedId(null)} title="Üye Detayı" size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              {selected.photo ? (
                <img src={selected.photo} alt={selected.name} className="h-14 w-14 rounded-2xl object-cover" />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-lg font-bold text-brand-600">
                  {selected.name?.charAt(0)?.toUpperCase()}
                </span>
              )}
              <div>
                <p className="font-display text-lg font-bold text-cream-900">{selected.name}</p>
                <p className="text-sm text-cream-800/55">{selected.email}</p>
              </div>
              <span className={`ml-auto rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[selected.membershipStatus]}`}>
                {STATUS_LABELS[selected.membershipStatus]}
              </span>
            </div>

            <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
              <InfoRow label="Üyelik" value={selected.membership === 'free' ? 'Ücretsiz' : selected.membership === 'gumus' ? 'Gümüş' : selected.membership === 'altin' ? 'Altın' : selected.membership === 'platinum' ? 'Platinum' : 'Premium'} />
              <InfoRow label="Yaş" value={selected.age} />
              <InfoRow label="Cinsiyet" value={selected.gender === 'female' ? 'Kadın' : selected.gender === 'male' ? 'Erkek' : selected.gender} />
              <InfoRow label="Şehir / İlçe" value={[selected.city, selected.district].filter(Boolean).join(' / ')} />
              <InfoRow label="Kilo / Boy" value={selected.weight ? `${selected.weight} kg / ${selected.height || '—'} cm` : '—'} />
              <InfoRow label="Kayıt tarihi" value={selected.joinedAt} />
            </div>

            {selected.membership !== 'free' && (
              <div className="rounded-2xl border border-brand-100 bg-brand-50/40 p-4">
                <p className="mb-2 text-sm font-semibold text-cream-900">Üyelik Paketi</p>
                <div className="grid gap-x-8 sm:grid-cols-2">
                  <InfoRow label="Haftalık koç" value={`${selected.packageConfig?.coachMeetingsPerWeek ?? 0}`} />
                  <InfoRow label="Aylık diyetisyen" value={`${selected.packageConfig?.dietitianMeetingsPerMonth ?? 0}`} />
                  <InfoRow label="Süre" value={selected.packageConfig?.durationWeeks ? `${selected.packageConfig.durationWeeks} hafta` : '—'} />
                  <InfoRow label="Kalan gün" value={selected.premiumExpiresAt ? `${getRemainingDays(selected.premiumExpiresAt) ?? '—'} gün` : '—'} />
                  <div className="flex items-center gap-2 py-1.5 text-sm"><Dumbbell className="h-4 w-4 text-brand-500" /> {staffName(selected.assignedCoachId)}</div>
                  <div className="flex items-center gap-2 py-1.5 text-sm"><Apple className="h-4 w-4 text-sage-500" /> {staffName(selected.assignedDietitianId)}</div>
                </div>
              </div>
            )}

            {selected.goals?.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-cream-900"><Target className="h-4 w-4 text-brand-500" /> Hedefler</p>
                <div className="flex flex-wrap gap-2">
                  {selected.goals.map((g) => (
                    <span key={g} className="rounded-full bg-cream-100 px-3 py-1 text-xs text-cream-800">{g}</span>
                  ))}
                </div>
              </div>
            )}

            {selected.healthTest && describeHealthTest(selected.healthTest, selected.gender).length > 0 && (
              <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
                <p className="mb-3 text-sm font-semibold text-cream-900">Sa\u011fl\u0131k Testi</p>
                <div className="space-y-4">
                  {describeHealthTest(selected.healthTest, selected.gender).map((sec) => (
                    <div key={sec.id}>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700/80">{sec.title}</p>
                      <div className="grid gap-x-6 sm:grid-cols-2">
                        {sec.items.map((it, i) => (
                          <InfoRow key={i} label={it.label} value={it.value} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 border-t border-cream-100 pt-4">
              {selected.membershipStatus !== 'paused' && (
                <button type="button" disabled={busy} onClick={() => act({ membershipStatus: 'paused' }, 'Üyelik duraklatıldı')} className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50">
                  <Pause className="h-4 w-4" /> Duraklat
                </button>
              )}
              {selected.membershipStatus !== 'active' && (
                <button type="button" disabled={busy} onClick={() => act({ membershipStatus: 'active', pauseUntil: null }, 'Üyelik aktif edildi')} className="flex items-center gap-2 rounded-xl bg-sage-50 px-4 py-2.5 text-sm font-semibold text-sage-700 hover:bg-sage-100 disabled:opacity-50">
                  <Play className="h-4 w-4" /> Aktifleştir
                </button>
              )}
              {selected.membershipStatus === 'cancelled' ? (
                <button type="button" disabled={busy} onClick={() => act({ membershipStatus: 'active', pauseUntil: null }, 'Üyelik yenilendi')} className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-100 disabled:opacity-50">
                  <RefreshCw className="h-4 w-4" /> Yenile
                </button>
              ) : (
                <button type="button" disabled={busy} onClick={() => act({ membershipStatus: 'cancelled' }, 'Üyelik iptal edildi')} className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50">
                  <XCircle className="h-4 w-4" /> İptal Et
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
