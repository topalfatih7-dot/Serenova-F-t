// Paket tanımları — bunlar Supabase'den yüklenen verinin fallback'idir.
// Admin panelinden güncellenen veriler DB'den gelir.

export const DURATION_OPTIONS = [
  { months: 1, label: 'Aylık', days: 30 },
  { months: 3, label: '3 Aylık', days: 90 },
  { months: 6, label: '6 Aylık', days: 180 },
]

/** Ay sayısını yaklaşık gün sayısına çevirir (sabit 30 gün/ay varsayımı — UI gösterimi için). */
export function getDurationDays(months = 1) {
  const found = DURATION_OPTIONS.find((o) => o.months === Number(months))
  if (found) return found.days
  return Math.round((Number(months) || 1) * 30)
}

/** Fiyat kartlarında gösterilecek kısa süre etiketi: "30 gün", "Tek seferlik", "Süresiz" */
export function getPlanDurationLabel(plan) {
  if (!plan) return ''
  if (plan.price === 0) return 'Süresiz'
  if (plan.period === 'Tek Seferlik') return 'Tek seferlik'
  return `${getDurationDays(1)} gün`
}

export const PAID_MEMBERSHIPS = [
  'eko', 'diyet', 'spor', 'doktor', 'vip',
  // geriye dönük uyumluluk
  'kurucu', 'gumus', 'altin', 'platinum', 'premium',
]

export const PLAN_IDS = ['free', 'eko', 'diyet', 'spor', 'doktor', 'vip']

export const PLAN_LABELS = {
  free: 'Basic',
  eko: 'Eko Paket',
  diyet: 'Diyet Paketi',
  spor: 'Spor Paketi',
  doktor: 'Doktor Paketi',
  vip: 'Vip Paket',
  kurucu: '100 Kurucu Üye',
  gumus: 'Gümüş',
  altin: 'Altın',
  platinum: 'Platinum',
  premium: 'Premium',
}

export const RECOMMENDED_PLAN = 'vip'

/** Fiyat gösterimi: "Aylık 3.499₺" */
export function formatMonthlyPrice(price) {
  if (!price || price <= 0) return 'Ücretsiz'
  return `Aylık ${Number(price).toLocaleString('tr-TR')}₺`
}

export function getPlanBadge(plan) {
  return plan?.badge || null
}

/** Landing / onboarding için önerilen sıra */
export const PLAN_DISPLAY_ORDER = ['free', 'eko', 'diyet', 'spor', 'doktor', 'vip']

export function sortPlansForDisplay(plans = []) {
  return [...plans].sort((a, b) => {
    const ia = PLAN_DISPLAY_ORDER.indexOf(a.id)
    const ib = PLAN_DISPLAY_ORDER.indexOf(b.id)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })
}

export const isPaidMembership = (membership) => PAID_MEMBERSHIPS.includes(membership)

export function getPlanLabel(id) {
  return PLAN_LABELS[id] || id
}

/** Üyelik planı → görsel rozet seviyesi */
export function getMembershipBadgeTier(membership) {
  if (membership === 'eko' || membership === 'gumus') return 'silver'
  if (membership === 'diyet' || membership === 'spor' || membership === 'altin' || membership === 'doktor') return 'gold'
  if (membership === 'vip' || membership === 'platinum' || membership === 'premium') {
    return 'platinum'
  }
  return 'free'
}

/** Plan + süre için fiyat (TL) */
export const PLAN_PRICING = {
  eko: { 1: 1299, 3: 2999, 6: 3999 },
  diyet: { 1: 2499, 3: 6499, 6: 9999 },
  spor: { 1: 2499, 3: 6499, 6: 9999 },
  doktor: { 1: 1500 },
  vip: { 1: 4999, 3: 12999, 6: 19999 },
}

export function getTierPrice(planId, months = 1) {
  const m = Number(months) || 1
  const tiers = PLAN_PRICING[planId]
  if (!tiers) return 0
  return tiers[m] || tiers[1] || 0
}

export function getCompareAtPrice(planId, months = 1) {
  const m = Number(months) || 1
  return PLAN_PRICING[planId]?.compareAt?.[m] || null
}

