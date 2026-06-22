export const DEFAULT_SPORT_TYPES = [
  'Kalistenik',
  'Fitness',
  'Yoga',
  'Pilates',
  'Kardiyo',
  'CrossFit',
  'Mobilite',
  'Esneme',
]

export const DEFAULT_BODY_PARTS = [
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
]

export function normalizeExerciseTaxonomy(raw) {
  const sportTypes = Array.isArray(raw?.sportTypes) && raw.sportTypes.length
    ? raw.sportTypes
    : DEFAULT_SPORT_TYPES
  const bodyParts = Array.isArray(raw?.bodyParts) && raw.bodyParts.length
    ? raw.bodyParts
    : DEFAULT_BODY_PARTS
  return { sportTypes, bodyParts, id: raw?.id || null }
}
