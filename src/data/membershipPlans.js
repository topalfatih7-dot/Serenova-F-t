export const FREE_PLAN = {
  id: 'free',
  name: 'Ücretsiz Üyelik',
  price: 0,
  period: 'Süresiz',
  features: [
    { text: 'Haftalık 1 genel antrenman planı', included: true },
    { text: 'Temel beslenme ipuçları', included: true },
    { text: 'Topluluk erişimi (sınırlı)', included: true },
    { text: 'Birebir koç görüşmesi', included: false },
    { text: 'Diyetisyen randevusu', included: false },
    { text: 'Detaylı takvim ve hatırlatıcılar', included: false },
    { text: 'İlerleme raporları', included: false },
    { text: 'Öncelikli destek', included: false },
  ],
  limits: ['Haftada 1 plan güncellemesi', 'Temel bildirimler', 'Standart destek yanıt süresi'],
}

export const PREMIUM_PLAN = {
  id: 'premium',
  name: 'Premium Üyelik',
  price: null,
  period: 'Özelleştirilebilir',
  features: [
    { text: 'Haftalık 2 koç görüşmesi (varsayılan)', included: true },
    { text: 'Aylık 1 diyetisyen görüşmesi', included: true },
    { text: 'Detaylı takvim takibi', included: true },
    { text: 'Kişiselleştirilmiş hatırlatıcılar', included: true },
    { text: 'Haftalık/aylık ilerleme raporları', included: true },
    { text: 'Öncelikli destek', included: true },
    { text: 'Eklenti seçenekleri', included: true },
    { text: 'Paket özelleştirme', included: true },
  ],
  benefits: [
    'weekly 2 coach meetings',
    'monthly 1 dietitian meeting',
    'detailed calendar tracking',
    'personalized reminders',
    'progress reports',
    'priority support',
    'add-on selection',
  ],
}

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
  durationWeeks: 12,
  progressTracking: 'detailed',
  reminderFrequency: 'daily',
  addOns: [],
}
