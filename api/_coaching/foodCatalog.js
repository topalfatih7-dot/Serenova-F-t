/**
 * Program üretimi için food_dictionary adayları (ALLOW list → prompt).
 */

import { detectAllergyFlags } from './nutritionGuard.js'

const ALLERGY_TAG_DENY = {
  gluten: ['contains_gluten'],
  lactose: ['contains_lactose'],
  nut: ['contains_nut'],
  egg: ['contains_egg'],
}

const PREF_TAG_PREFER = {
  gluten: 'gluten_free',
  lactose: 'lactose_free',
  plant: 'plant_based',
  vegan: 'plant_based',
  vegetarian: 'plant_based',
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {{ healthTest?: object, nutritionPrefs?: string[], limit?: number }} [opts]
 */
export async function loadFoodAllowlist(admin, opts = {}) {
  if (!admin) return { foods: [], promptBlock: '', allergyFlags: [] }
  const healthTest = opts.healthTest || {}
  const allergyFlags = detectAllergyFlags(healthTest)
  const limit = Math.min(140, Math.max(40, Number(opts.limit) || 90))

  let { data, error } = await admin
    .from('food_dictionary')
    .select('name, name_normalized, cal_per_unit, unit, protein_g, fat_g, carb_g, tags, source')
    .contains('tags', ['turkish_staple'])
    .order('usage_count', { ascending: false })
    .limit(limit)

  // Eski şema / eksik kolon: makro alanları olmadan dene
  if (error && /protein_g|fat_g|carb_g|tags/i.test(error.message || '')) {
    const legacy = await admin
      .from('food_dictionary')
      .select('name, name_normalized, cal_per_unit, unit, source')
      .order('usage_count', { ascending: false })
      .limit(limit)
    data = (legacy.data || []).map((row) => ({ ...row, protein_g: null, fat_g: null, carb_g: null, tags: [] }))
    error = legacy.error
  }

  if (error || !data?.length) {
    const fallback = await admin
      .from('food_dictionary')
      .select('name, name_normalized, cal_per_unit, unit, protein_g, fat_g, carb_g, tags, source')
      .order('usage_count', { ascending: false })
      .limit(limit)
    data = fallback.data || []
    error = fallback.error
    if (error && /protein_g|fat_g|carb_g|tags/i.test(error.message || '')) {
      const legacy = await admin
        .from('food_dictionary')
        .select('name, name_normalized, cal_per_unit, unit, source')
        .order('usage_count', { ascending: false })
        .limit(limit)
      data = (legacy.data || []).map((row) => ({ ...row, protein_g: null, fat_g: null, carb_g: null, tags: [] }))
      error = legacy.error
    }
  }

  if (error) {
    console.warn('[foodCatalog]', error.message || error)
    return { foods: [], promptBlock: '', allergyFlags }
  }

  const denyTags = new Set()
  for (const flag of allergyFlags) {
    for (const t of ALLERGY_TAG_DENY[flag] || []) denyTags.add(t)
  }

  const prefs = (opts.nutritionPrefs || []).map((p) => String(p).toLowerCase())
  const preferTags = new Set()
  for (const p of prefs) {
    if (PREF_TAG_PREFER[p]) preferTags.add(PREF_TAG_PREFER[p])
    if (p.includes('gluten')) preferTags.add('gluten_free')
    if (p.includes('laktoz') || p.includes('lactose')) preferTags.add('lactose_free')
    if (p.includes('vegan') || p.includes('vejet') || p.includes('bitkisel')) preferTags.add('plant_based')
  }

  let foods = (data || []).filter((row) => {
    const tags = Array.isArray(row.tags) ? row.tags : []
    if (tags.some((t) => denyTags.has(t))) return false
    if (allergyFlags.includes('gluten') && tags.includes('contains_gluten')) return false
    if (allergyFlags.includes('lactose') && tags.includes('contains_lactose')) return false
    if (allergyFlags.includes('nut') && tags.includes('contains_nut')) return false
    if (allergyFlags.includes('egg') && tags.includes('contains_egg')) return false
    return true
  })

  if (preferTags.size) {
    foods = [...foods].sort((a, b) => {
      const at = Array.isArray(a.tags) ? a.tags : []
      const bt = Array.isArray(b.tags) ? b.tags : []
      const as = at.some((t) => preferTags.has(t)) ? 1 : 0
      const bs = bt.some((t) => preferTags.has(t)) ? 1 : 0
      return bs - as
    })
  }

  foods = foods.slice(0, 70)
  const lines = foods.map((f) => {
    const p = f.protein_g != null ? ` P${Math.round(Number(f.protein_g))}g` : ''
    return `- ${f.name} (${f.unit || 'porsiyon'} ~${f.cal_per_unit} kcal${p})`
  })

  const promptBlock = lines.length
    ? [
      'ALLOWED_FOODS (tercihen bunlardan kur; makroyu uydurma, porsiyon + ~kcal yaz):',
      ...lines,
    ].join('\n')
    : ''

  return { foods, promptBlock, allergyFlags }
}

/** Guard için isim → makro haritası */
export function buildFoodMacroIndex(foods = []) {
  const byNorm = new Map()
  for (const f of foods) {
    const key = String(f.name_normalized || f.name || '').toLowerCase()
    if (!key) continue
    byNorm.set(key, {
      cal: Number(f.cal_per_unit) || 0,
      protein: Number(f.protein_g) || 0,
      fat: Number(f.fat_g) || 0,
      carb: Number(f.carb_g) || 0,
      name: f.name,
    })
  }
  return byNorm
}
