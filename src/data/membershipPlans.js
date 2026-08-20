// Paket tanımları — bunlar Supabase'den yüklenen verinin fallback'idir.
// Admin panelinden güncellenen veriler DB'den gelir.

/** Paket süre seçenekleri — gerçek bitiş `computePremiumExpiresAt` ile takvim ayı (setMonth). */
export const DURATION_OPTIONS = [
  { months: 1, label: 'Aylık', shortLabel: '1 ay' },
  { months: 3, label: '3 Aylık', shortLabel: '3 ay' },
  { months: 6, label: '6 Aylık', shortLabel: '6 ay' },
]

/** Takvim ayı etiketi (bitiş hesabıyla aynı model). */
export function getDurationMonthsLabel(months = 1) {
  const m = Number(months) || 1
  const found = DURATION_OPTIONS.find((o) => o.months === m)
  if (found) return found.shortLabel
  return `${m} ay`
}

/** Fiyat kartlarında kısa süre: "1 ay", "Tek seferlik", "Süresiz" (takvim ayı modeli). */
export function getPlanDurationLabel(plan) {
  if (!plan) return ''
  if (plan.price === 0) return 'Süresiz'
  if (plan.period === 'Tek Seferlik' || plan.id === 'doktor') return 'Tek seferlik'
  return getDurationMonthsLabel(1)
}

/** Tek seferlik plan mı (fiyat/CTA gösterimi) */
export function isOneTimeBillingPlan(plan) {
  if (!plan) return false
  if (plan.billingType === 'one_time') return true
  if (plan.id === 'doktor') return true
  return plan.period === 'Tek Seferlik'
}

/** Admin oluşturma: slug plan id */
export const PLAN_ID_PATTERN = /^[a-z][a-z0-9_]*$/
export function isValidPlanId(id) {
  return typeof id === 'string' && PLAN_ID_PATTERN.test(id) && id.length >= 2 && id.length <= 40
}

/** Stripe GBP settlement (~£0.30) için TRY güvenli alt sınır — api/_stripe.js ile aynı */
export const STRIPE_MIN_AMOUNT_TRY = 50

export function validateSellablePlanPricing(plan) {
  if (!plan || plan.isSellable !== true) return null
  const price = Number(plan.price) || 0
  if (price > 0 && price < STRIPE_MIN_AMOUNT_TRY) {
    return `Satışa açık paketlerde Stripe minimumu ${STRIPE_MIN_AMOUNT_TRY}₺. Taban fiyatı yükseltin.`
  }
  for (const t of plan.pricingTiers || []) {
    const p = Number(t.price) || 0
    if (p > 0 && p < STRIPE_MIN_AMOUNT_TRY) {
      return `Fiyat katmanı "${t.label || `${t.months} ay`}" Stripe minimumunun altında (${STRIPE_MIN_AMOUNT_TRY}₺).`
    }
  }
  return null
}

/** Runtime plan kataloğu (AppContext hydrate sonrası) */
let _planCatalog = new Map()

export function setPlanCatalog(plans = []) {
  const next = new Map()
  for (const p of plans || []) {
    if (p?.id) next.set(p.id, p)
  }
  _planCatalog = next
}

export function getPlanFromCatalog(id) {
  if (!id) return null
  if (_planCatalog.has(id)) return _planCatalog.get(id)
  // ALL_PLANS / FREE_PLAN modül init sırasında TDZ'de olabilir (buildPricingTiers)
  try {
    const found = ALL_PLANS.find((p) => p.id === id)
    if (found) return found
  } catch { /* TDZ during module init */ }
  try {
    if (id === 'free') return FREE_PLAN
  } catch { /* TDZ */ }
  return null
}

export function emptyEntitlements() {
  return {
    coachMeetingsPerMonth: 0,
    dietitianMeetingsPerMonth: 0,
    doctorMeetingsPerMonth: 0,
    doctorSessionsTotal: 0,
    photoCalorie: false,
    manualCalorie: false,
  }
}