export function buildPricingTiers(planId) {
  return DURATION_OPTIONS.map(({ months, label }) => ({
    months,
    label,
    price: getTierPrice(planId, months),
    compareAt: getCompareAtPrice(planId, months),
  }))
}

export const FREE_PLAN = {
  id: 'free',
  name: 'Basic',
  price: 0,
  period: 'Süresiz',
  color: 'sage',
  pricingTiers: [],
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

export const EKO_PLAN = {
  id: 'eko',
  name: 'Eko Paket',
  price: 1299,
  period: 'Aylık',
  color: 'sage',
  pricingTiers: buildPricingTiers('eko'),
  features: [
    { text: 'Manuel Kalori Hesaplama', included: true },
    { text: 'Diyet Programı Ayda 2 Kere', included: true },
    { text: 'Spor Programı Ayda 1 Kere', included: true },
    { text: 'Video Kütüphanesi (Sınırlı)', included: true },
    { text: 'İlerleme Raporları', included: true },
    { text: 'Takip Programı', included: true },
    { text: 'Birebir Koç Görüşmesi', included: false },
    { text: 'Diyetisyen Randevusu', included: false },
    { text: 'Fotoğraflı Kalori Tespiti', included: false },
  ],
  limits: ['Sınırlı video erişimi', 'Program güncellemeleri', 'Standart destek'],
}

export const DIYET_PLAN = {
  id: 'diyet',
  name: 'Diyet Paketi',
  price: 2499,
  period: 'Aylık',
  color: 'emerald',
  pricingTiers: buildPricingTiers('diyet'),
  features: [
    { text: 'Doktor Tarafından Kan Tahlili Testi Analizi', included: true },
    { text: 'Kişisel Sağlık & Vücut Analizi', included: true },
    { text: 'Fotoğraflı ve Manuel Kalori Hesaplama', included: true },
    { text: 'Ayda 2 Diyetisyen ile Online Görüşme', included: true },
    { text: 'Diyet Üyeye Özel Diyet Programı', included: true },
    { text: 'Sınırsız İlerleme Raporları', included: true },
    { text: 'Takip Programı', included: true },
    { text: 'Sınırsız Destek', included: true },
    { text: 'Birebir Koç Görüşmesi', included: false },
  ],
  limits: ['Ayda 2 diyetisyen görüşmesi', 'Kişisel diyet programı', 'Sınırsız destek'],
}

export const SPOR_PLAN = {
  id: 'spor',
  name: 'Spor Paketi',
  price: 2499,
  period: 'Aylık',
  color: 'blue',
  pricingTiers: buildPricingTiers('spor'),
  features: [
    { text: 'Doktor Tarafından Kan Tahlili Testi Analizi', included: true },
    { text: 'Kişisel Sağlık & Vücut Analizi', included: true },
    { text: 'Fotoğraflı ve Manuel Kalori Hesaplama', included: true },
    { text: 'Ayda 2 Koç ile Online Görüşme', included: true },
    { text: 'Spor Üyeye Özel Spor Programı', included: true },
    { text: 'Sınırsız Video Kütüphanesi Erişimi', included: true },
    { text: 'Sınırsız İlerleme Raporları', included: true },
    { text: 'Takip Programı', included: true },
    { text: 'Sınırsız Destek', included: true },
  ],
  limits: ['Ayda 2 koç görüşmesi', 'Kişisel spor programı', 'Sınırsız video'],
}

export const DOKTOR_PLAN = {
  id: 'doktor',
  name: 'Doktor Paketi',
  price: 1500,
  period: 'Tek Seferlik',
  color: 'teal',
  badge: null,
  pricingTiers: [{ months: 1, label: 'Tek Seferlik', price: 1500 }],
  features: [
    { text: '1 Online Doktor Görüşmesi', included: true },
    { text: 'Görüntülü Görüşme', included: true },
  ],
  limits: ['Tek seferlik doktor görüşmesi'],
}

export const VIP_PLAN = {
  id: 'vip',
  name: 'Vip Paket',
  price: 4999,
  period: 'Aylık',
  color: 'brand',
  badge: 'VIP',
  pricingTiers: buildPricingTiers('vip'),
  features: [
    { text: 'Kan Tahlili Testi Analizi', included: true },
    { text: 'Kişisel Sağlık & Vücut Analizi', included: true },
    { text: 'Fotoğraflı ve Manuel Kalori Hesaplama', included: true },
    { text: 'Ayda 2 Diyetisyen ile Online Görüşme', included: true },
    { text: 'Vip Üyeye Özel Diyet Programı', included: true },
    { text: 'Ayda 2 Koç ile Online Görüşme', included: true },
    { text: 'Vip Üyeye Özel Spor Programı', included: true },
    { text: 'Sınırsız Video Kütüphanesi Erişimi', included: true },
    { text: 'Sınırsız İlerleme Raporları', included: true },
    { text: 'Ücretsiz Takip Programı', included: true },
    { text: 'Sınırsız Destek', included: true },
    { text: 'Vip Üye Rozeti', included: true },
  ],
  limits: ['Ayda 2 koç + 2 diyetisyen', 'Sınırsız destek', 'VIP rozeti'],
}

// Geriye dönük uyumluluk
export const GUMUS_PLAN = EKO_PLAN
export const ALTIN_PLAN = DOKTOR_PLAN
export const PLATINUM_PLAN = VIP_PLAN
export const PREMIUM_PLAN = VIP_PLAN
export const KURUCU_PLAN = DOKTOR_PLAN

export const ALL_PLANS = [FREE_PLAN, EKO_PLAN, DIYET_PLAN, SPOR_PLAN, DOKTOR_PLAN, VIP_PLAN]

export const ADD_ONS = [
  { id: 'group', name: 'Grup Koçluğu', price: 450, desc: 'Haftalık canlı grup seansları' },
  { id: 'mental', name: 'Mental Wellness', price: 600, desc: 'Meditasyon ve mindfulness seansları' },
  { id: 'nutrition', name: 'Ek Beslenme İncelemesi', price: 350, desc: 'Aylık ek diyetisyen değerlendirmesi' },
  { id: 'video', name: 'Video Kütüphanesi Pro', price: 200, desc: '500+ egzersiz videosu' },
  { id: 'vip', name: 'VIP Destek', price: 300, desc: '7/24 öncelikli yanıt' },
]

export const DEFAULT_PACKAGE = {
  coachMeetingsPerMonth: 0,
  dietitianMeetingsPerMonth: 0,
  doctorMeetingsPerMonth: 0,
  coachMeetingsPerWeek: 0,
  durationMonths: 1,
  durationWeeks: 4,
  addOns: [],
}

const PACKAGE_BY_PLAN = {
  eko: { coachMeetingsPerMonth: 0, dietitianMeetingsPerMonth: 0, doctorMeetingsPerMonth: 0 },
  diyet: { coachMeetingsPerMonth: 0, dietitianMeetingsPerMonth: 2, doctorMeetingsPerMonth: 0 },
  spor: { coachMeetingsPerMonth: 2, dietitianMeetingsPerMonth: 0, doctorMeetingsPerMonth: 0 },
  doktor: { coachMeetingsPerMonth: 0, dietitianMeetingsPerMonth: 0, doctorMeetingsPerMonth: 0, doctorSessionsTotal: 1, billingType: 'one_time' },
  vip: { coachMeetingsPerMonth: 2, dietitianMeetingsPerMonth: 2, doctorMeetingsPerMonth: 0 },
  kurucu: { coachMeetingsPerMonth: 2, dietitianMeetingsPerMonth: 2, doctorMeetingsPerMonth: 0 },
  // legacy
  gumus: { coachMeetingsPerMonth: 0, dietitianMeetingsPerMonth: 1, doctorMeetingsPerMonth: 0, coachMeetingsPerWeek: 1 },
  altin: { coachMeetingsPerMonth: 2, dietitianMeetingsPerMonth: 2, doctorMeetingsPerMonth: 0, coachMeetingsPerWeek: 2 },
  platinum: { coachMeetingsPerMonth: 4, dietitianMeetingsPerMonth: 4, doctorMeetingsPerMonth: 0, coachMeetingsPerWeek: 3 },
  premium: { coachMeetingsPerMonth: 2, dietitianMeetingsPerMonth: 2, doctorMeetingsPerMonth: 0, coachMeetingsPerWeek: 2 },
}

/** Plan ID + süre (ay) için varsayılan paket konfigürasyonu */
export function getDefaultPackageForPlan(planId, durationMonths = 1) {
  if (planId === 'doktor') {
    return {
      ...DEFAULT_PACKAGE,
      ...PACKAGE_BY_PLAN.doktor,
      durationMonths: 0,
      durationWeeks: 0,
      addOns: [],
    }
  }
  const months = Number(durationMonths) || 1
  const base = PACKAGE_BY_PLAN[planId] || { coachMeetingsPerMonth: 0, dietitianMeetingsPerMonth: 0, doctorMeetingsPerMonth: 0 }
  return {
    ...DEFAULT_PACKAGE,
    ...base,
    durationMonths: months,
    durationWeeks: months * 4,
    addOns: [],
  }
}

/** Fotoğraflı kalori erişimi olan planlar */
export function hasPhotoCalorieAccess(membership) {
  return ['diyet', 'spor', 'vip', 'platinum', 'kurucu'].includes(membership)
}

/** Manuel kalori erişimi olan planlar */
export function hasManualCalorieAccess(membership) {
  return membership !== 'free'
}

/** Tam video kütüphanesi erişimi */
export function hasFullVideoAccess(membership) {
  return ['spor', 'vip', 'altin', 'platinum', 'premium', 'kurucu'].includes(membership)
}

export const COACH_MAX_PER_MONTH = 6
export const DIETITIAN_MAX_PER_MONTH = 6
export const DURATION_MIN_MONTHS = 1
export const DURATION_MAX_MONTHS = 12

/** Pakette koç görüşmesi var mı (aylık veya haftalık limit) */
export function packageIncludesCoach(packageConfig = {}) {
  return (Number(packageConfig.coachMeetingsPerMonth) || Number(packageConfig.coachMeetingsPerWeek) || 0) > 0
}

/** Pakette diyetisyen görüşmesi var mı */
export function packageIncludesDietitian(packageConfig = {}) {
  return (Number(packageConfig.dietitianMeetingsPerMonth) || 0) > 0
}

/** Pakette doktor görüşmesi var mı (tek seferlik veya aylık) */
export function packageIncludesDoctor(packageConfig = {}) {
  const total = Number(packageConfig.doctorSessionsTotal) || 0
  if (total > 0) {
    const remaining = packageConfig.doctorSessionsRemaining
    if (remaining != null && !Number.isNaN(Number(remaining))) return Number(remaining) > 0
    return true
  }
  return (Number(packageConfig.doctorMeetingsPerMonth) || 0) > 0
}

/** Koç görüşme limitini aylık olarak döndürür */
export function getCoachMeetingsPerMonth(packageConfig = {}) {
  return Number(packageConfig.coachMeetingsPerMonth) || (Number(packageConfig.coachMeetingsPerWeek) || 0) * 4
}

/** Üyenin paketine göre eksik koç/diyetisyen ataması var mı */
export function memberNeedsStaffAssignment(member) {
  const pkg = member?.packageConfig || {}
  const needsCoach = packageIncludesCoach(pkg) && !member?.assignedCoachId
  const needsDiet = packageIncludesDietitian(pkg) && !member?.assignedDietitianId
  const needsDoctor = packageIncludesDoctor(pkg) && !member?.assignedDoctorId
  return needsCoach || needsDiet || needsDoctor
}

/** Paket kapsamı dışındaki atama ve randevuları temizler (plan değişiminde) */
export function sanitizeStaffForPackage(packageConfig, data = {}) {
  const includeCoach = packageIncludesCoach(packageConfig)
  const includeDiet = packageIncludesDietitian(packageConfig)
  const includeDoctor = packageIncludesDoctor(packageConfig)
  return {
    ...data,
    assignedCoachId: includeCoach ? (data.assignedCoachId ?? null) : null,
    assignedDietitianId: includeDiet ? (data.assignedDietitianId ?? null) : null,
    assignedDoctorId: includeDoctor ? (data.assignedDoctorId ?? null) : null,
    coachSessions: includeCoach ? (data.coachSessions ?? []) : [],
    dietitianSessions: includeDiet ? (data.dietitianSessions ?? []) : [],
    doctorSessions: includeDoctor ? (data.doctorSessions ?? []) : [],
  }
}
