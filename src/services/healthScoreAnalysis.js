/**
 * Sağlık skoru meta — tarihsel healthAnalysis gösterimi için.
 * Yeni AI skor üretimi yok.
 */

export const HEALTH_SCORE_KEYS = [
  'general',
  'nutrition',
  'movement',
  'sleep',
  'stress',
  'lifestyle',
  'motivation',
  'readiness',
]

export const HEALTH_SCORE_META = {
  general: { label: 'Genel Sağlık', emoji: '❤️', color: 'brand' },
  nutrition: { label: 'Beslenme', emoji: '🍎', color: 'sage' },
  movement: { label: 'Hareket', emoji: '🏋️', color: 'amber' },
  sleep: { label: 'Uyku', emoji: '🌙', color: 'sky' },
  stress: { label: 'Stres', emoji: '🧘', color: 'violet' },
  lifestyle: { label: 'Yaşam Tarzı', emoji: '🌿', color: 'emerald' },
  motivation: { label: 'Motivasyon', emoji: '🔥', color: 'orange' },
  readiness: { label: 'Hazır Oluş', emoji: '🚦', color: 'rose' },
}

export const STAFF_BRIEF_KEYS = ['general', 'nutrition', 'movement', 'risks', 'actions']

export const STAFF_BRIEF_META = {
  general: { label: 'Genel durum' },
  nutrition: { label: 'Beslenme' },
  movement: { label: 'Hareket' },
  risks: { label: 'Riskler' },
  actions: { label: 'Aksiyon' },
}
