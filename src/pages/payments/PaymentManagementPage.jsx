import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
  CreditCard, History, Wallet, TrendingUp, Users, Plus, Trash2,
  Clock, ArrowDownLeft, Building2,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import Modal from '../../components/ui/Modal'
import PaymentForm from '../../components/payment/PaymentForm'
import EmptyState from '../../components/ui/EmptyState'
import { MOCK_STAFF_EARNINGS } from '../../data/mockPayments'
import { getPlanLabel } from '../../data/membershipPlans'

function formatTry(amount) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount || 0)
}

function paymentPlanLabel(p) {
  const planId = p.packageConfig?.planId || p.packageConfig?.membership || p.plan
  return getPlanLabel(planId) || p.plan || 'Üyelik ödemesi'
}

function paymentDate(p) {
  return p.createdAt || p.date || null
}

function detectCardBrand(number) {
  const n = String(number).replace(/\D/g, '')
  if (/^4/.test(n)) return 'VISA'
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'Mastercard'
  if (/^3[47]/.test(n)) return 'AMEX'
  if (/^9792/.test(n) || /^65/.test(n)) return 'Troy'
  return 'Kart'
}

function StatusBadge({ status }) {
  const map = {
    completed: 'bg-sage-50 text-sage-700',
    paid: 'bg-sage-50 text-sage-700',
    pending: 'bg-amber-50 text-amber-700',
    refunded: 'bg-cream-100 text-cream-700',
  }
  const labels = { completed: 'Tamamlandı', paid: 'Ödendi', pending: 'Bekliyor', refunded: 'İade' }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status] || map.pending}`}>
      {labels[status] || status}
    </span>
  )
}

function MemberPayments() {
  const { toast } = useToast()
  const { user, platform } = useApp()
  const [cards, setCards] = useState([])
  const [addCardOpen, setAddCardOpen] = useState(false)

  const payments = useMemo(() => (
    (platform?.payments || [])
      .filter((p) => p.memberId === user?.id)
      .sort((a, b) => new Date(paymentDate(b) || 0) - new Date(paymentDate(a) || 0))
  ), [platform?.payments, user?.id])

  const setDefault = (id) => {
    setCards((list) => list.map((c) => ({ ...c, isDefault: c.id === id })))
    toast('Varsayılan kart güncellendi', 'success')
  }

  const removeCard = (id) => {
    setCards((list) => list.filter((c) => c.id !== id))
    toast('Kart kaldırıldı', 'info')
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-cream-900">
            <CreditCard className="h-5 w-5 text-brand-500" /> Kayıtlı Kartlarım
          </h2>
          <button type="button" onClick={() => setAddCardOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600">
            <Plus className="h-3.5 w-3.5" /> Kart Ekle
          </button>
        </div>
        {cards.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="Kayıtlı kart yok"
            description="Stripe Customer Portal entegrasyonu sonraki aşamada eklenecek. Ödemeleriniz geçmiş tablosunda görünür."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {cards.map((card) => (
              <div key={card.id} className="rounded-2xl border border-cream-200 bg-gradient-to-br from-cream-900 to-brand-900 p-5 text-white shadow-md">
                <div className="flex items-start justify-between">
                  <p className="text-xs uppercase tracking-widest text-white/60">{card.brand}</p>
                  {card.isDefault && <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold">Varsayılan</span>}
                </div>
                <p className="mt-6 font-mono text-lg tracking-widest">•••• •••• •••• {card.last4}</p>
                <p className="mt-2 text-xs text-white/70">{card.holder} · {String(card.expMonth).padStart(2, '0')}/{card.expYear}</p>
                <div className="mt-4 flex gap-2">
                  {!card.isDefault && (
                    <button type="button" onClick={() => setDefault(card.id)} className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium hover:bg-white/25">
                      Varsayılan yap
                    </button>
                  )}
                  <button type="button" onClick={() => removeCard(card.id)} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-red-200 hover:bg-white/20">
                    <Trash2 className="inline h-3 w-3" /> Kaldır
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-cream-900">
          <History className="h-5 w-5 text-brand-500" /> Ödeme Geçmişim
        </h2>
        {payments.length === 0 ? (
          <EmptyState icon={History} title="Henüz ödeme kaydı yok" description="Ücretli paket satın aldığınızda ödemeleriniz burada listelenir." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-cream-100 bg-cream-50/80 text-left text-xs uppercase tracking-wide text-cream-800/50">
                <tr>
                  <th className="px-4 py-3">Tarih</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Tutar</th>
                  <th className="px-4 py-3">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-50">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-cream-50/50">
                    <td className="px-4 py-3 text-cream-800">
                      {paymentDate(p) ? format(new Date(paymentDate(p)), 'd MMM yyyy', { locale: tr }) : '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-cream-900">{paymentPlanLabel(p)}</td>
                    <td className="px-4 py-3 font-semibold text-cream-900">{formatTry(p.amount)}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status || 'completed'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal open={addCardOpen} onClose={() => setAddCardOpen(false)} title="Yeni Kart Ekle">
        <p className="mb-4 text-sm text-cream-800/60">Stripe kart kaydı yakında aktif olacak. Şimdilik ödeme Stripe Checkout üzerinden yapılır.</p>
        <PaymentForm
          submitLabel="Kartı Kaydet"
          loadingLabel="Kaydediliyor…"
          onCancel={() => setAddCardOpen(false)}
          onSubmit={({ cardNumber, expiry, holder }) => {
            const digits = String(cardNumber).replace(/\D/g, '')
            const [mm, yy] = String(expiry).split('/')
            const newCard = {
              id: `card-${Date.now()}`,
              brand: detectCardBrand(digits),
              last4: digits.slice(-4),
              holder: holder?.trim() || 'Kart Sahibi',
              expMonth: Number(mm) || 1,
              expYear: yy ? Number(`20${yy}`) : new Date().getFullYear(),
              isDefault: true,
            }
            setCards((list) => [...list.map((c) => ({ ...c, isDefault: false })), newCard])
            setAddCardOpen(false)
            toast('Kart yerel oturuma eklendi (Stripe senkronu yakında)', 'info')
          }}
        />
      </Modal>
    </div>
  )
}

function StaffPayments({ role }) {
  const earnings = MOCK_STAFF_EARNINGS[role === 'dietitian' ? 'dietitian' : 'coach']

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-3">
        <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <p className="text-sm text-amber-900/80">Personel hakediş modülü henüz veritabanına bağlanmadı — aşağıdaki özet demo veridir.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5">
          <p className="text-xs font-medium text-amber-800/70">Bekleyen Hakediş</p>
          <p className="mt-1 font-display text-2xl font-bold text-amber-900">{formatTry(earnings.pendingAmount)}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-amber-700">
            <Clock className="h-3 w-3" /> Ödeme: {format(new Date(earnings.nextPayoutDate), 'd MMM', { locale: tr })}
          </p>
        </div>
        <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-5">
          <p className="text-xs font-medium text-brand-800/70">Bu Ay Seans</p>
          <p className="mt-1 font-display text-2xl font-bold text-brand-900">{earnings.sessionsThisMonth}</p>
          <p className="mt-1 text-xs text-brand-700">Seans başı {formatTry(earnings.sessionRate)}</p>
        </div>
        {role === 'dietitian' && (
          <div className="rounded-2xl border border-sage-100 bg-sage-50/50 p-5">
            <p className="text-xs font-medium text-sage-800/70">Bu Ay Liste</p>
            <p className="mt-1 font-display text-2xl font-bold text-sage-900">{earnings.listsThisMonth}</p>
            <p className="mt-1 text-xs text-sage-700">Gönderilen beslenme listeleri</p>
          </div>
        )}
        <div className="rounded-2xl border border-cream-200 bg-white p-5">
          <p className="text-xs font-medium text-cream-800/60">Toplam Kazanç</p>
          <p className="mt-1 font-display text-2xl font-bold text-cream-900">{formatTry(earnings.totalEarned)}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-sage-600">
            <TrendingUp className="h-3 w-3" /> Demo veri
          </p>
        </div>
      </div>

      <section>
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-cream-900">
          <Wallet className="h-5 w-5 text-brand-500" /> Hakediş Geçmişi
        </h2>
        <div className="space-y-3">
          {earnings.history.map((row) => (
            <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cream-200 bg-white p-4">
              <div>
                <p className="font-semibold text-cream-900">{row.period}</p>
                <p className="text-xs text-cream-800/55">
                  {row.sessions} seans
                  {row.lists != null ? ` · ${row.lists} liste` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-bold text-cream-900">{formatTry(row.amount)}</p>
                <StatusBadge status={row.status} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function AdminPayments() {
  const { platform, adminStats } = useApp()

  const recent = useMemo(() => (
    [...(platform?.payments || [])]
      .sort((a, b) => new Date(paymentDate(b) || 0) - new Date(paymentDate(a) || 0))
      .slice(0, 25)
  ), [platform?.payments])

  const activePaid = adminStats?.premium ?? 0

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-5">
          <p className="text-xs text-brand-800/70">Aylık Tekrarlayan Gelir</p>
          <p className="mt-1 font-display text-2xl font-bold text-brand-900">{formatTry(adminStats?.mrr)}</p>
        </div>
        <div className="rounded-2xl border border-sage-100 bg-sage-50/50 p-5">
          <p className="text-xs text-sage-800/70">Ücretli Üye</p>
          <p className="mt-1 font-display text-2xl font-bold text-sage-900">{activePaid}</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5">
          <p className="text-xs text-amber-800/70">Toplam Gelir</p>
          <p className="mt-1 font-display text-2xl font-bold text-amber-900">{formatTry(adminStats?.totalRevenue)}</p>
        </div>
        <div className="rounded-2xl border border-cream-200 bg-white p-5">
          <p className="text-xs text-cream-800/60">Kayıtlı Ödeme</p>
          <p className="mt-1 font-display text-2xl font-bold text-cream-900">{platform?.payments?.length ?? 0}</p>
        </div>
      </div>

      <section>
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-cream-900">
          <ArrowDownLeft className="h-5 w-5 text-brand-500" /> Son Üye Ödemeleri
        </h2>
        {recent.length === 0 ? (
          <EmptyState icon={History} title="Ödeme kaydı yok" description="Stripe veya manuel plan değişimlerinde kayıtlar burada görünür." />
        ) : (
          <div className="space-y-2">
            {recent.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl border border-cream-200 bg-white px-4 py-3">
                <div>
                  <p className="font-medium text-cream-900">{t.memberName || 'Üye'}</p>
                  <p className="text-xs text-cream-800/50">
                    {paymentPlanLabel(t)}
                    {paymentDate(t) ? ` · ${format(new Date(paymentDate(t)), 'd MMM yyyy', { locale: tr })}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{formatTry(t.amount)}</span>
                  <StatusBadge status={t.status || 'completed'} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-cream-900">
          <Users className="h-5 w-5 text-brand-500" /> Personel Hakedişleri
        </h2>
        <p className="rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-sm text-cream-800/65">
          Personel ödeme modülü henüz aktif değil. Seans bazlı hakediş tablosu eklendiğinde bu bölüm doldurulacak.
        </p>
      </section>
    </div>
  )
}

export default function PaymentManagementPage({ audience = 'member' }) {
  const { staffUser } = useApp()

  const title = useMemo(() => {
    if (audience === 'admin') return 'Ödeme Yönetimi'
    if (audience === 'staff') return 'Kazanç & Hakediş'
    return 'Ödeme Yönetimi'
  }, [audience])

  const subtitle = useMemo(() => {
    if (audience === 'admin') return 'Canlı ödeme kayıtları ve abonelik özeti'
    if (audience === 'staff') return 'Seans ve liste bazlı kazanç özeti (demo)'
    return 'Ödeme geçmişiniz ve kart yönetimi'
  }, [audience])

  return (
    <div className="space-y-6">
      {audience === 'staff' && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-3">
          <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-900/80">Personel kazanç ekranı demo veri kullanıyor.</p>
        </div>
      )}

      <div>
        <h1 className="font-display text-2xl font-bold text-cream-900">{title}</h1>
        <p className="mt-1 text-sm text-cream-800/60">{subtitle}</p>
      </div>

      {audience === 'member' && <MemberPayments />}
      {audience === 'staff' && <StaffPayments role={staffUser?.role} />}
      {audience === 'admin' && <AdminPayments />}
    </div>
  )
}