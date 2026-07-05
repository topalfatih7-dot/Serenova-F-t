/** 1600exercisedbpro koleksiyon tanimlari — dedupe + import scriptleri ortak kullanir. */

export const DEFAULT_EXERCISE_DB_ROOT = '/Users/mac/Desktop/1600exercisedbpro'

/** @type {{ json: string, slug: string, videoRoot: string, sportType: string }[]} */
export const EXERCISE_PACKS = [
  { json: '100 Gym Workouts/100 Gym Workouts/100gymworkouts.json', slug: 'gym100', videoRoot: '100 Gym Workouts', sportType: 'Fitness' },
  { json: '100 Workouts/100workouts.json', slug: 'w100', videoRoot: '100 Workouts', sportType: 'Fitness' },
  { json: '200 Workouts/200 Workouts/200workouts.json', slug: 'w200', videoRoot: '200 Workouts', sportType: 'Fitness' },
  { json: '400 Women Workout/Women Workout/400homeworkout.json', slug: 'women400', videoRoot: '400 Women Workout', sportType: 'Fitness' },
  { json: '430 Workouts/430 Workouts/100gymfemale.json', slug: 'gf100', videoRoot: '430 Workouts', sportType: 'Fitness' },
  { json: '430 Workouts/430 Workouts/130gymworkouts.json', slug: 'gf130', videoRoot: '430 Workouts', sportType: 'Fitness' },
  { json: '430 Workouts/430 Workouts/200gymfemale.json', slug: 'gf200', videoRoot: '430 Workouts', sportType: 'Fitness' },
  { json: 'Face Exercise/face.json', slug: 'face', videoRoot: 'Face Exercise', sportType: 'Yüz Egzersizi' },
  { json: 'Home Pilate/Home Pilate/pilate.json', slug: 'pilate-home', videoRoot: 'Home Pilate', sportType: 'Pilates' },
  { json: 'Office/Office/office.json', slug: 'office', videoRoot: 'Office', sportType: 'Ofis / Ev' },
  { json: 'Wall Pilate Workouts/wallpilate.json', slug: 'pilate-wall', videoRoot: 'Wall Pilate Workouts', sportType: 'Pilates' },
  { json: 'Workouts/130workouts.json', slug: 'w130', videoRoot: 'Workouts', sportType: 'Fitness' },
  { json: 'Yoga/Yoga.json', slug: 'yoga', videoRoot: 'Yoga', sportType: 'Yoga' },
]

/** Faz 1 — kullanıcının belirttiği sıra */
export const PHASE_1_PACK_SLUGS = ['gym100', 'w100', 'w200', 'women400', 'gf100', 'gf130', 'gf200']
export function plannedVideoPath(packSlug, sourceId, ext = 'mp4') {
  const id = String(sourceId).trim()
  const base = id.startsWith(`${packSlug}-`) ? id : `${packSlug}-${id}`
  return `${base}.${ext}`
}