export function normalizeEntitlements(raw = {}) {
  const e = emptyEntitlements()
  if (!raw || typeof raw !== 'object') return e
  e.coachMeetingsPerMonth = Math.max(0, Number(raw.coachMeetingsPerMonth) || 0)
  e.dietitianMeetingsPerMonth = Math.max(0, Number(raw.dietitianMeetingsPerMonth) || 0)
  e.doctorMeetingsPerMonth = Math.max(0, Number(raw.doctorMeetingsPerMonth) || 0)
  e.doctorSessionsTotal = Math.max(0, Number(raw.doctorSessionsTotal) || 0)
  e.photoCalorie = Boolean(raw.photoCalorie)
  e.manualCalorie = Boolean(raw.manualCalorie)
  return e
}

export function entitlementsToPackageConfig(entitlements, billingType = 'recurring', durationMonths = 1) {
  const e = normalizeEntitlements(entitlements)
  const oneTime = billingType === 'one_time'
  const months = Number(durationMonths) || 1
  return {
    ...DEFAULT_PACKAGE,
    coachMeetingsPerMonth: e.coachMeetingsPerMonth,
    dietitianMeetingsPerMonth: e.dietitianMeetingsPerMonth,
    doctorMeetingsPerMonth: e.doctorMeetingsPerMonth,
    ...(e.doctorSessionsTotal > 0 ? { doctorSessionsTotal: e.doctorSessionsTotal } : {}),
    ...(oneTime
      ? { billingType: 'one_time', durationMonths: 0, durationWeeks: 0 }
      : { durationMonths: months, durationWeeks: months * 4 }),
    addOns: [],
  }
}

/** Fiyat gösterimi: "Aylık 3.499₺" */
export function formatMonthlyPrice(price) {
  if (!price || price <= 0) return 'Ücretsiz'
  return `Aylık ${Number(price).toLocaleString('tr-TR')}₺`
}

/** Plan kartı fiyatı — tek seferlikte "Aylık" öneki yok */
export function formatPlanPrice(plan) {
  if (!plan || !plan.price || plan.price <= 0) return 'Ücretsiz'
  const amount = `${Number(plan.price).toLocaleString('tr-TR')}₺`
  if (isOneTimeBillingPlan(plan)) return amount
  return `Aylık ${amount}`
}

export const PAID_MEMBERSHIPS = [
  'eko', 'eko_diyet', 'eko_spor', 'diyet', 'spor', 'doktor', 'vip',
  // geriye dönük uyumluluk (mevcut üyeler)
  'kurucu', 'gumus', 'altin', 'platinum', 'premium',
]

/** Satışa açık planlar (eski tek `eko` kapalı) */
export const SELLABLE_PLAN_IDS = ['eko_diyet', 'diyet', 'eko_spor', 'spor', 'doktor', 'vip']

/** Admin atama dropdown — eski `eko` yeni atanmaz; free = süre bitmiş fallback */
export const ADMIN_ASSIGNABLE_PLAN_IDS = ['free', 'eko_diyet', 'diyet', 'eko_spor', 'spor', 'doktor', 'vip']

export const PLAN_IDS = ['free', 'eko', 'eko_diyet', 'eko_spor', 'diyet', 'spor', 'doktor', 'vip']

