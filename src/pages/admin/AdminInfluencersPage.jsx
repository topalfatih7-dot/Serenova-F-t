import { useEffect, useMemo, useState } from 'react'
import {
  Plus, Search, Mail, Phone, Trash2, Edit, Megaphone, Copy, Check,
  Eye, EyeOff, Tag, Loader2,
} from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import PhoneField from '../../components/ui/PhoneField'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import {
  DEFAULT_COUNTRY_ISO,
  digitsOnly,
  formatE164,
  formatNationalNumber,
  parseE164,
  toE164,
} from '../../data/countryCodes'
import useInfluencerEarnings from '../../hooks/useInfluencerEarnings'
import {
  adminDeleteInfluencer,
  adminUpsertInfluencer,
} from '../../services/influencerDb'
import {
  formatInfluencerTry,
  summarizeInfluencerEarnings,
} from '../../data/influencerPayouts'
import {
  isValidInfluencerCodeFormat,
  normalizeInfluencerCode,
  suggestInfluencerCode,
} from '../../utils/influencerCode'

const inputCls = 'w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-300'

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  phoneCountry: DEFAULT_COUNTRY_ISO,
  instagram: '',
  code: '',
  active: true,
  password: '',
}

function splitStoredPhone(raw) {
  const parsed = parseE164(raw)
  if (!parsed?.national) return { iso: DEFAULT_COUNTRY_ISO, national: '' }
  return {
    iso: parsed.iso,
    national: formatNationalNumber(parsed.iso, parsed.national),
  }
}

function persistPhone(iso, national) {
  if (!digitsOnly(national)) return ''
  return toE164(iso || DEFAULT_COUNTRY_ISO, national)
}

async function copyText(text) {
  await navigator.clipboard.writeText(text)
}

function InfluencerForm({ initial, isEdit, onSubmit, onClose, busy }) {
  const [form, setForm] = useState(() => {
    const phoneParts = splitStoredPhone(initial?.phone)
    return {
      ...emptyForm,
      ...initial,
      code: initial?.code || suggestInfluencerCode(initial?.name || ''),
      active: initial?.active !== false,
      password: '',
      phone: phoneParts.national,
      phoneCountry: phoneParts.iso,
      codeTouched: Boolean(initial?.code),
    }
  })

  const update = (patch) => setForm((f) => {
    const next = { ...f, ...patch }
    if (patch.name != null && !isEdit && !next.codeTouched) {
      next.code = suggestInfluencerCode(patch.name)
    }
    return next
  })

  const submit = () => {
    if (busy) return
    const code = normalizeInfluencerCode(form.code)
    if (!isValidInfluencerCodeFormat(code)) return
    onSubmit({
      ...form,
      code,
      phone: persistPhone(form.phoneCountry, form.phone),
      id: initial?.id,
    })
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-cream-800/55">Ad soyad</span>
        <input
          type="text"
          autoComplete="name"
          value={form.name}
          onChange={(e) => update({ name: e.target.value })}
          className={inputCls}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-cream-800/55">E-posta</span>
        <input
          type="email"
          autoComplete="off"
          value={form.email}
          onChange={(e) => update({ email: e.target.value })}
          className={inputCls}
          disabled={isEdit}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-cream-800/55">Kod</span>
        <input
          type="text"
          name="influencer_promo_code"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={form.code}
          onChange={(e) => update({ code: normalizeInfluencerCode(e.target.value), codeTouched: true })}
          className={`${inputCls} font-mono tracking-wide`}
        />
        <p className="mt-1 text-[11px] text-cream-800/45">4–20 karakter, yalnızca A–Z ve 0–9. Influencer bu kodu değiştiremez.</p>
      </label>
      <PhoneField
        label="Telefon"
        country={form.phoneCountry}
        value={form.phone}
        onCountryChange={(iso) => update({ phoneCountry: iso, phone: '' })}
        onValueChange={(phone) => update({ phone })}
        hint="Türkiye için 10 hane: 5XX XXX XX XX"
      />
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-cream-800/55">Instagram</span>
        <input type="text" autoComplete="off" value={form.instagram} onChange={(e) => update({ instagram: e.target.value })} className={inputCls} placeholder="@kullanici" />
      </label>
      {isEdit && (
        <label className="flex items-center gap-2 text-sm text-cream-800">
          <input type="checkbox" checked={form.active} onChange={(e) => update({ active: e.target.checked })} />
          Aktif (pasif kod checkout’ta geçersiz görünür)
        </label>
      )}
      {isEdit && (
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-cream-800/55">Yeni geçici şifre (opsiyonel)</span>
          <input type="password" value={form.password} onChange={(e) => update({ password: e.target.value })} className={inputCls} autoComplete="new-password" />
        </label>
      )}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-cream-200 py-2.5 text-sm">Vazgeç</button>
        <button
          type="button"
          disabled={busy || !isValidInfluencerCodeFormat(form.code)}
          onClick={submit}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? 'Kaydet' : 'Oluştur'}
        </button>
      </div>
    </div>
  )
}

