/**
 * Egzersiz açıklama ve talimatlarını akıcı Türkçeye çevirir.
 * İsimler değiştirilmez — yalnızca description + instructions.
 */

const TRANSLATE_URL = 'https://translate.googleapis.com/translate_a/single'
const DEFAULT_DELAY_MS = 120
const MAX_RETRIES = 4

const POLISH_REPLACEMENTS = [
  [/demirci makinesi/gi, 'Smith makinesi'],
  [/demirci makine/gi, 'Smith makine'],
  [/smith makine/gi, 'Smith makinesi'],
  [/obliklere/gi, 'yan karın kaslarına'],
  [/oblikleri/gi, 'yan karın kaslarını'],
  [/oblikler/gi, 'yan karın kasları'],
  [/oblik/gi, 'yan karın'],
  [/karın kası tekerleği/gi, 'ab tekerleği'],
  [/karın kasları tekerleği/gi, 'ab tekerleği'],
  [/merkez bölgenizi/gi, 'karın kaslarınızı'],
  [/merkez bölge/gi, 'karın kasları'],
  [/çekirdek stabilitesine/gi, 'core stabilitesine'],
  [/çekirdek/gi, 'core'],
  [/gövdenizi/gi, 'vücudunuzu'],
  [/gövde/gi, 'vücut'],
  [/tekrarlar için/gi, 'tekrar için'],
  [/istediğiniz sayıda/gi, 'istediğiniz'],
  [/veya karın kasları egzersizidir/gi, 'veya ab tekerleği egzersizidir'],
  [/çıtırtı hareketi/gi, 'mekik hareketi'],
  [/cable crunch/gi, 'kablo mekik'],
  [/karın kaslarıde/gi, 'karın kaslarında'],
  [/addüktör/gi, 'iç uyluk'],
  [/latları/gi, 'kanat kaslarını'],
  [/eşkenar dörtgenleri/gi, 'romboid kasları'],
  [/tuzakları/gi, 'trapez kaslarını'],
  [/arka sıradaki/gi, 'sırt'],
]

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

export function polishTurkishFitnessText(text) {
  let out = String(text || '').trim()
  for (const [re, rep] of POLISH_REPLACEMENTS) {
    out = out.replace(re, rep)
  }
  return out.replace(/\s+/g, ' ').trim()
}

async function requestTranslate(text) {
  const url = `${TRANSLATE_URL}?client=gtx&sl=en&tl=tr&dt=t&q=${encodeURIComponent(text)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Çeviri HTTP ${res.status}`)
  const data = await res.json()
  const parts = data?.[0]
  if (!Array.isArray(parts)) throw new Error('Çeviri yanıtı geçersiz')
  return parts.map((p) => p?.[0] || '').join('')
}

export async function translateEnglishToTurkish(text, { delayMs = DEFAULT_DELAY_MS } = {}) {
  const source = String(text || '').trim()
  if (!source) return ''

  let lastErr = null
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (delayMs > 0) await sleep(delayMs)
      const translated = await requestTranslate(source)
      return polishTurkishFitnessText(translated)
    } catch (err) {
      lastErr = err
      await sleep(800 * (attempt + 1))
    }
  }
  throw lastErr || new Error('Çeviri başarısız')
}

const STEP_DELIM = '@@STEP@@'

export async function translateInstructions(steps, opts = {}) {
  const list = Array.isArray(steps) ? steps.filter(Boolean) : []
  if (!list.length) return []
  if (list.length === 1) {
    return [await translateEnglishToTurkish(list[0], opts)]
  }

  const batch = `${STEP_DELIM}${list.join(STEP_DELIM)}`
  const translated = await translateEnglishToTurkish(batch, opts)
  const parts = translated.split(STEP_DELIM).map((s) => s.trim()).filter(Boolean)
  if (parts.length === list.length) return parts

  // Ayırıcı bozulursa tek tek dene
  const out = []
  for (const step of list) {
    out.push(await translateEnglishToTurkish(step, opts))
  }
  return out
}

export function buildTurkishDescriptionBlock(description, instructions) {
  const parts = []
  if (description) parts.push(description)
  const steps = Array.isArray(instructions) ? instructions.filter(Boolean) : []
  if (steps.length) {
    parts.push('')
    parts.push('Uygulama adımları:')
    steps.forEach((step, i) => parts.push(`${i + 1}. ${step}`))
  }
  return parts.join('\n').trim()
}

/** İngilizce kaynak metinden açıklama + talimatları Türkçeleştirir */
export async function translateExerciseContent({ description, instructions } = {}, opts = {}) {
  const descTr = description
    ? await translateEnglishToTurkish(description, opts)
    : ''
  const stepsTr = await translateInstructions(instructions, opts)
  return {
    description: buildTurkishDescriptionBlock(descTr, stepsTr),
    instructions: stepsTr,
  }
}
