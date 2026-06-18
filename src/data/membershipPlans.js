// Paket tanımları — bunlar Supabase'den yüklenen verinin fallback'idir.
// Admin panelinden güncellenen veriler DB'den gelir.

export const PAID_MEMBERSHIPS = ['gumus', 'altin', 'platinum', 'premium']
export const isPaidMembership = (membership) => PAID_MEMBERSHIPS.includes(membership)

// Aylık ödeme yapan planlar için varsayılan süre (4 hafta = 1 ay)
export const MONTHLY_DURATION_WEEKS = 4

export const FREE_PLAN = {
  id: 'free',
  name: 'Basic',
  price: 0,
  period: 'Süresiz',
  color: 'sage',
  features: [
    { text: 'Kişisel Sağlık & Vücut Analizi', included: true },
    { text: 'Otomatik Beslenme Programı', included: true },
    { text: 'Otomatik Antrenman Programı', included: true },
    { text: 'Video Kütüphanesi (Temel)', included: true },
    { text: 'Program Takibi', included: true },
    { text: 'Birebir Koç Görüşmesi', included: false },
    { text: 'Diyetisyen Randevusu', included: false },
    { text: 'Manuel Kalori Hesaplama', included: false },
    { text: 'Fotoğraflı Kalori Tespiti', included: false },
  ],
  limits: ['Otomatik programlar', 'Temel video erişimi', 'Standart destek'],
}

export const GUMUS_PLAN = {
  id: 'gumus',
  name: 'Gümüş',
  price: 999,
  period: 'Aylık',
  color: 'slate',
  features: [
    { text: 'Kişisel Sağlık & Vücut Analizi', included: true },
    { text: 'Video Kütüphanesi (Tam Erişim)', included: true },
    { text: 'Haftada 1 Koç Görüşmesi', included: true },
    { text: 'Aylık 1 Diyetisyen Görüşmesi', included: true },
    { text: 'Koç & Diyetisyen Programları', included: true },
    { text: 'Manuel Kalori Hesaplama', included: true },
    { text: 'E-posta Desteği', included: true },
    { text: 'Grup Seansları', included: false },
    { text: 'Fotoğraflı Kalori Tespiti', included: false },
  ],
  limits: ['Haftada 1 koç görüşmesi', 'Aylık 1 diyetisyen', 'Manuel kalori girişi'],
}

export const ALTIN_PLAN = {
  id: 'altin',
  name: 'Altın',
  price: 1999,
  period: 'Aylık',
  color: 'gold',
  badge: 'En Popüler',
  features: [
    { text: 'Kişisel Sağlık & Vücut Analizi', included: true },
    { text: 'Video Kütüphanesi (Tam Erişim)', included: true },
    { text: 'Haftada 2 Koç Görüşmesi', included: true },
    { text: 'Aylık 2 Diyetisyen Görüşmesi', included: true },
    { text: 'Koç & Diyetisyen Programları', included: true },
    { text: 'Manuel Kalori Hesaplama', included: true },
    { text: 'Detaylı İlerleme Raporları', included: true },
    { text: 'Öncelikli Destek', included: true },
    { text: 'Grup Seansları', included: true },
  ],
  limits: ['Haftada 2 koç görüşmesi', 'Aylık 2 diyetisyen', 'Manuel kalori girişi'],
}

export const PLATINUM_PLAN = {
  id: 'platinum',
  name: 'Platinum',
  price: 3499,
  period: 'Aylık',
  color: 'brand',
  badge: 'Premium',
  features: [
    { text: 'Kişisel Sağlık & Vücut Analizi', included: true },
    { text: 'Video Kütüphanesi (Tam Erişim)', included: true },
    { text: 'Haftada 3 Koç Görüşmesi', included: true },
    { text: 'Haftada 1 Diyetisyen Görüşmesi', included: true },
    { text: 'Koç & Diyetisyen Programları', included: true },
    { text: 'Manuel Kalori Hesaplama', included: true },
    { text: 'Fotoğraflı Kalori Tespiti', included: true },
    { text: '7/24 VIP Destek', included: true },
    { text: 'Grup Seansları & Aktiviteler', included: true },
  ],
  limits: ['Haftada 3 koç görüşmesi', 'Haftada 1 diyetisyen', 'Fotoğraflı kalori', '7/24 VIP destek'],
}

// Geriye dönük uyumluluk için
export const PREMIUM_PLAN = ALTIN_PLAN

export const ALL_PLANS = [FREE_PLAN, GUMUS_PLAN, ALTIN_PLAN, PLATINUM_PLAN]

export const ADD_ONS = [
  { id: 'group', name: 'Grup Koçluğu', price: 450, desc: 'Haftalık canlı grup seansları' },
  { id: 'mental', name: 'Mental Wellness', price: 600, desc: 'Meditasyon ve mindfulness seansları' },
  { id: 'nutrition', name: 'Ek Beslenme İncelemesi', price: 350, desc: 'Aylık ek diyetisyen değerlendirmesi' },
  { id: 'video', name: 'Video Kütüphanesi Pro', price: 200, desc: '500+ egzersiz videosu' },
  { id: 'vip', name: 'VIP Destek', price: 300, desc: '7/24 öncelikli yanıt' },
]

export const DEFAULT_PACKAGE = {
  coachMeetingsPerWeek: 2,
  dietitianMeetingsPerMonth: 1,
  durationWeeks: 4,
  addOns: [],
}

// Plan ID'sine göre varsayılan paket konfigürasyonu
export function getDefaultPackageForPlan(planId) {
  switch (planId) {
    case 'gumus':  return { coachMeetingsPerWeek: 1, dietitianMeetingsPerMonth: 1, durationWeeks: 4, addOns: [] }
    case 'altin':  return { coachMeetingsPerWeek: 2, dietitianMeetingsPerMonth: 2, durationWeeks: 4, addOns: [] }
    case 'platinum': return { coachMeetingsPerWeek: 3, dietitianMeetingsPerMonth: 4, durationWeeks: 4, addOns: [] }
    default:       return { ...DEFAULT_PACKAGE }
  }
}

export const COACH_MAX_PER_WEEK = 5
export const DIETITIAN_MAX_PER_MONTH = 6
export const DURATION_MIN_WEEKS = 1
export const DURATION_MAX_WEEKS = 36
