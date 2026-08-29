/**
 * Türkiye EFT / IBAN banka kodları (5 hane, IBAN 5–9. karakterler).
 * Perakende mevduat + katılım önde; yatırım/kalkınma “diğer”.
 */

export const BANK_GROUPS = {
  deposit: 'Mevduat bankaları',
  participation: 'Katılım bankaları',
  other: 'Kalkınma ve yatırım',
}

export const TURKISH_BANKS = [
  { code: '00010', name: 'T.C. Ziraat Bankası A.Ş.', short: 'Ziraat', group: 'deposit', popular: true, aliases: ['ziraat bankasi', 'tc ziraat'], tone: 'red' },
  { code: '00012', name: 'Türkiye Halk Bankası A.Ş.', short: 'Halkbank', group: 'deposit', popular: true, aliases: ['halk bankasi', 'halk'], tone: 'navy' },
  { code: '00015', name: 'T. Vakıflar Bankası T.A.O.', short: 'VakıfBank', group: 'deposit', popular: true, aliases: ['vakifbank', 'vakif bankasi', 'vakıf'], tone: 'gold' },
  { code: '00032', name: 'Türkiye Ekonomi Bankası A.Ş.', short: 'TEB', group: 'deposit', popular: true, aliases: ['turkiye ekonomi', 'teb'], tone: 'navy' },
  { code: '00046', name: 'Akbank T.A.Ş.', short: 'Akbank', group: 'deposit', popular: true, aliases: ['ak bank'], tone: 'red' },
  { code: '00059', name: 'Şekerbank T.A.Ş.', short: 'Şekerbank', group: 'deposit', aliases: ['sekerbank', 'şeker'], tone: 'green' },
  { code: '00062', name: 'T. Garanti Bankası A.Ş.', short: 'Garanti BBVA', group: 'deposit', popular: true, aliases: ['garanti', 'bbva', 'garanti bbva'], tone: 'green' },
  { code: '00064', name: 'Türkiye İş Bankası A.Ş.', short: 'İş Bankası', group: 'deposit', popular: true, aliases: ['is bankasi', 'işbank', 'isbank'], tone: 'navy' },
  { code: '00067', name: 'Yapı ve Kredi Bankası A.Ş.', short: 'Yapı Kredi', group: 'deposit', popular: true, aliases: ['yapi kredi', 'ykb', 'yapıkredi'], tone: 'navy' },
  { code: '00099', name: 'ING Bank A.Ş.', short: 'ING', group: 'deposit', popular: true, aliases: ['ing bank'], tone: 'orange' },
  { code: '00103', name: 'Fibabanka A.Ş.', short: 'Fibabanka', group: 'deposit', aliases: ['fiba', 'fiba banka'], tone: 'navy' },
  { code: '00109', name: 'ICBC Turkey Bank A.Ş.', short: 'ICBC Turkey', group: 'deposit', aliases: ['icbc', 'tekstilbank'], tone: 'red' },
  { code: '00111', name: 'QNB Bank A.Ş.', short: 'QNB', group: 'deposit', popular: true, aliases: ['qnb finansbank', 'finansbank', 'finans bank'], tone: 'violet' },
  { code: '00123', name: 'HSBC Bank A.Ş.', short: 'HSBC', group: 'deposit', aliases: ['hsbc turkey'], tone: 'red' },
  { code: '00124', name: 'Alternatifbank A.Ş.', short: 'ABank', group: 'deposit', aliases: ['alternatifbank', 'alternatif bank'], tone: 'navy' },
  { code: '00125', name: 'Burgan Bank A.Ş.', short: 'Burgan', group: 'deposit', aliases: ['burgan bank'], tone: 'navy' },
  { code: '00129', name: 'Bank of China Turkey A.Ş.', short: 'Bank of China', group: 'deposit', aliases: ['boc', 'bank of china'], tone: 'red' },
  { code: '00132', name: 'Citibank A.Ş.', short: 'Citi', group: 'deposit', aliases: ['citi', 'citibank'], tone: 'navy' },
  { code: '00134', name: 'Denizbank A.Ş.', short: 'DenizBank', group: 'deposit', popular: true, aliases: ['deniz bank', 'denizbank'], tone: 'sky' },
  { code: '00135', name: 'Anadolubank A.Ş.', short: 'Anadolubank', group: 'deposit', aliases: ['anadolu bank'], tone: 'navy' },
  { code: '00143', name: 'Aktif Yatırım Bankası A.Ş.', short: 'Aktif Bank', group: 'other', aliases: ['aktif bank', 'aktif yatirim'], tone: 'orange' },
  { code: '00146', name: 'Odea Bank A.Ş.', short: 'Odeabank', group: 'deposit', aliases: ['odea', 'odea bank'], tone: 'violet' },
  { code: '00091', name: 'Arap Türk Bankası A.Ş.', short: 'Arap Türk', group: 'deposit', aliases: ['arap turk', 'atbank'], tone: 'green' },
  { code: '00092', name: 'Turkish Bank A.Ş.', short: 'Turkish Bank', group: 'deposit', aliases: ['turkishbank'], tone: 'navy' },
  { code: '00148', name: 'Intesa Sanpaolo S.p.A.', short: 'Intesa Sanpaolo', group: 'other', aliases: ['intesa'], tone: 'navy' },
  { code: '00115', name: 'Deutsche Bank A.Ş.', short: 'Deutsche Bank', group: 'other', aliases: ['deutsche'], tone: 'navy' },
  { code: '00116', name: 'PASHA Yatırım Bankası A.Ş.', short: 'PASHA Bank', group: 'other', aliases: ['pasha'], tone: 'navy' },
  { code: '00016', name: 'Türk Eximbank', short: 'Eximbank', group: 'other', aliases: ['eximbank', 'ihracat'], tone: 'sky' },
  { code: '00017', name: 'Türkiye Kalkınma ve Yatırım Bankası A.Ş.', short: 'TKYB', group: 'other', aliases: ['kalkinma', 'tkyb'], tone: 'green' },
  { code: '00014', name: 'Türkiye Sınai Kalkınma Bankası A.Ş.', short: 'TSKB', group: 'other', aliases: ['tskb', 'sinai'], tone: 'green' },
  { code: '00141', name: 'Nurol Yatırım Bankası A.Ş.', short: 'Nurol Bank', group: 'other', aliases: ['nurol'], tone: 'navy' },
  { code: '00203', name: 'Albaraka Türk Katılım Bankası A.Ş.', short: 'Albaraka Türk', group: 'participation', popular: true, aliases: ['albaraka'], tone: 'green' },
  { code: '00205', name: 'Kuveyt Türk Katılım Bankası A.Ş.', short: 'Kuveyt Türk', group: 'participation', popular: true, aliases: ['kuveyt turk', 'kuveytturk'], tone: 'sky' },
  { code: '00206', name: 'Türkiye Finans Katılım Bankası A.Ş.', short: 'Türkiye Finans', group: 'participation', popular: true, aliases: ['turkiye finans', 'tfkb'], tone: 'navy' },
  { code: '00209', name: 'Ziraat Katılım Bankası A.Ş.', short: 'Ziraat Katılım', group: 'participation', popular: true, aliases: ['ziraat katilim'], tone: 'red' },
  { code: '00210', name: 'Vakıf Katılım Bankası A.Ş.', short: 'Vakıf Katılım', group: 'participation', popular: true, aliases: ['vakif katilim', 'vakıf katılım'], tone: 'gold' },
  { code: '00211', name: 'Türkiye Emlak Katılım Bankası A.Ş.', short: 'Emlak Katılım', group: 'participation', aliases: ['emlak katilim', 'emlak katılım'], tone: 'gold' },
]

