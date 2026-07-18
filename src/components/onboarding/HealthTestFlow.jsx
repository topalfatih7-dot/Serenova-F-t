import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import HealthTestStep from './HealthTestStep'
import HealthTestConsentForm from './HealthTestConsentForm'
import {
  emptyHealthTest,
  getApplicableQuestions,
  getSectionQuestions,
  getSectionResumeState,
  getApplicableSections,
  getHealthTestResumeState,
  hasHealthTestProgress,
  isQuestionAnswered,
  isQuestionFullyAnswered,
  migrateLegacyHealthTestKeys,
} from '../../data/healthTest'

function mergeHealthTest(initial, schema) {
  return { ...emptyHealthTest(schema), ...migrateLegacyHealthTestKeys(initial || {}) }
}

function isLastHealthQuestion(index, questions) {
  return index >= questions.length - 1
}

export default function HealthTestFlow({
  open,
  onClose,
  layout = 'modal',
  sectionId = null,
  gender = '',
  packageConfig = null,
  healthTestSchema = null,
  initialHealthTest,
  initialHealthAck = false,
  initialDisclaimer = false,
  onProgressSave,
  onComplete,
  onSectionComplete,
  saving = false,
}) {
  const schema = healthTestSchema

  const section = useMemo(
    () => (sectionId
      ? getApplicableSections(gender, packageConfig, schema).find((s) => s.id === sectionId)
      : null),
    [sectionId, gender, packageConfig, schema],
  )

  const resume = sectionId && section
    ? getSectionResumeState(section, initialHealthTest, schema)
    : getHealthTestResumeState(initialHealthTest, gender, packageConfig, {
        healthAck: initialHealthAck,
        disclaimer: initialDisclaimer,
        schema,
      })

  const [questionIndex, setQuestionIndex] = useState(resume.questionIndex)
  const [showErrors, setShowErrors] = useState(false)
  const [healthTest, setHealthTest] = useState(() => mergeHealthTest(initialHealthTest, schema))
  const [healthAck, setHealthAck] = useState(initialHealthAck)
  const [disclaimer, setDisclaimer] = useState(initialDisclaimer)
  const [phase, setPhase] = useState(resume.phase)
  const healthTestRef = useRef(healthTest)
  const prevOpenRef = useRef(open)
  const onProgressSaveRef = useRef(onProgressSave)
  const lastPersistedRef = useRef(JSON.stringify(mergeHealthTest(initialHealthTest, schema)))

  useEffect(() => {
    healthTestRef.current = healthTest
  }, [healthTest])

  useEffect(() => {
    onProgressSaveRef.current = onProgressSave
  }, [onProgressSave])

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      const next = sectionId && section
        ? getSectionResumeState(section, initialHealthTest, schema)
        : getHealthTestResumeState(initialHealthTest, gender, packageConfig, {
            healthAck: initialHealthAck,
            disclaimer: initialDisclaimer,
            schema,
          })
      const merged = mergeHealthTest(initialHealthTest, schema)
      setQuestionIndex(next.questionIndex)
      setPhase(next.phase)
      setHealthTest(merged)
      setHealthAck(initialHealthAck)
      setDisclaimer(initialDisclaimer)
      setShowErrors(false)
      lastPersistedRef.current = JSON.stringify(merged)
    }
    prevOpenRef.current = open
  }, [open, initialHealthTest, gender, packageConfig, initialHealthAck, initialDisclaimer, sectionId, section, schema])

  const persistProgress = useCallback(() => {
    const save = onProgressSaveRef.current
    if (!save) return
    const snapshot = healthTestRef.current
    if (!hasHealthTestProgress(snapshot, gender, packageConfig, schema)) return
    const serialized = JSON.stringify(snapshot)
    if (serialized === lastPersistedRef.current) return
    lastPersistedRef.current = serialized
    save({ healthTest: snapshot })
  }, [gender, packageConfig, schema])

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
      if (!hasHealthTestProgress(snapshot, gender, packageConfig, schema)) return
      const serialized = JSON.stringify(snapshot)
      if (serialized === lastPersistedRef.current) return
      lastPersistedRef.current = serialized
      save({ healthTest: snapshot })
    }
  }, [gender, packageConfig, schema])

  const questions = sectionId
    ? getSectionQuestions(sectionId, gender, packageConfig, schema)
    : getApplicableQuestions(gender, packageConfig, schema)
  const currentQuestion = questions[questionIndex]
  const lastQuestion = isLastHealthQuestion(questionIndex, questions)
  const sectionMode = Boolean(sectionId)

  const updateHealthTest = (patch) => setHealthTest((prev) => ({ ...prev, ...patch }))

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
    if (!isQuestionAnswered(currentQuestion, healthTest)) {
      setShowErrors(true)
      return
    }
    setShowErrors(false)
    if (!lastQuestion) {
      setQuestionIndex((i) => i + 1)
      return
    }
    if (sectionMode) {
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
    if (phase === 'questions' && questionIndex === 0 && !sectionMode) {
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
      ? (sectionMode ? (saving ? 'Kaydediliyor…' : 'Testi Bitir') : (saving ? 'Kaydediliyor…' : 'Tamamla'))
      : 'İleri'

  const body = (
        <div className={layout === 'page' ? '' : 'p-4 sm:p-6'}>
          <AnimatePresence mode="wait">
            {phase === 'ack' ? (
              <motion.div key="ack" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
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
              <motion.div key={`q-${questionIndex}`} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                <HealthTestStep
                  question={currentQuestion}
                  questionIndex={questionIndex}
                  totalQuestions={questions.length}
                  sectionTitle={currentQuestion?.sectionTitle}
                  healthTest={healthTest}
                  updateHealthTest={updateHealthTest}
                  showErrors={showErrors}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className={`mt-6 flex gap-3 ${layout === 'page' ? 'mx-auto max-w-2xl' : ''}`}>
            {(phase === 'questions' && questionIndex > 0) || (phase === 'questions' && !sectionMode) ? (
              <button
                type="button"
                onClick={goBack}
                className="rounded-2xl border border-cream-200 px-5 py-3 text-sm font-semibold text-cream-800 hover:bg-cream-50"
              >
                Geri
              </button>
            ) : null}
            <button
              type="button"
              disabled={saving}
              onClick={goNext}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {nextLabel}
            </button>
          </div>
        </div>
  )

  if (layout === 'page') {
    return <div className="w-full">{body}</div>
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-cream-900/40 p-0 sm:items-center sm:p-4">
      <div className="relative flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-cream-100 p-2 text-cream-800 hover:bg-cream-200"
          aria-label="Kapat"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="overflow-y-auto">{body}</div>
      </div>
    </div>
  )
}
