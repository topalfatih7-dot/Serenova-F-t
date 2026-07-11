/**
 * Egzersiz metinlerini kullanıcıya gösterilecek düzgün Türkçeye çevirir.
 * Import script ve UI etiketleri ortak kullanır.
 */

export const TARGET_MUSCLE_LABELS = {
  abs: 'Karın Kasları',
  obliques: 'Yan Karın',
  'lower back': 'Alt Sırt',
  'upper back': 'Üst Sırt',
  lats: 'Kanat Kasları',
  traps: 'Trapez',
  delts: 'Omuz Kasları',
  'rear delts': 'Arka Omuz',
  biceps: 'Pazu',
  triceps: 'Arka Kol',
  forearms: 'Ön Kol',
  quads: 'Ön Bacak',
  hamstrings: 'Arka Bacak',
  glutes: 'Kalça',
  calves: 'Baldır',
  adductors: 'İç Bacak',
  abductors: 'Dış Bacak',
  chest: 'Göğüs',
  rhomboids: 'Romboid',
  'serratus anterior': 'Seratus Ön',
  'levator scapulae': 'Skapula Kaldırıcı',
  'cardiovascular system': 'Kardiyovasküler Sistem',
  'facial muscles': 'Yüz Kasları',
  cheeks: 'Yanak',
  'orbicularis oris': 'Ağız Çevresi Kasları',
  spine: 'Omurga',
  core: 'Merkez Bölge',
  hips: 'Kalça',
  shoulders: 'Omuz',
}

export const MOVEMENT_CATEGORY_LABELS = {
  strength: 'Güç',
  stretching: 'Esneme',
  cardio: 'Kardiyo',
  mobility: 'Mobilite',
  balance: 'Denge',
  plyometrics: 'Pliometri',
  rehabilitation: 'Rehabilitasyon',
}

export const DIFFICULTY_LABELS = {
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  advanced: 'İleri',
}

/** Konum filtresi — 1600exercisedbpro `locations` alanı */
export const EXERCISE_LOCATION_LABELS = {
  office: 'Ofis',
  home: 'Ev',
  gym: 'Salon',
}

export const EXERCISE_LOCATION_OPTIONS = [
  { id: 'office', label: 'Ofis' },
  { id: 'home', label: 'Ev' },
  { id: 'gym', label: 'Salon' },
]

/** Makine filtresi — `requiresMachine` */
export const REQUIRES_MACHINE_LABELS = {
  true: 'Makinalı',
  false: 'Makinasız',
}

export const REQUIRES_MACHINE_OPTIONS = [
  { id: 'true', label: 'Makinalı' },
  { id: 'false', label: 'Makinasız' },
]

export function formatExerciseLocations(locations) {
  if (!Array.isArray(locations) || !locations.length) return []
  return locations.map((loc) => EXERCISE_LOCATION_LABELS[loc] || loc)
}

export const SORT_LABELS = {
  name_asc: 'İsim (A → Z)',
  name_desc: 'İsim (Z → A)',
  category_asc: 'Kategori',
  difficulty_asc: 'Zorluk',
  newest: 'En yeni',
}

