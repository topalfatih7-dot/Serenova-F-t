import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  HeartPulse, Stethoscope, Dumbbell, Apple, CheckCircle2, Loader2, Save, AlertCircle,
} from 'lucide-react'
import HealthTestStep from '../onboarding/HealthTestStep'
import {
  emptyHealthTest,
  getApplicableSections,
  getSectionProgress,
  isHealthTestComplete,
  isQuestionFullyAnswered,
  migrateLegacyHealthTestKeys,
} from '../../data/healthTest'

const SECTION_ICONS = {
  Stethoscope,
  Dumbbell,
  Apple,
  HeartPulse,
  Activity: HeartPulse,
  Moon: HeartPulse,
  Bone: HeartPulse,
  Clock3: HeartPulse,
}

const SECTION_THEME = {
  safety: {
    chip: 'bg-rose-50 text-rose-800 ring-rose-200',
    active: 'bg-rose-500 text-white ring-rose-500',
    bar: 'bg-rose-500',
    soft: 'border-rose-100 bg-rose-50/40',
  },
  movement: {
    chip: 'bg-amber-50 text-amber-800 ring-amber-200',
    active: 'bg-amber-500 text-white ring-amber-500',
    bar: 'bg-amber-500',
    soft: 'border-amber-100 bg-amber-50/40',
  },
  nutrition: {
    chip: 'bg-sage-50 text-sage-800 ring-sage-200',
    active: 'bg-sage-500 text-white ring-sage-500',
    bar: 'bg-sage-500',
    soft: 'border-sage-100 bg-sage-50/40',
  },
  context: {
    chip: 'bg-brand-50 text-brand-800 ring-brand-200',
    active: 'bg-brand-500 text-white ring-brand-500',
    bar: 'bg-brand-500',
    soft: 'border-brand-100 bg-brand-50/40',
  },
}

function buildInitial(healthTest, schema) {
  return { ...emptyHealthTest(schema), ...migrateLegacyHealthTestKeys(healthTest || {}) }
}

function countRequiredAnswered(healthTest, sections) {
  let total = 0
  let answered = 0
  sections.forEach((section) => {
    section.questions.forEach((q) => {
      if (!q.required) return
      total += 1
      if (isQuestionFullyAnswered(q, healthTest)) answered += 1
    })
  })
  return { answered, total }
}

