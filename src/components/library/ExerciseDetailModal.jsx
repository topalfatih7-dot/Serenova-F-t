import Modal from '../ui/Modal'
import VideoPlayer from '../ui/VideoPlayer'
import { DIFFICULTY_LABELS, formatExerciseLocations } from '../../data/exerciseTurkish'

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

export default function ExerciseDetailModal({ open, onClose, exercise, zClass = 'z-50' }) {
  const name = exercise?.name || exercise?.exerciseName

  return (
    <Modal open={open} onClose={onClose} title={name} size="lg" zClass={zClass}>
      {exercise && (
        <div className="space-y-4">
          {(exercise.videoUrl || exercise.videoPending) && (
            <VideoPlayer url={exercise.videoUrl} videoPending={exercise.videoPending} />
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
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed text-cream-800/80">
            {exercise.description || 'Açıklama eklenmemiş.'}
          </p>
        </div>
      )}
    </Modal>
  )
}
