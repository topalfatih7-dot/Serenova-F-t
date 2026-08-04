import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  HeartPulse, Stethoscope, Dumbbell, Activity, Venus, Mars, Apple, MoonStar, Clock3,
  CheckCircle2, Circle, Sparkles, ArrowRight, Loader2, Lock, RefreshCw,
} from 'lucide-react'
import HealthTestConsentForm from './HealthTestConsentForm'
import HealthProfileGateForm from './HealthProfileGateForm'
import HealthScoreCard from '../dashboard/HealthScoreCard'
import MemberHealthBrief from '../dashboard/MemberHealthBrief'
import {
  getHealthTestLockState,
  isHealthAnalysisStale,
  resolveMemberBrief,
} from '../../services/healthScoreAnalysis'
import {
  HEALTH_AUDIENCE_META,
  getRemainingHubSections,
} from '../../data/healthTest'
import {
  getCoreHealthTestKeySet,
  getCoreHealthTestProgress,
  isCoreHealthTestComplete,
} from '../../data/coreHealthTest'
import { hasCompleteAnalysisProfile } from '../../utils/healthProfile'

function formatLockedUntil(date) {
  if (!date) return ''
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date instanceof Date ? date : new Date(date))
  } catch {
    return ''
  }
}

const ICONS = {
  HeartPulse, Stethoscope, Dumbbell, Activity, Venus, Mars, Apple, MoonStar, Clock3,
  Flower2: Sparkles,
}

