/** 1600exercisedbpro → Serenova exercises tablosu alan eslemeleri */

import {
  translateExerciseRecord,
  translateMuscle,
  translateMovementCategory,
  DIFFICULTY_LABELS as TR_DIFFICULTY,
  MOVEMENT_CATEGORY_LABELS as TR_MOVEMENT,
} from './exerciseTurkish.js'

export { TR_DIFFICULTY as DIFFICULTY_LABELS, TR_MOVEMENT as MOVEMENT_CATEGORY_LABELS }

export const BODY_PART_TO_CATEGORY = {
  back: 'Sırt',
  chest: 'Göğüs',
  shoulders: 'Omuz',
  'upper arms': 'Kol',
  'lower arms': 'Kol',
  'upper legs': 'Bacak',
  'lower legs': 'Bacak',
  waist: 'Karın',
  cardio: 'Kardiyo',
  neck: 'Boyun',
}

export const EQUIPMENT_LABELS = {
  'body weight': 'Vücut Ağırlığı',
  dumbbell: 'Dambıl',
  barbell: 'Halter',
  machine: 'Makine',
  cable: 'Kablo',
  'resistance band': 'Direnç Bandı',
  kettlebell: 'Kettlebell',
  'medicine ball': 'Medisin Topu',
  'leverage machine': 'Leverage Makinesi',
  'exercise ball': 'Egzersiz Topu',
  'bosu ball': 'Bosu Topu',
  'smith machine': 'Smith Makinesi',
  trx: 'TRX',
  'battle rope': 'Battle Rope',
  band: 'Direnç Bandı',
  'ab wheel': 'Karın Tekerleği',
  assisted: 'Destekli',
  'hex bar': 'Hex Bar',
  'jump rope': 'İp Atlama',
  plate: 'Plaka',
  rope: 'Halat',
  sled: 'Kızak',
  'trap bar': 'Trap Bar',
  vipr: 'ViPR',
}

/** Admin taxonomy için Türkçe kategori listesi */
export const IMPORT_TAXONOMY_BODY_PARTS = [
  'Tüm Vücut',
  'Üst Vücut',
  'Alt Vücut',
  'Göğüs',
  'Sırt',
  'Omuz',
  'Kol',
  'Karın',
  'Kalça',
  'Bacak',
  'Kardiyo',
  'Boyun',
  'Esneme',
]

/** Şimdilik import edilmeyecek paketler */
export const DEFERRED_IMPORT_PACKS = ['face', 'office']

export function mapBodyPart(bodyPart) {
  const key = String(bodyPart || '').trim().toLowerCase()
  return BODY_PART_TO_CATEGORY[key] || 'Tüm Vücut'
}

export function mapEquipment(equipment) {
  const key = String(equipment || '').trim().toLowerCase()
  return EQUIPMENT_LABELS[key] || equipment || 'Vücut Ağırlığı'
}

export function mapDifficulty(difficulty) {
  const key = String(difficulty || '').trim().toLowerCase()
  return key || 'beginner'
}

export function titleCaseName(name) {
  return translateExerciseRecord({ name }, {}).name
}

export function buildDescription(exercise) {
  return translateExerciseRecord(exercise, {}).description
}

export function localizeExerciseFields(exercise, pack) {
  const tr = translateExerciseRecord(exercise, pack)
  return {
    name: tr.name,
    description: tr.description,
    instructions: tr.instructions,
    target_muscle: tr.targetMuscleTr,
    secondary_muscles: tr.secondaryMusclesTr,
    movement_category: exercise.category || 'strength',
    movement_category_label: tr.movementCategoryTr,
  }
}

export { translateMuscle, translateMovementCategory }
