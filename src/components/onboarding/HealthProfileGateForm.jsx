import { useState } from 'react'
import { CalendarDays, Loader2, Ruler, Scale, UserRound } from 'lucide-react'
import FormField from '../ui/FormField'
import BirthDateField from '../ui/BirthDateField'
import GenderSelect from '../ui/GenderSelect'
import { isValidMemberGender } from '../../data/genders'
import { ageFromBirthDate, birthDateError } from '../../utils/birthDate'
import { getMissingAnalysisProfileFields } from '../../utils/healthProfile'

const LIMITS = {
  weight: { min: 30, max: 300 },
  height: { min: 120, max: 250 },
}

function rangeError(field, value) {
  if (value === '' || value == null) return 'Zorunlu'
  const num = Number(value)
  const { min, max } = LIMITS[field]
  if (Number.isNaN(num) || num < min || num > max) return `${min}–${max} arası olmalı`
  return ''
}

/**
 * Sağlık testi öncesi boy/kilo/doğum tarihi (+ eksikse cinsiyet) zorunlu formu.
 * Profil sayfasına yönlendirmeden satır içi doldurulur.
 */
export default function HealthProfileGateForm({
  profile,
  onSave,
  saving = false,
}) {
  const missing = getMissingAnalysisProfileFields(profile)
  const needsGender = missing.some((f) => f.key === 'gender')

  const [form, setForm] = useState(() => ({
    birthDate: profile?.birthDate || '',
    weight: profile?.weight || '',
    height: profile?.height || '',
    gender: profile?.gender || '',
  }))
  const [showErrors, setShowErrors] = useState(false)

  const errors = {
    birthDate: birthDateError(form.birthDate) || (!form.birthDate ? 'Zorunlu' : ''),
    weight: rangeError('weight', form.weight),
    height: rangeError('height', form.height),
    gender: needsGender && !isValidMemberGender(form.gender) ? 'Cinsiyet seçin' : '',
  }
  const hasErrors = Boolean(errors.birthDate || errors.weight || errors.height || errors.gender)

  const handleSubmit = async (e) => {
    e?.preventDefault?.()
    if (hasErrors) {
      setShowErrors(true)
      return
    }
    const patch = {
      birthDate: form.birthDate,
      weight: form.weight,
      height: form.height,
      age: form.birthDate ? ageFromBirthDate(form.birthDate) : '',
    }
    if (needsGender) patch.gender = form.gender
    await onSave?.(patch)
  }

  return (
    <div className="w-full space-y-5">
      <aside
        className="relative overflow-hidden rounded-3xl border-2 border-amber-300/90 bg-gradient-to-br from-amber-50 via-white to-brand-50/40 shadow-md ring-1 ring-amber-200/80"
        role="status"
      >
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-amber-500 to-brand-500" aria-hidden />
        <div className="flex flex-col gap-3 p-5 pl-6 sm:flex-row sm:items-start sm:gap-4 sm:p-6 sm:pl-7">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-sm ring-1 ring-amber-200">
            <Scale className="h-6 w-6" strokeWidth={2.25} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-800/80">
              Başlamadan önce
            </p>
            <h2 className="mt-1 font-display text-lg font-bold leading-snug text-cream-900 sm:text-xl">
              Boy, kilo ve yaş bilgileriniz gerekli
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-cream-800/85">
              Sağlık testine ve uzman analizine başlamadan önce bu bilgileri girmeniz zorunludur.
              Analiz sonuçlarınız bu ölçümlere göre kişiselleştirilir.
            </p>
            {missing.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {missing.map((field) => (
                  <li
                    key={field.key}
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-amber-950 shadow-sm"
                  >
                    {field.key === 'birthDate' && <CalendarDays className="h-3.5 w-3.5 text-amber-600" aria-hidden />}
                    {field.key === 'weight' && <Scale className="h-3.5 w-3.5 text-amber-600" aria-hidden />}
                    {field.key === 'height' && <Ruler className="h-3.5 w-3.5 text-amber-600" aria-hidden />}
                    {field.key === 'gender' && <UserRound className="h-3.5 w-3.5 text-amber-600" aria-hidden />}
                    {field.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </aside>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-cream-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <BirthDateField
            value={form.birthDate}
            onChange={(birthDate) => setForm((f) => ({ ...f, birthDate }))}
            error={showErrors ? errors.birthDate : ''}
          />
          {needsGender ? (
            <GenderSelect
              value={form.gender}
              onChange={(gender) => setForm((f) => ({ ...f, gender }))}
              error={showErrors ? errors.gender : ''}
              hint="Kadın veya Erkek seçin."
            />
          ) : (
            <div className="hidden sm:block" aria-hidden />
          )}
          <FormField
            label="Kilo (kg)"
            icon={Scale}
            type="number"
            value={form.weight}
            onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
            error={showErrors ? errors.weight : ''}
            emphasis
            className="border-amber-200/70 bg-gradient-to-br from-white to-amber-50/40"
          />
          <FormField
            label="Boy (cm)"
            icon={Ruler}
            type="number"
            value={form.height}
            onChange={(e) => setForm((f) => ({ ...f, height: e.target.value }))}
            error={showErrors ? errors.height : ''}
            emphasis
            className="border-sky-200/70 bg-gradient-to-br from-white to-sky-50/40"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-sage-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-200/50 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? 'Kaydediliyor…' : 'Kaydet ve devam et'}
        </button>
      </form>
    </div>
  )
}
