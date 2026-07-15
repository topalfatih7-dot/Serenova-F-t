/**
 * Kalori metin analizi — öğün cache + global yiyecek sözlüğü.
 * Yazımlar service_role ile; hata durumunda null döner (AI akışı bozulmaz).
 */

import { getSupabaseAdmin } from './_supabaseAdmin.js'

const TR_MAP = {
  İ: 'i', I: 'ı', Ş: 'ş', Ğ: 'ğ', Ü: 'ü', Ö: 'ö', Ç: 'ç',
}

function toTrLower(s) {
  return String(s || '')
    .replace(/[İIŞĞÜÖÇ]/g, (ch) => TR_MAP[ch] || ch)
    .toLocaleLowerCase('tr-TR')
}

/** Öğün / yiyecek adı normalize — eşleşme için. */
export function normalizeMealQuery(text) {
  let s = toTrLower(String(text || '').trim())
  s = s
    .replace(/["""'']/g, '')
    .replace(/[;|•·]/g, ',')
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+ve\s+/g, ', ')
    .replace(/[, ]+/g, (m) => (m.includes(',') ? ', ' : ' '))
    .replace(/^[, ]+|[, ]+$/g, '')
    .trim()
  // Minimal çoğul sadeleştirme (yalnızca tam eşleşme için query üzerinde agresif değil)
  return s.slice(0, 500)
}

export function normalizeFoodName(name) {
  let s = toTrLower(String(name || '').trim())
  s = s
    .replace(/["""'']/g, '')
    .replace(/[^\wğüşıöç\s-]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  // Yaygın çoğul / ek sadeleştirme
  if (s.endsWith('lar') || s.endsWith('ler')) s = s.slice(0, -3)
  else if (s.endsWith('ları') || s.endsWith('leri')) s = s.slice(0, -4)
  return s.slice(0, 80)
}

/**
 * Naive öğün parçalama — virgül / satır / "ve".
 * @returns {{ raw: string, amount: number, nameHint: string, nameNormalized: string }[]}
 */
export function parseMealItemsNaive(text) {
  const cleaned = String(text || '')
    .replace(/\n+/g, ',')
    .replace(/\s+ve\s+/gi, ',')
  const parts = cleaned.split(/[,;]+/).map((p) => p.trim()).filter(Boolean)
  const items = []

  for (const part of parts) {
    const m = part.match(/^(\d+(?:[.,]\d+)?|yar[iı]m|çeyrek)?\s*(.+)$/i)
    if (!m) continue
    let amount = 1
    const amountRaw = (m[1] || '').toLocaleLowerCase('tr-TR')
    if (amountRaw === 'yarım' || amountRaw === 'yarim') amount = 0.5
    else if (amountRaw === 'çeyrek' || amountRaw === 'ceyrek') amount = 0.25
    else if (amountRaw) amount = Number(String(amountRaw).replace(',', '.')) || 1

    let rest = (m[2] || '').trim()
    // "2 dilim ekmek" → amount 2 zaten; birim kelimesini isimde bırak
    const leadingNum = rest.match(/^(\d+(?:[.,]\d+)?)\s+(.+)$/)
    if (!m[1] && leadingNum) {
      amount = Number(String(leadingNum[1]).replace(',', '.')) || amount
      rest = leadingNum[2]
    }

    const nameNormalized = normalizeFoodName(rest)
    if (!nameNormalized || nameNormalized.length < 2) continue
    items.push({
      raw: part,
      amount,
      nameHint: rest.slice(0, 60),
      nameNormalized,
    })
  }

  return items
}

function normalizeAnalysisItems(items) {
  if (!Array.isArray(items)) return []
  return items.map((it) => ({
    name: String(it.name || 'Bilinmeyen').slice(0, 60),
    amount: Number(it.amount) || 1,
    unit: String(it.unit || 'porsiyon').slice(0, 20),
    cal: Math.max(0, Math.round(Number(it.cal) || 0)),
  }))
}

export async function lookupMealCache(queryNormalized) {
  const admin = getSupabaseAdmin()
  if (!admin || !queryNormalized) return null
  try {
    const { data, error } = await admin
      .from('meal_analysis_cache')
      .select('id, label, items, confidence, hit_count')
      .eq('query_normalized', queryNormalized)
      .maybeSingle()
    if (error || !data) return null

    await admin
      .from('meal_analysis_cache')
      .update({
        hit_count: (Number(data.hit_count) || 0) + 1,
        last_hit_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id)
      .then(() => {})
      .catch(() => {})

    return {
      label: data.label || 'Kayıtlı Öğün',
      items: normalizeAnalysisItems(data.items),
      confidence: data.confidence || 'medium',
    }
  } catch {
    return null
  }
}

export async function upsertMealCache({
  queryNormalized,
  queryRaw,
  label,
  items,
  confidence,
  userId = null,
}) {
  const admin = getSupabaseAdmin()
  if (!admin || !queryNormalized) return
  const payload = {
    query_normalized: queryNormalized,
    query_raw: String(queryRaw || '').slice(0, 500),
    label: String(label || 'Yazılan Öğün').slice(0, 60),
    items: normalizeAnalysisItems(items),
    confidence: confidence || 'medium',
    updated_at: new Date().toISOString(),
    last_hit_at: new Date().toISOString(),
    created_by: userId || null,
  }
  try {
    const { data: existing } = await admin
      .from('meal_analysis_cache')
      .select('id, hit_count')
      .eq('query_normalized', queryNormalized)
      .maybeSingle()

    if (existing?.id) {
      await admin
        .from('meal_analysis_cache')
        .update({
          ...payload,
          hit_count: (Number(existing.hit_count) || 0) + 1,
        })
        .eq('id', existing.id)
    } else {
      await admin.from('meal_analysis_cache').insert({
        ...payload,
        hit_count: 1,
      })
    }
  } catch {
    /* ignore */
  }
}

export async function lookupFoodItems(parsedItems) {
  const admin = getSupabaseAdmin()
  if (!admin || !parsedItems?.length) return { found: [], missing: parsedItems || [] }

  const norms = [...new Set(parsedItems.map((p) => p.nameNormalized).filter(Boolean))]
  if (!norms.length) return { found: [], missing: parsedItems }

  try {
    const { data, error } = await admin
      .from('food_dictionary')
      .select('id, name, name_normalized, cal_per_unit, unit, amount_default, usage_count')
      .in('name_normalized', norms)

    if (error) return { found: [], missing: parsedItems }

    const byNorm = new Map((data || []).map((row) => [row.name_normalized, row]))
    const found = []
    const missing = []

    for (const parsed of parsedItems) {
      const row = byNorm.get(parsed.nameNormalized)
      if (row) found.push({ parsed, row })
      else missing.push(parsed)
    }

    // usage bump (fire-and-forget)
    if (found.length) {
      Promise.all(
        found.map(({ row }) =>
          admin
            .from('food_dictionary')
            .update({
              usage_count: (Number(row.usage_count) || 0) + 1,
              updated_at: new Date().toISOString(),
            })
            .eq('id', row.id),
        ),
      ).catch(() => {})
    }

    return { found, missing }
  } catch {
    return { found: [], missing: parsedItems }
  }
}

/**
 * Sözlükten tam öğün sonucu üret.
 * @returns {{ label: string, items: object[], confidence: string } | null}
 */
export function composeFromDictionary(foundPairs) {
  if (!foundPairs?.length) return null
  const items = foundPairs.map(({ parsed, row }) => {
    const amount = Number(parsed.amount) || Number(row.amount_default) || 1
    const calPer = Number(row.cal_per_unit) || 0
    const baseAmount = Number(row.amount_default) || 1
    const cal = Math.max(0, Math.round((calPer / baseAmount) * amount))
    return {
      name: String(row.name || parsed.nameHint).slice(0, 60),
      amount,
      unit: String(row.unit || 'porsiyon').slice(0, 20),
      cal,
    }
  })
  const names = items.map((i) => i.name).slice(0, 3).join(', ')
  return {
    label: names ? `Öğün (${names})` : 'Sözlük Öğünü',
    items,
    confidence: 'medium',
  }
}

export async function upsertFoodItems(items, source = 'ai') {
  const admin = getSupabaseAdmin()
  if (!admin || !items?.length) return

  for (const it of items) {
    const name = String(it.name || '').trim()
    if (!name) continue
    const nameNormalized = normalizeFoodName(name)
    if (!nameNormalized) continue
    const amount = Number(it.amount) || 1
    const cal = Math.max(0, Math.round(Number(it.cal) || 0))
    const unit = String(it.unit || 'porsiyon').slice(0, 20)
    // cal_per_unit = bu amount için toplam kalori; amount_default = amount
    const calPerUnit = cal
    const amountDefault = amount > 0 ? amount : 1

    try {
      const { data: existing } = await admin
        .from('food_dictionary')
        .select('id, usage_count')
        .eq('name_normalized', nameNormalized)
        .maybeSingle()

      if (existing?.id) {
        await admin
          .from('food_dictionary')
          .update({
            name: name.slice(0, 60),
            cal_per_unit: calPerUnit,
            unit,
            amount_default: amountDefault,
            source,
            usage_count: (Number(existing.usage_count) || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
      } else {
        await admin.from('food_dictionary').insert({
          name: name.slice(0, 60),
          name_normalized: nameNormalized,
          cal_per_unit: calPerUnit,
          unit,
          amount_default: amountDefault,
          source,
          usage_count: 1,
        })
      }
    } catch {
      /* ignore tekil hata */
    }
  }
}