const CARD_THEME = {
  general: 'from-brand-500/10 to-brand-600/5 border-brand-200 hover:border-brand-300',
  medical: 'from-rose-500/10 to-rose-600/5 border-rose-200 hover:border-rose-300',
  nutrition: 'from-sage-500/10 to-emerald-600/5 border-sage-200 hover:border-sage-300',
  physical: 'from-amber-500/10 to-orange-600/5 border-amber-200 hover:border-amber-300',
  lifestyle: 'from-sky-500/10 to-blue-600/5 border-sky-200 hover:border-sky-300',
  women: 'from-pink-500/10 to-fuchsia-600/5 border-pink-200 hover:border-pink-300',
  men: 'from-slate-500/10 to-slate-700/5 border-slate-200 hover:border-slate-300',
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
  onConsentSave,
  consentSaving = false,
  profile = null,
  onProfileGateSave,
  profileGateSaving = false,
  analysisReady = false,
  analysisLoading = false,
  analysisStage = null,
  analysis = null,
  analysisHistory = [],
  detailedComplete = false,
  scoresOnly = false,
  onStartCoreAnalysis = null,
  onRetake = null,
  retakeSaving = false,
}) {
  const [localAck, setLocalAck] = useState(!!healthAck)
  const [localDisclaimer, setLocalDisclaimer] = useState(!!disclaimer)
  const [showErrors, setShowErrors] = useState(false)
  const [confirmRetake, setConfirmRetake] = useState(false)

  const profileReady = hasCompleteAnalysisProfile(profile)
  const needsConsent = !healthAck || !disclaimer
  const coreKeys = getCoreHealthTestKeySet(gender)
  const coreProgress = getCoreHealthTestProgress(healthTest, gender)
  const coreComplete = isCoreHealthTestComplete(healthTest, gender)
  const sections = getRemainingHubSections(gender, packageConfig, healthTest, coreKeys)
  const lockState = getHealthTestLockState({
    healthAnalysis: analysis,
    detailedComplete,
    optionalCompletedAt: healthTest?.optionalCompletedAt || null,
  })
  const analysisStale = Boolean(
    analysisReady && profile && isHealthAnalysisStale(analysis, profile),
  )
  /** Süre dolmuş ama henüz sıfırlanmamış cevaplar → retake butonu */
  const awaitingRetake = Boolean(lockState.canRetake && coreComplete && analysisReady)

  const remainingTotal = sections.reduce((n, s) => n + (s.progress.requiredTotal || 0), 0)
  const remainingAnswered = sections.reduce((n, s) => n + (s.progress.requiredAnswered || 0), 0)
  const remainingSectionsDone = sections.filter((s) => s.progress.complete).length
  const remainingPercent = remainingTotal
    ? Math.round((remainingAnswered / remainingTotal) * 100)
    : (detailedComplete ? 100 : 0)

  const handleConsentSubmit = () => {
    if (!localAck || !localDisclaimer) {
      setShowErrors(true)
      return
    }
    onConsentSave?.({ healthAck: localAck, disclaimer: localDisclaimer })
  }

  if (!profileReady) {
    return (
      <div className="w-full space-y-5">
        <HealthProfileGateForm
          profile={profile}
          onSave={onProfileGateSave}
          saving={profileGateSaving}
        />
      </div>
    )
  }

  if (needsConsent) {
    return (
      <div className="w-full space-y-5">
        <HealthTestConsentForm
          healthAck={localAck}
          disclaimer={localDisclaimer}
          onHealthAckChange={setLocalAck}
          onDisclaimerChange={setLocalDisclaimer}
          onSubmit={handleConsentSubmit}
          submitting={consentSaving}
          showErrors={showErrors}
        />
      </div>
    )
  }

  if (!coreComplete) {
    return (
      <div className="w-full min-w-0 space-y-6 overflow-x-hidden">
        <div className="rounded-3xl border border-cream-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-cream-800/50">
                1. Aşama
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-cream-900">
                Genel Sağlık Testi
              </p>
              <p className="mt-1 text-sm text-cream-800/60 break-words">
                {coreProgress.total} soruluk temel test — tamamlandığında skorlarınız hazırlanır.
                İsterseniz daha sonra kategori sorularıyla analizi derinleştirebilirsiniz.
              </p>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <span className="font-display text-lg font-bold">{coreProgress.percent}%</span>
            </div>
          </div>
          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-cream-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-sage-500 transition-all duration-500"
              style={{ width: `${coreProgress.percent}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-medium text-cream-800/55">
            {coreProgress.answered} / {coreProgress.total} soru
          </p>
        </div>

        <Link
          to="/health-test/core"
          className="group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-500/10 to-sage-500/5 p-6 shadow-sm transition hover:border-brand-300 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/90 text-brand-600 shadow-sm">
              <HeartPulse className="h-6 w-6" />
            </span>
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ${
              coreProgress.started
                ? 'bg-amber-100 text-amber-800 ring-amber-200'
                : 'bg-brand-100 text-brand-800 ring-brand-200'
            }`}>
              {coreProgress.started ? 'Devam et' : 'Başla'}
            </span>
          </div>
          <h3 className="mt-4 font-display text-xl font-bold text-cream-900 group-hover:text-brand-700">
            Genel Sağlık Testi
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-cream-800/65">
            Genel sağlık, tıbbi geçmiş, beslenme, hareket ve yaşam tarzından seçilmiş temel sorular.
            Kategori seçmeden tek akışta ilerlersiniz.
          </p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
            {coreProgress.started ? 'Kaldığınız yerden devam' : 'Teste başla'}
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>
    )
  }

  const awaitingCoreAnalysis = coreComplete && (!analysisReady || analysisStale)
  const showOptionalGrid = !lockState.fullLock && !awaitingRetake
  const lockedUntilLabel = formatLockedUntil(lockState.lockedUntil)

  return (
    <div className="w-full min-w-0 space-y-6 overflow-x-hidden">
      <div className={`rounded-3xl px-4 py-4 text-sm sm:px-5 ${
        awaitingCoreAnalysis
          ? 'border-2 border-brand-300 bg-gradient-to-br from-brand-50 via-white to-sage-50/40 text-cream-900 shadow-sm'
          : 'border border-sage-200 bg-sage-50/50 text-sage-900'
      }`}>
        <span className="flex items-center gap-2 font-semibold">
          <CheckCircle2 className={`h-4 w-4 shrink-0 ${awaitingCoreAnalysis ? 'text-brand-600' : 'text-sage-600'}`} />
          Genel Sağlık Testi tamamlandı
        </span>
        <p className={`mt-1 text-xs break-words ${awaitingCoreAnalysis ? 'text-cream-800/75' : 'text-sage-800/75'}`}>
          {analysisLoading
            ? 'Analiziniz hazırlanıyor…'
            : analysisStale && analysisReady
              ? 'Cevaplarınız güncellendi. Yeni skorlarınız için analizi başlatın.'
              : analysisReady
                ? (analysisStage === 'detailed' || detailedComplete
                  ? 'Detaylı sağlık analiziniz hazır.'
                  : 'Temel skorlarınız hazır. İsterseniz aşağıdaki opsiyonel kategorileri tamamlayarak daha detaylı analiz alın.')
                : 'Cevaplarınız kaydedildi. Skorlarınızı görmek için analizi başlatın.'}
          {scoresOnly && analysisReady && !analysisStale
            ? ' Uzman raporu paket seçince açılır.'
            : ''}
        </p>
        {awaitingCoreAnalysis && (
          <button
            type="button"
            onClick={() => onStartCoreAnalysis?.()}
            disabled={!onStartCoreAnalysis || analysisLoading}
            className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-sage-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {analysisLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {analysisLoading ? 'Analiz hazırlanıyor…' : 'Analizi Başlat'}
          </button>
        )}
        {scoresOnly && analysisReady && !analysisStale && (
          <Link
            to="/plans"
            className="mt-2 inline-flex text-sm font-semibold text-brand-700 underline-offset-2 hover:underline"
          >
            Plan seç &amp; uzman raporunu aç
          </Link>
        )}
      </div>

      {analysisReady && analysis && (
        <>
          <HealthScoreCard
            analysis={analysis}
            history={analysisHistory}
            loading={analysisLoading}
            complete
            scoresOnly={scoresOnly}
            lockState={lockState}
          />
          <MemberHealthBrief
            brief={resolveMemberBrief(analysis)}
            showPitch={scoresOnly}
          />
        </>
      )}

      {lockState.locked && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/70 px-4 py-4 text-sm text-amber-950 sm:px-5">
          <span className="flex items-center gap-2 font-semibold">
            <Lock className="h-4 w-4 shrink-0 text-amber-700" />
            Cevaplarınız kilitli
          </span>
          <p className="mt-1 text-xs text-amber-900/80 break-words">
            {lockState.daysLeft} gün sonra
            {lockedUntilLabel ? ` (${lockedUntilLabel})` : ''}
            {' '}
            testi yeniden çözebilirsiniz. Bu süre boyunca skorlarınızı görebilirsiniz; sorulara erişim kapalıdır.
          </p>
        </div>
      )}

      {awaitingRetake && (
        <div className="rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-sage-50/40 px-4 py-4 text-sm text-cream-900 shadow-sm sm:px-5">
          <span className="flex items-center gap-2 font-semibold">
            <RefreshCw className="h-4 w-4 shrink-0 text-brand-600" />
            Yeniden çözme hakkınız açıldı
          </span>
          <p className="mt-1 text-xs text-cream-800/75 break-words">
            14 günlük süre doldu. Testi yeniden çözmek önceki cevaplarınızı siler;
            soruları baştan tamamlamanız ve yeni analiz almanız gerekir.
          </p>
          {!confirmRetake ? (
            <button
              type="button"
              onClick={() => setConfirmRetake(true)}
              disabled={!onRetake || retakeSaving}
              className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-sage-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className="h-4 w-4" />
              Testi Yeniden Çöz
            </button>
          ) : (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-medium text-rose-700">
                Önceki cevaplarınız silinecek. Emin misiniz?
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await onRetake?.()
                    setConfirmRetake(false)
                  }}
                  disabled={!onRetake || retakeSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {retakeSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Evet, sıfırla ve baştan çöz
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRetake(false)}
                  disabled={retakeSaving}
                  className="inline-flex items-center justify-center rounded-xl border border-cream-200 bg-white px-4 py-2 text-sm font-semibold text-cream-800 hover:bg-cream-50 disabled:opacity-60"
                >
                  Vazgeç
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showOptionalGrid && !detailedComplete && (
        <div className="rounded-3xl border border-cream-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-cream-800/50">
                2. Aşama — Opsiyonel
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-cream-900">
                {remainingSectionsDone} / {sections.length} kategori
              </p>
              <p className="mt-1 text-sm text-cream-800/60 break-words">
                Kalan soruları istediğiniz sırayla tamamlayın. Yarıda bıraktığınız kategorilere dönebilirsiniz.
                Tümü bitince detaylı analiz üretilir ve cevaplar 14 gün kilitlenir.
              </p>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <span className="font-display text-lg font-bold">{remainingPercent}%</span>
            </div>
          </div>
          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-cream-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-sage-500 transition-all duration-500"
              style={{ width: `${remainingPercent}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-medium text-cream-800/55">
            {remainingAnswered} / {remainingTotal} kalan soru
          </p>
        </div>
      )}

      {detailedComplete && !awaitingRetake && (
        <div className="rounded-2xl border border-sage-200 bg-sage-50/60 px-4 py-3 text-sm text-sage-900">
          <span className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-sage-600" />
            {analysisStage === 'detailed'
              ? 'Detaylı analiz tamamlandı'
              : 'Tüm opsiyonel sorular tamamlandı'}
          </span>
          <p className="mt-1 text-xs text-sage-800/75 break-words">
            {analysisLoading
              ? 'Detaylı analiz hazırlanıyor…'
              : lockState.locked
                ? 'Cevaplarınız kilitli. Süre dolunca testi yeniden çözebilirsiniz.'
                : 'İstediğiniz zaman testi yeniden çözebilirsiniz.'}
          </p>
        </div>
      )}

      {showOptionalGrid && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {sections.map(({ section, progress }) => {
            const Icon = ICONS[section.icon] || HeartPulse
            const audienceMeta = HEALTH_AUDIENCE_META[section.audience || 'shared']
            const theme = cardTheme(section.id)
            const sectionLocked = Boolean(lockState.fullLock || awaitingRetake)
            const canOpen = !sectionLocked

            let statusLabel = 'Başla'
            let statusClass = 'bg-cream-100 text-cream-800'
            if (sectionLocked) {
              statusLabel = 'Kilitli'
              statusClass = 'bg-amber-100 text-amber-800'
            } else if (progress.complete) {
              statusLabel = 'Tamamlandı'
              statusClass = 'bg-sage-100 text-sage-800'
            } else if (progress.started || progress.requiredAnswered > 0) {
              statusLabel = 'Devam et'
              statusClass = 'bg-amber-100 text-amber-800'
            }

            const progressPercent = progress.complete ? 100 : progress.percent
            const cardClass = `group flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-gradient-to-br p-4 shadow-sm transition ${theme} ${
              canOpen ? 'hover:shadow-md' : 'cursor-not-allowed opacity-70'
            }`

            const cardBody = (
              <>
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-cream-900 shadow-sm">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ${audienceMeta.chip}`}>
                    {audienceMeta.label}
                  </span>
                </div>

                <h3 className={`mt-3 min-w-0 break-words font-display text-base font-bold text-cream-900 ${canOpen ? 'group-hover:text-brand-700' : ''}`}>
                  {section.title}
                </h3>
                <p className="mt-1 min-w-0 flex-1 break-words text-xs leading-relaxed text-cream-800/60">
                  {section.subtitle}
                </p>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-cream-800/40">
                  Opsiyonel
                </p>

                <div className="mt-3 space-y-2">
                  <div className="flex min-w-0 items-center justify-between gap-2 text-xs font-medium text-cream-800/55">
                    <span className="min-w-0 truncate">
                      {progress.complete
                        ? `${progress.requiredTotal} / ${progress.requiredTotal} soru`
                        : `${progress.requiredAnswered} / ${progress.requiredTotal} soru`}
                    </span>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusClass}`}>
                      {sectionLocked
                        ? <Lock className="h-3 w-3" />
                        : progress.complete
                          ? <CheckCircle2 className="h-3 w-3" />
                          : progress.started
                            ? <Circle className="h-3 w-3" />
                            : null}
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
              </>
            )

            if (!canOpen) {
              return (
                <div key={section.id} className={cardClass} aria-disabled="true">
                  {cardBody}
                </div>
              )
            }

            return (
              <Link
                key={section.id}
                to={`/health-test/${section.id}`}
                className={cardClass}
              >
                {cardBody}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
