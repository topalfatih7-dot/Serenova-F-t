import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, X, Edit3, Save, Plus, Trash2, ChevronDown, ChevronUp,
  DollarSign, Tag, ToggleLeft, ToggleRight,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import Modal from '../../components/ui/Modal'
import {
  emptyEntitlements,
  normalizeEntitlements,
  isValidPlanId,
  validateSellablePlanPricing,
  STRIPE_MIN_AMOUNT_TRY,
} from '../../data/membershipPlans'
import {
  planVisual,
  getPlanTheme,
  planHeaderColor,
  planBadgeColor,
  PLAN_ICON_OPTIONS,
  PLAN_ICON_MAP,
  PLAN_COLOR_TOKENS,
  PLAN_EMOJI_OPTIONS,
  resolvePlanIconName,
} from '../../components/membership/planTheme'

function isHexColor(value) {
  return typeof value === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim())
}

function slugifyName(name) {
  return String(name || '')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)
}

function blankPlan(sortOrder = 99) {
  return {
    id: '',
    name: '',
    price: 0,
    period: 'Aylık',
    badge: '',
    color: 'sage',
    icon: 'Package',
    emoji: '',
    isActive: true,
    isSellable: true,
    billingType: 'recurring',
    sortOrder,
    features: [{ text: 'Yeni özellik', included: true }],
    limits: [],
    pricingTiers: [
      { months: 1, label: 'Aylık', price: 0 },
      { months: 3, label: '3 Aylık', price: 0 },
      { months: 6, label: '6 Aylık', price: 0 },
    ],
    entitlements: emptyEntitlements(),
  }
}

