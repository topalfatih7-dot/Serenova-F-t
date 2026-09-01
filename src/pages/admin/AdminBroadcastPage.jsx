import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bell, Mail, Search, Plus, X, ShoppingCart, Smartphone, PhoneOff, Send, Users, Stethoscope,
} from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import NotificationItem from '../../components/notifications/NotificationItem'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { getApiAuthHeaders } from '../../services/apiAuth'
import { getPlanLabel } from '../../data/membershipPlans'
import { staffRoleLabel } from '../../utils/staffRoles'
import { formatRelativeTime } from '../../utils/relativeTime'
import useRelativeTimeTick from '../../hooks/useRelativeTimeTick'

const CART_MAX = 200
const TITLE_MAX = 80
const BODY_MAX = 1500

const REASON_TR = {
  no_token: 'Uygulamada oturum yok',
  push_prefs_off: 'Bildirim kapalı',
  no_email: 'E-posta yok',
  not_found: 'Kayıt bulunamadı',
}

function cartKey(audience, id) {
  return `${audience}:${id}`
}

function statusLabel(row) {
  if (row.emailFallback) return 'Kutuya yazıldı · e-posta yedeği'
  if (row.status === 'sent') return 'Gönderildi'
  if (row.status === 'failed') return 'Hata'
  if (row.inbox && row.reason === 'no_token') return 'Kutuya yazıldı · telefon yok'
  if (row.inbox && row.reason === 'push_prefs_off') return 'Kutuya yazıldı · bildirim kapalı'
  return REASON_TR[row.reason] || 'Atlandı'
}

function statusClass(row) {
  if (row.status === 'sent') return 'bg-sage-50 text-sage-700'
  if (row.status === 'failed') return 'bg-red-50 text-red-700'
  return 'bg-amber-50 text-amber-800'
}

