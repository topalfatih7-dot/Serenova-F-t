import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Loader2 } from 'lucide-react'
import HealthTestStep from './HealthTestStep'
import DisclaimerBox from '../ui/DisclaimerBox'
import {
  EMPTY_HEALTH_TEST,
  getApplicableQuestions,
  getHealthTestResumeState,
  hasHealthTestProgress,
  isQuestionAnswered,
} from '../../data/healthTest'

function isLastHealthQuestion(index, gender, packageConfig) {
  const questions = getApplicableQuestions(gender, packageConfig)
  return index >= questions.length - 1
}

export default function HealthTestFlow({
  open,
  onClose,
  layout = 'modal',
  gender = '',
  packageConfig = null,
  initialHealthTest,
  initialHealthAck = false,
  initialDisclaimer = false,
  onProgressSave,
  onComplete,
  saving = false,
}) {
  const resume = getHealthTestResumeState(initialHealthTest, gender, packageConfig, {
    healthAck: initialHealthAck,
    disclaimer: initialDisclaimer,
  })
  const [questionIndex, setQuestionIndex] = useState(resume.questionIndex)
  const [showErrors, setShowErrors] = useState(false)
  const [healthTest, setHealthTest] = useState(() => ({ ...EMPTY_HEALTH_TEST, ...initialHealthTest }))
  const [healthAck, setHealthAck] = useState(initialHealthAck)
  const [disclaimer, setDisclaimer] = useState(initialDisclaimer)
  const [phase, setPhase] = useState(resume.phase)
  const healthTestRef = useRef(healthTest)
  healthTestRef.current = healthTest
  const prevOpenRef = useRef(open)
  const onProgressSaveRef = useRef(onProgressSave)
  onProgressSaveRef.current = onProgressSave
  const lastPersistedRef = useRef(JSON.stringify({ ...EMPTY_HEALTH_TEST, ...initialHealthTest }))

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      const next = getHealthTestResumeState(initialHealthTest, gender, packageConfig, {
        healthAck: initialHealthAck,
        disclaimer: initialDisclaimer,
      })
      const merged = { ...EMPTY_HEALTH_TEST, ...initialHealthTest }
      setQuestionIndex(next.questionIndex)
      setPhase(next.phase)
      setHealthTest(merged)
      setHealthAck(initialHealthAck)
      setDisclaimer(initialDisclaimer)
      setShowErrors(false)
      lastPersistedRef.current = JSON.stringify(merged)
    }
    prevOpenRef.current = open
  }, [open, initialHealthTest, gender, packageConfig, initialHealthAck, initialDisclaimer])

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

  const questions = getApplicableQuestions(gender, packageConfig)
  const currentQuestion = questions[questionIndex]
  const lastQuestion = isLastHealthQuestion(questionIndex, gender, packageConfig)

  const updateHealthTest = (patch) => setHealthTest((prev) => ({ ...prev, ...patch }))

  const handleComplete = () => {
    if (!healthAck || !disclaimer) {
      setShowErrors(true)
      return
    }
    onComplete?.({ healthTest, healthAck, disclaimer })
  }

  const goNext = () => {
    if (phase === 'ack') {
      handleComplete()
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
    setPhase('ack')
  }

  const goBack = () => {
    setShowErrors(false)
    if (phase === 'ack') {
      setPhase('questions')
      return
    }
    if (questionIndex > 0) setQuestionIndex((i) => i - 1)
  }

  if (!open) return null

  const body = (
        <div className={layout === 'page' ? '' : 'p-4 sm:p-6'}>
          <AnimatePresence mode="wait">
            {phase === 'questions' ? (
              <motion.div key={`q-${questionIndex}`} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                <HealthTestStep
                  question={currentQuestion}
                  questionIndex={questionIndex}
                  totalQuestions={questions.length}
                  healthTest={healthTest}
                  updateHealthTest={updateHealthTest}
                  showErrors={showErrors}
                />
              </motion.div>
            ) : (
              <motion.div key="ack" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="mx-auto max-w-lg space-y-4">
                <h3 className="font-display text-xl font-bold text-cream-900">Son bir adım</h3>
                <p className="text-sm text-cream-800/65">Güvenliğiniz için lütfen aşağıdaki onayları işaretleyin.</p>
                <DisclaimerBox variant="prominent" />
                {[
                  { key: 'healthAck', checked: healthAck, set: setHealthAck, text: 'Sağlık durumumu doğru bildirdim ve gerekli durumlarda doktoruma danıştım.' },
                  { key: 'disclaimer', checked: disclaimer, set: setDisclaimer, text: 'Bu hizmetin tıbbi teşhis veya tedavi olmadığını kabul ediyorum.' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => item.set(!item.checked)}
                    className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${
                      item.checked ? 'border-brand-400 bg-brand-50 ring-2 ring-brand-200' : 'border-cream-200 bg-white'
                    }`}
                  >
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                      item.checked ? 'border-brand-500 bg-brand-500 text-white' : 'border-cream-300'
                    }`}>
                      {item.checked && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <span className="text-sm leading-snug text-cream-800/80">{item.text}</span>
                  </button>
                ))}
                {showErrors && (!healthAck || !disclaimer) && (
                  <p className="text-xs font-medium text-red-600">Lütfen tüm onayları işaretleyin.</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 flex justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              disabled={phase === 'questions' && questionIndex === 0}
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
              {phase === 'ack' ? (saving ? 'Kaydediliyor…' : 'Tamamla') : lastQuestion ? 'Onaya Geç' : 'İleri'}
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
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="fixed inset-x-0 bottom-0 z-[113] mx-auto max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-cream-50 shadow-2xl sm:inset-x-4 sm:top-1/2 sm:bottom-auto sm:max-h-[88dvh] sm:-translate-y-1/2 sm:rounded-3xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-cream-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <p className="text-sm font-semibold text-cream-900">Sağlık Profili Testi</p>
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