export default function AdminPlansPage() {
  const { plans, savePlan, createPlan, deletePlan } = useApp()
  const { toast } = useToast()
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState(null)
  const [filter, setFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [createDraft, setCreateDraft] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [hardDelete, setHardDelete] = useState(false)

  const filtered = useMemo(() => {
    const list = [...(plans || [])].sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0))
    if (filter === 'sellable') return list.filter((p) => p.isSellable && p.isActive !== false)
    if (filter === 'inactive') return list.filter((p) => p.isActive === false || !p.isSellable)
    return list
  }, [plans, filter])

  const startEdit = (plan) => {
    setDraft({
      ...plan,
      icon: resolvePlanIconName(plan),
      color: plan.color || 'sage',
      emoji: plan.emoji || '',
      isActive: plan.isActive !== false,
      isSellable: plan.isSellable === true,
      billingType: plan.billingType === 'one_time' ? 'one_time' : 'recurring',
      entitlements: normalizeEntitlements(plan.entitlements || {}),
      features: (plan.features || []).map((f) => ({ ...f })),
      limits: [...(plan.limits || [])],
      pricingTiers: (plan.pricingTiers || []).map((t) => ({ ...t })),
    })
    setEditingId(plan.id)
  }

  const cancelEdit = () => { setEditingId(null); setDraft(null) }

  const handleSave = async () => {
    if (!draft) return
    const priceErr = validateSellablePlanPricing(draft)
    if (priceErr) {
      toast(priceErr, 'error')
      return
    }
    setSaving(true)
    try {
      await savePlan(draft)
      toast('Plan başarıyla güncellendi.', 'success')
      setEditingId(null)
      setDraft(null)
    } catch (e) {
      toast(e?.message || 'Güncelleme sırasında hata oluştu.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const openCreate = () => {
    const maxSort = Math.max(0, ...(plans || []).map((p) => Number(p.sortOrder) || 0))
    setCreateDraft(blankPlan(maxSort + 1))
    setCreateOpen(true)
  }

  const handleCreate = async () => {
    if (!createDraft) return
    const id = createDraft.id || slugifyName(createDraft.name)
    if (!isValidPlanId(id)) {
      toast('Geçersiz plan ID. Örn: yeni_paket', 'error')
      return
    }
    if ((plans || []).some((p) => p.id === id)) {
      toast('Bu ID zaten kullanılıyor.', 'error')
      return
    }
    if (!createDraft.name?.trim()) {
      toast('Paket adı gerekli.', 'error')
      return
    }
    const priceErr = validateSellablePlanPricing(createDraft)
    if (priceErr) {
      toast(priceErr, 'error')
      return
    }
    setSaving(true)
    try {
      await createPlan({
        ...createDraft,
        id,
        name: createDraft.name.trim(),
        entitlements: normalizeEntitlements(createDraft.entitlements),
      })
      toast('Yeni paket oluşturuldu.', 'success')
      setCreateOpen(false)
      setCreateDraft(null)
    } catch (e) {
      toast(e?.message || 'Oluşturma başarısız.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      const result = await deletePlan(deleteTarget.id, { hard: hardDelete })
      toast(
        result?.hard ? 'Paket kalıcı olarak silindi.' : 'Paket pasife alındı ve satışa kapatıldı.',
        'success',
      )
      setDeleteTarget(null)
      setHardDelete(false)
      if (editingId === deleteTarget.id) cancelEdit()
    } catch (e) {
      toast(e?.message || 'Silme başarısız.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const updateDraft = (key, value) => setDraft((d) => ({ ...d, [key]: value }))
  const updateEntitlement = (key, value) => {
    setDraft((d) => ({
      ...d,
      entitlements: { ...normalizeEntitlements(d.entitlements), [key]: value },
    }))
  }

  const toggleFeature = (idx) => {
    const features = draft.features.map((f, i) => i === idx ? { ...f, included: !f.included } : f)
    updateDraft('features', features)
  }
  const updateFeatureText = (idx, text) => {
    const features = draft.features.map((f, i) => i === idx ? { ...f, text } : f)
    updateDraft('features', features)
  }
  const addFeature = () => updateDraft('features', [...draft.features, { text: 'Yeni özellik', included: true }])
  const removeFeature = (idx) => updateDraft('features', draft.features.filter((_, i) => i !== idx))
  const updateLimit = (idx, value) => {
    const limits = draft.limits.map((l, i) => i === idx ? value : l)
    updateDraft('limits', limits)
  }
  const addLimit = () => updateDraft('limits', [...(draft.limits || []), 'Yeni sınır'])
  const removeLimit = (idx) => updateDraft('limits', draft.limits.filter((_, i) => i !== idx))

  const updateTier = (idx, field, value) => {
    setDraft((d) => {
      const pricingTiers = (d.pricingTiers || []).map((t, i) => (
        i === idx
          ? { ...t, [field]: field === 'price' || field === 'months' ? (parseInt(value, 10) || 0) : value }
          : t
      ))
      const next = { ...d, pricingTiers }
      const edited = pricingTiers[idx]
      if (field === 'price' && edited && Number(edited.months) === 1) {
        next.price = parseInt(value, 10) || 0
      }
      return next
    })
  }
  const addTier = () => {
    updateDraft('pricingTiers', [...(draft.pricingTiers || []), { months: 1, label: '1 Ay', price: draft.price || 0 }])
  }
  const removeTier = (idx) => {
    updateDraft('pricingTiers', (draft.pricingTiers || []).filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-cream-900">Paket Yönetimi</h1>
          <p className="mt-1 text-sm text-cream-800/60">
            Paket oluşturun, fiyat / özellik / kota / renk / emoji düzenleyin; satışa açın veya kapatın.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" /> Yeni Paket
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'Tümü' },
          { id: 'sellable', label: 'Satışta' },
          { id: 'inactive', label: 'Pasif / Kapalı' },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              filter === f.id
                ? 'bg-brand-500 text-white'
                : 'border border-cream-200 bg-white text-cream-700 hover:bg-cream-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-2">
        {filtered.map((plan) => {
          const isEditing = editingId === plan.id
          const d = isEditing ? draft : plan
          const theme = getPlanTheme(d)
          const headerCls = planHeaderColor(d.color)
          const headerStyle = isHexColor(d.color)
            ? { background: `linear-gradient(90deg, ${d.color}22, ${d.color}11)` }
            : undefined

          return (
            <motion.div
              key={plan.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-sm"
            >
              <div
                className={`flex items-center justify-between border-b bg-gradient-to-r px-5 py-4 ${isHexColor(d.color) ? 'border-cream-200' : headerCls}`}
                style={headerStyle}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${theme.customHex ? 'text-white' : theme.icon}`}
                    style={theme.customHex ? { backgroundColor: theme.customHex } : undefined}
                  >
                    {planVisual(d, 'h-5 w-5', 'text-xl leading-none')}
                  </span>
                  <div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={d.name}
                        onChange={(e) => updateDraft('name', e.target.value)}
                        className="rounded-lg border border-cream-200 bg-white px-2 py-1 text-sm font-bold text-cream-900 focus:outline-none focus:ring-2 focus:ring-brand-300"
                      />
                    ) : (
                      <h3 className="font-display text-lg font-bold text-cream-900">{d.name}</h3>
                    )}
                    <p className="text-xs text-cream-800/50">
                      ID: {plan.id}
                      {plan.isSellable ? ' · Satışta' : ' · Satış kapalı'}
                      {plan.isActive === false ? ' · Pasif' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {d.badge && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${isHexColor(d.color) ? 'text-white' : planBadgeColor(d.color)}`}
                      style={isHexColor(d.color) ? { backgroundColor: d.color } : undefined}
                    >
                      {d.badge}
                    </span>
                  )}
                  {!isEditing && (
                    <>
                      <button
                        type="button"
                        onClick={() => startEdit(plan)}
                        className="flex items-center gap-1.5 rounded-lg border border-cream-200 bg-white px-3 py-1.5 text-xs font-medium text-cream-800 hover:bg-cream-50 transition"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Düzenle
                      </button>
                      {plan.id !== 'free' && (
                        <button
                          type="button"
                          onClick={() => { setDeleteTarget(plan); setHardDelete(false) }}
                          className="rounded-lg border border-red-100 bg-white px-2 py-1.5 text-red-500 hover:bg-red-50"
                          title="Sil / pasife al"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="p-5 space-y-4">
                {isEditing ? (
                  <EditForm
                    draft={d}
                    updateDraft={updateDraft}
                    updateEntitlement={updateEntitlement}
                    toggleFeature={toggleFeature}
                    updateFeatureText={updateFeatureText}
                    addFeature={addFeature}
                    removeFeature={removeFeature}
                    updateLimit={updateLimit}
                    addLimit={addLimit}
                    removeLimit={removeLimit}
                    updateTier={updateTier}
                    addTier={addTier}
                    removeTier={removeTier}
                    allowIdEdit={false}
                  />
                ) : (
                  <ViewMode plan={plan} />
                )}
              </div>

              <AnimatePresence>
                {isEditing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-cream-100 bg-cream-50 px-5 py-3 flex justify-end gap-3"
                  >
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-lg border border-cream-200 bg-white px-4 py-2 text-sm font-medium text-cream-800 hover:bg-cream-100"
                    >
                      Vazgeç
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" />
                      {saving ? 'Kaydediliyor…' : 'Kaydet'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          <strong>Not:</strong> Fiyat, görsel ve satış durumu anında yayına girer.
          Kota / erişim değişiklikleri yeni atama ve yeni ödemelerde geçerlidir — mevcut üyelerin snapshottlanmış kotası korunur.
        </p>
      </div>

      <Modal open={createOpen} onClose={() => !saving && setCreateOpen(false)} title="Yeni Paket">
        {createDraft && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <EditForm
              draft={createDraft}
              updateDraft={(k, v) => {
                setCreateDraft((d) => {
                  const next = { ...d, [k]: v }
                  if (k === 'name' && !d.idLocked) {
                    next.id = slugifyName(v)
                  }
                  return next
                })
              }}
              updateEntitlement={(k, v) => {
                setCreateDraft((d) => ({
                  ...d,
                  entitlements: { ...normalizeEntitlements(d.entitlements), [k]: v },
                }))
              }}
              toggleFeature={(idx) => {
                setCreateDraft((d) => ({
                  ...d,
                  features: d.features.map((f, i) => i === idx ? { ...f, included: !f.included } : f),
                }))
              }}
              updateFeatureText={(idx, text) => {
                setCreateDraft((d) => ({
                  ...d,
                  features: d.features.map((f, i) => i === idx ? { ...f, text } : f),
                }))
              }}
              addFeature={() => setCreateDraft((d) => ({ ...d, features: [...d.features, { text: 'Yeni özellik', included: true }] }))}
              removeFeature={(idx) => setCreateDraft((d) => ({ ...d, features: d.features.filter((_, i) => i !== idx) }))}
              updateLimit={(idx, value) => {
                setCreateDraft((d) => ({
                  ...d,
                  limits: d.limits.map((l, i) => i === idx ? value : l),
                }))
              }}
              addLimit={() => setCreateDraft((d) => ({ ...d, limits: [...(d.limits || []), 'Yeni sınır'] }))}
              removeLimit={(idx) => setCreateDraft((d) => ({ ...d, limits: d.limits.filter((_, i) => i !== idx) }))}
              updateTier={(idx, field, value) => {
                setCreateDraft((d) => {
                  const pricingTiers = (d.pricingTiers || []).map((t, i) => (
                    i === idx
                      ? { ...t, [field]: field === 'price' || field === 'months' ? (parseInt(value, 10) || 0) : value }
                      : t
                  ))
                  const next = { ...d, pricingTiers }
                  if (field === 'price' && Number(pricingTiers[idx]?.months) === 1) {
                    next.price = parseInt(value, 10) || 0
                  }
                  return next
                })
              }}
              addTier={() => setCreateDraft((d) => ({
                ...d,
                pricingTiers: [...(d.pricingTiers || []), { months: 1, label: '1 Ay', price: d.price || 0 }],
              }))}
              removeTier={(idx) => setCreateDraft((d) => ({
                ...d,
                pricingTiers: (d.pricingTiers || []).filter((_, i) => i !== idx),
              }))}
              allowIdEdit
              onIdManualEdit={(id) => setCreateDraft((d) => ({ ...d, id, idLocked: true }))}
            />
            <div className="flex justify-end gap-2 border-t border-cream-100 pt-3">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-lg border border-cream-200 px-4 py-2 text-sm"
                disabled={saving}
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={saving}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? 'Oluşturuluyor…' : 'Oluştur'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(deleteTarget)} onClose={() => !saving && setDeleteTarget(null)} title="Paketi kaldır">
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-cream-800">
              <strong>{deleteTarget.name}</strong> ({deleteTarget.id}) paketini kaldırmak istiyor musunuz?
            </p>
            <label className="flex items-start gap-2 rounded-xl border border-cream-200 bg-cream-50 p-3 text-sm">
              <input
                type="checkbox"
                checked={hardDelete}
                onChange={(e) => setHardDelete(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Kalıcı sil (üye yoksa). İşaretli değilse paket pasife alınır ve satışa kapatılır.
              </span>
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-cream-200 px-4 py-2 text-sm"
                disabled={saving}
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? 'İşleniyor…' : (hardDelete ? 'Kalıcı sil' : 'Pasife al')}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function ViewMode({ plan }) {
  const tiers = plan.pricingTiers || []
  const e = normalizeEntitlements(plan.entitlements || {})
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-cream-50 p-3">
          <p className="text-xs text-cream-800/50">Fiyat</p>
          <p className="mt-0.5 font-display text-xl font-bold text-cream-900">
            {plan.price === 0 ? 'Ücretsiz' : `${plan.price.toLocaleString('tr-TR')}₺`}
          </p>
        </div>
        <div className="rounded-xl bg-cream-50 p-3">
          <p className="text-xs text-cream-800/50">Dönem / faturalama</p>
          <p className="mt-0.5 font-semibold text-cream-900">
            {plan.period}
            {plan.billingType === 'one_time' ? ' · Tek seferlik' : ''}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-cream-100 bg-cream-50/80 p-3 text-xs text-cream-800 space-y-1">
        <p className="font-semibold uppercase tracking-wide text-cream-800/50">Kota & erişim</p>
        <p>Koç: {e.coachMeetingsPerMonth}/ay · Diyetisyen: {e.dietitianMeetingsPerMonth}/ay · Doktor: {e.doctorMeetingsPerMonth}/ay{e.doctorSessionsTotal ? ` (+${e.doctorSessionsTotal} tek sefer)` : ''}</p>
        <p>
          Kalori: {e.manualCalorie ? 'manuel' : '—'}{e.photoCalorie ? ' + foto' : ''}
        </p>
      </div>

      {tiers.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cream-800/50">Fiyat katmanları</p>
          <ul className="space-y-1">
            {tiers.map((t, i) => (
              <li key={i} className="flex justify-between text-sm text-cream-800">
                <span>{t.label || `${t.months} ay`}</span>
                <span className="font-semibold">{Number(t.price || 0).toLocaleString('tr-TR')}₺</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cream-800/50">Özellikler</p>
        <ul className="space-y-1.5">
          {(plan.features || []).map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              {f.included
                ? <Check className="h-3.5 w-3.5 shrink-0 text-sage-500" />
                : <X className="h-3.5 w-3.5 shrink-0 text-cream-300" />}
              <span className={f.included ? 'text-cream-800' : 'text-cream-400'}>{f.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function EditForm({
  draft, updateDraft, updateEntitlement, toggleFeature, updateFeatureText, addFeature, removeFeature,
  updateLimit, addLimit, removeLimit, updateTier, addTier, removeTier,
  allowIdEdit = false, onIdManualEdit,
}) {
  const [showLimits, setShowLimits] = useState(false)
  const [hexInput, setHexInput] = useState(isHexColor(draft.color) ? draft.color : '#5B8A72')
  const selectedIcon = resolvePlanIconName(draft)
  const ent = normalizeEntitlements(draft.entitlements || {})

  return (
    <div className="space-y-5">
      {allowIdEdit && (
        <div>
          <label className="mb-1 block text-xs font-semibold text-cream-800/60">Plan ID (slug)</label>
          <input
            type="text"
            value={draft.id || ''}
            onChange={(e) => {
              const v = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
              onIdManualEdit?.(v)
              updateDraft('id', v)
            }}
            placeholder="yeni_paket"
            className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm font-mono"
          />
          <p className="mt-1 text-[11px] text-cream-800/45">Küçük harf, rakam, alt çizgi. Oluşturulunca değişmez.</p>
        </div>
      )}

      {allowIdEdit && (
        <div>
          <label className="mb-1 block text-xs font-semibold text-cream-800/60">Paket adı</label>
          <input
            type="text"
            value={draft.name || ''}
            onChange={(e) => updateDraft('name', e.target.value)}
            className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-cream-800/60">
            Fiyat (₺/ay) — satışta min. {STRIPE_MIN_AMOUNT_TRY}₺
          </label>
          <div className="relative">
            <DollarSign className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-cream-400" />
            <input
              type="number"
              min={0}
              value={draft.price}
              onChange={(e) => updateDraft('price', parseInt(e.target.value, 10) || 0)}
              className="w-full rounded-lg border border-cream-200 bg-cream-50 pl-7 pr-3 py-2 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-cream-800/60">Dönem etiketi</label>
          <input
            type="text"
            value={draft.period}
            onChange={(e) => updateDraft('period', e.target.value)}
            className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-cream-800/60">Faturalama</label>
          <select
            value={draft.billingType || 'recurring'}
            onChange={(e) => updateDraft('billingType', e.target.value)}
            className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm"
          >
            <option value="recurring">Aylık / süreli</option>
            <option value="one_time">Tek seferlik</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-cream-800/60">Sıra (sort)</label>
          <input
            type="number"
            min={0}
            value={draft.sortOrder ?? 0}
            onChange={(e) => updateDraft('sortOrder', parseInt(e.target.value, 10) || 0)}
            className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-cream-800/50">Fiyat katmanları (1/3/6 ay)</p>
          <button type="button" onClick={addTier} className="flex items-center gap-1 rounded-lg border border-dashed border-cream-300 px-2.5 py-1 text-xs text-cream-600 hover:bg-cream-50">
            <Plus className="h-3.5 w-3.5" /> Ekle
          </button>
        </div>
        <div className="space-y-2">
          {(draft.pricingTiers || []).map((t, i) => (
            <div key={i} className="grid grid-cols-[4rem_1fr_5.5rem_auto] gap-2">
              <input type="number" min={0} value={t.months ?? ''} onChange={(e) => updateTier(i, 'months', e.target.value)} className="rounded-lg border border-cream-200 bg-cream-50 px-2 py-1.5 text-sm" title="Ay" />
              <input type="text" value={t.label || ''} onChange={(e) => updateTier(i, 'label', e.target.value)} placeholder="Etiket" className="rounded-lg border border-cream-200 bg-cream-50 px-2 py-1.5 text-sm" />
              <input type="number" min={0} value={t.price ?? ''} onChange={(e) => updateTier(i, 'price', e.target.value)} className="rounded-lg border border-cream-200 bg-cream-50 px-2 py-1.5 text-sm" title="₺" />
              <button type="button" onClick={() => removeTier(i)} className="text-cream-300 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-cream-800/60">Rozet (opsiyonel)</label>
        <div className="relative">
          <Tag className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-cream-400" />
          <input type="text" placeholder="En Popüler" value={draft.badge || ''} onChange={(e) => updateDraft('badge', e.target.value)} className="w-full rounded-lg border border-cream-200 bg-cream-50 pl-7 pr-3 py-2 text-sm" />
        </div>
      </div>

      {/* Entitlements */}
      <div className="rounded-xl border border-cream-200 bg-cream-50/50 p-3 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-cream-800/50">Kota & erişim bayrakları</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { key: 'coachMeetingsPerMonth', label: 'Koç / ay' },
            { key: 'dietitianMeetingsPerMonth', label: 'Diyet / ay' },
            { key: 'doctorMeetingsPerMonth', label: 'Doktor / ay' },
            { key: 'doctorSessionsTotal', label: 'Doktor tek sefer' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="mb-0.5 block text-[11px] text-cream-800/55">{label}</label>
              <input
                type="number"
                min={0}
                value={ent[key] ?? 0}
                onChange={(e) => updateEntitlement(key, Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full rounded-lg border border-cream-200 bg-white px-2 py-1.5 text-sm"
              />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          {[
            { key: 'manualCalorie', label: 'Manuel kalori' },
            { key: 'photoCalorie', label: 'Foto kalori' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-xs font-medium text-cream-800">
              <input
                type="checkbox"
                checked={Boolean(ent[key])}
                onChange={(e) => updateEntitlement(key, e.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Emoji */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cream-800/50">Emoji (opsiyonel — Lucide yerine)</p>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {PLAN_EMOJI_OPTIONS.map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => updateDraft('emoji', draft.emoji === em ? '' : em)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg transition ${
                draft.emoji === em ? 'bg-brand-500 ring-2 ring-brand-300' : 'bg-cream-50 ring-1 ring-cream-200 hover:ring-brand-300'
              }`}
            >
              {em}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={draft.emoji || ''}
          onChange={(e) => updateDraft('emoji', e.target.value.slice(0, 8))}
          placeholder="veya özel emoji yapıştır"
          className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm"
        />
      </div>

      {/* Icon picker */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cream-800/50">Lucide ikon (emoji yoksa)</p>
        <div className="grid max-h-44 grid-cols-6 gap-1.5 overflow-y-auto rounded-xl border border-cream-100 bg-cream-50/60 p-2 sm:grid-cols-8">
          {PLAN_ICON_OPTIONS.map((name) => {
            const Icon = PLAN_ICON_MAP[name]
            const active = selectedIcon === name
            return (
              <button
                key={name}
                type="button"
                title={name}
                onClick={() => updateDraft('icon', name)}
                className={`flex h-9 w-full items-center justify-center rounded-lg transition ${
                  active ? 'bg-brand-500 text-white shadow' : 'bg-white text-cream-700 ring-1 ring-cream-200 hover:ring-brand-300'
                }`}
              >
                <Icon className="h-4 w-4" />
              </button>
            )
          })}
        </div>
      </div>

      {/* Color picker */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cream-800/50">Arkaplan / tema rengi</p>
        <div className="flex flex-wrap gap-2">
          {PLAN_COLOR_TOKENS.map((c) => {
            const active = draft.color === c.id
            return (
              <button
                key={c.id}
                type="button"
                title={c.label}
                onClick={() => updateDraft('color', c.id)}
                className={`h-8 w-8 rounded-full ring-2 ring-offset-2 transition ${c.swatch} ${
                  active ? 'ring-cream-900' : 'ring-transparent hover:ring-cream-300'
                }`}
              />
            )
          })}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="color"
            value={isHexColor(draft.color) ? draft.color : hexInput}
            onChange={(e) => { setHexInput(e.target.value); updateDraft('color', e.target.value) }}
            className="h-9 w-12 cursor-pointer rounded border border-cream-200 bg-white p-0.5"
          />
          <input
            type="text"
            value={isHexColor(draft.color) ? draft.color : hexInput}
            onChange={(e) => {
              setHexInput(e.target.value)
              if (isHexColor(e.target.value)) updateDraft('color', e.target.value.trim())
            }}
            placeholder="#5B8A72"
            className="flex-1 rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm font-mono"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-xl border border-cream-100 bg-cream-50 px-4 py-2.5">
          <span className="text-sm font-medium text-cream-800">Plan aktif</span>
          <button type="button" onClick={() => updateDraft('isActive', !draft.isActive)}>
            {draft.isActive ? <ToggleRight className="h-6 w-6 text-sage-500" /> : <ToggleLeft className="h-6 w-6 text-cream-300" />}
          </button>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-cream-100 bg-cream-50 px-4 py-2.5">
          <span className="text-sm font-medium text-cream-800">Satışa açık (is_sellable)</span>
          <button type="button" onClick={() => updateDraft('isSellable', !draft.isSellable)}>
            {draft.isSellable ? <ToggleRight className="h-6 w-6 text-brand-500" /> : <ToggleLeft className="h-6 w-6 text-cream-300" />}
          </button>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-cream-800/50">Özellikler</p>
          <button type="button" onClick={addFeature} className="flex items-center gap-1 rounded-lg border border-dashed border-cream-300 px-2.5 py-1 text-xs text-cream-600 hover:bg-cream-50">
            <Plus className="h-3.5 w-3.5" /> Ekle
          </button>
        </div>
        <div className="space-y-2">
          {(draft.features || []).map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleFeature(i)}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                  f.included ? 'border-sage-400 bg-sage-50 text-sage-500' : 'border-cream-200 text-cream-300'
                }`}
              >
                {f.included ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              </button>
              <input type="text" value={f.text} onChange={(e) => updateFeatureText(i, e.target.value)} className="flex-1 rounded-lg border border-cream-200 bg-cream-50 px-2.5 py-1.5 text-sm" />
              <button type="button" onClick={() => removeFeature(i)} className="text-cream-300 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <button type="button" onClick={() => setShowLimits((v) => !v)} className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-cream-800/50 hover:text-cream-800">
          Sınırlar (opsiyonel)
          {showLimits ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <AnimatePresence>
          {showLimits && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2 space-y-2">
              {(draft.limits || []).map((l, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="text" value={l} onChange={(e) => updateLimit(i, e.target.value)} className="flex-1 rounded-lg border border-cream-200 bg-cream-50 px-2.5 py-1.5 text-sm" />
                  <button type="button" onClick={() => removeLimit(i)} className="text-cream-300 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
              <button type="button" onClick={addLimit} className="flex items-center gap-1 text-xs text-cream-500 hover:text-cream-800">
                <Plus className="h-3.5 w-3.5" /> Sınır ekle
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
