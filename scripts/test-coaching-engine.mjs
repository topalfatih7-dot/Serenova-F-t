/**
 * Coaching Engine smoke test (OpenAI / DB yok).
 * node scripts/test-coaching-engine.mjs
 */
import { runCoachingEngine } from '../api/coaching/index.js'
import { guardNutritionMeals } from '../api/coaching/nutritionGuard.js'
import { buildCoachingStatePatch, logCoachingDecision } from '../api/coaching/observability.js'
import { planVolume } from '../api/coaching/volume.js'

const fakeExercises = [
  { id: 'e1', name: 'Goblet Squat', body_part: 'Bacak', target_muscle: 'quads', equipment: 'dumbbell', difficulty: 'beginner', locations: ['home', 'gym'], video_pending: false, requires_machine: false },
  { id: 'e2', name: 'Romanian Deadlift', body_part: 'Kalça', target_muscle: 'glutes', equipment: 'dumbbell', difficulty: 'beginner', locations: ['home', 'gym'], video_pending: false, requires_machine: false },
  { id: 'e3', name: 'Push Up', body_part: 'Göğüs', target_muscle: 'chest', equipment: 'bodyweight', difficulty: 'beginner', locations: ['home'], video_pending: false, requires_machine: false },
  { id: 'e4', name: 'Dumbbell Row', body_part: 'Sırt', target_muscle: 'back', equipment: 'dumbbell', difficulty: 'beginner', locations: ['home', 'gym'], video_pending: false, requires_machine: false },
  { id: 'e5', name: 'Glute Bridge', body_part: 'Kalça', target_muscle: 'glutes', equipment: 'bodyweight', difficulty: 'beginner', locations: ['home'], video_pending: false, requires_machine: false },
  { id: 'e6', name: 'Dead Bug', body_part: 'Core', target_muscle: 'abs', equipment: 'bodyweight', difficulty: 'beginner', locations: ['home'], video_pending: false, requires_machine: false },
  { id: 'e7', name: 'March in Place', body_part: 'Cardio', target_muscle: 'full', equipment: 'bodyweight', difficulty: 'beginner', locations: ['home'], video_pending: false, requires_machine: false },
  { id: 'e8', name: 'Cat Cow Stretch', body_part: 'Mobilite', target_muscle: 'spine', equipment: 'bodyweight', difficulty: 'beginner', locations: ['home'], video_pending: false, requires_machine: false },
  { id: 'e9', name: 'Band Pull Apart', body_part: 'Sırt', target_muscle: 'rear delts', equipment: 'bands', difficulty: 'beginner', locations: ['home'], video_pending: false, requires_machine: false },
  { id: 'e10', name: 'Reverse Lunge', body_part: 'Bacak', target_muscle: 'quads', equipment: 'bodyweight', difficulty: 'beginner', locations: ['home'], video_pending: false, requires_machine: false },
  { id: 'e11', name: 'Overhead Press', body_part: 'Omuz', target_muscle: 'shoulders', equipment: 'dumbbell', difficulty: 'beginner', locations: ['gym'], video_pending: false, requires_machine: false },
  { id: 'e12', name: 'Jump Squat', body_part: 'Bacak', target_muscle: 'quads', equipment: 'bodyweight', difficulty: 'intermediate', locations: ['home'], video_pending: false, requires_machine: false },
]

const member = {
  name: 'Test Üye',
  gender: 'female',
  weight: 72,
  height: 165,
  availability: {
    1: ['09:00'],
    3: ['09:00'],
    5: ['09:00'],
  },
  healthTest: {
    injuries: 'yes_partial',
    injuryRegions: ['knee'],
    injuryLimitation: 'moderate',
    injuryDoctorRestriction: 'no',
    painAreas: ['knee'],
    painScale: 5,
    activityFrequency: '1_2',
    trainingHistoryYears: 'under_6m',
    currentActivityTypes: ['walking'],
    equipmentAccess: ['bodyweight', 'dumbbells', 'bands'],
    preferredTrainingDays: ['monday', 'wednesday', 'friday'],
    sessionDurationGoal: '30_40',
    trainingLocation: 'home',
    performanceGoal: '6 kg vermek ve kalça güçlendirmek',
    exercisePreferences: ['strength', 'shortHome'],
    exerciseBarriers: ['time'],
    motivation: 7,
    readinessToChange: 'ready',
    energy: 'ok',
    wellbeing: 'good',
    flexibilityLevel: 'low',
    sittingHours: '7_9',
    doctorClearance: 'yes',
    chronicConditions: [],
    exerciseContraindications: 'no',
  },
  healthAnalysis: { radarScores: { sleep: 60, stress: 55 } },
}

