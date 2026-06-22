import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Loader2 } from 'lucide-react'
import HealthTestStep from './HealthTestStep'
import DisclaimerBox from '../ui/DisclaimerBox'
import {
  EMPTY_HEALTH_TEST,
  getApplicableQuestions,
  isQuestionAnswered,
} from '../../data/healthTest'

function isLastHealthQuestion(index, gender) {
  const questions = getApplicableQuestions(gender)
  return index >= questions.length - 1
}

export default function HealthTestFlow({
  open,
  onClose,
  gender = '',
  initialHealthTest,
  onComplete,
  saving = false,
}) {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [showErrors, setShowErrors] = useState(false)
  const [healthTest, setHealthTest] = useState(() => ({ ...EMPTY_HEALTH_TEST, ...initialHealthTest }))
  const [healthAck, setHealthAck] = useState(false)
  const [disclaimer, setDisclaimer] = useState(false)
  const [phase, setPhase] = useState('questions')

  const questions = getApplicableQuestions(gender)
  const currentQuestion = questions[questionIndex]
  const lastQuestion = isLastHealthQuestion(questionIndex, gender)

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
          <button type="button" onClick={onClose} className="rounded-full p-2 text-cream-800/50 hover:bg-cream-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
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
                  onSelectAndAdvance={() => {
                    if (!lastQuestion) setQuestionIndex((i) => i + 1)
                    else setPhase('ack')
                  }}
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
      </motion.div>
    </>
  )
}