export const PLAN_LABELS = {
  free: 'Ücretsiz',
  eko: 'Eko Paket (eski)',
  eko_diyet: 'Eko Diyet Paketi',
  eko_spor: 'Eko Spor Paketi',
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

export function getPlanBadge(plan) {
  return plan?.badge || null
}

/** Landing / onboarding için önerilen sıra (yalnızca satılan paketler) */
export const PLAN_DISPLAY_ORDER = ['eko_diyet', 'diyet', 'eko_spor', 'spor', 'doktor', 'vip']

export function sortPlansForDisplay(plans = []) {
  const sellable = (plans || []).filter((p) => {
    if (!p?.id || p.id === 'free') return false
    if (p.isActive === false) return false
    if (typeof p.isSellable === 'boolean') return p.isSellable
    return SELLABLE_PLAN_IDS.includes(p.id)
  })
  return [...sellable].sort((a, b) => {
    const sa = Number(a.sortOrder)
    const sb = Number(b.sortOrder)
    if (Number.isFinite(sa) && Number.isFinite(sb) && sa !== sb) return sa - sb
    const ia = PLAN_DISPLAY_ORDER.indexOf(a.id)
    const ib = PLAN_DISPLAY_ORDER.indexOf(b.id)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })
}

/** Ücretli üyelik: free değil + legacy set veya katalogda fiyatlı/satılabilir */
export function isPaidMembership(membership) {
  if (!membership || membership === 'free') return false
  if (PAID_MEMBERSHIPS.includes(membership)) return true
  const plan = getPlanFromCatalog(membership)
  if (plan) return Number(plan.price) > 0 || plan.isSellable === true
  return true
}

/** Admin atama listesi — free + aktif planlar (DB) */
export function getAdminAssignablePlanIds(plans = []) {
  const ids = ['free']
  for (const p of plans || []) {
    if (!p?.id || p.id === 'free') continue
    if (p.isActive === false) continue
    ids.push(p.id)
  }
  return ids.length > 1 ? ids : [...ADMIN_ASSIGNABLE_PLAN_IDS]
}

/** Dashboard erişimi: kayıtlı üye (ücretsiz dahil) süresiz gezebilir. */
export function canAccessMemberDashboard() {
  return true
}

export function isSellablePlanId(id, plans) {
  if (!id || id === 'free') return false
  const list = plans || (_planCatalog.size ? Array.from(_planCatalog.values()) : null)
  if (list?.length) {
    const plan = list.find((p) => p.id === id) || getPlanFromCatalog(id)
    if (plan) {
      if (plan.isActive === false) return false
      if (typeof plan.isSellable === 'boolean') return plan.isSellable
      // is_sellable kolonu henüz map edilmediyse: fiyatlı aktif planı satılabilir say
      return Number(plan.price) > 0 || SELLABLE_PLAN_IDS.includes(id)
    }
  }
  return SELLABLE_PLAN_IDS.includes(id)
}

export function getPlanLabel(id) {
  const plan = getPlanFromCatalog(id)
  if (plan?.name) return plan.name
  return PLAN_LABELS[id] || id
}

/** Üyelik planı → görsel rozet seviyesi */
export function getMembershipBadgeTier(membership) {
  if (membership === 'eko' || membership === 'eko_diyet' || membership === 'eko_spor' || membership === 'gumus') {
    return 'silver'
  }
  if (membership === 'doktor' || membership === 'kurucu') return 'silver'
  if (membership === 'diyet' || membership === 'spor' || membership === 'altin') return 'gold'
  if (membership === 'vip' || membership === 'platinum' || membership === 'premium') {
    return 'platinum'
  }
  return 'free'
}

/** Plan + süre için fiyat (TL) */
export const PLAN_PRICING = {
  eko: { 1: 1299, 3: 2999, 6: 3999 },
  eko_diyet: { 1: 1299, 3: 2999, 6: 3999 },
  eko_spor: { 1: 1299, 3: 2999, 6: 3999 },
  diyet: { 1: 2499, 3: 6499, 6: 9999 },
  spor: { 1: 2499, 3: 6499, 6: 9999 },
  doktor: { 1: 1500 },
  vip: { 1: 4999, 3: 12999, 6: 19999 },
}

/** Plan + süre fiyatı — önce DB/katalog pricingTiers, yoksa PLAN_PRICING fallback */
export function getTierPrice(planId, months = 1, planRow = null) {
  const m = Number(months) || 1
  // Modül init'te ALL_PLANS TDZ'sine düşmemek için önce Map / verilen satır
  const plan = planRow || (_planCatalog.size ? _planCatalog.get(planId) : null)
  if (plan) {
    const tiers = plan.pricingTiers || []
    if (Array.isArray(tiers) && tiers.length) {
      const tier = tiers.find((t) => Number(t.months) === m)
      if (tier != null && tier.price != null && Number(tier.price) > 0) return Number(tier.price)
      if (m === 1) {
        const first = tiers.find((t) => Number(t.price) > 0)
        if (first) return Number(first.price)
      }
    }
    if (Number(plan.price) > 0 && (m === 1 || !tiers.length)) return Number(plan.price)
  }
  const hardcoded = PLAN_PRICING[planId]
  if (!hardcoded) return 0
  return hardcoded[m] || hardcoded[1] || 0
}

/** Uzun süre seçiminde aylık baz fiyata göre yüzde tasarruf (ör. 6 ay VIP). */
export function getDurationSavingsPercent(planId, months = 1) {
  const m = Number(months) || 1
  if (m <= 1) return 0
  const monthly = getTierPrice(planId, 1)
  const bundle = getTierPrice(planId, m)
  if (!monthly || !bundle) return 0
  const full = monthly * m
  if (full <= bundle) return 0
  return Math.round(((full - bundle) / full) * 100)
}

export const RECOMMENDED_DURATION_MONTHS = 6

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
  name: 'Ücretsiz',
  price: 0,
  period: 'Süresiz',
  color: 'sage',
  badge: 'Ücretsiz',
  isSellable: false,
  isActive: true,
  billingType: 'recurring',
  entitlements: emptyEntitlements(),
  pricingTiers: [],
  features: [
    { text: 'Süresiz hesap ve panele giriş', included: true },
    { text: 'Sağlık testi doldurma', included: true },
    { text: 'AI sağlık skorları (genel + kategoriler)', included: true },
    { text: 'Uzman raporu & skor grafiği', included: false },
    { text: 'Program, takvim, kütüphane', included: false },
    { text: 'Mesajlar & kalori AI', included: false },
  ],
  limits: ['Ücretli özellikler kilitlidir; istediğiniz zaman paket seçebilirsiniz'],
}

