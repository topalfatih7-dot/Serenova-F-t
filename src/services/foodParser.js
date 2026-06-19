/**
 * Yerel besin metni ayrıştırıcısı (Türkçe).
 *
 * Yaklaşım (hibrit, önce yerel → sonra AI):
 *  1. "2 yumurta, 1 dilim tam buğday ekmeği, 200 gram tavuk" gibi serbest metni
 *     token'lara böler.
 *  2. Her token için miktar, birim ve besin adını çıkarır.
 *  3. Besin adını normalize ederek FOOD_DB + customFoods'a karşı eşleştirir.
 *  4. Bulunan besinler = `matched`; bulunamayanlar = `unknown`.
 *  5. `unknown` listesi AI fallback için çağırana iletilir.
 */

// Türkçe karakterleri ve özel durumları normalize eder.
export function normalizeTr(str) {
  return String(str || '')
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Yazıyla yazılan miktarlar (Türkçe)
const WORD_NUMBERS = {
  bir: 1, iki: 2, uc: 3, dort: 4, bes: 5, alti: 6, yedi: 7, sekiz: 8, dokuz: 9, on: 10,
  yari: 0.5, yarim: 0.5, 'uc ceyrek': 0.75, ceyrek: 0.25,
}

// Bilinen birimleri normalize et (Türkçe → standart)
const UNIT_MAP = {
  g: 'gram', gr: 'gram', gram: 'gram',
  kg: 'kg', kilogram: 'kg',
  dilim: 'dilim', kare: 'kare',
  adet: 'adet', tane: 'adet',
  porsiyon: 'porsiyon', pors: 'porsiyon',
  kase: 'kase', kap: 'kase',
  bardak: 'bardak', su: 'bardak',
  fincan: 'fincan',
  'yemek kasigi': 'yemek kaşığı', kasik: 'yemek kaşığı',
  'cay kasigi': 'çay kaşığı',
  avuc: 'avuç',
  paket: 'paket', kutu: 'kutu',
}

// Metinden miktarı çıkar: "2", "2.5", "bir", "yarım"
function extractQuantity(tokens) {
  if (!tokens.length) return { qty: 1, rest: tokens }
  const first = tokens[0]

  // Sayısal
  const num = parseFloat(first.replace(',', '.'))
  if (!isNaN(num) && num > 0) return { qty: num, rest: tokens.slice(1) }

  // İki kelimeli sayı (ör. "uc ceyrek")
  if (tokens.length >= 2) {
    const twoWord = normalizeTr(tokens.slice(0, 2).join(' '))
    if (WORD_NUMBERS[twoWord] !== undefined) return { qty: WORD_NUMBERS[twoWord], rest: tokens.slice(2) }
  }

  // Tek kelimeli sayı
  const oneWord = normalizeTr(first)
  if (WORD_NUMBERS[oneWord] !== undefined) return { qty: WORD_NUMBERS[oneWord], rest: tokens.slice(1) }

  return { qty: 1, rest: tokens }
}

// Metinden birimi çıkar
function extractUnit(tokens) {
  if (!tokens.length) return { unit: null, rest: tokens }
  const norm = normalizeTr(tokens[0])

  // İki kelimeli birim (ör. "yemek kaşığı")
  if (tokens.length >= 2) {
    const twoNorm = normalizeTr(tokens.slice(0, 2).join(' '))
    if (UNIT_MAP[twoNorm]) return { unit: UNIT_MAP[twoNorm], rest: tokens.slice(2) }
  }

  if (UNIT_MAP[norm]) return { unit: UNIT_MAP[norm], rest: tokens.slice(1) }

  return { unit: null, rest: tokens }
}

// Bir besin token'ını ({qty, unit, name}) ayrıştır.
function parseToken(raw) {
  const clean = raw.trim().replace(/\s+/g, ' ')
  const words = clean.split(' ')
  const { qty, rest: r1 } = extractQuantity(words)
  const { unit, rest: r2 } = extractUnit(r1)
  const name = r2.join(' ').trim() || r1.join(' ').trim()
  return { qty, unit, name: name || clean }
}

// ── Eşleştirme ──────────────────────────────────────────────────────

// Fuzzy skor: 0-1 (1 = mükemmel eşleşme)
function matchScore(queryNorm, foodNorm) {
  if (foodNorm === queryNorm) return 1
  if (foodNorm.startsWith(queryNorm) || foodNorm.includes(queryNorm)) return 0.9
  if (queryNorm.startsWith(foodNorm)) return 0.85

  // Kelime kesişimi
  const qWords = queryNorm.split(' ').filter(Boolean)
  const fWords = foodNorm.split(' ').filter(Boolean)
  const common = qWords.filter((w) => w.length >= 3 && fWords.some((fw) => fw.startsWith(w) || w.startsWith(fw)))
  if (common.length > 0) {
    const ratio = (common.length * 2) / (qWords.length + fWords.length)
    return ratio * 0.8
  }
  return 0
}

// Tüm besin listesinde en iyi eşleşmeyi bul
function findBestMatch(name, allFoods) {
  const query = normalizeTr(name)
  if (!query) return null
  let best = null
  let bestScore = 0.45 // minimum eşik
  for (const food of allFoods) {
    const foodNorm = normalizeTr(food.name)
    const score = matchScore(query, foodNorm)
    if (score > bestScore) {
      bestScore = score
      best = food
    }
  }
  return best
}

// Birimi kalori hesabına çevir
function calcCalories(food, qty, unit) {
  const g = (() => {
    const u = (unit || '').toLowerCase()
    if (u === 'gram') return qty
    if (u === 'kg') return qty * 1000
    // Besin'in kendi birimi veya genel "porsiyon" → unitG kullan
    if (!u || u === 'porsiyon' || u === food.unit?.toLowerCase()) return qty * (food.unitG || 100)
    return qty * (food.unitG || 100)
  })()
  return Math.round((food.cal100 * g) / 100)
}

/**
 * Ana ayrıştırma fonksiyonu.
 * @param {string} text  — kullanıcı girişi (örn. "2 yumurta, 1 dilim ekmek, 200g tavuk")
 * @param {Array} allFoods — FOOD_DB + customFoods birleşimi
 * @returns {{ matched: Array, unknown: Array }}
 *   matched:  [{food, qty, unit, cal, displayName}]
 *   unknown:  [{raw, name, qty, unit}]  — AI fallback için
 */
export function parseFoodText(text, allFoods) {
  // Ayırıcılar: virgül, noktalı virgül, "ve", "ile", satır sonu
  const rawTokens = text
    .split(/[,;\n]+|(?:\s+(?:ve|ile)\s+)/i)
    .map((t) => t.trim())
    .filter(Boolean)

  const matched = []
  const unknown = []

  for (const raw of rawTokens) {
    const { qty, unit, name } = parseToken(raw)
    if (!name) continue
    const food = findBestMatch(name, allFoods)
    if (food) {
      const cal = calcCalories(food, qty, unit)
      matched.push({ food, qty, unit: unit || food.unit, cal, displayName: name })
    } else {
      unknown.push({ raw, name, qty, unit: unit || null })
    }
  }

  return { matched, unknown }
}