const result = runCoachingEngine(member, fakeExercises)

console.log('split:', result.split.splitType, 'days:', result.split.daysPerWeek)
console.log('risk:', result.risk.level, 'bans:', result.risk.bannedTags.slice(0, 8))
console.log('goals:', result.goals.primary, result.goals.programBias)
console.log('pool:', result.poolSize)
console.log('session:', result.sessionDuration, result.sessionStart)
for (const tpl of result.templates) {
  console.log(`\nTemplate ${tpl.id} (${tpl.focus}):`)
  for (const ex of tpl.exercises) {
    console.log(`  [${ex.block}] ${ex.exerciseName} — ${ex.note}`)
  }
}

const names = result.primaryExercises.map((e) => e.exerciseName).join(' | ')
if (/Jump Squat|Overhead Press/i.test(names)) {
  console.error('FAIL: restricted/impact or overhead slipped into primary for knee+home beginner')
  process.exit(1)
}
if (result.primaryExercises.length < 4) {
  console.error('FAIL: too few exercises')
  process.exit(1)
}
// Progresyon: ikinci üretim öncekiyle aynı olmamalı veya amount artmalı
const previous = {
  type: 'workout',
  entries: result.primaryExercises.map((e) => ({ ...e })),
  coaching: { splitType: result.split.splitType },
}
const result2 = runCoachingEngine(member, fakeExercises, { previousWorkout: previous })
const ids1 = new Set(result.primaryExercises.map((e) => e.exerciseId))
const ids2 = result2.primaryExercises.map((e) => e.exerciseId)
const overlap = ids2.filter((id) => ids1.has(id)).length / ids2.length
console.log('\nProgression overlap:', Math.round(overlap * 100) + '%')
console.log('Progression explain sample:', result2.explain.filter((x) => /progresyon|çeşitlilik/.test(x)).slice(0, 3))

const nutrition = guardNutritionMeals([
  { mealType: 'breakfast', name: 'Yulaf, süt, bal (~400 kcal)', start: '08:00', note: '' },
  { mealType: 'lunch', name: 'Tavuk, bulgur, salata (~500 kcal)', start: '13:00', note: '' },
  { mealType: 'dinner', name: 'Balık, ekmek, yoğurt (~450 kcal)', start: '19:00', note: '' },
  { mealType: 'snack_morning', name: 'Badem (~180 kcal)', start: '10:30', note: '' },
], {
  healthTest: {
    foodAllergiesDetail: 'laktoz intoleransı, fıstık alerjisi',
  },
  dailyCalories: { recommended: 1800, goal: 'Kilo verme' },
})
console.log('\nNutrition swaps:', nutrition.explain)
console.log('Breakfast after guard:', nutrition.meals.find((m) => m.mealType === 'breakfast')?.name)
if (/süt|badem|yoğurt/i.test(nutrition.meals.find((m) => m.mealType === 'breakfast')?.name || '')) {
  // breakfast swap should remove süt; badem is snack
}
if (/süt/i.test(nutrition.meals.map((m) => m.name).join(' '))) {
  console.error('FAIL: lactose item remained')
  process.exit(1)
}
if (/badem/i.test(nutrition.meals.map((m) => m.name).join(' '))) {
  console.error('FAIL: nut item remained')
  process.exit(1)
}