export const EKO_PLAN = {
  id: 'eko',
  name: 'Eko Paket (eski)',
  price: 1299,
  period: 'Aylık',
  color: 'sage',
  pricingTiers: buildPricingTiers('eko'),
  features: [
    { text: 'Manuel Kalori Hesaplama', included: true },
    { text: 'Video Kütüphanesi (Sınırlı)', included: true },
    { text: 'İlerleme Raporları', included: true },
    { text: 'Takip Programı', included: true },
    { text: 'Birebir Koç Görüşmesi', included: false },
    { text: 'Diyetisyen Randevusu', included: false },
    { text: 'Fotoğraflı Kalori Tespiti', included: false },
  ],
  limits: ['Yeni satış kapalı — mevcut üyeler admin ile taşınır'],
}

export const EKO_DIYET_PLAN = {
  id: 'eko_diyet',
  name: 'Eko Diyet Paketi',
  price: 1299,
  period: 'Aylık',
  color: 'sage',
  icon: 'Salad',
  badge: 'Eko',
  isSellable: true,
  isActive: true,
  billingType: 'recurring',
  sortOrder: 0,
  entitlements: {
    coachMeetingsPerMonth: 0, dietitianMeetingsPerMonth: 1, doctorMeetingsPerMonth: 0, doctorSessionsTotal: 0,
    photoCalorie: true, manualCalorie: true,
  },
  pricingTiers: buildPricingTiers('eko_diyet'),
  features: [
    { text: 'Doktor Tarafından Kan Tahlili Testi Analizi', included: true },
    { text: 'Yeniform Kişisel Sağlık Analizi', included: true },
    { text: 'Fotoğraflı ve Manuel Kalori Hesaplama', included: true },
    { text: 'Ayda 1 Diyetisyen ile Online Görüşme', included: true },
    { text: 'Diyet Üyeye Özel Diyet Programı', included: true },
    { text: 'Sınırsız İlerleme Raporları', included: true },
    { text: 'Takip Programı', included: true },
    { text: 'Sınırsız Destek', included: true },
    { text: 'Birebir Koç Görüşmesi', included: false },
  ],
  limits: ['Uzman diyetisyen desteğiyle sürdürülebilir beslenme', 'Kişisel diyet programı', 'Sınırsız destek'],
}

