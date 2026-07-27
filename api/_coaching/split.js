/**
 * Training Split Engine — gün sayısı + şablon tipi.
 */

export function planSplit(profile, goalPlan, riskReport) {
  let days = profile?.schedule?.workoutWeekdays?.length || 3
  const adherence = profile?.scores?.adherenceExpected ?? 50
  const recovery = profile?.scores?.recovery ?? 50
  const exp = profile?.experienceLevel || 'beginner'
  const riskLevel = riskReport?.level || 'low'
  const sessionMin = profile?.schedule?.sessionMinutes || 35
  const location = profile?.locationProfile || 'mixed'
  const homeLike = location === 'home' || location === 'office' || (
    Array.isArray(profile?.equipmentProfile)
    && !profile.equipmentProfile.includes('gym')
    && location !== 'gym'
  )

  if (adherence < 40) days = Math.min(days, 3)
  if (riskLevel === 'high' || riskLevel === 'referral') days = Math.min(days, 3)
  if (exp === 'novice') days = Math.min(days, 4)
  days = Math.max(2, Math.min(6, days))

  let splitType = 'full_body'
  /** @type {{ id: string, focus: string, patterns: string[] }[]} */
  let sessionTemplates = []

  if (riskLevel === 'referral' || goalPlan?.primary === 'rehab_support') {
    splitType = 'rehab_mobility'
    sessionTemplates = [{
      id: 'A',
      focus: 'mobility_full',
      patterns: ['mobility', 'loco', 'hinge', 'push_h', 'core'],
    }]
  } else if (homeLike && days <= 4) {
    splitType = 'home_minimal'
    if (days <= 2) {
      sessionTemplates = [
        { id: 'A', focus: 'full_body', patterns: ['squat', 'hinge', 'push_h', 'pull_h', 'core'] },
        { id: 'B', focus: 'full_body_var', patterns: ['lunge', 'hinge', 'push_h', 'pull_h', 'loco'] },
      ]
    } else {
      sessionTemplates = [
        { id: 'A', focus: 'full_body', patterns: ['squat', 'push_h', 'pull_h', 'core'] },
        { id: 'B', focus: 'full_body_hinge', patterns: ['hinge', 'lunge', 'push_h', 'pull_v', 'core'] },
        { id: 'C', focus: 'full_body_mix', patterns: ['squat', 'hinge', 'pull_h', 'loco', 'mobility'] },
      ]
    }
  } else if (days <= 3) {
    splitType = 'full_body'
    sessionTemplates = [
      { id: 'A', focus: 'full_body', patterns: ['squat', 'hinge', 'push_h', 'pull_h', 'core'] },
      { id: 'B', focus: 'full_body_var', patterns: ['lunge', 'hinge', 'push_v', 'pull_v', 'core'] },
      { id: 'C', focus: 'full_body_mix', patterns: ['squat', 'push_h', 'pull_h', 'loco', 'mobility'] },
    ].slice(0, Math.max(2, Math.min(3, days)))
  } else if (days === 4) {
    splitType = 'upper_lower'
    sessionTemplates = [
      { id: 'A', focus: 'upper', patterns: ['push_h', 'pull_h', 'push_v', 'pull_v', 'core'] },
      { id: 'B', focus: 'lower', patterns: ['squat', 'hinge', 'lunge', 'core', 'loco'] },
      { id: 'C', focus: 'upper', patterns: ['pull_h', 'push_h', 'pull_v', 'core'] },
      { id: 'D', focus: 'lower', patterns: ['hinge', 'squat', 'lunge', 'mobility'] },
    ]
  } else if (days >= 5 && (exp === 'intermediate' || exp === 'advanced') && recovery >= 55) {
    splitType = 'ppl'
    sessionTemplates = [
      { id: 'A', focus: 'push', patterns: ['push_h', 'push_v', 'core'] },
      { id: 'B', focus: 'pull', patterns: ['pull_h', 'pull_v', 'hinge', 'core'] },
      { id: 'C', focus: 'legs', patterns: ['squat', 'hinge', 'lunge', 'core'] },
      { id: 'D', focus: 'push', patterns: ['push_h', 'push_v', 'loco'] },
      { id: 'E', focus: 'pull', patterns: ['pull_h', 'pull_v', 'mobility'] },
    ]
    if (days >= 6 && recovery >= 65 && sessionMin <= 45 && exp === 'advanced') {
      sessionTemplates.push({
        id: 'F',
        focus: 'legs',
        patterns: ['squat', 'lunge', 'core', 'mobility'],
      })
    } else {
      days = Math.min(days, 5)
    }
  } else {
    splitType = 'upper_lower'
    days = 4
    sessionTemplates = [
      { id: 'A', focus: 'upper', patterns: ['push_h', 'pull_h', 'push_v', 'core'] },
      { id: 'B', focus: 'lower', patterns: ['squat', 'hinge', 'lunge', 'core'] },
      { id: 'C', focus: 'upper', patterns: ['pull_h', 'push_h', 'pull_v'] },
      { id: 'D', focus: 'lower', patterns: ['hinge', 'squat', 'mobility'] },
    ]
  }

  if (goalPlan?.gluteFocus && splitType !== 'rehab_mobility') {
    splitType = splitType === 'full_body' || splitType === 'home_minimal'
      ? 'glute_focus_fb'
      : 'glute_focus'
    sessionTemplates = sessionTemplates.map((t) => {
      if (t.focus.includes('lower') || t.focus.includes('legs') || t.focus.includes('full')) {
        return {
          ...t,
          patterns: ['hinge', 'squat', 'lunge', ...t.patterns.filter((p) => !['squat', 'hinge', 'lunge'].includes(p))],
        }
      }
      return t
    })
  }

  // Trim templates to days
  sessionTemplates = sessionTemplates.slice(0, days)

  const weekdays = (profile?.schedule?.workoutWeekdays || [1, 3, 5]).slice(0, days)
  const mapping = weekdays.map((wd, i) => ({
    weekday: wd,
    templateId: sessionTemplates[i % sessionTemplates.length].id,
  }))

  return {
    daysPerWeek: days,
    splitType,
    sessionTemplates,
    mapping,
    explain: [
      `split=${splitType}`,
      `days=${days}`,
      `templates=${sessionTemplates.map((t) => t.id).join('/')}`,
    ],
  }
}
