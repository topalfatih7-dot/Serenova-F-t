import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import HealthTestStep from './HealthTestStep'
import HealthTestConsentForm from './HealthTestConsentForm'
import {
  EMPTY_HEALTH_TEST,
  getApplicableQuestions,
  getSectionQuestions,
  getSectionResumeState,
  getRemainingSectionQuestions,
  getRemainingSectionResumeState,
  getApplicableSections,
  getHealthTestResumeState,
  hasHealthTestProgress,
  isQuestionAnswered,
  isQuestionFullyAnswered,
} from '../../data/healthTest'
import {
  getCoreHealthTestKeySet,
  getCoreHealthTestQuestions,
  getCoreHealthTestResumeIndex,
  isCoreQuestionAnswered,
} from '../../data/coreHealthTest'

function migrateLegacyHealthTestKeys(ht = {}) {
  const next = { ...ht }
  if (!next.trainingLocation && next.preferredExercisePlace) {
    const place = next.preferredExercisePlace
    if (place === 'home' || place === 'gym' || place === 'office') next.trainingLocation = place
    else if (place === 'outdoor') next.trainingLocation = 'home'
  }
  return next
}

function isLastHealthQuestion(index, questions) {
  return index >= questions.length - 1
}

const PANEL_SCROLL_SELECTOR = '[data-panel-scroll]'

/** Panel veya modal scroll konteynerinde hedefi üste hizala — window.scrollTo(0) kullanma. */
function scrollContainerToElement(el, container) {
  if (!el || !container) return
  const containerRect = container.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  const nextTop = container.scrollTop + (elRect.top - containerRect.top) - 8
  container.scrollTo({ top: Math.max(0, nextTop), left: 0, behavior: 'instant' })
}

