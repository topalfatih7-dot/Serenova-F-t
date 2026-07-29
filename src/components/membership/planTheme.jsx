import {
  Activity, Apple, Award, Beef, Bike, Brain, CalendarHeart, Citrus, ClipboardPlus,
  Crown, Droplets, Dumbbell, Flame, Footprints, Gem, Heart, HeartPulse, Leaf,
  Medal, Mountain, Package, Pill, Salad, Shield, Sparkles, Star, Stethoscope,
  Sun, Target, Trophy, UserRound, Utensils, Waves, Wind, Zap, Flower2, HandHeart,
  PersonStanding, Scale, Timer, Bone, Eye, Smile,
} from 'lucide-react'

/** Admin picker + runtime çözümleme için Lucide ikon haritası */
export const PLAN_ICON_MAP = {
  Activity,
  Apple,
  Award,
  Beef,
  Bike,
  Bone,
  Brain,
  CalendarHeart,
  Citrus,
  ClipboardPlus,
  Crown,
  Droplets,
  Dumbbell,
  Eye,
  Flame,
  Flower2,
  Footprints,
  Gem,
  HandHeart,
  Heart,
  HeartPulse,
  Leaf,
  Medal,
  Mountain,
  Package,
  PersonStanding,
  Pill,
  Salad,
  Scale,
  Shield,
  Smile,
  Sparkles,
  Star,
  Stethoscope,
  Sun,
  Target,
  Timer,
  Trophy,
  UserRound,
  Utensils,
  Waves,
  Wind,
  Zap,
}

export const PLAN_ICON_OPTIONS = Object.keys(PLAN_ICON_MAP)

const DEFAULT_ICON_BY_ID = {
  free: 'Sparkles',
  eko: 'Leaf',
  diyet: 'Sparkles',
  spor: 'Dumbbell',
  doktor: 'Stethoscope',
  kurucu: 'Crown',
  vip: 'Award',
  gumus: 'Star',
  altin: 'Crown',
  platinum: 'Award',
}

export function resolvePlanId(planOrId) {
  if (planOrId && typeof planOrId === 'object') return planOrId.id
  return planOrId
}

export function resolvePlanIconName(planOrId) {
  if (planOrId && typeof planOrId === 'object') {
    if (planOrId.icon && PLAN_ICON_MAP[planOrId.icon]) return planOrId.icon
    return DEFAULT_ICON_BY_ID[planOrId.id] || 'Package'
  }
  return DEFAULT_ICON_BY_ID[planOrId] || 'Package'
}

export function planIcon(planOrId, className = 'h-5 w-5') {
  const name = resolvePlanIconName(planOrId)
  const Icon = PLAN_ICON_MAP[name] || Sparkles
  return <Icon className={className} />
}

/** Kartlarda emoji varsa onu göster, yoksa Lucide ikon */
export function planVisual(planOrId, className = 'h-5 w-5', emojiClassName = 'text-2xl leading-none') {
  const emoji = planOrId && typeof planOrId === 'object' ? planOrId.emoji : null
  if (emoji && String(emoji).trim()) {
    return <span className={emojiClassName} aria-hidden>{String(emoji).trim()}</span>
  }
  return planIcon(planOrId, className)
}

/** Admin emoji hızlı seçim */
export const PLAN_EMOJI_OPTIONS = [
  '🥗', '💪', '🏃', '🩺', '👑', '⭐', '🔥', '🌿', '🍎', '🏋️',
  '💚', '🎯', '✨', '🏆', '🧘', '❤️', '🥇', '⚡', '🌟', '🎁',
]

