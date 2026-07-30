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
  eko_diyet: 'Salad',
  diyet: 'Apple',
  eko_spor: 'Footprints',
  spor: 'Dumbbell',
  doktor: 'Stethoscope',
  kurucu: 'Crown',
  vip: 'Crown',
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
  return <Icon className={className} strokeWidth={1.75} fill="none" aria-hidden />
}

/** Kartlarda Lucide outline ikon (emoji yoksayılır) */
export function planVisual(planOrId, className = 'h-5 w-5', _emojiClassName = 'text-2xl leading-none') {
  return planIcon(planOrId, className)
}

/** Admin emoji hızlı seçim */
export const PLAN_EMOJI_OPTIONS = [
  '🥗', '💪', '🏃', '🩺', '👑', '⭐', '🔥', '🌿', '🍎', '🏋️',
  '💚', '🎯', '✨', '🏆', '🧘', '❤️', '🥇', '⚡', '🌟', '🎁',
]

/** Token veya #hex → tema sınıfları */
export const PLAN_COLOR_TOKENS = [
  /* Sage/Sky: eko planlar — sönük; btnOutline = landing outline CTA */
  { id: 'sage', label: 'Sage', swatch: 'bg-sage-400', accent: 'from-sage-200 via-sage-300 to-sage-400', glow: 'shadow-sage-100/40', ring: 'border-sage-200 ring-sage-50', icon: 'bg-gradient-to-br from-sage-300 to-sage-400 text-white', iconIdle: 'bg-sage-50 text-sage-600 ring-sage-200/80', chip: 'bg-sage-50 text-sage-600 ring-sage-100', btn: 'bg-gradient-to-r from-sage-400 to-sage-500 text-white', btnIdle: 'bg-sage-50 text-sage-700', btnOutline: 'border-sage-400 text-sage-700', label: 'text-sage-600', header: 'from-sage-50 to-sage-100/50 border-sage-200', badge: 'bg-sage-400 text-white' },
  { id: 'emerald', label: 'Emerald', swatch: 'bg-emerald-600', accent: 'from-emerald-400 via-green-500 to-teal-500', glow: 'shadow-emerald-300/55', ring: 'border-emerald-400 ring-emerald-200', icon: 'bg-gradient-to-br from-emerald-500 to-green-600 text-white', iconIdle: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80', chip: 'bg-emerald-50 text-emerald-700 ring-emerald-100', btn: 'bg-gradient-to-r from-emerald-600 to-green-600 text-white', btnIdle: 'bg-emerald-50 text-emerald-800', btnOutline: 'border-emerald-500 text-emerald-700', label: 'text-emerald-700', header: 'from-emerald-50 to-emerald-100/60 border-emerald-200', badge: 'bg-emerald-600 text-white' },
  { id: 'teal', label: 'Teal', swatch: 'bg-teal-500', accent: 'from-teal-400 via-cyan-500 to-brand-600', glow: 'shadow-teal-200/45', ring: 'border-teal-300 ring-teal-100', icon: 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white', iconIdle: 'bg-teal-50 text-teal-700 ring-teal-200/80', chip: 'bg-teal-50 text-teal-800 ring-teal-100', btn: 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white', btnIdle: 'bg-teal-50 text-teal-800', btnOutline: 'border-teal-500 text-teal-700', label: 'text-teal-700', header: 'from-teal-50 to-teal-100/60 border-teal-200', badge: 'bg-teal-600 text-white' },
  { id: 'blue', label: 'Blue', swatch: 'bg-blue-600', accent: 'from-sky-400 via-blue-500 to-indigo-500', glow: 'shadow-blue-300/50', ring: 'border-blue-400 ring-blue-200', icon: 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white', iconIdle: 'bg-sky-50 text-blue-700 ring-sky-200/80', chip: 'bg-sky-50 text-blue-700 ring-sky-100', btn: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white', btnIdle: 'bg-sky-50 text-blue-800', btnOutline: 'border-blue-500 text-blue-700', label: 'text-blue-700', header: 'from-sky-50 to-blue-100/60 border-sky-200', badge: 'bg-blue-600 text-white' },
  { id: 'sky', label: 'Sky', swatch: 'bg-sky-400', accent: 'from-sky-200 via-sky-300 to-cyan-300', glow: 'shadow-sky-100/40', ring: 'border-sky-200 ring-sky-50', icon: 'bg-gradient-to-br from-sky-300 to-sky-400 text-white', iconIdle: 'bg-sky-50 text-sky-600 ring-sky-200/80', chip: 'bg-sky-50 text-sky-600 ring-sky-100', btn: 'bg-gradient-to-r from-sky-400 to-cyan-400 text-white', btnIdle: 'bg-sky-50 text-sky-700', btnOutline: 'border-sky-400 text-sky-700', label: 'text-sky-600', header: 'from-sky-50 to-sky-100/50 border-sky-200', badge: 'bg-sky-400 text-white' },
  { id: 'amber', label: 'Amber', swatch: 'bg-amber-500', accent: 'from-amber-300 via-orange-400 to-rose-400', glow: 'shadow-amber-200/60', ring: 'border-amber-300 ring-amber-100', icon: 'bg-gradient-to-br from-amber-400 to-orange-500 text-white', iconIdle: 'bg-amber-50 text-amber-700 ring-amber-200/80', chip: 'bg-amber-50 text-amber-800 ring-amber-100', btn: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white', btnIdle: 'bg-amber-50 text-amber-800', btnOutline: 'border-amber-500 text-amber-700', label: 'text-amber-700', header: 'from-amber-50 to-amber-100/60 border-amber-200', badge: 'bg-gradient-to-r from-amber-400 to-amber-600 text-white' },
  { id: 'gold', label: 'Gold', swatch: 'bg-amber-500', accent: 'from-amber-400 via-yellow-500 to-orange-500', glow: 'shadow-amber-300/65', ring: 'border-amber-400 ring-amber-200', icon: 'bg-gradient-to-br from-amber-500 to-yellow-500 text-white', iconIdle: 'bg-amber-50 text-amber-700 ring-amber-200/90', chip: 'bg-amber-50 text-amber-800 ring-amber-100', btn: 'bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 text-white', btnIdle: 'bg-amber-50 text-amber-800', btnOutline: 'border-amber-500 text-amber-700', label: 'text-amber-700', header: 'from-amber-50 to-amber-100/60 border-amber-200', badge: 'bg-gradient-to-r from-amber-400 to-amber-600 text-white' },
  { id: 'brand', label: 'Brand', swatch: 'bg-brand-500', accent: 'from-violet-300 via-brand-400 to-fuchsia-400', glow: 'shadow-brand-200/50', ring: 'border-brand-300 ring-brand-100', icon: 'bg-gradient-to-br from-brand-500 to-violet-500 text-white', iconIdle: 'bg-brand-50 text-brand-700 ring-brand-200/80', chip: 'bg-brand-50 text-brand-700 ring-brand-100', btn: 'bg-gradient-to-r from-brand-500 to-violet-500 text-white', btnIdle: 'bg-brand-50 text-brand-800', btnOutline: 'border-brand-400 text-brand-700', label: 'text-brand-700', header: 'from-brand-50 to-brand-100/60 border-brand-200', badge: 'bg-gradient-to-r from-brand-500 to-brand-700 text-white' },
  { id: 'violet', label: 'Violet', swatch: 'bg-violet-600', accent: 'from-violet-400 via-purple-500 to-fuchsia-500', glow: 'shadow-violet-300/55', ring: 'border-violet-400 ring-violet-200', icon: 'bg-gradient-to-br from-violet-600 to-purple-600 text-white', iconIdle: 'bg-violet-50 text-violet-700 ring-violet-200/80', chip: 'bg-violet-50 text-violet-700 ring-violet-100', btn: 'bg-gradient-to-r from-violet-600 to-purple-600 text-white', btnIdle: 'bg-violet-50 text-violet-800', btnOutline: 'border-violet-500 text-violet-700', label: 'text-violet-700', header: 'from-violet-50 to-violet-100/60 border-violet-200', badge: 'bg-violet-600 text-white' },
  { id: 'slate', label: 'Slate', swatch: 'bg-slate-500', accent: 'from-slate-300 via-slate-400 to-zinc-400', glow: 'shadow-slate-200/50', ring: 'border-slate-300 ring-slate-100', icon: 'bg-gradient-to-br from-slate-400 to-zinc-500 text-white', iconIdle: 'bg-slate-50 text-slate-600 ring-slate-200/80', chip: 'bg-slate-50 text-slate-700 ring-slate-100', btn: 'bg-gradient-to-r from-slate-500 to-zinc-500 text-white', btnIdle: 'bg-slate-50 text-slate-800', btnOutline: 'border-slate-400 text-slate-700', label: 'text-slate-700', header: 'from-slate-50 to-slate-100/60 border-slate-200', badge: 'bg-slate-500 text-white' },
  { id: 'rose', label: 'Rose', swatch: 'bg-rose-500', accent: 'from-rose-300 via-pink-400 to-fuchsia-400', glow: 'shadow-rose-200/50', ring: 'border-rose-300 ring-rose-100', icon: 'bg-gradient-to-br from-rose-400 to-pink-500 text-white', iconIdle: 'bg-rose-50 text-rose-700 ring-rose-200/80', chip: 'bg-rose-50 text-rose-700 ring-rose-100', btn: 'bg-gradient-to-r from-rose-500 to-pink-500 text-white', btnIdle: 'bg-rose-50 text-rose-800', btnOutline: 'border-rose-400 text-rose-700', label: 'text-rose-700', header: 'from-rose-50 to-rose-100/60 border-rose-200', badge: 'bg-rose-500 text-white' },
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
    iconIdle: 'bg-cream-50 text-cream-700 ring-cream-200/80',
    chip: 'bg-cream-50 text-cream-800 ring-cream-200',
    btn: 'text-white',
    btnIdle: 'bg-cream-50 text-cream-800',
    btnOutline: 'border-cream-400 text-cream-800',
    label: 'text-cream-800',
    header: 'from-cream-50 to-cream-100 border-cream-200',
    badge: 'text-white',
    customHex: h,
  }
}

export const PLAN_THEME = {
  free: TOKEN_BY_ID.sage,
  eko: TOKEN_BY_ID.teal,
  eko_diyet: TOKEN_BY_ID.sage,
  diyet: TOKEN_BY_ID.emerald,
  eko_spor: TOKEN_BY_ID.sky,
  spor: TOKEN_BY_ID.blue,
  doktor: TOKEN_BY_ID.violet,
  kurucu: TOKEN_BY_ID.amber,
  vip: TOKEN_BY_ID.gold,
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