export default function AdminHealthTestEditor({
  member,
  onSave,
  saving = false,
  onDirtyChange,
  healthTestSchema = null,
}) {
  const sections = useMemo(
    () => getApplicableSections(member?.gender, member?.packageConfig, healthTestSchema),
    [member?.gender, member?.packageConfig, healthTestSchema],
  )

  const [healthTest, setHealthTest] = useState(() => buildInitial(member?.healthTest, healthTestSchema))
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id || 'safety')
  const [showErrors, setShowErrors] = useState(false)
  const [baseline, setBaseline] = useState(() => JSON.stringify(buildInitial(member?.healthTest, healthTestSchema)))

  useEffect(() => {
    const next = buildInitial(member?.healthTest, healthTestSchema)
    setHealthTest(next)
    setBaseline(JSON.stringify(next))
    setShowErrors(false)
    setActiveSectionId(sections[0]?.id || 'safety')
  }, [member?.id, healthTestSchema, sections])

  const dirty = useMemo(() => JSON.stringify(healthTest) !== baseline, [healthTest, baseline])

  useEffect(() => {
    onDirtyChange?.(dirty)
  }, [dirty, onDirtyChange])

  const updateHealthTest = useCallback((patch) => {
    setHealthTest((prev) => ({ ...prev, ...patch }))
  }, [])

  const activeSection = sections.find((s) => s.id === activeSectionId) || sections[0]
  const requiredStats = countRequiredAnswered(healthTest, sections)
  const complete = isHealthTestComplete(healthTest, member?.gender, member?.packageConfig, healthTestSchema)

  const sectionNav = sections.map((section) => {
    const progress = getSectionProgress(section, healthTest, healthTestSchema)
    return { section, progress }
  })

  const handleSave = async () => {
    const allOk = sections.every((section) =>
      section.questions.every((q) => isQuestionFullyAnswered(q, healthTest)),
    )
    if (!allOk) {
      setShowErrors(true)
      const firstGap = sections.find((section) =>
        section.questions.some((q) => !isQuestionFullyAnswered(q, healthTest)),
      )
      if (firstGap) setActiveSectionId(firstGap.id)
      return
    }
    const payload = migrateLegacyHealthTestKeys(healthTest)
    await onSave?.(payload)
    setBaseline(JSON.stringify(payload))
    setShowErrors(false)
  }

  const mappedQuestions = (activeSection?.questions || []).map((q) => ({
    ...q,
    sectionId: activeSection.id,
    sectionTitle: activeSection.title,
    sectionIcon: activeSection.icon,
    audience: activeSection.audience || 'shared',
  }))

  return (
    <div className="space-y-4 pb-24 md:pb-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cream-200 bg-white px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-cream-900">Sağlık testi düzenleme</p>
          <p className="text-xs text-cream-800/55">
            {requiredStats.total} zorunlu soru · {requiredStats.answered}/{requiredStats.total} dolu
            {complete ? ' · Tamamlandı' : ''}
            {dirty ? ' · Kaydedilmemiş değişiklikler' : ''}
          </p>
        </div>
        <div className="h-2 w-full max-w-[12rem] overflow-hidden rounded-full bg-cream-100 sm:w-48">
          <div
            className={`h-full rounded-full transition-all ${complete ? 'bg-sage-500' : 'bg-brand-500'}`}
            style={{
              width: `${requiredStats.total ? Math.round((requiredStats.answered / requiredStats.total) * 100) : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Mobil: yatay chip nav */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:hidden">
        {sectionNav.map(({ section, progress }) => {
          const theme = SECTION_THEME[section.id] || SECTION_THEME.context
          const Icon = SECTION_ICONS[section.icon] || HeartPulse
          const active = section.id === activeSectionId
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSectionId(section.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-xs font-bold ring-1 transition ${
                active ? theme.active : theme.chip
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {section.title}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? 'bg-white/20' : 'bg-white/80'}`}>
                {progress.requiredAnswered}/{progress.requiredTotal}
              </span>
            </button>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Desktop: dikey nav */}
        <aside className="hidden md:block">
          <nav className="sticky top-4 space-y-2 rounded-2xl border border-cream-200 bg-white p-3">
            <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-cream-800/45">
              Kategoriler
            </p>
            {sectionNav.map(({ section, progress }) => {
              const theme = SECTION_THEME[section.id] || SECTION_THEME.context
              const Icon = SECTION_ICONS[section.icon] || HeartPulse
              const active = section.id === activeSectionId
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSectionId(section.id)}
                  className={`flex w-full flex-col gap-2 rounded-xl px-3 py-3 text-left transition ${
                    active ? `${theme.soft} ring-1 ring-inset` : 'hover:bg-cream-50'
                  } ${active ? (section.id === 'safety' ? 'ring-rose-200' : section.id === 'movement' ? 'ring-amber-200' : section.id === 'nutrition' ? 'ring-sage-200' : 'ring-brand-200') : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${active ? theme.active : theme.chip}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-cream-900">{section.title}</p>
                      <p className="text-[11px] text-cream-800/50">
                        {progress.complete ? 'Tamam' : `${progress.requiredAnswered}/${progress.requiredTotal}`}
                      </p>
                    </div>
                    {progress.complete && <CheckCircle2 className="h-4 w-4 shrink-0 text-sage-600" />}
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-cream-100">
                    <div
                      className={`h-full rounded-full ${theme.bar}`}
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                </button>
              )
            })}
          </nav>
        </aside>

        <div className="space-y-4">
          {activeSection && (
            <div className={`rounded-2xl border px-4 py-3 ${SECTION_THEME[activeSection.id]?.soft || SECTION_THEME.context.soft}`}>
              <p className="font-display text-lg font-bold text-cream-900">{activeSection.title}</p>
              <p className="text-xs text-cream-800/55">{activeSection.subtitle}</p>
            </div>
          )}

          <div className="space-y-3">
            {mappedQuestions.map((q, idx) => (
              <HealthTestStep
                key={q.key}
                variant="embedded"
                question={q}
                questionIndex={idx}
                totalQuestions={mappedQuestions.length}
                sectionTitle={activeSection?.title}
                healthTest={healthTest}
                updateHealthTest={updateHealthTest}
                showErrors={showErrors}
              />
            ))}
          </div>

          {showErrors && !complete && (
            <p className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-900">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Eksik zorunlu sorular var. Lütfen tüm kategorileri kontrol edin.
            </p>
          )}

          {/* Desktop kaydet */}
          <div className="hidden items-center justify-between gap-3 rounded-2xl border border-cream-200 bg-white px-4 py-3 md:flex">
            <p className="text-xs text-cream-800/55">
              {dirty ? 'Değişiklikler henüz kaydedilmedi.' : 'Tüm değişiklikler kaydedildi.'}
            </p>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !dirty}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Kaydet
            </button>
          </div>
        </div>
      </div>

      {/* Mobil sticky kaydet */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-cream-900">
              {requiredStats.answered}/{requiredStats.total} zorunlu
            </p>
            <p className="truncate text-[11px] text-cream-800/50">
              {dirty ? 'Kaydedilmedi' : 'Güncel'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !dirty}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Kaydet
          </button>
        </div>
      </div>
    </div>
  )
}

export function confirmLeaveHealthTestEditor(dirty) {
  if (!dirty) return true
  return window.confirm('Kaydedilmemiş değişiklikler var. Çıkmak istiyor musunuz?')
}
