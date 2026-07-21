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
  [/çekirdeğinizi/gi, 'core bölgenizi'],
  [/çekirdek/gi, 'core'],
  [/gövdenizi/gi, 'vücudunuzu'],
  [/gövde/gi, 'vücut'],
  [/vücutnize/gi, 'vücudunuza'],
  [/vücutnizi/gi, 'vücudunuzu'],
  [/vücutnin/gi, 'vücudunuzun'],
  [/vücutniz/gi, 'vücudunuz'],
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
  // Makine çevirisi artıkları (position / reps parçaları)
  [/\s*konum\.?\s*$/gi, '.'],
  [/\s*tekrarlar\.?\s*$/gi, '.'],
  [/\s*tekrarlardan oluşuyor\.?\s*$/gi, '.'],
  [/\s+tekrarlar\s*$/gi, ''],
  [/İstediğiniz sayıda tekrar yapın\.\s*tekrarlar\.?/gi, 'İstediğiniz sayıda tekrar yapın.'],
  [/İstediğiniz sayıda tekrarlayın\.\s*tekrarlar\.?/gi, 'İstediğiniz sayıda tekrarlayın.'],
  [/İstediğiniz sayı için tekrarlayın\.\s*tekrarlardan oluşuyor\.?/gi, 'İstediğiniz sayıda tekrarlayın.'],
  [/İstediğiniz sayı için tekrarlayın\.?/gi, 'İstediğiniz sayıda tekrarlayın.'],
  [/Tekrarlayın\s+İstenilen sayıda tekrar\.?/gi, 'İstediğiniz sayıda tekrarlayın.'],
  [/Bunu tekrarlayın\.\s*İstenilen sayıda tekrar\.?/gi, 'İstediğiniz sayıda tekrarlayın.'],
  [/Tekrarlayın\.\s*İstenilen sayıda tekrar\.?/gi, 'İstediğiniz sayıda tekrarlayın.'],
  [/İstenen tekrar sayısı için tekrarlayın\.?/gi, 'İstediğiniz sayıda tekrarlayın.'],
]

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

export function polishTurkishFitnessText(text) {
  let out = String(text || '').trim()
  for (const [re, rep] of POLISH_REPLACEMENTS) {
    out = out.replace(re, rep)
  }
  return out
    .replace(/\.\.+/g, '.')
    .replace(/\s+\./g, '.')
    .replace(/\s+/g, ' ')
    .trim()
}

/** description içine gömülen "Uygulama adımları" bloğunu kaldırır (UI'da ayrı listelenir). */
export function stripEmbeddedInstructionBlock(description) {
  return String(description || '')
    .replace(/\s*Uygulama ad[ıi]mlar[ıi]:[\s\S]*$/i, '')
    .trim()
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

export function buildTurkishDescriptionBlock(description, _instructions) {
  // Adımlar yalnızca instructions alanında tutulur; description'a gömülmez
  // (UI "Açıklama" + "Nasıl yapılır" olarak ayrı gösterir).
  return stripEmbeddedInstructionBlock(description)
}

/** İngilizce kaynak metinden açıklama + talimatları Türkçeleştirir */
export async function translateExerciseContent({ description, instructions } = {}, opts = {}) {
  const descTr = description
    ? await translateEnglishToTurkish(description, opts)
    : ''
  const stepsTr = await translateInstructions(instructions, opts)
  return {
    description: buildTurkishDescriptionBlock(descTr),
    instructions: stepsTr.map(polishTurkishFitnessText),
  }
}