export const DIYET_PLAN = {
  id: 'diyet',
  name: 'Diyet Paketi',
  price: 2499,
  period: 'Aylık',
  color: 'emerald',
  icon: 'Apple',
  isSellable: true,
  isActive: true,
  billingType: 'recurring',
  sortOrder: 1,
  entitlements: {
    coachMeetingsPerMonth: 0, dietitianMeetingsPerMonth: 2, doctorMeetingsPerMonth: 0, doctorSessionsTotal: 0,
    photoCalorie: true, manualCalorie: true,
  },
  pricingTiers: buildPricingTiers('diyet'),
  features: [
    { text: 'Doktor Tarafından Kan Tahlili Testi Analizi', included: true },
    { text: 'Yeniform Kişisel Sağlık Analizi', included: true },
    { text: 'Fotoğraflı ve Manuel Kalori Hesaplama', included: true },
    { text: 'Ayda 2 Diyetisyen ile Online Görüşme', included: true },
    { text: 'Diyet Üyeye Özel Diyet Programı', included: true },
    { text: 'Sınırsız İlerleme Raporları', included: true },
    { text: 'Takip Programı', included: true },
    { text: 'Sınırsız Destek', included: true },
    { text: 'Birebir Koç Görüşmesi', included: false },
  ],
  limits: ['Uzman diyetisyen desteğiyle sürdürülebilir beslenme', 'Kişisel diyet programı', 'Sınırsız destek'],
}

export const EKO_SPOR_PLAN = {
  id: 'eko_spor',
  name: 'Eko Spor Paketi',
  price: 1299,
  period: 'Aylık',
  color: 'sky',
  icon: 'Footprints',
  badge: 'Eko',
  isSellable: true,
  isActive: true,
  billingType: 'recurring',
  sortOrder: 2,
  entitlements: {
    coachMeetingsPerMonth: 1, dietitianMeetingsPerMonth: 0, doctorMeetingsPerMonth: 0, doctorSessionsTotal: 0,
    photoCalorie: true, manualCalorie: true,
  },
  pricingTiers: buildPricingTiers('eko_spor'),
  features: [
    { text: 'Yeniform Kişisel Sağlık Analizi', included: true },
    { text: 'Fotoğraflı ve Manuel Kalori Hesaplama', included: true },
    { text: 'Ayda 1 Koç ile Online Görüşme', included: true },
    { text: 'Spor Üyeye Özel Spor Programı', included: true },
    { text: 'Sınırsız Video Kütüphanesi Erişimi', included: true },
    { text: 'Sınırsız İlerleme Raporları', included: true },
    { text: 'Takip Programı', included: true },
    { text: 'Sınırsız Destek', included: true },
  ],
  limits: ['Spor yapanlar için profesyonel takip', 'Kişisel spor programı', 'Sınırsız video'],
}