/** Uzun ifadeler önce — kısmi eşleşme hatalarını önler */
const PHRASE_MAP = [
  ['body weight', 'vücut ağırlığı'],
  ['resistance band', 'direnç bandı'],
  ['medicine ball', 'medisin topu'],
  ['exercise ball', 'egzersiz topu'],
  ['jump rope', 'ip atlama'],
  ['battle rope', 'battle rope'],
  ['smith machine', 'smith makinesi'],
  ['leverage machine', 'leverage makinesi'],
  ['bosu ball', 'bosu topu'],
  ['trap bar', 'trap bar'],
  ['hex bar', 'hex bar'],
  ['ab wheel', 'ab wheel'],
  ['full body', 'tüm vücut'],
  ['lower back', 'alt sırt'],
  ['upper back', 'üst sırt'],
  ['lower legs', 'alt bacak'],
  ['upper legs', 'üst bacak'],
  ['upper arms', 'üst kol'],
  ['lower arms', 'alt kol'],
  ['rear delts', 'arka omuz'],
  ['facial muscles', 'yüz kasları'],
  ['cardiovascular system', 'kardiyovasküler sistem'],
  ['kneeling', 'diz üstü'],
  ['standing', 'ayakta'],
  ['seated', 'oturarak'],
  ['lying', 'yatarak'],
  ['incline', 'eğimli'],
  ['decline', 'ters eğimli'],
  ['alternating', 'dönüşümlü'],
  ['single leg', 'tek bacak'],
  ['single arm', 'tek kol'],
  ['wide grip', 'geniş tutuş'],
  ['close grip', 'dar tutuş'],
  ['workout', 'egzersizi'],
  ['exercise', 'egzersizi'],
  ['stretch', 'esnetme'],
  ['raises', 'kaldırma'],
  ['raise', 'kaldırma'],
  ['press', 'presi'],
  ['curl', 'curl'],
  ['crunch', 'mekik'],
  ['crunches', 'mekik'],
  ['squat', 'squat'],
  ['squats', 'squat'],
  ['lunge', 'lunge'],
  ['lunges', 'lunge'],
  ['plank', 'plank'],
  ['row', 'row'],
  ['rows', 'row'],
  ['pull-up', 'barfiks'],
  ['pull up', 'barfiks'],
  ['push-up', 'şınav'],
  ['push up', 'şınav'],
  ['burpee', 'burpee'],
  ['deadlift', 'deadlift'],
  ['hip thrust', 'kalça itişi'],
  ['leg raise', 'bacak kaldırma'],
  ['leg raises', 'bacak kaldırma'],
  ['shoulder', 'omuz'],
  ['shoulders', 'omuz'],
  ['chest', 'göğüs'],
  ['back', 'sırt'],
  ['waist', 'bel'],
  ['neck', 'boyun'],
  ['cardio', 'kardiyo'],
  ['yoga', 'yoga'],
  ['pilates', 'pilates'],
  ['dumbbell', 'dambıl'],
  ['barbell', 'halter'],
  ['cable', 'kablo'],
  ['machine', 'makine'],
  ['kettlebell', 'kettlebell'],
  ['band', 'band'],
  ['rope', 'halat'],
  ['ball', 'top'],
  ['wheel', 'tekerlek'],
  ['step', 'adım'],
  ['hold', 'bekleme'],
  ['rotation', 'rotasyon'],
  ['twist', 'bükme'],
  ['fly', 'fly'],
  ['extension', 'ekstansiyon'],
  ['flexion', 'fleksiyon'],
  ['warm-up', 'ısınma'],
  ['warm up', 'ısınma'],
  ['cool-down', 'soğuma'],
  ['cool down', 'soğuma'],
]

const WORD_MAP = {
  the: '', a: '', an: '', and: '', or: '', with: '', on: '', in: '', to: '', of: '', your: 'your',
  slowly: 'yavaşça', gently: 'nazikçe', repeat: 'tekrarlayın', hold: 'bekleyin',
  begin: 'başlayın', start: 'başlayın', return: 'dönün', lower: 'indirin', lift: 'kaldırın',
  extend: 'uzatın', bend: 'bükün', keep: 'koruyun', maintain: 'sürdürün', engage: 'aktive edin',
  tighten: 'sıkın', relax: 'gevşetin', breathe: 'nefes alın', exhale: 'nefes verin',
  inhale: 'nefes alın', pause: 'duraklayın', switch: 'değiştirin', alternate: 'dönüşümlü yapın',
  desired: 'istediğiniz', number: 'sayı', repetitions: 'tekrar', seconds: 'saniye', minutes: 'dakika',
  floor: 'zemin', ground: 'yer', wall: 'duvar', chair: 'sandalye', bench: 'sehpa',
  feet: 'ayaklar', foot: 'ayak', knees: 'dizler', knee: 'diz', hips: 'kalçalar', hip: 'kalça',
  arms: 'kollar', arm: 'kol', hands: 'eller', hand: 'el', core: 'merkez', spine: 'omurga',
  straight: 'düz', parallel: 'paralel', upright: 'dik', forward: 'öne', backward: 'geriye',
  upward: 'yukarı', downward: 'aşağı', outward: 'dışa', inward: 'içe', sideways: 'yana',
  position: 'pozisyon', movement: 'hareket', motion: 'hareket', tension: 'gerilim',
  muscles: 'kaslar', muscle: 'kas', body: 'vücut', head: 'baş', chest: 'göğüs',
  targeting: 'hedefleyen', targets: 'hedefler', target: 'hedefler',
  beginner: 'başlangıç', intermediate: 'orta', advanced: 'ileri',
}

