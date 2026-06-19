// Ülke telefon kodları — kayıt formundaki telefon alanı için.
// Her ülke: iso (ISO-3166 alfa-2), name (Türkçe), dial (uluslararası kod),
// flag (emoji), min/max (ulusal numara hane sayısı aralığı).

export const COUNTRY_CODES = [
  { iso: 'TR', name: 'Türkiye', dial: '90', flag: '🇹🇷', min: 10, max: 10 },
  { iso: 'DE', name: 'Almanya', dial: '49', flag: '🇩🇪', min: 10, max: 11 },
  { iso: 'NL', name: 'Hollanda', dial: '31', flag: '🇳🇱', min: 9, max: 9 },
  { iso: 'GB', name: 'Birleşik Krallık', dial: '44', flag: '🇬🇧', min: 10, max: 10 },
  { iso: 'US', name: 'Amerika', dial: '1', flag: '🇺🇸', min: 10, max: 10 },
  { iso: 'FR', name: 'Fransa', dial: '33', flag: '🇫🇷', min: 9, max: 9 },
  { iso: 'AT', name: 'Avusturya', dial: '43', flag: '🇦🇹', min: 9, max: 11 },
  { iso: 'BE', name: 'Belçika', dial: '32', flag: '🇧🇪', min: 8, max: 9 },
  { iso: 'CH', name: 'İsviçre', dial: '41', flag: '🇨🇭', min: 9, max: 9 },
  { iso: 'AZ', name: 'Azerbaycan', dial: '994', flag: '🇦🇿', min: 9, max: 9 },
  { iso: 'CY', name: 'Kıbrıs (KKTC)', dial: '90', flag: '🇨🇾', min: 10, max: 10 },
  { iso: 'SA', name: 'Suudi Arabistan', dial: '966', flag: '🇸🇦', min: 9, max: 9 },
  { iso: 'AE', name: 'BAE', dial: '971', flag: '🇦🇪', min: 9, max: 9 },
  { iso: 'QA', name: 'Katar', dial: '974', flag: '🇶🇦', min: 8, max: 8 },
  { iso: 'RU', name: 'Rusya', dial: '7', flag: '🇷🇺', min: 10, max: 10 },
  { iso: 'UA', name: 'Ukrayna', dial: '380', flag: '🇺🇦', min: 9, max: 9 },
  { iso: 'BG', name: 'Bulgaristan', dial: '359', flag: '🇧🇬', min: 8, max: 9 },
  { iso: 'GR', name: 'Yunanistan', dial: '30', flag: '🇬🇷', min: 10, max: 10 },
  { iso: 'IT', name: 'İtalya', dial: '39', flag: '🇮🇹', min: 9, max: 10 },
  { iso: 'ES', name: 'İspanya', dial: '34', flag: '🇪🇸', min: 9, max: 9 },
  { iso: 'SE', name: 'İsveç', dial: '46', flag: '🇸🇪', min: 7, max: 10 },
  { iso: 'NO', name: 'Norveç', dial: '47', flag: '🇳🇴', min: 8, max: 8 },
  { iso: 'DK', name: 'Danimarka', dial: '45', flag: '🇩🇰', min: 8, max: 8 },
  { iso: 'CA', name: 'Kanada', dial: '1', flag: '🇨🇦', min: 10, max: 10 },
  { iso: 'AU', name: 'Avustralya', dial: '61', flag: '🇦🇺', min: 9, max: 9 },
]

export const DEFAULT_COUNTRY_ISO = 'TR'

export function getCountry(iso) {
  return COUNTRY_CODES.find((c) => c.iso === iso) || COUNTRY_CODES[0]
}

// Yalnızca rakamları tutar.
export function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '')
}

// Ülkeye göre ulusal numarayı okunabilir biçimde gruplar.
export function formatNationalNumber(iso, raw) {
  const country = getCountry(iso)
  let d = digitsOnly(raw).slice(0, country.max)
  if (iso === 'TR' || iso === 'CY') {
    // 5XX XXX XX XX (başında 0 olmadan 10 hane)
    if (d.startsWith('0')) d = d.slice(1)
    d = d.slice(0, 10)
    if (d.length <= 3) return d
    if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`
    if (d.length <= 8) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`
  }
  // Genel: 3'erli gruplama
  return d.replace(/(\d{3})(?=\d)/g, '$1 ').trim()
}

// Geçerli mi? (ulusal hane aralığı kontrolü)
export function isValidNationalNumber(iso, raw) {
  const country = getCountry(iso)
  let d = digitsOnly(raw)
  if ((iso === 'TR' || iso === 'CY') && d.startsWith('0')) d = d.slice(1)
  if ((iso === 'TR' || iso === 'CY') && !d.startsWith('5')) return false
  return d.length >= country.min && d.length <= country.max
}

// E.164 benzeri tam numara: +{dial}{national}
export function toE164(iso, raw) {
  const country = getCountry(iso)
  let d = digitsOnly(raw)
  if ((iso === 'TR' || iso === 'CY') && d.startsWith('0')) d = d.slice(1)
  return `+${country.dial}${d}`
}