// Adaptation: planlı 4 gün, 0 tamamlanma → restart_easy / ease
const prevDated = {
  type: 'workout',
  cycleStartDate: '2026-07-06',
  cycleLength: 14,
  entries: [
    { id: 'w1', exerciseId: 'e1', exerciseName: 'Goblet Squat', date: '2026-07-06', amount: 10, note: '3 set · RPE7', block: 'main' },
    { id: 'w2', exerciseId: 'e2', exerciseName: 'RDL', date: '2026-07-06', amount: 10, note: '3 set · RPE7', block: 'main' },
    { id: 'w3', exerciseId: 'e1', exerciseName: 'Goblet Squat', date: '2026-07-08', amount: 10, note: '3 set · RPE7', block: 'main' },
    { id: 'w4', exerciseId: 'e2', exerciseName: 'RDL', date: '2026-07-08', amount: 10, note: '3 set · RPE7', block: 'main' },
    { id: 'w5', exerciseId: 'e1', exerciseName: 'Goblet Squat', date: '2026-07-13', amount: 10, note: '3 set · RPE7', block: 'main' },
    { id: 'w6', exerciseId: 'e2', exerciseName: 'RDL', date: '2026-07-13', amount: 10, note: '3 set · RPE7', block: 'main' },
    { id: 'w7', exerciseId: 'e1', exerciseName: 'Goblet Squat', date: '2026-07-15', amount: 10, note: '3 set · RPE7', block: 'main' },
    { id: 'w8', exerciseId: 'e2', exerciseName: 'RDL', date: '2026-07-15', amount: 10, note: '3 set · RPE7', block: 'main' },
  ],
}
const easyMember = {
  ...member,
  completedActivities: {},
}
const easy = runCoachingEngine(easyMember, fakeExercises, {
  previousWorkout: prevDated,
  completedActivities: {},
})
console.log('\nAdaptation (missed):', easy.adaptation?.mode, easy.adherence)
if (!['ease', 'restart_easy'].includes(easy.adaptation?.mode)) {
  console.error('FAIL: expected ease/restart_easy on zero completion')
  process.exit(1)
}
const hasEasyNote = easy.primaryExercises.some((e) => /kolay hafta/.test(e.note || ''))
if (!hasEasyNote) {
  console.error('FAIL: expected kolay hafta note')
  process.exit(1)
}

// Yüksek uyum
const doneActs = {}
for (const e of prevDated.entries) {
  if (!doneActs[e.date]) doneActs[e.date] = []
  doneActs[e.date].push(`${e.date}_${e.id}`)
}
const pushRun = runCoachingEngine({ ...member, injuries: 'no', healthTest: { ...member.healthTest, injuries: 'no', injuryLimitation: '', painAreas: [], painScale: 1 } }, fakeExercises, {
  previousWorkout: prevDated,
  completedActivities: doneActs,
})
console.log('Adaptation (high):', pushRun.adaptation?.mode, 'rate', pushRun.adherence?.rate)

// Volume + nutrition constraints + observability
console.log('\nVolume:', result.volume?.weeklySetsPerMuscle, 'deload', result.volume?.deload)
console.log('Protein target:', result.nutritionConstraints?.proteinGDay, 'g')
if (!result.nutritionConstraints?.proteinGDay) {
  console.error('FAIL: missing nutrition constraints')
  process.exit(1)
}
if (!result.volume?.setsPerSessionMajor) {
  console.error('FAIL: missing volume plan')
  process.exit(1)
}
const state = buildCoachingStatePatch({}, result, 'ai_basic')
if (!state.coachingState?.lastExplain?.length) {
  console.error('FAIL: coachingState explain missing')
  process.exit(1)
}
logCoachingDecision('test-member', result, { endpoint: 'smoke' })

// Deterministik: aynı input → aynı exercise ids
const again = runCoachingEngine(member, fakeExercises)
const a = result.primaryExercises.map((e) => e.exerciseId).join(',')
const b = again.primaryExercises.map((e) => e.exerciseId).join(',')
if (a !== b) {
  console.error('FAIL: non-deterministic selection', a, b)
  process.exit(1)
}
console.log('Deterministic OK')

// Deload week 4
const vol4 = planVolume(result.profile, result.goals, result.risk, { mesocycleWeek: 4 })
if (!vol4.deload) {
  console.error('FAIL: expected deload on week 4')
  process.exit(1)
}
console.log('Deload week4 OK')

console.log('\nOK coaching engine smoke test passed')