export const SPOR_PLAN = {
  id: 'spor',
  name: 'Spor Paketi',
  price: 2499,
  period: 'Aylık',
  color: 'blue',
  icon: 'Dumbbell',
  isSellable: true,
  isActive: true,
  billingType: 'recurring',
  sortOrder: 3,
  entitlements: {
    coachMeetingsPerMonth: 2, dietitianMeetingsPerMonth: 0, doctorMeetingsPerMonth: 0, doctorSessionsTotal: 0,
    photoCalorie: true, manualCalorie: true,
  },
  pricingTiers: buildPricingTiers('spor'),
  features: [
    { text: 'Yeniform Kişisel Sağlık Analizi', included: true },
    { text: 'Fotoğraflı ve Manuel Kalori Hesaplama', included: true },
    { text: 'Ayda 2 Koç ile Online Görüşme', included: true },
    { text: 'Spor Üyeye Özel Spor Programı', included: true },
    { text: 'Sınırsız Video Kütüphanesi Erişimi', included: true },
    { text: 'Sınırsız İlerleme Raporları', included: true },
    { text: 'Takip Programı', included: true },
    { text: 'Sınırsız Destek', included: true },
  ],
  limits: ['Spor yapanlar için profesyonel takip', 'Kişisel spor programı', 'Sınırsız video'],
}

export const DOKTOR_PLAN = {
  id: 'doktor',
  name: 'Doktor Paketi',
  price: 1500,
  period: 'Tek Seferlik',
  color: 'violet',
  icon: 'Stethoscope',
  badge: 'Tek Seferlik',
  isSellable: true,
  isActive: true,
  billingType: 'one_time',
  sortOrder: 4,
  entitlements: {
    coachMeetingsPerMonth: 0, dietitianMeetingsPerMonth: 0, doctorMeetingsPerMonth: 0, doctorSessionsTotal: 1,
    photoCalorie: false, manualCalorie: false,
  },
  pricingTiers: [{ months: 1, label: 'Tek Seferlik', price: 1500 }],
  features: [
    { text: '1 Online Doktor Görüşmesi', included: true },
    { text: 'Görüntülü Görüşme', included: true },
    { text: 'Mevcut üyeliğe ek paket olarak eklenebilir', included: true },
  ],
  limits: ['İhtiyaç duyduğunuz anda uzman desteği alın'],
}