function normalizeKey(s) {
  return String(s || '').trim().toLowerCase()
}

export function translateMuscle(muscle) {
  const key = normalizeKey(muscle)
  return TARGET_MUSCLE_LABELS[key] || titleCaseTr(muscle)
}

export function translateMovementCategory(category) {
  const key = normalizeKey(category)
  return MOVEMENT_CATEGORY_LABELS[key] || category
}

/** Egzersiz adını Türkçeleştirir */
export function translateExerciseName(name) {
  let text = normalizeKey(name)
  if (!text) return ''

  for (const [en, tr] of PHRASE_MAP) {
    text = text.split(en).join(tr)
  }

  const words = text.split(/\s+/).filter(Boolean)
  const translated = words.map((w) => {
    const clean = w.replace(/[^a-z0-9çğıöşü-]/gi, '')
    return WORD_MAP[clean] !== undefined ? WORD_MAP[clean] : w
  }).filter(Boolean)

  let result = translated.join(' ').replace(/\s+/g, ' ').trim()
  result = result.replace(/\(\s*/g, '(').replace(/\s*\)/g, ')')

  if (!result.endsWith('egzersizi') && !result.endsWith('esnetme') && !result.includes('yoga') && !result.includes('pilates')) {
    if (!/egzersiz|esnetme|squat|plank|burpee|şınav|barfiks|mekik/i.test(result)) {
      result = `${result} egzersizi`
    }
  }

  return titleCaseTr(result)
}

/** Açıklama / talimat cümlesini Türkçeleştirir */
export function translateSentence(sentence) {
  let text = String(sentence || '').trim()
  if (!text) return ''

  for (const [en, tr] of PHRASE_MAP) {
    const re = new RegExp(`\\b${en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    text = text.replace(re, tr)
  }

  return text
    .split(/(?<=[.!?])\s+/)
    .map((clause) => {
      let c = clause.trim()
      const words = c.split(/\s+/)
      const out = words.map((w) => {
        const bare = w.toLowerCase().replace(/[^a-z0-9çğıöşü'-]/gi, '')
        if (WORD_MAP[bare] !== undefined && WORD_MAP[bare] !== '') return WORD_MAP[bare]
        if (WORD_MAP[bare] === '') return ''
        return w
      }).filter(Boolean)
      c = out.join(' ')
      if (c && !/[.!?]$/.test(c)) c += '.'
      return c.charAt(0).toUpperCase() + c.slice(1)
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function buildTurkishDescription(exercise) {
  const parts = []
  if (exercise.description) {
    parts.push(translateSentence(exercise.description))
  }
  const steps = Array.isArray(exercise.instructions) ? exercise.instructions : []
  if (steps.length) {
    parts.push('')
    parts.push('Uygulama adımları:')
    steps.forEach((step, i) => parts.push(`${i + 1}. ${translateSentence(step)}`))
  }
  return parts.join('\n').trim()
}

export function translateExerciseRecord(exercise, _pack) {
  const secondary = (exercise.secondaryMuscles || []).map(translateMuscle)
  return {
    name: translateExerciseName(exercise.name),
    description: buildTurkishDescription(exercise),
    instructions: (exercise.instructions || []).map(translateSentence),
    targetMuscleTr: translateMuscle(exercise.target),
    secondaryMusclesTr: secondary,
    movementCategoryTr: translateMovementCategory(exercise.category),
  }
}

export function titleCaseTr(text) {
  return String(text || '')
    .trim()
    .split(/\s+/)
    .map((w) => {
      if (!w) return w
      if (w === w.toUpperCase() && w.length <= 4) return w
      const paren = w.match(/^\((.+)\)$/)
      if (paren) return `(${paren[1].charAt(0).toUpperCase()}${paren[1].slice(1)})`
      return w.charAt(0).toLocaleUpperCase('tr-TR') + w.slice(1)
    })
    .join(' ')
}

export function difficultyLabelTr(difficulty) {
  return DIFFICULTY_LABELS[normalizeKey(difficulty)] || difficulty
}