/** Token veya #hex → tema sınıfları */
export const PLAN_COLOR_TOKENS = [
  { id: 'sage', label: 'Sage', swatch: 'bg-sage-500', accent: 'from-sage-300 via-sage-400 to-emerald-400', glow: 'shadow-sage-200/50', ring: 'border-sage-300 ring-sage-100', icon: 'bg-gradient-to-br from-sage-400 to-emerald-500 text-white', iconIdle: 'bg-sage-50 text-sage-600', chip: 'bg-sage-50 text-sage-700 ring-sage-100', btn: 'bg-gradient-to-r from-sage-500 to-emerald-500 text-white', btnIdle: 'bg-sage-50 text-sage-800', label: 'text-sage-700', header: 'from-sage-50 to-sage-100/60 border-sage-200', badge: 'bg-sage-500 text-white' },
  { id: 'emerald', label: 'Emerald', swatch: 'bg-emerald-500', accent: 'from-emerald-300 via-green-400 to-teal-400', glow: 'shadow-emerald-200/50', ring: 'border-emerald-300 ring-emerald-100', icon: 'bg-gradient-to-br from-emerald-400 to-green-500 text-white', iconIdle: 'bg-emerald-50 text-emerald-700', chip: 'bg-emerald-50 text-emerald-700 ring-emerald-100', btn: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white', btnIdle: 'bg-emerald-50 text-emerald-800', label: 'text-emerald-700', header: 'from-emerald-50 to-emerald-100/60 border-emerald-200', badge: 'bg-emerald-500 text-white' },
  { id: 'teal', label: 'Teal', swatch: 'bg-teal-500', accent: 'from-teal-400 via-cyan-500 to-brand-600', glow: 'shadow-teal-200/45', ring: 'border-teal-300 ring-teal-100', icon: 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white', iconIdle: 'bg-teal-50 text-teal-700', chip: 'bg-teal-50 text-teal-800 ring-teal-100', btn: 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white', btnIdle: 'bg-teal-50 text-teal-800', label: 'text-teal-700', header: 'from-teal-50 to-teal-100/60 border-teal-200', badge: 'bg-teal-600 text-white' },
  { id: 'blue', label: 'Blue', swatch: 'bg-blue-500', accent: 'from-sky-300 via-blue-400 to-indigo-400', glow: 'shadow-sky-200/50', ring: 'border-sky-300 ring-sky-100', icon: 'bg-gradient-to-br from-sky-400 to-blue-500 text-white', iconIdle: 'bg-sky-50 text-sky-700', chip: 'bg-sky-50 text-sky-700 ring-sky-100', btn: 'bg-gradient-to-r from-sky-500 to-blue-500 text-white', btnIdle: 'bg-sky-50 text-sky-800', label: 'text-sky-700', header: 'from-sky-50 to-blue-100/60 border-sky-200', badge: 'bg-blue-500 text-white' },
  { id: 'sky', label: 'Sky', swatch: 'bg-sky-500', accent: 'from-sky-300 via-cyan-400 to-blue-400', glow: 'shadow-sky-200/50', ring: 'border-sky-300 ring-sky-100', icon: 'bg-gradient-to-br from-sky-400 to-cyan-500 text-white', iconIdle: 'bg-sky-50 text-sky-700', chip: 'bg-sky-50 text-sky-700 ring-sky-100', btn: 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white', btnIdle: 'bg-sky-50 text-sky-800', label: 'text-sky-700', header: 'from-sky-50 to-sky-100/60 border-sky-200', badge: 'bg-sky-500 text-white' },
  { id: 'amber', label: 'Amber', swatch: 'bg-amber-500', accent: 'from-amber-300 via-orange-400 to-rose-400', glow: 'shadow-amber-200/60', ring: 'border-amber-300 ring-amber-100', icon: 'bg-gradient-to-br from-amber-400 to-orange-500 text-white', iconIdle: 'bg-amber-50 text-amber-700', chip: 'bg-amber-50 text-amber-800 ring-amber-100', btn: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white', btnIdle: 'bg-amber-50 text-amber-800', label: 'text-amber-700', header: 'from-amber-50 to-amber-100/60 border-amber-200', badge: 'bg-gradient-to-r from-amber-400 to-amber-600 text-white' },
  { id: 'gold', label: 'Gold', swatch: 'bg-amber-500', accent: 'from-amber-300 via-yellow-400 to-orange-400', glow: 'shadow-amber-200/60', ring: 'border-amber-300 ring-amber-100', icon: 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white', iconIdle: 'bg-amber-50 text-amber-700', chip: 'bg-amber-50 text-amber-800 ring-amber-100', btn: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white', btnIdle: 'bg-amber-50 text-amber-800', label: 'text-amber-700', header: 'from-amber-50 to-amber-100/60 border-amber-200', badge: 'bg-gradient-to-r from-amber-400 to-amber-600 text-white' },
  { id: 'brand', label: 'Brand', swatch: 'bg-brand-500', accent: 'from-violet-300 via-brand-400 to-fuchsia-400', glow: 'shadow-brand-200/50', ring: 'border-brand-300 ring-brand-100', icon: 'bg-gradient-to-br from-brand-500 to-violet-500 text-white', iconIdle: 'bg-brand-50 text-brand-700', chip: 'bg-brand-50 text-brand-700 ring-brand-100', btn: 'bg-gradient-to-r from-brand-500 to-violet-500 text-white', btnIdle: 'bg-brand-50 text-brand-800', label: 'text-brand-700', header: 'from-brand-50 to-brand-100/60 border-brand-200', badge: 'bg-gradient-to-r from-brand-500 to-brand-700 text-white' },
  { id: 'violet', label: 'Violet', swatch: 'bg-violet-500', accent: 'from-violet-300 via-purple-400 to-fuchsia-400', glow: 'shadow-violet-200/50', ring: 'border-violet-300 ring-violet-100', icon: 'bg-gradient-to-br from-violet-500 to-purple-500 text-white', iconIdle: 'bg-violet-50 text-violet-700', chip: 'bg-violet-50 text-violet-700 ring-violet-100', btn: 'bg-gradient-to-r from-violet-500 to-purple-500 text-white', btnIdle: 'bg-violet-50 text-violet-800', label: 'text-violet-700', header: 'from-violet-50 to-violet-100/60 border-violet-200', badge: 'bg-violet-500 text-white' },
  { id: 'slate', label: 'Slate', swatch: 'bg-slate-500', accent: 'from-slate-300 via-slate-400 to-zinc-400', glow: 'shadow-slate-200/50', ring: 'border-slate-300 ring-slate-100', icon: 'bg-gradient-to-br from-slate-400 to-zinc-500 text-white', iconIdle: 'bg-slate-50 text-slate-600', chip: 'bg-slate-50 text-slate-700 ring-slate-100', btn: 'bg-gradient-to-r from-slate-500 to-zinc-500 text-white', btnIdle: 'bg-slate-50 text-slate-800', label: 'text-slate-700', header: 'from-slate-50 to-slate-100/60 border-slate-200', badge: 'bg-slate-500 text-white' },
  { id: 'rose', label: 'Rose', swatch: 'bg-rose-500', accent: 'from-rose-300 via-pink-400 to-fuchsia-400', glow: 'shadow-rose-200/50', ring: 'border-rose-300 ring-rose-100', icon: 'bg-gradient-to-br from-rose-400 to-pink-500 text-white', iconIdle: 'bg-rose-50 text-rose-700', chip: 'bg-rose-50 text-rose-700 ring-rose-100', btn: 'bg-gradient-to-r from-rose-500 to-pink-500 text-white', btnIdle: 'bg-rose-50 text-rose-800', label: 'text-rose-700', header: 'from-rose-50 to-rose-100/60 border-rose-200', badge: 'bg-rose-500 text-white' },
]

const TOKEN_BY_ID = Object.fromEntries(PLAN_COLOR_TOKENS.map((t) => [t.id, t]))

function isHexColor(value) {
  return typeof value === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim())
}

function themeFromHex(hex) {
  const h = hex.trim()
  return {
    accent: 'from-cream-200 via-cream-300 to-cream-400',
    glow: 'shadow-cream-200/50',
    ring: 'border-cream-300 ring-cream-100',
    icon: 'text-white',
    iconIdle: 'bg-cream-50 text-cream-700',
    chip: 'bg-cream-50 text-cream-800 ring-cream-200',
    btn: 'text-white',
    btnIdle: 'bg-cream-50 text-cream-800',
    label: 'text-cream-800',
    header: 'from-cream-50 to-cream-100 border-cream-200',
    badge: 'text-white',
    customHex: h,
  }
}

export const PLAN_THEME = {
  free: TOKEN_BY_ID.sage,
  eko: TOKEN_BY_ID.teal,
  diyet: TOKEN_BY_ID.emerald,
  spor: TOKEN_BY_ID.blue,
  doktor: TOKEN_BY_ID.teal,
  kurucu: TOKEN_BY_ID.amber,
  vip: TOKEN_BY_ID.brand,
  gumus: TOKEN_BY_ID.slate,
  altin: TOKEN_BY_ID.gold,
  platinum: TOKEN_BY_ID.brand,
}

export function getPlanTheme(planOrId) {
  if (planOrId && typeof planOrId === 'object') {
    const color = planOrId.color
    if (isHexColor(color)) return themeFromHex(color)
    if (color && TOKEN_BY_ID[color]) return TOKEN_BY_ID[color]
    return PLAN_THEME[planOrId.id] || TOKEN_BY_ID.brand
  }
  return PLAN_THEME[planOrId] || TOKEN_BY_ID.brand
}

export function planHeaderColor(color) {
  if (isHexColor(color)) return themeFromHex(color).header
  return TOKEN_BY_ID[color]?.header || 'from-cream-50 to-cream-100 border-cream-200'
}

export function planBadgeColor(color) {
  if (isHexColor(color)) return themeFromHex(color).badge
  return TOKEN_BY_ID[color]?.badge || 'bg-cream-700 text-white'
}

export function dailyPrice(price) {
  if (!price || price <= 0) return 0
  return Math.max(1, Math.round(price / 30))
}
