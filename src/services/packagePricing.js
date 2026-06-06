import { ADD_ONS } from '../data/membershipPlans'

const BASE_PRICE = 2500
const COACH_MEETING_PRICE = 400
const DIETITIAN_MEETING_PRICE = 600
const DETAILED_TRACKING_PRICE = 300
const WEEKLY_TRACKING_PRICE = 150

const REMINDER_PRICES = { minimal: 0, daily: 100, twice: 150 }

export function calculatePackagePrice(config) {
  const {
    coachMeetingsPerWeek = 2,
    dietitianMeetingsPerMonth = 1,
    durationWeeks = 12,
    progressTracking = 'detailed',
    reminderFrequency = 'daily',
    addOns = [],
  } = config

  const weeks = durationWeeks / 4
  const coachCost = coachMeetingsPerWeek * 4 * weeks * COACH_MEETING_PRICE
  const dietitianCost = dietitianMeetingsPerMonth * weeks * DIETITIAN_MEETING_PRICE
  const trackingCost = (progressTracking === 'detailed' ? DETAILED_TRACKING_PRICE : WEEKLY_TRACKING_PRICE) * weeks
  const reminderCost = (REMINDER_PRICES[reminderFrequency] || 0) * weeks
  const addOnCost = addOns.reduce((sum, id) => {
    const addon = ADD_ONS.find((a) => a.id === id)
    return sum + (addon?.price || 0) * weeks
  }, 0)

  const subtotal = BASE_PRICE + coachCost + dietitianCost + trackingCost + reminderCost + addOnCost
  const discount = durationWeeks >= 24 ? 0.15 : durationWeeks >= 16 ? 0.1 : 0
  const total = Math.round(subtotal * (1 - discount))

  return {
    base: BASE_PRICE,
    coachCost: Math.round(coachCost),
    dietitianCost: Math.round(dietitianCost),
    trackingCost: Math.round(trackingCost),
    reminderCost: Math.round(reminderCost),
    addOnCost: Math.round(addOnCost),
    discount: Math.round(subtotal * discount),
    total,
    monthly: Math.round(total / weeks),
  }
}

const DEFAULT_RECOMMENDED = {
  coachMeetingsPerWeek: 2,
  dietitianMeetingsPerMonth: 1,
  durationWeeks: 12,
  progressTracking: 'detailed',
  reminderFrequency: 'daily',
  addOns: ['video'],
}

export function getRecommendedPackage(profile = {}) {
  const level = profile.fitnessLevel || 'beginner'
  if (level === 'advanced') {
    return { ...DEFAULT_RECOMMENDED, coachMeetingsPerWeek: 3, durationWeeks: 16 }
  }
  if (level === 'intermediate') {
    return { ...DEFAULT_RECOMMENDED, coachMeetingsPerWeek: 2, durationWeeks: 12 }
  }
  return DEFAULT_RECOMMENDED
}

export function generateCalendarPreview(config, startDate = new Date()) {
  const events = []
  const { coachMeetingsPerWeek, dietitianMeetingsPerMonth, durationWeeks } = config
  const daysBetweenCoach = Math.floor(7 / coachMeetingsPerWeek)

  for (let w = 0; w < Math.min(durationWeeks, 4); w++) {
    for (let c = 0; c < coachMeetingsPerWeek; c++) {
      const d = new Date(startDate)
      d.setDate(d.getDate() + w * 7 + c * daysBetweenCoach + 1)
      events.push({ date: d, type: 'coach', title: 'Koç Görüşmesi' })
    }
    if (w % Math.ceil(4 / dietitianMeetingsPerMonth) === 0 && dietitianMeetingsPerMonth > 0) {
      const d = new Date(startDate)
      d.setDate(d.getDate() + w * 7 + 3)
      events.push({ date: d, type: 'dietitian', title: 'Diyetisyen' })
    }
  }
  return events.sort((a, b) => a.date - b.date)
}