export default function AdminInfluencersPage() {
  const { influencers = [], refresh } = useApp()
  const { toast } = useToast()
  const { rows: earnings } = useInfluencerEarnings({ all: true })
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [busy, setBusy] = useState(false)
  const [createdCreds, setCreatedCreds] = useState(null)
  const [copied, setCopied] = useState('')
  const [togglingId, setTogglingId] = useState(null)

  const statsById = useMemo(() => {
    const map = {}
    for (const row of earnings) {
      const id = row.influencer_id
      if (!map[id]) map[id] = []
      map[id].push(row)
    }
    const out = {}
    for (const [id, list] of Object.entries(map)) {
      out[id] = summarizeInfluencerEarnings(list)
    }
    return out
  }, [earnings])

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr')
    return (influencers || []).filter((s) => {
      if (!q) return true
      return [s.name, s.email, s.code, s.phone, s.instagram].join(' ').toLocaleLowerCase('tr').includes(q)
    })
  }, [influencers, search])

  useEffect(() => {
    if (!copied) return undefined
    const t = setTimeout(() => setCopied(''), 1400)
    return () => clearTimeout(t)
  }, [copied])

  const copy = async (value, key) => {
    try {
      await copyText(value)
      setCopied(key)
      toast('Kopyalandı.', 'success')
    } catch {
      toast('Kopyalanamadı.', 'error')
    }
  }

  const handleAdd = async (form) => {
    setBusy(true)
    try {
      const r = await adminUpsertInfluencer({
        name: form.name,
        email: form.email,
        phone: form.phone,
        instagram: form.instagram,
        code: form.code,
        active: true,
        sendInvite: true,
      })
      if (!r.success) {
        toast(r.error, 'error')
        return
      }
      await refresh?.()
      setAddOpen(false)
      setCreatedCreds({
        email: form.email,
        code: r.code,
        tempPassword: r.tempPassword,
        emailSent: r.emailSent,
      })
      toast('Influencer oluşturuldu.', 'success')
    } finally {
      setBusy(false)
    }
  }

  const handleEdit = async (form) => {
    setBusy(true)
    try {
      const payload = {
        id: form.id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        instagram: form.instagram,
        code: form.code,
        active: form.active,
      }
      if (form.password) payload.password = form.password
      const r = await adminUpsertInfluencer(payload)
      if (!r.success) {
        toast(r.error, 'error')
        return
      }
      await refresh?.()
      setEditTarget(null)
      toast('Influencer güncellendi.', 'success')
    } finally {
      setBusy(false)
    }
  }

  const handleToggleActive = async (row) => {
    if (togglingId) return
    setTogglingId(row.id)
    try {
      const r = await adminUpsertInfluencer({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        instagram: row.instagram,
        code: row.code,
        active: !row.active,
      })
      if (!r.success) {
        toast(r.error, 'error')
        return
      }
      await refresh?.()
      toast(row.active ? 'Kod pasifleştirildi.' : 'Kod etkinleştirildi.', 'success')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setBusy(true)
    try {
      const r = await adminDeleteInfluencer(deleteTarget.id)
      if (!r.success) {
        toast(r.error, 'error')
        return
      }
      await refresh?.()
      toast('Influencer silindi.', 'info')
      setDeleteTarget(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-cream-900">Influencer yönetimi</h1>
          <p className="mt-1 text-sm text-cream-800/60">
            {influencers.length} kayıt · tek kod, abonelik süresince %10 indirim, ödenen tutarın %20’si hakediş
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" /> Yeni influencer
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-800/40" />
        <input
          type="text"
          placeholder="İsim, e-posta veya kod ara…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-cream-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-300"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title={influencers.length === 0 ? 'Henüz influencer yok' : 'Eşleşen kayıt yok'}
          description={influencers.length === 0 ? 'Ad, e-posta ve kod ile hesap oluşturun. Geçici şifre e-posta ile gider.' : 'Aramayı değiştirin.'}
          action={influencers.length === 0 ? (
            <button type="button" onClick={() => setAddOpen(true)} className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white">
              Yeni influencer
            </button>
          ) : null}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => {
            const stats = statsById[s.id] || summarizeInfluencerEarnings([])
            return (
              <div key={s.id} className={`flex flex-col rounded-2xl border bg-white p-5 shadow-sm ${s.active ? 'border-cream-200' : 'border-amber-200/80'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-cream-900">{s.name}</p>
                    <button
                      type="button"
                      onClick={() => copy(s.code, s.id)}
                      className="mt-1 inline-flex items-center gap-1 font-mono text-sm font-bold tracking-wide text-brand-700 hover:text-brand-900"
                    >
                      {copied === s.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {s.code}
                    </button>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className={`mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.active ? 'bg-sage-50 text-sage-700' : 'bg-amber-50 text-amber-800'}`}>
                      {s.active ? 'Aktif' : 'Pasif'}
                    </span>
                    <button type="button" onClick={() => setEditTarget(s)} className="rounded-lg p-1.5 text-cream-800/50 hover:bg-cream-100" aria-label="Düzenle">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setDeleteTarget(s)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50" aria-label="Sil">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-cream-50 px-3 py-2">
                    <p className="text-cream-800/50">Müşteri</p>
                    <p className="font-semibold text-cream-900">{stats.uniqueCustomers}</p>
                  </div>
                  <div className="rounded-xl bg-cream-50 px-3 py-2">
                    <p className="text-cream-800/50">GMV</p>
                    <p className="font-semibold text-cream-900">{formatInfluencerTry(stats.gmv)}</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 px-3 py-2">
                    <p className="text-amber-800/60">Bekleyen</p>
                    <p className="font-semibold text-amber-900">{formatInfluencerTry(stats.pending)}</p>
                  </div>
                  <div className="rounded-xl bg-sage-50 px-3 py-2">
                    <p className="text-sage-800/60">Ödenen</p>
                    <p className="font-semibold text-sage-900">{formatInfluencerTry(stats.paid)}</p>
                  </div>
                </div>

                <div className="mt-auto space-y-1.5 pt-4 text-sm text-cream-800/70">
                  <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-cream-800/40" /> {s.email}</p>
                  <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-cream-800/40" /> {s.phone ? formatE164(s.phone) : '—'}</p>
                  <p className="flex items-center gap-2"><Tag className="h-4 w-4 shrink-0 text-cream-800/40" /> {s.instagram || '—'}</p>
                </div>

                <button
                  type="button"
                  disabled={togglingId === s.id}
                  onClick={() => handleToggleActive(s)}
                  className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-cream-100 py-2 text-xs font-medium text-cream-800 hover:bg-cream-200 disabled:opacity-50"
                >
                  {togglingId === s.id ? 'Kaydediliyor…' : s.active ? (
                    <><EyeOff className="h-3.5 w-3.5" /> Pasifleştir</>
                  ) : (
                    <><Eye className="h-3.5 w-3.5" /> Etkinleştir</>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={addOpen} onClose={() => !busy && setAddOpen(false)} title="Yeni influencer">
        <InfluencerForm onSubmit={handleAdd} onClose={() => setAddOpen(false)} busy={busy} />
      </Modal>

      <Modal open={!!editTarget} onClose={() => !busy && setEditTarget(null)} title="Influencer düzenle">
        {editTarget && (
          <InfluencerForm
            key={editTarget.id}
            isEdit
            initial={editTarget}
            onSubmit={handleEdit}
            onClose={() => setEditTarget(null)}
            busy={busy}
          />
        )}
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => !busy && setDeleteTarget(null)} title="Kaydı sil">
        <p className="text-sm text-cream-800/70">
          <strong>{deleteTarget?.name}</strong> hesabını silmek istediğinize emin misiniz? Auth kullanıcısı da silinir.
        </p>
        <div className="mt-4 flex gap-3">
          <button type="button" onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl border border-cream-200 py-2.5 text-sm">Vazgeç</button>
          <button
            type="button"
            disabled={busy}
            onClick={handleDelete}
            className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            Sil
          </button>
        </div>
      </Modal>

      <Modal open={!!createdCreds} onClose={() => setCreatedCreds(null)} title="Hesap oluşturuldu">
        <p className="text-sm text-cream-800/70">
          Geçici şifreyi şimdi kopyalayın. {createdCreds?.emailSent ? 'Davet e-postası gönderildi.' : 'E-posta gönderilemedi; şifreyi elle iletin.'}
        </p>
        <div className="mt-4 space-y-2 rounded-xl bg-cream-50 p-4 text-sm">
          <p><span className="text-cream-800/50">E-posta:</span> {createdCreds?.email}</p>
          <p><span className="text-cream-800/50">Kod:</span> <span className="font-mono font-bold">{createdCreds?.code}</span></p>
          <p className="flex items-center justify-between gap-2">
            <span>
              <span className="text-cream-800/50">Şifre:</span>{' '}
              <span className="font-mono font-bold">{createdCreds?.tempPassword}</span>
            </span>
            {createdCreds?.tempPassword && (
              <button
                type="button"
                onClick={() => copy(createdCreds.tempPassword, 'pwd')}
                className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-xs font-semibold ring-1 ring-cream-200"
              >
                {copied === 'pwd' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                Kopyala
              </button>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreatedCreds(null)}
          className="mt-4 w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white"
        >
          Tamam
        </button>
      </Modal>
    </div>
  )
}
