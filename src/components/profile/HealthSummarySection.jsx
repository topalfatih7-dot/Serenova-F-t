import { useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, Scale, Ruler, RulerDimensionLine, Gauge, Check } from 'lucide-react'
import FormField from '../ui/FormField'
import Modal from '../ui/Modal'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { calculateBMI } from '../../services/health'
import { syncMemberHealthAssets } from '../../services/memberHealthSync'

const LIMITS = {
  weight: { min: 30, max: 300 },
  height: { min: 120, max: 250 },
  waist: { min: 40, max: 200 },
}

function rangeError(field, value) {
  if (value === '' || value == null) return ''
  const num = Number(value)
  const { min, max } = LIMITS[field]
  if (Number.isNaN(num) || num < min || num > max) return `${min}–${max} arası olmalı`
  return ''
}

function MetricCard({ icon: Icon, value, label, iconClass }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-orange-100/80 bg-white px-3 py-4 text-center shadow-sm sm:px-4">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 ${iconClass}`}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-2 font-display text-xl font-bold text-cream-900 sm:text-2xl">{value}</p>
      <p className="mt-0.5 text-[11px] font-medium text-cream-800/50 sm:text-xs">{label}</p>
    </div>
  )
}

export default function HealthSummarySection({ user }) {
  const { updateProfile, createProgram, exercises, myPrograms } = useApp()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    weight: user.weight || '',
    height: user.height || '',
    waist: user.waist || '',
  })

  const errors = {
    weight: rangeError('weight', form.weight),
    height: rangeError('height', form.height),
    waist: rangeError('waist', form.waist),
  }

  const bmi = calculateBMI(user.weight, user.height)

  const openEditor = () => {
    setForm({
      weight: user.weight || '',
      height: user.height || '',
      waist: user.waist || '',
    })
    setOpen(true)
  }

  const handleSave = async () => {
    if (errors.weight || errors.height || errors.waist) {
      toast('Lütfen geçerli ölçüler girin', 'warning')
      return
    }
    setSaving(true)
    try {
      const patch = {
        weight: form.weight,
        height: form.height,
        waist: form.waist,
      }
      await updateProfile(patch)
      const merged = { ...user, ...patch }
      const result = await syncMemberHealthAssets({
        user: merged,
        exercises,
        updateProfile,
        createProgram,
        myPrograms,
      })
      setOpen(false)
      toast(
        result.synced
          ? 'Ölçüleriniz güncellendi ve programlarınız yenilendi.'
          : 'Ölçüleriniz kaydedildi.',
        'success',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="overflow-hidden rounded-3xl border border-orange-100/80 bg-gradient-to-br from-orange-50/60 via-white to-amber-50/40 shadow-md shadow-orange-100/40"
      >
        <div className="flex flex-col gap-4 border-b border-orange-100/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-orange-200/50">
              <Activity className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-cream-900">Sağlık Özeti</h2>
              <p className="text-sm text-cream-800/55">Vücut ölçülerinizi takip edin</p>
            </div>
          </div>
          <button
            type="button"
            onClick={openEditor}
            className="shrink-0 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-200/50 transition hover:brightness-105"
          >
            Ölçüleri Güncelle
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 sm:gap-4 sm:p-6">
          <MetricCard
            icon={Scale}
            value={user.weight ? `${user.weight} kg` : '—'}
            label="Kilo"
            iconClass="text-orange-600"
          />
          <MetricCard
            icon={Ruler}
            value={user.height ? `${user.height} cm` : '—'}
            label="Boy"
            iconClass="text-amber-600"
          />
          <MetricCard
            icon={RulerDimensionLine}
            value={user.waist ? `${user.waist} cm` : '—'}
            label="Bel çevresi"
            iconClass="text-orange-500"
          />
          <MetricCard
            icon={Gauge}
            value={bmi != null ? String(bmi) : '—'}
            label="VKİ"
            iconClass="text-rose-500"
          />
        </div>
      </motion.section>

      <Modal open={open} onClose={() => !saving && setOpen(false)} title="Vücut Ölçüleri" size="sm">
        <p className="mb-4 text-sm text-cream-800/60">
          Kilo, boy ve bel çevrenizi güncelleyin. VKİ otomatik hesaplanır.
        </p>
        <div className="space-y-3">
          <FormField
            label="Kilo (kg)"
            icon={Scale}
            type="number"
            value={form.weight}
            onChange={(e) => setForm({ ...form, weight: e.target.value })}
            error={errors.weight}
          />
          <FormField
            label="Boy (cm)"
            icon={Ruler}
            type="number"
            value={form.height}
            onChange={(e) => setForm({ ...form, height: e.target.value })}
            error={errors.height}
          />
          <FormField
            label="Bel çevresi (cm)"
            icon={RulerDimensionLine}
            type="number"
            value={form.waist}
            onChange={(e) => setForm({ ...form, waist: e.target.value })}
            error={errors.waist}
          />
          {form.weight && form.height && (
            <p className="rounded-xl bg-orange-50 px-3 py-2 text-sm text-orange-800">
              Tahmini VKİ: <strong>{calculateBMI(form.weight, form.height) ?? '—'}</strong>
            </p>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-sm font-semibold text-white hover:brightness-105 disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </Modal>
    </>
  )
}
