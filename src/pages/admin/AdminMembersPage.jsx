import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, Crown, Dumbbell, Apple, Target, Circle, Trash2, HeartPulse } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import AdminActiveUsersPanel from '../../components/admin/AdminActiveUsersPanel'
import AdminMembershipStatusPanel from '../../components/admin/AdminMembershipStatusPanel'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { getRemainingDays } from '../../services/premiumMembership'
import { getPlanLabel, packageIncludesCoach, packageIncludesDietitian } from '../../data/membershipPlans'
import { GOAL_LABELS, FITNESS_LABELS, NUTRITION_LABELS } from '../../services/health'
import AvailabilityView from '../../components/package/AvailabilityView'
import MemberHealthInsights from '../../components/member/MemberHealthInsights'
import { ADMIN_EMAIL } from '../../config/brand'

const STATUS_LABELS = {
  active: 'Aktif',
  expiring: 'Sona Eriyor',
  paused: 'Donduruldu',
  cancelled: 'İptal',
}
const STATUS_STYLES = {
  active: 'bg-sage-50 text-sage-700',
  expiring: 'bg-orange-50 text-orange-700',
  paused: 'bg-sky-50 text-sky-700',
  cancelled: 'bg-red-50 text-red-700',
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
  const { platform, activeUsers, removeMember, adminSetMembershipStatus } = useApp()
  const toast = useToast()
  const members = platform.members
  const staff = platform.staff || []
  const [search, setSearch] = useState('')
  const [filterMembership, setFilterMembership] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [statusBusy, setStatusBusy] = useState(false)

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
          <option value="expiring">Sona Eriyor</option>
          <option value="paused">Donduruldu</option>
          <option value="cancelled">İptal</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Üye bulunamadı" description="Kayıt oluşturduğunuzda burada görünecek." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-cream-200 bg-white">
          <table className="w-full min-w-[960px] text-left text-sm">
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
                <th className="px-4 py-3 font-semibold">İşlem</th>
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
                      {getPlanLabel(m.membership)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[m.membershipStatus] || STATUS_STYLES.active}`}>
                      {STATUS_LABELS[m.membershipStatus] || m.membershipStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-cream-800/70">{m.city || '—'}</td>
                  <td className="px-4 py-3">{m.streak || 0} gün</td>
                  <td className="px-4 py-3 text-cream-800/60">{m.joinedAt}</td>
                  <td className="px-4 py-3 text-cream-800/60">{m.lastActiveAt}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/members/${m.id}/health`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-bold text-brand-700 ring-1 ring-brand-100 transition hover:bg-brand-500 hover:text-white"
                      title="Sağlık testi & notlar"
                    >
                      <HeartPulse className="h-3.5 w-3.5" />
                      Sağlık
                    </Link>
                  </td>
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
              <span className={`ml-auto rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[selected.membershipStatus] || STATUS_STYLES.active}`}>
                {STATUS_LABELS[selected.membershipStatus] || selected.membershipStatus}
              </span>
            </div>

            <AdminMembershipStatusPanel
              key={`${selected.id}-${selected.membershipStatus}-${selected.membershipStatusChangedAt || ''}`}
              member={selected}
              busy={statusBusy}
              onSubmit={async ({ status, note, pauseUntil }) => {
                setStatusBusy(true)
                try {
                  const r = await adminSetMembershipStatus(selected.id, { status, note, pauseUntil })
                  if (!r?.success) {
                    toast(r?.error || 'Durum güncellenemedi', 'error')
                    return
                  }
                  const labels = { active: 'Aktifleştirildi', paused: 'Donduruldu', cancelled: 'İptal edildi' }
                  toast(labels[status] || 'Durum güncellendi', 'success')
                } finally {
                  setStatusBusy(false)
                }
              }}
            />

            <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
              <InfoRow label="E-posta" value={selected.email} />
              <InfoRow label="Telefon" value={selected.phone} />
              <InfoRow label="Üyelik" value={getPlanLabel(selected.membership)} />
              <InfoRow label="Yaş" value={selected.age} />
              <InfoRow label="Cinsiyet" value={selected.gender === 'female' ? 'Kadın' : selected.gender === 'male' ? 'Erkek' : selected.gender} />
              <InfoRow label="Şehir / İlçe" value={[selected.city, selected.district].filter(Boolean).join(' / ')} />
              <InfoRow label="Kilo / Boy" value={selected.weight ? `${selected.weight} kg / ${selected.height || '—'} cm` : '—'} />
              <InfoRow label="Bel çevresi" value={selected.waist ? `${selected.waist} cm` : '—'} />
              <InfoRow label="Spor seviyesi" value={FITNESS_LABELS[selected.fitnessLevel] || '—'} />
              <InfoRow label="Kayıt tarihi" value={selected.joinedAt} />
            </div>

            {selected.membership !== 'free' && (
              <div className="rounded-2xl border border-brand-100 bg-brand-50/40 p-4">
                <p className="mb-2 text-sm font-semibold text-cream-900">Üyelik Paketi</p>
                <div className="grid gap-x-8 sm:grid-cols-2">
                  {packageIncludesCoach(selected.packageConfig) && (
                    <InfoRow label="Aylık koç" value={`${selected.packageConfig?.coachMeetingsPerMonth ?? (selected.packageConfig?.coachMeetingsPerWeek ? selected.packageConfig.coachMeetingsPerWeek * 4 : 0)}`} />
                  )}
                  {packageIncludesDietitian(selected.packageConfig) && (
                    <InfoRow label="Aylık diyetisyen" value={`${selected.packageConfig?.dietitianMeetingsPerMonth ?? 0}`} />
                  )}
                  <InfoRow label="Süre" value={selected.packageConfig?.durationMonths ? `${selected.packageConfig.durationMonths} ay` : selected.packageConfig?.durationWeeks ? `${selected.packageConfig.durationWeeks} hafta` : '—'} />
                  <InfoRow label="Kalan gün" value={selected.premiumExpiresAt ? `${getRemainingDays(selected.premiumExpiresAt) ?? '—'} gün` : '—'} />
                  {packageIncludesCoach(selected.packageConfig) && (
                    <div className="flex items-center gap-2 py-1.5 text-sm"><Dumbbell className="h-4 w-4 text-brand-500" /> {staffName(selected.assignedCoachId)}</div>
                  )}
                  {packageIncludesDietitian(selected.packageConfig) && (
                    <div className="flex items-center gap-2 py-1.5 text-sm"><Apple className="h-4 w-4 text-sage-500" /> {staffName(selected.assignedDietitianId)}</div>
                  )}
                </div>
              </div>
            )}

            {selected.goals?.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-cream-900"><Target className="h-4 w-4 text-brand-500" /> Hedefler</p>
                <div className="flex flex-wrap gap-2">
                  {selected.goals.map((g) => (
                    <span key={g} className="rounded-full bg-cream-100 px-3 py-1 text-xs text-cream-800">{GOAL_LABELS[g] || g}</span>
                  ))}
                </div>
              </div>
            )}

            {selected.nutritionPrefs?.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-cream-900">Beslenme Tercihleri</p>
                <div className="flex flex-wrap gap-2">
                  {selected.nutritionPrefs.map((p) => (
                    <span key={p} className="rounded-full bg-sage-50 px-3 py-1 text-xs text-sage-800">{NUTRITION_LABELS[p] || p}</span>
                  ))}
                </div>
              </div>
            )}

            {selected.availability && Object.keys(selected.availability).length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-cream-900">Antrenman Müsaitliği</p>
                <AvailabilityView value={selected.availability} emptyText="—" />
              </div>
            )}

            <MemberHealthInsights member={selected} showLocation={false} />

            <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-4">
              <p className="text-sm font-semibold text-cream-900">Sağlık testi (30 soru)</p>
              <p className="mt-1 text-xs text-cream-800/60">
                Üyenin kilitli sağlık testini görüntüle, doldur veya düzenle; klinik not ekle.
              </p>
              <Link
                to={`/admin/members/${selected.id}/health`}
                onClick={() => setSelectedId(null)}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
              >
                <HeartPulse className="h-4 w-4" />
                Sağlık profiline git · Testi düzenle
              </Link>
            </div>

            {(selected.healthAck || selected.disclaimer) && (
              <div className="rounded-xl border border-cream-100 bg-cream-50 px-4 py-3 text-xs text-cream-800/70">
                {selected.healthAck && <p>✓ Sağlık bilgisi doğruluğu onayı verildi</p>}
                {selected.disclaimer && <p>✓ Tıbbi feragat onayı verildi</p>}
              </div>
            )}

            {selected.role !== 'admin' && selected.email?.toLowerCase() !== ADMIN_EMAIL && (
              <div className="rounded-xl border border-red-100 bg-red-50/50 px-4 py-4">
                <p className="text-sm font-semibold text-red-800">Üyeliği kalıcı sil</p>
                <p className="mt-1 text-xs text-red-700/80">
                  Ödemeler, abonelikler, programlar, destek talepleri ve sohbet geçmişi dahil tüm kayıtlar silinir.
                </p>
                <button
                  type="button"
                  onClick={() => { setDeleteTarget(selected); setSelectedId(null) }}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
                >
                  <Trash2 className="h-4 w-4" /> Üyeyi Sil
                </button>
              </div>
            )}

          </div>
        )}
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} title="Üyeyi Sil">
        {deleteTarget && (
          <>
            <p className="text-sm text-cream-800/70">
              <strong className="text-cream-900">{deleteTarget.name}</strong> ({deleteTarget.email}) ve ilişkili tüm veriler kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </p>
            <div className="mt-6 flex gap-3">
              <button type="button" disabled={deleting} onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl border border-cream-200 py-2.5 text-sm font-semibold text-cream-800">Vazgeç</button>
              <button
                type="button"
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true)
                  try {
                    await removeMember(deleteTarget.id)
                    setDeleteTarget(null)
                    toast('Üye ve ilişkili kayıtlar silindi', 'info')
                  } catch (e) {
                    toast(e?.message || 'Silme başarısız', 'error')
                  } finally {
                    setDeleting(false)
                  }
                }}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {deleting ? 'Siliniyor…' : 'Kalıcı Sil'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
