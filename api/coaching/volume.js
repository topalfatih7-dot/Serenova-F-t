/**
 * Volume Engine — haftalık set hedefleri (NSCA/ACSM pragmatic bands).
 * Çıktı note/amount’a map edilir; yeni DB alanı yok.
 */

const BASE_WEEKLY_SETS = {
  novice: { min: 6, max: 10 },
  beginner: { min: 8, max: 12 },
  intermediate: { min: 10, max: 16 },
  advanced: { min: 12, max: 18 },
}

/**
 * @returns {{
 *   weeklySetsPerMuscle: { min, max, target },
 *   setsPerSessionMajor: number,
 *   volumeScale: number,
 *   deload: boolean,
 *   explain: string[],
 * }}
 */
export function planVolume(profile, goalPlan, riskReport, opts = {}) {
  const exp = profile?.experienceLevel || 'beginner'
  const band = BASE_WEEKLY_SETS[exp] || BASE_WEEKLY_SETS.beginner
  const days = Math.max(2, profile?.schedule?.workoutWeekdays?.length || 3)
  const recovery = profile?.scores?.recovery ?? 50
  const riskLevel = riskReport?.level || 'low'
  const age = profile?.age || 30
  const bias = goalPlan?.programBias || 'general'
  const mesocycleWeek = Number(opts.mesocycleWeek) || 1
  const adaptationMode = opts.adaptationMode || 'maintain'

  let volumeScale = 1
  const explain = [`volume base ${exp}: ${band.min}-${band.max} set/kas/hafta`]

  if (bias === 'fat_loss') {
    volumeScale *= 0.9
    explain.push('fat_loss: volume −10%')
  } else if (bias === 'strength') {
    volumeScale *= 0.85
    explain.push('strength: volume −15% (yoğunluk öncelik)')
  } else if (bias === 'mobility' || goalPlan?.primary === 'rehab_support') {
    volumeScale *= 0.75
    explain.push('rehab/mobility: volume −25%')
  }

  if (recovery < 45) {
    volumeScale *= 0.8
    explain.push('recovery düşük: volume −20%')
  } else if (recovery > 70 && riskLevel === 'low') {
    volumeScale *= 1.1
    explain.push('recovery yüksek: volume +10%')
  }

  if (age >= 50) {
    volumeScale *= 0.9
    explain.push('yaş≥50: volume −10%')
  }

  if (riskLevel === 'high' || riskLevel === 'referral') {
    volumeScale *= 0.7
    explain.push(`risk ${riskLevel}: volume −30%`)
  }

  // Deload: her 4. mesocycle haftası veya adaptation restart
  let deload = false
  if (mesocycleWeek > 0 && mesocycleWeek % 4 === 0) {
    deload = true
    volumeScale *= 0.6
    explain.push('deload haftası (mesocycle %4)')
  }
  if (adaptationMode === 'restart_easy') {
    deload = true
    volumeScale = Math.min(volumeScale, 0.7)
    explain.push('deload: restart_easy')
  } else if (adaptationMode === 'ease') {
    volumeScale *= 0.85
    explain.push('ease: volume −15%')
  } else if (adaptationMode === 'push' && !deload) {
    volumeScale *= 1.05
    explain.push('push: volume +5%')
  }

  volumeScale = Math.max(0.5, Math.min(1.25, volumeScale))

  const target = Math.round(((band.min + band.max) / 2) * volumeScale)
  const min = Math.max(4, Math.round(band.min * volumeScale))
  const max = Math.max(min + 2, Math.round(band.max * volumeScale))

  // Seans başına major pattern set ≈ haftalık / gün (basit dağılım)
  const setsPerSessionMajor = Math.max(2, Math.min(4, Math.round(target / days)))

  return {
    weeklySetsPerMuscle: { min, max, target },
    setsPerSessionMajor,
    volumeScale,
    deload,
    explain,
  }
}
