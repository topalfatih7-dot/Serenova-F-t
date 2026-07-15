export function calculateBMI(weight, height) {
  const w = Number(weight)
  const h = Number(height)
  if (!w || !h) return null
  const m = h / 100
  if (m <= 0) return null
  return Math.round((w / (m * m)) * 10) / 10
}

export function bmiCategory(bmi) {
  if (bmi == null) return { label: 'Bilinmiyor', color: 'bg-cream-100 text-cream-800/50' }
  if (bmi < 18.5) return { label: 'Zayıf', color: 'bg-amber-50 text-amber-700' }
  if (bmi < 25) return { label: 'Normal', color: 'bg-sage-50 text-sage-700' }
  if (bmi < 30) return { label: 'Fazla kilolu', color: 'bg-orange-50 text-orange-700' }
  return { label: 'Obez', color: 'bg-red-50 text-red-600' }
}

export const GOAL_LABELS = {
  weight: 'Kilo Yönetimi',
  fatburn: 'Yağ Yakımı',
  muscle: 'Kas Kazanımı',
  tone: 'Formda Kalmak',
  endurance: 'Dayanıklılık',
  heart: 'Kalp Sağlığı',
  habit: 'Sağlıklı Alışkanlık',
  sleep: 'Uyku Kalitesi',
  performance: 'Performans',
  confidence: 'Özgüven',
}

export const FITNESS_LABELS = {
  beginner: 'Başlangıç',
  intermediate: 'Orta Seviye',
  advanced: 'İleri Seviye',
}

export const NUTRITION_LABELS = {
  balanced: 'Dengeli Beslenme',
  'high-protein': 'Yüksek Protein',
  vegetarian: 'Vejetaryen',
  vegan: 'Vegan',
  'low-carb': 'Düşük Karbonhidrat',
  'no-pork': 'Domuz Eti Yok',
  'gluten-free': 'Glutensiz',
}
