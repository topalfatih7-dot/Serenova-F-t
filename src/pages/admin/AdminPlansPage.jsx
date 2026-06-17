import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, X, Edit3, Save, Plus, Trash2, Crown, Sparkles, Star, Award,
  Package, ChevronDown, ChevronUp, DollarSign, Tag, ToggleLeft, ToggleRight,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'

const PLAN_COLORS = [
  { id: 'sage',  label: 'Yeşil (Ücretsiz)', cls: 'bg-sage-500' },
  { id: 'slate', label: 'Gri (Gümüş)',      cls: 'bg-slate-500' },
  { id: 'gold',  label: 'Altın (Altın)',    cls: 'bg-amber-500' },
  { id: 'brand', label: 'Marka (Platinum)', cls: 'bg-brand-500' },
]

function planIcon(id) {
  if (id === 'free')     return <Sparkles className="h-5 w-5 text-sage-500" />
  if (id === 'gumus')    return <Star className="h-5 w-5 text-slate-400" />
  if (id === 'altin')    return <Crown className="h-5 w-5 text-amber-500" />
  if (id === 'platinum') return <Award className="h-5 w-5 text-brand-500" />
  return <Package className="h-5 w-5 text-cream-500" />
}

function planHeaderColor(color) {
  if (color === 'sage')  return 'from-sage-50 to-sage-100/60 border-sage-200'
  if (color === 'slate') return 'from-slate-50 to-slate-100/60 border-slate-200'
  if (color === 'gold')  return 'from-amber-50 to-amber-100/60 border-amber-200'
  if (color === 'brand') return 'from-brand-50 to-brand-100/60 border-brand-200'
  return 'from-cream-50 to-cream-100 border-cream-200'
}

function planBadgeColor(color) {
  if (color === 'sage')  return 'bg-sage-500 text-white'
  if (color === 'slate') return 'bg-slate-500 text-white'
  if (color === 'gold')  return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white'
  if (color === 'brand') return 'bg-gradient-to-r from-brand-500 to-brand-700 text-white'
  return 'bg-cream-700 text-white'
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
      features: plan.features.map((f) => ({ ...f })),
      limits: [...(plan.limits || [])],
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream-900">Paket Yönetimi</h1>
        <p className="mt-1 text-sm text-cream-800/60">
          Üyelik paketlerini fiyat, özellik ve sınırlarıyla admin panelinden düzenleyin.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-2">
        {(plans || []).map((plan) => {
          const isEditing = editingId === plan.id
          const d = isEditing ? draft : plan

          return (
            <motion.div
              key={plan.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-sm"
            >
              {/* Header */}
              <div className={`flex items-center justify-between border-b bg-gradient-to-r px-5 py-4 ${planHeaderColor(d.color)}`}>
                <div className="flex items-center gap-3">
                  {planIcon(plan.id)}
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
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${planBadgeColor(d.color)}`}>
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

              {/* Body */}
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
                  />
                ) : (
                  <ViewMode plan={plan} />
                )}
              </div>

              {/* Edit Actions */}
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

      {/* Info box */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          <strong>Not:</strong> Paket değişiklikleri anında yayına girer. Mevcut üyelerin paket konfigürasyonları etkilenmez — yalnızca yeni kayıtlar ve landing sayfasındaki gösterim güncellenir.
        </p>
      </div>
    </div>
  )
}

function ViewMode({ plan }) {
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

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cream-800/50">Özellikler</p>
        <ul className="space-y-1.5">
          {plan.features.map((f, i) => (
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

function EditForm({ draft, updateDraft, toggleFeature, updateFeatureText, addFeature, removeFeature, updateLimit, addLimit, removeLimit }) {
  const [showLimits, setShowLimits] = useState(false)

  return (
    <div className="space-y-5">
      {/* Fiyat & Dönem */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-cream-800/60">Fiyat (₺/ay)</label>
          <div className="relative">
            <DollarSign className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-cream-400" />
            <input
              type="number"
              min={0}
              value={draft.price}
              onChange={(e) => updateDraft('price', parseInt(e.target.value) || 0)}
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

      {/* Badge & Renk */}
      <div className="grid grid-cols-2 gap-3">
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
        <div>
          <label className="mb-1 block text-xs font-semibold text-cream-800/60">Renk Teması</label>
          <select
            value={draft.color}
            onChange={(e) => updateDraft('color', e.target.value)}
            className="w-full rounded-lg border border-cream-200 bg-cream-50 px-3 py-2 text-sm focus:border-brand-300 focus:outline-none"
          >
            {PLAN_COLORS.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Aktif/Pasif */}
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

      {/* Özellikler */}
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
          {draft.features.map((f, i) => (
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

      {/* Sınırlar (opsiyonel) */}
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
