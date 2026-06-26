import { Leaf, Sparkles, Dumbbell, Crown, Award, Star } from 'lucide-react'

export function planIcon(id, className = 'h-5 w-5') {
  const props = { className }
  if (id === 'free' || id === 'eko') return <Leaf {...props} />
  if (id === 'diyet') return <Sparkles {...props} />
  if (id === 'spor') return <Dumbbell {...props} />
  if (id === 'kurucu' || id === 'altin') return <Crown {...props} />
  if (id === 'vip' || id === 'platinum') return <Award {...props} />
  if (id === 'gumus') return <Star {...props} />
  return <Sparkles {...props} />
}

export const PLAN_THEME = {
  free: {
    accent: 'from-sage-300 via-sage-400 to-emerald-400',
    glow: 'shadow-sage-200/50',
    ring: 'border-sage-300 ring-sage-100',
    icon: 'bg-gradient-to-br from-sage-400 to-emerald-500 text-white',
    iconIdle: 'bg-sage-50 text-sage-600',
    chip: 'bg-sage-50 text-sage-700 ring-sage-100',
    btn: 'bg-gradient-to-r from-sage-500 to-emerald-500 text-white',
    btnIdle: 'bg-sage-50 text-sage-800',
    label: 'text-sage-700',
  },
  eko: {
    accent: 'from-teal-300 via-sage-400 to-emerald-400',
    glow: 'shadow-teal-200/50',
    ring: 'border-teal-300 ring-teal-100',
    icon: 'bg-gradient-to-br from-teal-400 to-sage-500 text-white',
    iconIdle: 'bg-teal-50 text-teal-700',
    chip: 'bg-teal-50 text-teal-700 ring-teal-100',
    btn: 'bg-gradient-to-r from-teal-500 to-sage-500 text-white',
    btnIdle: 'bg-teal-50 text-teal-800',
    label: 'text-teal-700',
  },
  diyet: {
    accent: 'from-emerald-300 via-green-400 to-teal-400',
    glow: 'shadow-emerald-200/50',
    ring: 'border-emerald-300 ring-emerald-100',
    icon: 'bg-gradient-to-br from-emerald-400 to-green-500 text-white',
    iconIdle: 'bg-emerald-50 text-emerald-700',
    chip: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    btn: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white',
    btnIdle: 'bg-emerald-50 text-emerald-800',
    label: 'text-emerald-700',
  },
  spor: {
    accent: 'from-sky-300 via-blue-400 to-indigo-400',
    glow: 'shadow-sky-200/50',
    ring: 'border-sky-300 ring-sky-100',
    icon: 'bg-gradient-to-br from-sky-400 to-blue-500 text-white',
    iconIdle: 'bg-sky-50 text-sky-700',
    chip: 'bg-sky-50 text-sky-700 ring-sky-100',
    btn: 'bg-gradient-to-r from-sky-500 to-blue-500 text-white',
    btnIdle: 'bg-sky-50 text-sky-800',
    label: 'text-sky-700',
  },
  kurucu: {
    accent: 'from-amber-300 via-orange-400 to-rose-400',
    glow: 'shadow-amber-200/60',
    ring: 'border-amber-300 ring-amber-100',
    icon: 'bg-gradient-to-br from-amber-400 to-orange-500 text-white',
    iconIdle: 'bg-amber-50 text-amber-700',
    chip: 'bg-amber-50 text-amber-800 ring-amber-100',
    btn: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
    btnIdle: 'bg-amber-50 text-amber-800',
    label: 'text-amber-700',
  },
  vip: {
    accent: 'from-violet-300 via-brand-400 to-fuchsia-400',
    glow: 'shadow-brand-200/50',
    ring: 'border-brand-300 ring-brand-100',
    icon: 'bg-gradient-to-br from-brand-500 to-violet-500 text-white',
    iconIdle: 'bg-brand-50 text-brand-700',
    chip: 'bg-brand-50 text-brand-700 ring-brand-100',
    btn: 'bg-gradient-to-r from-brand-500 to-violet-500 text-white',
    btnIdle: 'bg-brand-50 text-brand-800',
    label: 'text-brand-700',
  },
}

export function getPlanTheme(id) {
  return PLAN_THEME[id] || PLAN_THEME.vip
}

export function dailyPrice(price) {
  if (!price || price <= 0) return 0
  return Math.max(1, Math.round(price / 30))
}