const BANK_BY_CODE = new Map(TURKISH_BANKS.map((b) => [b.code, b]))

export const BANK_TONE_CLASS = {
  red: 'bg-rose-100 text-rose-800',
  navy: 'bg-sky-100 text-sky-900',
  gold: 'bg-amber-100 text-amber-900',
  green: 'bg-sage-100 text-sage-800',
  orange: 'bg-orange-100 text-orange-900',
  violet: 'bg-violet-100 text-violet-800',
  sky: 'bg-cyan-100 text-cyan-900',
}

export function findBankByCode(code) {
  const key = String(code || '').replace(/\D/g, '').padStart(5, '0')
  if (key === '00000') return null
  return BANK_BY_CODE.get(key) || null
}

export function bankDisplayName(code, fallbackName = '') {
  const bank = findBankByCode(code)
  if (bank) return bank.short
  return String(fallbackName || '').trim() || (code ? `Banka ${code}` : 'Banka seçilmedi')
}

export function bankInitials(bank) {
  const label = bank?.short || bank?.name || '?'
  return label.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü0-9]/g, ' ').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toLocaleUpperCase('tr')
}

function bankSearchHaystack(bank) {
  return [bank.code, bank.name, bank.short, ...(bank.aliases || [])].join(' ').toLocaleLowerCase('tr')
}

export function searchBanks(query) {
  const q = String(query || '').trim().toLocaleLowerCase('tr')
  const list = q
    ? TURKISH_BANKS.filter((b) => bankSearchHaystack(b).includes(q))
    : [...TURKISH_BANKS].sort((a, b) => Number(Boolean(b.popular)) - Number(Boolean(a.popular)) || a.short.localeCompare(b.short, 'tr'))
  const grouped = { deposit: [], participation: [], other: [] }
  for (const bank of list) {
    grouped[bank.group]?.push(bank)
  }
  return grouped
}

export function unknownBank(code) {
  const padded = String(code || '').replace(/\D/g, '').padStart(5, '0')
  return {
    code: padded,
    name: `Bilinmeyen banka (${padded})`,
    short: `Kod ${padded}`,
    group: 'other',
    tone: 'navy',
    unknown: true,
  }
}
