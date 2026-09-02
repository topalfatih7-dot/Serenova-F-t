import {
  Activity, Apple, Award, Baby, Dumbbell, Flame, HeartPulse, Medal, Salad, Sparkles,
  Users, Video,
} from 'lucide-react'
import { COACH_SPECIALTY_GROUPS, DIETITIAN_SPECIALTY_GROUPS, OTHER_OPTION } from '../../data/staffApplication'

export const STAFF_TAG_TONES = [
  'border-brand-200 bg-white text-brand-700',
  'border-sage-200 bg-white text-sage-700',
  'border-warm-200 bg-white text-warm-500',
  'border-violet-200 bg-white text-violet-700',
  'border-sky-200 bg-white text-sky-700',
  'border-pink-200 bg-white text-pink-600',
  'border-orange-200 bg-white text-orange-600',
  'border-teal-200 bg-white text-teal-700',
]

export const SPECIALTY_TONE = {
  brand: {
    panel: 'border-brand-100 bg-gradient-to-br from-brand-50 via-white to-sky-50/50',
    icon: 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-brand-500/25',
    chip: 'border-brand-200/70 bg-white/90 text-brand-800',
    title: 'text-brand-800',
    blob: 'bg-brand-200/40',
  },
  sky: {
    panel: 'border-sky-100 bg-gradient-to-br from-sky-50 via-white to-brand-50/40',
    icon: 'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sky-500/25',
    chip: 'border-sky-200/70 bg-white/90 text-sky-800',
    title: 'text-sky-800',
    blob: 'bg-sky-200/40',
  },
  emerald: {
    panel: 'border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sage-50/50',
    icon: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/25',
    chip: 'border-emerald-200/70 bg-white/90 text-emerald-800',
    title: 'text-emerald-800',
    blob: 'bg-emerald-200/40',
  },
  amber: {
    panel: 'border-amber-100 bg-gradient-to-br from-amber-50 via-white to-warm-50',
    icon: 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-amber-500/25',
    chip: 'border-amber-200/70 bg-white/90 text-amber-900',
    title: 'text-amber-900',
    blob: 'bg-amber-200/45',
  },
  violet: {
    panel: 'border-violet-100 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50/40',
    icon: 'bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-violet-500/25',
    chip: 'border-violet-200/70 bg-white/90 text-violet-800',
    title: 'text-violet-800',
    blob: 'bg-violet-200/40',
  },
  sage: {
    panel: 'border-sage-100 bg-gradient-to-br from-sage-50 via-white to-emerald-50/40',
    icon: 'bg-gradient-to-br from-sage-500 to-emerald-600 text-white shadow-sage-500/25',
    chip: 'border-sage-200/70 bg-white/90 text-sage-800',
    title: 'text-sage-800',
    blob: 'bg-sage-200/40',
  },
  rose: {
    panel: 'border-rose-100 bg-gradient-to-br from-rose-50 via-white to-pink-50/50',
    icon: 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-rose-500/25',
    chip: 'border-rose-200/70 bg-white/90 text-rose-800',
    title: 'text-rose-800',
    blob: 'bg-rose-200/40',
  },
  teal: {
    panel: 'border-teal-100 bg-gradient-to-br from-teal-50 via-white to-cyan-50/40',
    icon: 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-teal-500/25',
    chip: 'border-teal-200/70 bg-white/90 text-teal-800',
    title: 'text-teal-800',
    blob: 'bg-teal-200/40',
  },
}

const GROUP_ICONS = {
  body: Flame,
  training: Dumbbell,
  wellness: Activity,
  populations: Users,
  delivery: Video,
  clinical: HeartPulse,
  lifestyle: Salad,
  lifestage: Baby,
  other: Sparkles,
}

const CERT_TONES = [
  { wrap: 'bg-sage-50', icon: 'bg-sage-500 text-white', Icon: Dumbbell },
  { wrap: 'bg-warm-50', icon: 'bg-warm-500 text-white', Icon: Activity },
  { wrap: 'bg-brand-50', icon: 'bg-brand-500 text-white', Icon: Medal },
  { wrap: 'bg-violet-50', icon: 'bg-violet-500 text-white', Icon: Award },
  { wrap: 'bg-sky-50', icon: 'bg-sky-500 text-white', Icon: HeartPulse },
  { wrap: 'bg-orange-50', icon: 'bg-orange-400 text-white', Icon: Flame },
]

export function tagToneClass(index) {
  return STAFF_TAG_TONES[index % STAFF_TAG_TONES.length]
}

export function specialtyGroupsForRole(role) {
  if (role === 'dietitian') return DIETITIAN_SPECIALTY_GROUPS
  return COACH_SPECIALTY_GROUPS
}

export function groupProfileSpecialties(tags = [], role) {
  const unique = [...new Set(
    (tags || [])
      .map((t) => String(t).trim())
      .filter((t) => t && t !== OTHER_OPTION),
  )]
  if (!unique.length) return []
  const remaining = new Set(unique)
  const catalog = specialtyGroupsForRole(role)
  const grouped = []
  catalog.forEach((group) => {
    const items = group.items.filter((item) => remaining.has(item))
    items.forEach((item) => remaining.delete(item))
    if (items.length) grouped.push({ ...group, items })
  })
  const extra = unique.filter((item) => remaining.has(item))
  if (extra.length) {
    if (grouped.length) {
      const host = grouped[0]
      grouped[0] = { ...host, items: [...host.items, ...extra] }
    } else {
      grouped.push({
        id: 'other',
        label: extra.length === 1 ? extra[0] : 'Uzmanlık',
        tone: 'teal',
        items: extra,
      })
    }
  }
  return grouped
}

export function specialtyGroupVisual(group) {
  const tone = SPECIALTY_TONE[group.tone] || SPECIALTY_TONE.brand
  const Icon = GROUP_ICONS[group.id] || Sparkles
  return { ...tone, Icon }
}

export function certificateVisual(cert, index) {
  const n = String(cert?.name || '').toLocaleLowerCase('tr')
  const fallback = CERT_TONES[index % CERT_TONES.length]
  if (/pilates|yoga|reformer/.test(n)) return { ...fallback, wrap: 'bg-violet-50', icon: 'bg-violet-500 text-white', Icon: Activity }
  if (/hamile/.test(n)) return { wrap: 'bg-pink-50', icon: 'bg-pink-500 text-white', Icon: Baby }
  if (/postür|klinik|corrective/.test(n)) return { wrap: 'bg-sky-50', icon: 'bg-sky-500 text-white', Icon: HeartPulse }
  if (/nasm|cpt|tff|tcf|kademe|antrenman|fonksiyonel/.test(n)) {
    return { wrap: 'bg-sage-50', icon: 'bg-sage-500 text-white', Icon: Dumbbell }
  }
  if (/beslenme|diyet|nutrition/.test(n)) return { wrap: 'bg-sage-50', icon: 'bg-sage-500 text-white', Icon: Salad }
  return fallback
}

export function expertiseIconForRole(role) {
  if (role === 'dietitian') return Apple
  return Flame
}
