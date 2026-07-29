import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, X, Edit3, Save, Plus, Trash2, ChevronDown, ChevronUp,
  DollarSign, Tag, ToggleLeft, ToggleRight,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import {
  planIcon,
  getPlanTheme,
  planHeaderColor,
  planBadgeColor,
  PLAN_ICON_OPTIONS,
  PLAN_ICON_MAP,
  PLAN_COLOR_TOKENS,
  resolvePlanIconName,
} from '../../components/membership/planTheme'

function isHexColor(value) {
  return typeof value === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim())
}

export default function AdminPlansPage() {
  const { plans, savePlan } = useApp()
  const { toast } = useToast()
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState(null)

  const startEdit = (plan) => {
    setDraft({
      ...plan,
      icon: resolvePlanIconName(plan),
      color: plan.color || 'sage',
      isActive: plan.isActive !== false,
      features: (plan.features || []).map((f) => ({ ...f })),
      limits: [...(plan.limits || [])],
      pricingTiers: (plan.pricingTiers || []).map((t) => ({ ...t })),
    })
    setEditingId(plan.id)
  }

  const cancelEdit = () => { setEditingId(null); setDraft(null) }

  const handleSave = async () => {
    if (!draft) return
    setSaving(true)
    try {
      await savePlan(draft)
      toast('Plan başarıyla güncellendi.', 'success')
      setEditingId(null)
      setDraft(null)
    } catch {
      toast('Güncelleme sırasında hata oluştu.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const updateDraft = (key, value) => setDraft((d) => ({ ...d, [key]: value }))

  const toggleFeature = (idx) => {
    const features = draft.features.map((f, i) => i === idx ? { ...f, included: !f.included } : f)
    updateDraft('features', features)
  }

  const updateFeatureText = (idx, text) => {
    const features = draft.features.map((f, i) => i === idx ? { ...f, text } : f)
    updateDraft('features', features)
  }

  const addFeature = () => {
    updateDraft('features', [...draft.features, { text: 'Yeni özellik', included: true }])
  }

  const removeFeature = (idx) => {
    updateDraft('features', draft.features.filter((_, i) => i !== idx))
  }

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
      <div>
        <h1 className="font-display text-2xl font-bold text-cream-900">Paket Yönetimi</h1>
        <p className="mt-1 text-sm text-cream-800/60">
          Üyelik paketlerini fiyat, özellik, ikon ve renkleriyle admin panelinden düzenleyin.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-2">
        {(plans || []).map((plan) => {
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
                    {planIcon(d, 'h-5 w-5')}
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
                    <p className="text-xs text-cream-800/50">ID: {plan.id}</p>
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
                    <button
                      type="button"
                      onClick={() => startEdit(plan)}
                      className="flex items-center gap-1.5 rounded-lg border border-cream-200 bg-white px-3 py-1.5 text-xs font-medium text-cream-800 hover:bg-cream-50 transition"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Düzenle
                    </button>
                  )}
                </div>
              </div>

              <div className="p-5 space-y-4">
                {isEditing ? (
                  <EditForm
                    draft={d}
                    updateDraft={updateDraft}
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
          <strong>Not:</strong> Fiyat ve görsel değişiklikleri anında yayına girer (landing / checkout).
          Mevcut üyelerin paket kotası etkilenmez — yalnızca yeni atamalar ve ödemeler güncel fiyatı kullanır.
        </p>
      </div>
    </div>
  )
}

function ViewMode({ plan }) {
  const tiers = plan.pricingTiers || []
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
          <p className="text-xs text-cream-800/50">Dönem</p>
          <p className="mt-0.5 font-semibold text-cream-900">{plan.period}</p>
        </div>
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

      {plan.limits?.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cream-800/50">Sınırlar</p>
          <ul className="space-y-1">
            {plan.limits.map((l, i) => (
              <li key={i} className="flex items-center gap-1.5 text-xs text-cream-800/60">
                <span className="h-1 w-1 rounded-full bg-cream-400" /> {l}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function EditForm({
  draft, updateDraft, toggleFeature, updateFeatureText, addFeature, removeFeature,
  updateLimit, addLimit, removeLimit, updateTier, addTier, removeTier,
}) {
  const [showLimits, setShowLimits] = useState(false)
  const [hexInput, setHexInput] = useState(isHexColor(draft.color) ? draft.color : '#5B8A72')
  const selectedIcon = resolvePlanIconName(draft)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-cream-800/60">Fiyat (₺/ay)</label>
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
          <label className="mb-1 block text-xs font-semibold text-cream-800/60">Dönem</label>
          <input
            type="text"
            value={draft.period}
            onChange={(e) => updateDraft('period', e.target.value)}
            className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </div>
      </div>

      {/* pricing tiers */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-cream-800/50">Fiyat katmanları (1/3/6 ay)</p>
          <button
            type="button"
            onClick={addTier}
            className="flex items-center gap-1 rounded-lg border border-dashed border-cream-300 px-2.5 py-1 text-xs text-cream-600 hover:bg-cream-50"
          >
            <Plus className="h-3.5 w-3.5" /> Ekle
          </button>
        </div>
        <div className="space-y-2">
          {(draft.pricingTiers || []).map((t, i) => (
            <div key={i} className="grid grid-cols-[4rem_1fr_5.5rem_auto] gap-2">
              <input
                type="number"
                min={0}
                value={t.months ?? ''}
                onChange={(e) => updateTier(i, 'months', e.target.value)}
                className="rounded-lg border border-cream-200 bg-cream-50 px-2 py-1.5 text-sm"
                title="Ay"
              />
              <input
                type="text"
                value={t.label || ''}
                onChange={(e) => updateTier(i, 'label', e.target.value)}
                placeholder="Etiket"
                className="rounded-lg border border-cream-200 bg-cream-50 px-2 py-1.5 text-sm"
              />
              <input
                type="number"
                min={0}
                value={t.price ?? ''}
                onChange={(e) => updateTier(i, 'price', e.target.value)}
                className="rounded-lg border border-cream-200 bg-cream-50 px-2 py-1.5 text-sm"
                title="₺"
              />
              <button type="button" onClick={() => removeTier(i)} className="text-cream-300 hover:text-red-400">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {(draft.pricingTiers || []).length === 0 && (
            <p className="text-xs text-cream-800/45">Katman yok — checkout yalnızca taban fiyatı kullanır.</p>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-cream-800/60">Rozet (opsiyonel)</label>
        <div className="relative">
          <Tag className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-cream-400" />
          <input
            type="text"
            placeholder="En Popüler"
            value={draft.badge || ''}
            onChange={(e) => updateDraft('badge', e.target.value)}
            className="w-full rounded-lg border border-cream-200 bg-cream-50 pl-7 pr-3 py-2 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </div>
      </div>

      {/* Icon picker */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cream-800/50">İkon</p>
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
                  active
                    ? 'bg-brand-500 text-white shadow'
                    : 'bg-white text-cream-700 ring-1 ring-cream-200 hover:ring-brand-300'
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
            onChange={(e) => {
              setHexInput(e.target.value)
              updateDraft('color', e.target.value)
            }}
            className="h-9 w-12 cursor-pointer rounded border border-cream-200 bg-white p-0.5"
            title="Özel renk"
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
          <button
            type="button"
            onClick={() => {
              if (isHexColor(hexInput)) updateDraft('color', hexInput.trim())
            }}
            className="rounded-lg border border-cream-200 bg-white px-3 py-2 text-xs font-medium text-cream-800"
          >
            Uygula
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-cream-100 bg-cream-50 px-4 py-2.5">
        <span className="text-sm font-medium text-cream-800">Plan Aktif</span>
        <button
          type="button"
          onClick={() => updateDraft('isActive', !draft.isActive)}
          className="transition"
        >
          {draft.isActive
            ? <ToggleRight className="h-6 w-6 text-sage-500" />
            : <ToggleLeft className="h-6 w-6 text-cream-300" />}
        </button>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-cream-800/50">Özellikler</p>
          <button
            type="button"
            onClick={addFeature}
            className="flex items-center gap-1 rounded-lg border border-dashed border-cream-300 px-2.5 py-1 text-xs text-cream-600 hover:bg-cream-50"
          >
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
              <input
                type="text"
                value={f.text}
                onChange={(e) => updateFeatureText(i, e.target.value)}
                className="flex-1 rounded-lg border border-cream-200 bg-cream-50 px-2.5 py-1.5 text-sm focus:border-brand-300 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removeFeature(i)}
                className="text-cream-300 hover:text-red-400 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowLimits((v) => !v)}
          className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-cream-800/50 hover:text-cream-800 transition"
        >
          Sınırlar (opsiyonel)
          {showLimits ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <AnimatePresence>
          {showLimits && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 space-y-2"
            >
              {(draft.limits || []).map((l, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={l}
                    onChange={(e) => updateLimit(i, e.target.value)}
                    className="flex-1 rounded-lg border border-cream-200 bg-cream-50 px-2.5 py-1.5 text-sm focus:border-brand-300 focus:outline-none"
                  />
                  <button type="button" onClick={() => removeLimit(i)} className="text-cream-300 hover:text-red-400 transition">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addLimit}
                className="flex items-center gap-1 text-xs text-cream-500 hover:text-cream-800"
              >
                <Plus className="h-3.5 w-3.5" /> Sınır ekle
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