export const VIP_PLAN = {
  id: 'vip',
  name: 'Vip Paket',
  price: 4999,
  period: 'Aylık',
  color: 'gold',
  icon: 'Crown',
  badge: 'VIP',
  isSellable: true,
  isActive: true,
  billingType: 'recurring',
  sortOrder: 5,
  entitlements: {
    coachMeetingsPerMonth: 2, dietitianMeetingsPerMonth: 2, doctorMeetingsPerMonth: 0, doctorSessionsTotal: 0,
    photoCalorie: true, manualCalorie: true,
  },
  pricingTiers: buildPricingTiers('vip'),
  features: [
    { text: 'Kan Tahlili Testi Analizi', included: true },
    { text: 'Yeniform Kişisel Sağlık Analizi', included: true },
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
  limits: ['İşbirliği içerisindeki uzmanlarımıza en kapsamlı sağlık deneyimi', 'Sınırsız destek', 'VIP rozeti'],
}

// Geriye dönük uyumluluk

export const ALL_PLANS = [EKO_DIYET_PLAN, DIYET_PLAN, EKO_SPOR_PLAN, SPOR_PLAN, DOKTOR_PLAN, VIP_PLAN]

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
  eko_diyet: { coachMeetingsPerMonth: 0, dietitianMeetingsPerMonth: 1, doctorMeetingsPerMonth: 0 },
  eko_spor: { coachMeetingsPerMonth: 1, dietitianMeetingsPerMonth: 0, doctorMeetingsPerMonth: 0 },
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

const LEGACY_PHOTO_CALORIE = new Set(['eko_diyet', 'eko_spor', 'diyet', 'spor', 'vip', 'platinum', 'premium'])
const LEGACY_MANUAL_EXCLUDE = new Set(['free', 'doktor', 'kurucu'])

function planHasEntitlementFlags(plan) {
  const e = plan?.entitlements
  if (!e || typeof e !== 'object') return false
  // normalizeEntitlements her zaman boolean üretir — yalnızca anlamlı kota/bayrak varsa DB kaynaklı say
  return (
    Number(e.coachMeetingsPerMonth) > 0
    || Number(e.dietitianMeetingsPerMonth) > 0
    || Number(e.doctorMeetingsPerMonth) > 0
    || Number(e.doctorSessionsTotal) > 0
    || e.photoCalorie === true
    || e.manualCalorie === true
  )
}

/** Plan ID + süre (ay) için varsayılan paket konfigürasyonu (DB entitlements öncelikli) */
export function getDefaultPackageForPlan(planId, durationMonths = 1, planRow = null) {
  const plan = planRow || getPlanFromCatalog(planId)
  if (plan && planHasEntitlementFlags(plan)) {
    const billing = plan.billingType || (planId === 'doktor' || plan.period === 'Tek Seferlik' ? 'one_time' : 'recurring')
    return entitlementsToPackageConfig(plan.entitlements, billing, durationMonths)
  }
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

/** Fotoğraflı kalori erişimi (tek plan id — çoklu paket için memberHasPhotoCalorieAccess) */
export function hasPhotoCalorieAccess(membership) {
  const plan = getPlanFromCatalog(membership)
  if (plan && typeof plan.entitlements?.photoCalorie === 'boolean') return plan.entitlements.photoCalorie
  return LEGACY_PHOTO_CALORIE.has(membership)
}

/** Manuel kalori erişimi */
export function hasManualCalorieAccess(membership) {
  const plan = getPlanFromCatalog(membership)
  if (plan && typeof plan.entitlements?.manualCalorie === 'boolean') return plan.entitlements.manualCalorie
  if (LEGACY_MANUAL_EXCLUDE.has(membership)) return false
  return membership !== 'free'
}

/** Tam video kütüphanesi erişimi */

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

/** Pakette doktor görüşmesi var mı (tek seferlik veya aylık). Remaining kota için kullanılmaz. */
export function packageIncludesDoctor(packageConfig = {}) {
  return (Number(packageConfig.doctorSessionsTotal) || 0) > 0
    || (Number(packageConfig.doctorMeetingsPerMonth) || 0) > 0
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

/** Paket kapsamı dışındaki koç/diyet atamalarını temizler. Doktor ataması yalnız admin ile kalkar. */
export function sanitizeStaffForPackage(packageConfig, data = {}) {
  const includeCoach = packageIncludesCoach(packageConfig)
  const includeDiet = packageIncludesDietitian(packageConfig)
  const includeDoctor = packageIncludesDoctor(packageConfig)
  return {
    ...data,
    assignedCoachId: includeCoach ? (data.assignedCoachId ?? null) : null,
    assignedDietitianId: includeDiet ? (data.assignedDietitianId ?? null) : null,
    assignedDoctorId: data.assignedDoctorId ?? null,
    coachSessions: sanitizeSessionsForRole(data.coachSessions, includeCoach),
    dietitianSessions: sanitizeSessionsForRole(data.dietitianSessions, includeDiet),
    doctorSessions: sanitizeSessionsForRole(data.doctorSessions, includeDoctor),
  }
}

const KEEP_SESSION_STATUSES = new Set(['completed', 'cancelled', 'rejected', 'no_show'])

/** Rol kaybında geçmiş seanslar kalır; gelecekteki scheduled/rescheduled iptal edilir. */
export function sanitizeSessionsForRole(sessions = [], keepRole, { keepPending = false } = {}) {
  if (keepRole) return Array.isArray(sessions) ? sessions : []
  const now = Date.now()
  return (Array.isArray(sessions) ? sessions : []).map((s) => {
    if (!s || typeof s !== 'object') return s
    const status = s.status || 'scheduled'
    if (KEEP_SESSION_STATUSES.has(status)) return s
    if (keepPending && status === 'pending') return s
    const t = new Date(s.date || s.start || 0).getTime()
    if (!t || Number.isNaN(t) || t < now) return s
    return {
      ...s,
      status: 'cancelled',
      cancelledReason: s.cancelledReason || 'package_ended',
      cancelledAt: s.cancelledAt || new Date().toISOString(),
    }
  })
}