export default function AdminBroadcastPage() {
  useRelativeTimeTick()
  const { platform, staff } = useApp()
  const { toast } = useToast()
  const members = platform.members || []
  const staffList = staff?.length ? staff : (platform.staff || [])

  const [tab, setTab] = useState('member')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([])
  const [channel, setChannel] = useState('push')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [tokenIds, setTokenIds] = useState(() => new Set())
  const [mailConfigured, setMailConfigured] = useState(true)
  const [history, setHistory] = useState([])
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [sending, setSending] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [lastResults, setLastResults] = useState(null)
  const [coverage, setCoverage] = useState(null)

  const loadMeta = useCallback(async () => {
    try {
      const headers = await getApiAuthHeaders()
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'admin-broadcast', op: 'meta' }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.ok) {
        toast(json.error || 'Gönderici bilgisi alınamadı', 'error')
        return
      }
      setTokenIds(new Set((json.tokenUserIds || []).map(String)))
      setMailConfigured(json.mailConfigured !== false)
      setHistory(Array.isArray(json.messages) ? json.messages : [])
      setCoverage(json.coverage && typeof json.coverage === 'object' ? json.coverage : null)
    } catch {
      toast('Gönderici bilgisi alınamadı', 'error')
    } finally {
      setLoadingMeta(false)
    }
  }, [toast])

  useEffect(() => {
    loadMeta()
  }, [loadMeta])

  const inCart = useMemo(() => new Set(cart.map((c) => cartKey(c.audience, c.id))), [cart])

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return members.filter((m) => {
      if (!q) return true
      return (
        String(m.name || '').toLowerCase().includes(q)
        || String(m.email || '').toLowerCase().includes(q)
      )
    })
  }, [members, search])

  const filteredStaff = useMemo(() => {
    const q = search.trim().toLowerCase()
    return staffList.filter((s) => {
      if (!q) return true
      return (
        String(s.name || '').toLowerCase().includes(q)
        || String(s.email || '').toLowerCase().includes(q)
        || String(staffRoleLabel(s.role) || '').toLowerCase().includes(q)
      )
    })
  }, [staffList, search])

  const addToCart = (audience, person) => {
    if (!person?.id) return
    const key = cartKey(audience, person.id)
    if (inCart.has(key)) return
    if (cart.length >= CART_MAX) {
      toast(`Sepette en fazla ${CART_MAX} kişi olabilir`, 'error')
      return
    }
    setCart((prev) => [
      ...prev,
      {
        audience,
        id: person.id,
        name: person.name || 'İsimsiz',
        email: person.email || '',
      },
    ])
  }

  const removeFromCart = (audience, id) => {
    setCart((prev) => prev.filter((c) => !(c.audience === audience && c.id === id)))
  }

  const previewNotif = useMemo(() => ({
    id: 'preview',
    type: 'announcement',
    title: title.trim() || 'Başlık',
    message: message.trim() || 'Mesajınız burada görünür',
    read: false,
    createdAt: new Date().toISOString(),
  }), [title, message])

  const canSend = cart.length > 0 && title.trim() && message.trim() && !sending
    && (channel !== 'email' || mailConfigured)

  const openConfirm = () => {
    if (!cart.length) {
      toast('Sepete en az bir kişi ekleyin', 'error')
      return
    }
    if (!title.trim() || !message.trim()) {
      toast('Başlık ve mesaj yazın', 'error')
      return
    }
    if (channel === 'email' && !mailConfigured) {
      toast('E-posta servisi yapılandırılmamış', 'error')
      return
    }
    setConfirmOpen(true)
  }

  const send = async () => {
    if (!canSend) return
    setSending(true)
    setConfirmOpen(false)
    try {
      const headers = await getApiAuthHeaders()
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'admin-broadcast',
          op: 'send',
          channel,
          title: title.trim(),
          message: message.trim(),
          recipients: cart.map((c) => ({ audience: c.audience, id: c.id })),
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.ok) {
        toast(json.error || 'Gönderilemedi', 'error')
        return
      }
      setLastResults(json)
      const inboxOnly = (json.results || []).filter((r) => r.status === 'skipped' && r.inbox).length
      const parts = []
      if (json.sentCount) parts.push(`${json.sentCount} telefona gitti`)
      if (inboxOnly) parts.push(`${inboxOnly} kutuya yazıldı (uygulama yok)`)
      const otherSkip = (json.skipCount || 0) - inboxOnly
      if (otherSkip > 0) parts.push(`${otherSkip} atlandı`)
      if (json.failCount) parts.push(`${json.failCount} hata`)
      toast(
        parts.join(' · ') || 'Tamam',
        json.failCount ? 'error' : inboxOnly && !json.sentCount ? 'warning' : 'success',
      )
      await loadMeta()
    } catch {
      toast('Gönderilemedi', 'error')
    } finally {
      setSending(false)
    }
  }

  const directory = tab === 'member' ? filteredMembers : filteredStaff

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream-900">Bildirim & E-posta</h1>
        <p className="mt-1 text-sm text-cream-800/60">
          Danışan veya personeli sepete ekleyin, kanal seçin, yazın, gönderin. Telefon bildirimi veya e-posta — ikisi birden değil.
        </p>
        {coverage ? (
          <p className="mt-1 text-xs text-cream-800/50">
            Kayıtlı cihaz: {coverage.tokens || 0}
            {' · '}
            Personel tokensız: {coverage.staffWithoutToken || 0}/{coverage.staff || 0}
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTab('member')}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium ${
                tab === 'member' ? 'bg-brand-500 text-white' : 'bg-white border border-cream-200 text-cream-800'
              }`}
            >
              <Users className="h-4 w-4" />
              Danışanlar
              <span className="opacity-70">{members.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('staff')}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium ${
                tab === 'staff' ? 'bg-brand-500 text-white' : 'bg-white border border-cream-200 text-cream-800'
              }`}
            >
              <Stethoscope className="h-4 w-4" />
              Personel
              <span className="opacity-70">{staffList.length}</span>
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-800/40" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="İsim veya e-posta ara..."
              className="w-full rounded-xl border border-cream-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-300"
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white">
            {directory.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={tab === 'member' ? Users : Stethoscope}
                  title="Kayıt yok"
                  description={search ? 'Aramayla eşleşen kimse bulunamadı.' : 'Liste boş.'}
                />
              </div>
            ) : (
              <ul className="divide-y divide-cream-100 max-h-[28rem] overflow-y-auto">
                {directory.map((person) => {
                  const audience = tab === 'member' ? 'member' : 'staff'
                  const added = inCart.has(cartKey(audience, person.id))
                  const hasToken = tokenIds.has(String(person.id))
                  const hasEmail = String(person.email || '').includes('@')
                  return (
                    <li key={person.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-cream-900">{person.name || 'İsimsiz'}</p>
                        <p className="truncate text-xs text-cream-800/55">{person.email || 'E-posta yok'}</p>
                        <p className="mt-0.5 text-[11px] text-cream-800/45">
                          {audience === 'member'
                            ? getPlanLabel(person.membership)
                            : staffRoleLabel(person.role)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {hasToken ? (
                          <span title="Kayıtlı cihaz var" className="rounded-lg bg-sage-50 p-1.5 text-sage-600">
                            <Smartphone className="h-3.5 w-3.5" />
                          </span>
                        ) : (
                          <span
                            title="Kayıtlı cihaz yok"
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800"
                          >
                            <PhoneOff className="h-3.5 w-3.5" />
                            Cihaz yok
                          </span>
                        )}
                        <span
                          title={hasEmail ? 'E-posta var' : 'E-posta yok'}
                          className={`rounded-lg p-1.5 ${hasEmail ? 'bg-sky-50 text-sky-600' : 'bg-cream-100 text-cream-800/40'}`}
                        >
                          <Mail className="h-3.5 w-3.5" />
                        </span>
                        <button
                          type="button"
                          disabled={added}
                          onClick={() => addToCart(audience, person)}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                            added
                              ? 'bg-cream-100 text-cream-800/40'
                              : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                          }`}
                        >
                          {added ? 'Sepette' : <><Plus className="h-3.5 w-3.5" /> Ekle</>}
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-2xl border border-cream-200 bg-white p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-semibold text-cream-900">
                <ShoppingCart className="h-4 w-4 text-brand-600" />
                Sepet
              </h2>
              <span className="text-xs text-cream-800/50">{cart.length}/{CART_MAX}</span>
            </div>

            {cart.length === 0 ? (
              <p className="mt-3 text-sm text-cream-800/55">Soldan danışan veya personel ekleyin.</p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2">
                {cart.map((c) => {
                  const hasToken = tokenIds.has(String(c.id))
                  const warn = channel === 'push' ? !hasToken : !String(c.email || '').includes('@')
                  return (
                    <li
                      key={cartKey(c.audience, c.id)}
                      className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${
                        warn ? 'bg-amber-50 text-amber-800' : 'bg-cream-100 text-cream-800'
                      }`}
                    >
                      <span className="truncate">
                        {c.name}
                        <span className="ml-1 opacity-60">
                          {c.audience === 'staff' ? 'personel' : 'danışan'}
                        </span>
                        {warn && channel === 'push' ? (
                          <span className="ml-1 font-medium">· cihaz yok</span>
                        ) : null}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(c.audience, c.id)}
                        className="shrink-0 rounded-full p-0.5 hover:bg-white/80"
                        aria-label="Sepetten çıkar"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}

            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setCart([])}
                className="mt-3 text-xs font-medium text-cream-800/50 hover:text-cream-900"
              >
                Sepeti temizle
              </button>
            )}

            <fieldset className="mt-5 space-y-2">
              <legend className="text-xs font-semibold uppercase tracking-wide text-cream-800/50">Kanal</legend>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-cream-200 p-3 has-[:checked]:border-brand-400 has-[:checked]:bg-brand-50/60">
                <input
                  type="radio"
                  name="channel"
                  value="push"
                  checked={channel === 'push'}
                  onChange={() => setChannel('push')}
                  className="mt-0.5"
                />
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-medium text-cream-900">
                    <Bell className="h-4 w-4 text-brand-600" /> Telefon bildirimi
                  </span>
                  <span className="mt-0.5 block text-xs text-cream-800/55">
                    Uygulama kutusu + telefonda banner. Token yoksa kutu yine yazılır.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-cream-200 p-3 has-[:checked]:border-brand-400 has-[:checked]:bg-brand-50/60">
                <input
                  type="radio"
                  name="channel"
                  value="email"
                  checked={channel === 'email'}
                  onChange={() => setChannel('email')}
                  className="mt-0.5"
                />
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-medium text-cream-900">
                    <Mail className="h-4 w-4 text-sky-600" /> E-posta
                  </span>
                  <span className="mt-0.5 block text-xs text-cream-800/55">
                    Yalnız e-posta. Telefon ve uygulama kutusuna gitmez.
                    {!mailConfigured && ' · Servis yapılandırılmamış.'}
                  </span>
                </span>
              </label>
            </fieldset>

            <label className="mt-4 block">
              <span className="text-xs font-medium text-cream-800/60">Başlık</span>
              <input
                type="text"
                value={title}
                maxLength={TITLE_MAX}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn. Program hatırlatması"
                className="mt-1 w-full rounded-xl border border-cream-200 px-3 py-2 text-sm outline-none focus:border-brand-300"
              />
              <span className="mt-0.5 block text-right text-[11px] text-cream-800/40">{title.length}/{TITLE_MAX}</span>
            </label>
            <label className="mt-2 block">
              <span className="text-xs font-medium text-cream-800/60">Mesaj</span>
              <textarea
                value={message}
                maxLength={BODY_MAX}
                rows={5}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Göndermek istediğiniz metin…"
                className="mt-1 w-full resize-y rounded-xl border border-cream-200 px-3 py-2 text-sm outline-none focus:border-brand-300"
              />
              <span className="mt-0.5 block text-right text-[11px] text-cream-800/40">{message.length}/{BODY_MAX}</span>
            </label>

            <div className="mt-3 pointer-events-none">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-cream-800/40">Önizleme</p>
              {channel === 'push' ? (
                <NotificationItem notification={previewNotif} />
              ) : (
                <div className="rounded-2xl border border-cream-200 bg-cream-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">Yeni Form</p>
                  <p className="mt-1 font-medium text-cream-900">{title.trim() || 'Başlık'}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-cream-800/70">
                    {message.trim() || 'Mesajınız burada görünür'}
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={!canSend}
              onClick={openConfirm}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
              {sending ? 'Gönderiliyor…' : 'Gönder'}
            </button>
            {loadingMeta && (
              <p className="mt-2 text-center text-[11px] text-cream-800/40">Cihaz bilgisi yükleniyor…</p>
            )}
          </div>
        </div>
      </div>

      {lastResults?.results?.length > 0 && (
        <div className="rounded-2xl border border-cream-200 bg-white p-5">
          <h2 className="font-semibold text-cream-900">Son gönderim</h2>
          <ul className="mt-3 divide-y divide-cream-100">
            {lastResults.results.map((row) => (
              <li key={`${row.audience}:${row.id}`} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <span className="min-w-0">
                  <span className="font-medium text-cream-900">{row.name || row.email || row.id}</span>
                  <span className="ml-2 text-xs text-cream-800/45">
                    {row.audience === 'staff' ? 'personel' : 'danışan'}
                  </span>
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass(row)}`}>
                  {statusLabel(row)}
                  {row.error ? ` · ${row.error}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h2 className="font-semibold text-cream-900">Geçmiş</h2>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-cream-800/55">Henüz gönderim yok.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {history.map((h) => (
              <li key={h.id} className="rounded-2xl border border-cream-200 bg-white px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-cream-900">{h.title}</p>
                  <span className="text-xs text-cream-800/45">{formatRelativeTime(h.createdAt)}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-cream-800/60">{h.body}</p>
                <p className="mt-2 text-xs text-cream-800/45">
                  {h.channel === 'email' ? 'E-posta' : 'Telefon bildirimi'}
                  {' · '}
                  {h.sentCount} gitti
                  {h.skipCount ? ` · ${h.skipCount} atlandı` : ''}
                  {h.failCount ? ` · ${h.failCount} hata` : ''}
                  {' · '}
                  {h.recipientCount} kişi
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Gönderimi onayla"
        size="sm"
      >
        <p className="text-sm text-cream-800/70">
          <strong className="text-cream-900">{cart.length}</strong>
          {' '}kişiye{' '}
          <strong className="text-cream-900">
            {channel === 'email' ? 'e-posta' : 'telefon bildirimi'}
          </strong>
          {' '}gidecek.
        </p>
        <p className="mt-2 text-sm font-medium text-cream-900">{title.trim()}</p>
        <p className="mt-1 line-clamp-4 text-sm text-cream-800/60">{message.trim()}</p>
        <ul className="mt-3 max-h-32 overflow-y-auto text-xs text-cream-800/55">
          {cart.slice(0, 12).map((c) => (
            <li key={cartKey(c.audience, c.id)}>{c.name}</li>
          ))}
          {cart.length > 12 && <li>+{cart.length - 12} kişi daha</li>}
        </ul>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setConfirmOpen(false)}
            className="rounded-xl border border-cream-200 px-4 py-2 text-sm font-medium text-cream-800"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={send}
            className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Onayla ve gönder
          </button>
        </div>
      </Modal>
    </div>
  )
}