export default function HealthTestFlow({
  open,
  onClose,
  layout = 'modal',
  /** 'default' | 'core' | 'remaining' — core: Genel Sağlık Testi; remaining: çekirdek dışı kategori */
  mode = 'default',
  sectionId = null,
  gender = '',
  packageConfig = null,
  initialHealthTest,
  initialHealthAck = false,
  initialDisclaimer = false,
  onProgressSave,
  onComplete,
  onSectionComplete,
  onCoreComplete,
  saving = false,
  flowTitle = null,
}) {
  const coreMode = mode === 'core'
  const remainingMode = mode === 'remaining'
  const coreKeys = useMemo(() => getCoreHealthTestKeySet(gender), [gender])

  const section = sectionId && !coreMode
    ? getApplicableSections(gender, packageConfig).find((s) => s.id === sectionId)
    : null

  const resume = (() => {
    if (coreMode) {
      return {
        questionIndex: getCoreHealthTestResumeIndex(initialHealthTest, gender),
        phase: 'questions',
      }
    }
    if (remainingMode && section) {
      return getRemainingSectionResumeState(section, initialHealthTest, coreKeys)
    }
    if (sectionId && section) {
      return getSectionResumeState(section, initialHealthTest)
    }
    return getHealthTestResumeState(initialHealthTest, gender, packageConfig, {
      healthAck: initialHealthAck,
      disclaimer: initialDisclaimer,
    })
  })()

  const [questionIndex, setQuestionIndex] = useState(resume.questionIndex)
  const [showErrors, setShowErrors] = useState(false)
  const [healthTest, setHealthTest] = useState(() => ({
    ...EMPTY_HEALTH_TEST,
    ...migrateLegacyHealthTestKeys(initialHealthTest || {}),
  }))
  const [healthAck, setHealthAck] = useState(initialHealthAck)
  const [disclaimer, setDisclaimer] = useState(initialDisclaimer)
  const [phase, setPhase] = useState(resume.phase)
  const healthTestRef = useRef(healthTest)
  const prevOpenRef = useRef(open)
  const onProgressSaveRef = useRef(onProgressSave)
  const lastPersistedRef = useRef(JSON.stringify({ ...EMPTY_HEALTH_TEST, ...initialHealthTest }))
  const stepAnchorRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const preservedScrollRef = useRef(null)
  const prevStepKeyRef = useRef(`${phase}:${questionIndex}`)

  useEffect(() => {
    healthTestRef.current = healthTest
  }, [healthTest])

  // Cevap işaretlenince (soru değişmeden) scroll sıçramasını engelle.
  // Not: minHeight kilidi kullanma — "Diğer" input kapanınca boş alan kalırdı.
  useLayoutEffect(() => {
    const stepKey = `${phase}:${questionIndex}`
    const stepChanged = prevStepKeyRef.current !== stepKey
    const container = scrollContainerRef.current
      || (layout === 'page'
        ? document.querySelector(PANEL_SCROLL_SELECTOR)
        : stepAnchorRef.current?.closest('.overflow-y-auto'))

    if (container) scrollContainerRef.current = container

    if (stepChanged) {
      prevStepKeyRef.current = stepKey
      scrollContainerToElement(stepAnchorRef.current, container)
      return
    }

    if (preservedScrollRef.current != null && container) {
      container.scrollTop = preservedScrollRef.current
      preservedScrollRef.current = null
    }
  }, [healthTest, phase, questionIndex, layout])

  const updateHealthTest = useCallback((patch) => {
    const container = scrollContainerRef.current
      || (layout === 'page'
        ? document.querySelector(PANEL_SCROLL_SELECTOR)
        : stepAnchorRef.current?.closest('.overflow-y-auto'))
    if (container) {
      scrollContainerRef.current = container
      preservedScrollRef.current = container.scrollTop
    }
    setHealthTest((prev) => ({ ...prev, ...patch }))
  }, [layout])

  useEffect(() => {
    onProgressSaveRef.current = onProgressSave
  }, [onProgressSave])

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      let next
      if (coreMode) {
        next = {
          questionIndex: getCoreHealthTestResumeIndex(initialHealthTest, gender),
          phase: 'questions',
        }
      } else if (remainingMode && section) {
        next = getRemainingSectionResumeState(section, initialHealthTest, coreKeys)
      } else if (sectionId && section) {
        next = getSectionResumeState(section, initialHealthTest)
      } else {
        next = getHealthTestResumeState(initialHealthTest, gender, packageConfig, {
          healthAck: initialHealthAck,
          disclaimer: initialDisclaimer,
        })
      }
      const merged = {
        ...EMPTY_HEALTH_TEST,
        ...migrateLegacyHealthTestKeys(initialHealthTest || {}),
      }
      setQuestionIndex(next.questionIndex)
      setPhase(next.phase)
      setHealthTest(merged)
      setHealthAck(initialHealthAck)
      setDisclaimer(initialDisclaimer)
      setShowErrors(false)
      lastPersistedRef.current = JSON.stringify(merged)
    }
    prevOpenRef.current = open
  }, [
    open, initialHealthTest, gender, packageConfig, initialHealthAck, initialDisclaimer,
    sectionId, section, coreMode, remainingMode, coreKeys,
  ])

  const persistProgress = useCallback(() => {
    const save = onProgressSaveRef.current
    if (!save) return
    const snapshot = healthTestRef.current
    if (!hasHealthTestProgress(snapshot, gender, packageConfig)) return
    const serialized = JSON.stringify(snapshot)
    if (serialized === lastPersistedRef.current) return
    lastPersistedRef.current = serialized
    save({ healthTest: snapshot })
  }, [gender, packageConfig])

  useEffect(() => {
    if (!onProgressSave) return undefined
    const timer = setTimeout(persistProgress, 700)
    return () => clearTimeout(timer)
  }, [healthTest, onProgressSave, persistProgress])

  useEffect(() => {
    return () => {
      const save = onProgressSaveRef.current
      if (!save) return
      const snapshot = healthTestRef.current
      if (!hasHealthTestProgress(snapshot, gender, packageConfig)) return
      const serialized = JSON.stringify(snapshot)
      if (serialized === lastPersistedRef.current) return
      lastPersistedRef.current = serialized
      save({ healthTest: snapshot })
    }
  }, [gender, packageConfig])

  const questions = (() => {
    if (coreMode) return getCoreHealthTestQuestions(gender)
    if (remainingMode && sectionId) {
      return getRemainingSectionQuestions(sectionId, gender, coreKeys)
    }
    if (sectionId) return getSectionQuestions(sectionId, gender, packageConfig)
    return getApplicableQuestions(gender, packageConfig)
  })()
  const currentQuestion = questions[questionIndex]
  const lastQuestion = isLastHealthQuestion(questionIndex, questions)
  const sectionMode = Boolean(sectionId) || remainingMode

  const questionReady = (q) => {
    if (!q) return false
    if (coreMode) return isCoreQuestionAnswered(q, healthTest)
    return isQuestionAnswered(q, healthTest)
  }

  const goNext = () => {
    if (phase === 'ack') {
      if (!healthAck || !disclaimer) {
        setShowErrors(true)
        return
      }
      setShowErrors(false)
      setPhase('questions')
      setQuestionIndex(0)
      return
    }
    if (!questionReady(currentQuestion)) {
      setShowErrors(true)
      return
    }
    setShowErrors(false)
    if (!lastQuestion) {
      setQuestionIndex((i) => i + 1)
      return
    }
    if (coreMode) {
      const allCoreDone = questions.every((q) => isCoreQuestionAnswered(q, healthTest))
      if (!allCoreDone) {
        setShowErrors(true)
        return
      }
      persistProgress()
      onCoreComplete?.({ healthTest })
      return
    }
    if (sectionMode) {
      // remainingMode: required:false — boş bırakılabilir; yalnızca yarım bağımlılık engeller
      const allSectionDone = questions.every((q) => isQuestionFullyAnswered(q, healthTest))
      if (!allSectionDone) {
        setShowErrors(true)
        return
      }
      persistProgress()
      onSectionComplete?.({ healthTest, sectionId })
      return
    }
    onComplete?.({ healthTest, healthAck, disclaimer })
  }

  const goBack = () => {
    setShowErrors(false)
    if (phase === 'questions' && questionIndex === 0 && !sectionMode && !coreMode) {
      setPhase('ack')
      return
    }
    if (phase === 'ack') return
    if (questionIndex > 0) setQuestionIndex((i) => i - 1)
  }

  if (!open) return null

  const nextLabel = phase === 'ack'
    ? 'Onayla ve başla'
    : lastQuestion
      ? (saving
        ? 'Kaydediliyor…'
        : (coreMode ? 'Testi Bitir' : (sectionMode ? 'Kaydet ve Bitir' : 'Tamamla')))
      : 'İleri'

  const headerTitle = flowTitle
    || (coreMode ? 'Genel Sağlık Testi' : (section?.title || 'Sağlık Profili Testi'))

  const body = (
        <div className={layout === 'page' ? '' : 'p-4 sm:p-6'}>
          {/*
            mode="wait" exit sırasında içerik yüksekliği 0'a düşüp panel scrollTop'unu
            sıfırlıyordu — her cevap/ileri sonrası sayfa en üste zıplıyordu.
          */}
          <div
            ref={stepAnchorRef}
            className="[overflow-anchor:none]"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {phase === 'ack' ? (
                <motion.div
                  key="ack"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22 }}
                >
                  <HealthTestConsentForm
                    healthAck={healthAck}
                    disclaimer={disclaimer}
                    onHealthAckChange={setHealthAck}
                    onDisclaimerChange={setDisclaimer}
                    showErrors={showErrors}
                    title="Başlamadan önce"
                    subtitle="Güvenliğiniz için lütfen aşağıdaki onayları işaretleyin."
                  />
                </motion.div>
              ) : (
                <motion.div
                  key={`q-${questionIndex}`}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22 }}
                >
                  <HealthTestStep
                    question={currentQuestion}
                    questionIndex={questionIndex}
                    totalQuestions={questions.length}
                    sectionTitle={coreMode ? 'Genel Sağlık Testi' : section?.title}
                    hideAudienceChip={coreMode}
                    forceRequired={coreMode}
                    healthTest={healthTest}
                    updateHealthTest={updateHealthTest}
                    showErrors={showErrors}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-6 flex justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              disabled={
                (phase === 'questions' && questionIndex === 0 && (sectionMode || coreMode))
                || phase === 'ack'
              }
              className="text-sm font-medium text-cream-800 disabled:opacity-30"
            >
              Geri
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {nextLabel}
            </button>
          </div>
        </div>
  )

  if (layout === 'page') {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-cream-200 bg-white p-4 shadow-sm sm:p-6">
        {body}
      </div>
    )
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[112] bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        ref={(node) => {
          if (node) scrollContainerRef.current = node
        }}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="fixed inset-x-0 bottom-0 z-[113] mx-auto max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-cream-50 shadow-2xl sm:inset-x-4 sm:top-1/2 sm:bottom-auto sm:max-h-[88dvh] sm:-translate-y-1/2 sm:rounded-3xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-cream-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <p className="text-sm font-semibold text-cream-900">{headerTitle}</p>
          {onClose && (
            <button
              type="button"
              onClick={() => { persistProgress(); onClose() }}
              className="rounded-full p-2 text-cream-800/50 hover:bg-cream-100"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        {body}
      </motion.div>
    </>
  )
}
