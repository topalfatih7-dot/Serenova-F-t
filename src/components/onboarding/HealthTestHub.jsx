import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  HeartPulse, Stethoscope, Dumbbell, Activity, Venus, Mars, Apple, Moon, Clock3,
  CheckCircle2, Circle, ArrowRight, Sparkles,
} from 'lucide-react'
import HealthTestConsentForm from './HealthTestConsentForm'
import {
  HEALTH_AUDIENCE_META,
  getHealthTestHubSections,
  getOverallHealthTestProgress,
  isHealthTestComplete,
} from '../../data/healthTest'

const ICONS = {
  HeartPulse, Stethoscope, Dumbbell, Activity, Venus, Mars, Apple, Moon, Clock3,
  Flower2: Sparkles,
}

const CARD_THEME = {
  general: 'from-brand-500/10 to-brand-600/5 border-brand-200 hover:border-brand-300',
  medical: 'from-rose-500/10 to-rose-600/5 border-rose-200 hover:border-rose-300',
  physical: 'from-amber-500/10 to-orange-600/5 border-amber-200 hover:border-amber-300',
  lifestyle: 'from-sky-500/10 to-blue-600/5 border-sky-200 hover:border-sky-300',
  women: 'from-pink-500/10 to-fuchsia-600/5 border-pink-200 hover:border-pink-300',
  men: 'from-slate-500/10 to-slate-700/5 border-slate-200 hover:border-slate-300',
  diet_reason: 'from-sage-500/10 to-emerald-600/5 border-sage-200 hover:border-sage-300',
  diet_health: 'from-rose-500/10 to-rose-600/5 border-rose-200 hover:border-rose-300',
  diet_lifestyle: 'from-sky-500/10 to-blue-600/5 border-sky-200 hover:border-sky-300',
  diet_activity: 'from-amber-500/10 to-orange-600/5 border-amber-200 hover:border-amber-300',
  diet_nutrition: 'from-sage-500/10 to-emerald-600/5 border-sage-200 hover:border-sage-300',
  diet_women: 'from-pink-500/10 to-fuchsia-600/5 border-pink-200 hover:border-pink-300',
  diet_extra: 'from-brand-500/10 to-brand-600/5 border-brand-200 hover:border-brand-300',
}

function cardTheme(id) {
  return CARD_THEME[id] || CARD_THEME.general
}

export default function HealthTestHub({
  gender,
  packageConfig,
  healthTest,
  healthAck,
  disclaimer,
  healthAnalysis = null,
  onConsentSave,
  consentSaving = false,
}) {
  const [localAck, setLocalAck] = useState(!!healthAck)
  const [localDisclaimer, setLocalDisclaimer] = useState(!!disclaimer)
  const [showErrors, setShowErrors] = useState(false)

  const sections = getHealthTestHubSections(gender, packageConfig, healthTest)
  const overall = getOverallHealthTestProgress(healthTest, gender, packageConfig)
  const allSectionsDone = sections.every(({ progress }) => progress.complete)
  const needsConsent = !healthAck || !disclaimer
  const fullyComplete = isHealthTestComplete(healthTest, gender, packageConfig)
    && healthAck && disclaimer
  const needsSync = allSectionsDone && healthAck && disclaimer && !healthAnalysis

  const handleConsentSubmit = () => {
    if (!localAck || !localDisclaimer) {
      setShowErrors(true)
      return
    }
    onConsentSave?.({ healthAck: localAck, disclaimer: localDisclaimer })
  }

  if (needsConsent) {
    return (
      <HealthTestConsentForm
        healthAck={localAck}
        disclaimer={localDisclaimer}
        onHealthAckChange={setLocalAck}
        onDisclaimerChange={setLocalDisclaimer}
        onSubmit={handleConsentSubmit}
        submitting={consentSaving}
        showErrors={showErrors}
      />
    )
  }

  return (
    <div className="w-full space-y-6">
      <div className="rounded-3xl border border-cream-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-cream-800/50">Toplam ilerleme</p>
            <p className="mt-1 font-display text-2xl font-bold text-cream-900">
              {overall.completed} / {overall.total} test
            </p>
            <p className="mt-1 text-sm text-cream-800/60">
              Her kategoriyi ayrı ayrı tamamlayın — istediğiniz sırayla ilerleyebilirsiniz.
            </p>
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <span className="font-display text-lg font-bold">{overall.percent}%</span>
          </div>
        </div>
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-cream-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-sage-500 transition-all duration-500"
            style={{ width: `${overall.percent}%` }}
          />
        </div>
      </div>

      {needsSync && (
        <Link
          to="/health-test/finish"
          className="flex items-center justify-between gap-4 rounded-2xl border border-brand-300 bg-gradient-to-r from-brand-50 to-sage-50 p-4 shadow-sm transition hover:border-brand-400 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-cream-900">Testler tamam — profili kaydedin</p>
              <p className="text-sm text-cream-800/65">Kişisel programlarınızı hazırlamak için son adıma geçin.</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-brand-600" />
        </Link>
      )}

      {fullyComplete && healthAnalysis && (
        <div className="rounded-2xl border border-sage-200 bg-sage-50/60 px-4 py-3 text-sm text-sage-900">
          <span className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-4 w-4 text-sage-600" />
            Sağlık profiliniz güncel
          </span>
          <p className="mt-1 text-xs text-sage-800/75">İstediğiniz kategoriyi tekrar açıp cevaplarınızı güncelleyebilirsiniz.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
        {sections.map(({ section, progress }) => {
          const Icon = ICONS[section.icon] || HeartPulse
          const audienceMeta = HEALTH_AUDIENCE_META[section.audience || 'shared']
          const theme = cardTheme(section.id)

          let statusLabel = 'Başla'
          let statusClass = 'bg-cream-100 text-cream-800'
          if (progress.complete) {
            statusLabel = 'Tamamlandı'
            statusClass = 'bg-sage-100 text-sage-800'
          } else if (progress.started || progress.requiredAnswered > 0) {
            statusLabel = 'Devam et'
            statusClass = 'bg-amber-100 text-amber-800'
          }

          const progressPercent = progress.complete
            ? 100
            : progress.percent

          return (
            <Link
              key={section.id}
              to={`/health-test/${section.id}`}
              className={`group flex flex-col rounded-2xl border bg-gradient-to-br p-4 shadow-sm transition hover:shadow-md ${theme}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-cream-900 shadow-sm">
                  <Icon className="h-5 w-5" />
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ${audienceMeta.chip}`}>
                  {audienceMeta.label}
                </span>
              </div>

              <h3 className="mt-3 font-display text-base font-bold text-cream-900 group-hover:text-brand-700">
                {section.title}
              </h3>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-cream-800/60">{section.subtitle}</p>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-cream-800/55">
                  <span>
                    {progress.complete
                      ? `${progress.requiredTotal} / ${progress.requiredTotal} soru`
                      : `${progress.requiredAnswered} / ${progress.requiredTotal} soru`}
                  </span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusClass}`}>
                    {progress.complete ? <CheckCircle2 className="h-3 w-3" /> : progress.started ? <Circle className="h-3 w-3" /> : null}
                    {statusLabel}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/60">
                  <div
                    className={`h-full rounded-full transition-all ${progress.complete ? 'bg-sage-500' : 'bg-brand-500'}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
