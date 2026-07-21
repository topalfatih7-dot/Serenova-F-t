import Modal from '../ui/Modal'
import VideoPlayer from '../ui/VideoPlayer'
import { DIFFICULTY_LABELS, formatExerciseLocations, stripEmbeddedInstructionBlock } from '../../data/exerciseTurkish'

const CATEGORY_COLORS = {
  default: 'from-violet-500 to-purple-600',
  Kardiyo: 'from-rose-500 to-orange-500',
  Güç: 'from-brand-500 to-blue-600',
  Esneklik: 'from-teal-500 to-emerald-500',
  Core: 'from-amber-500 to-orange-500',
}

function categoryGradient(category) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.default
}

function normalizeInstructions(instructions) {
  if (!Array.isArray(instructions)) return []
  return instructions
    .map((step) => {
      if (typeof step === 'string') return step.trim()
      if (step && typeof step === 'object') return String(step.text || step.description || step.step || '').trim()
      return ''
    })
    .filter(Boolean)
}

export default function ExerciseDetailModal({ open, onClose, exercise, zClass = 'z-50' }) {
  const name = exercise?.name || exercise?.exerciseName
  const steps = normalizeInstructions(exercise?.instructions)
  const description = stripEmbeddedInstructionBlock(exercise?.description)

  return (
    <Modal open={open} onClose={onClose} title={name} size="lg" zClass={zClass}>
      {exercise && (
        <div className="space-y-4">
          {(exercise.videoUrl || exercise.videoPending) && (
            <VideoPlayer url={exercise.videoUrl} videoPending={exercise.videoPending} title={name} />
          )}
          <div className="flex flex-wrap gap-2">
            {exercise.category && (
              <span className={`inline-block rounded-full bg-gradient-to-r px-3 py-1 text-xs font-semibold text-white ${categoryGradient(exercise.category)}`}>
                {exercise.category}
              </span>
            )}
            {exercise.equipment && (
              <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">{exercise.equipment}</span>
            )}
            {exercise.difficulty && (
              <span className="rounded-full bg-cream-100 px-3 py-1 text-xs font-medium text-cream-800/70">
                {DIFFICULTY_LABELS[exercise.difficulty] || exercise.difficulty}
              </span>
            )}
            {formatExerciseLocations(exercise.locations).map((label) => (
              <span key={label} className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">{label}</span>
            ))}
            {exercise.requiresMachine && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">Makinalı</span>
            )}
            {exercise.targetMuscle && (
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">{exercise.targetMuscle}</span>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-cream-800/45">Açıklama</p>
            <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-cream-800/80">
              {description || 'Açıklama eklenmemiş.'}
            </p>
          </div>
          {steps.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-cream-800/45">Nasıl yapılır</p>
              <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-cream-800/80">
                {steps.map((step, i) => (
                  <li key={`${i}-${step.slice(0, 24)}`}>{step}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
