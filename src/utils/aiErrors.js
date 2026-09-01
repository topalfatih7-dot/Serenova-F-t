/** Analiz API hatalarını kullanıcı dostu Türkçe mesaja çevirir (müşteriye teknik detay göstermez). */
export function formatAiError(error, code) {
  const raw = String(error || '')
  const c = code || ''
  const lower = raw.toLowerCase()

  if (c === 'rate_limit' || c === 'quota_exceeded' || raw.includes('429') || lower.includes('quota') || lower.includes('limitine')) {
    return 'Analiz limitine ulaşıldı. Birkaç dakika bekleyip tekrar deneyin.'
  }
  if (c === 'unusable_image') {
    return raw && !/(api[_ ]?key|openai)/i.test(raw)
      ? raw.slice(0, 180)
      : 'Fotoğraf analiz için uygun değil. Daha net ve aydınlık bir kare çekin.'
  }
  if (c === 'not_food') {
    return 'Fotoğrafta yemek tespit edilemedi. Tabağı veya ürünü net çekin.'
  }
  if (c === 'unmatched_food') {
    return raw && raw.length < 180 ? raw : 'Bu yiyecek için besin değeri bulunamadı.'
  }
  if (
    c === 'invalid_api_key'
    || lower.includes('geçersiz')
    || lower.includes('yetkisiz')
    || lower.includes('incorrect api key')
    || lower.includes('openai_api_key kontrol')
  ) {
    return 'Kalori AI anahtarı geçersiz veya yetkisiz. OPENAI_API_KEY değerini kontrol edin.'
  }
  if (raw.includes('yapılandırması eksik') || (raw.includes('503') && lower.includes('openai'))) {
    return 'Kalori analizi şu an kullanılamıyor (OPENAI_API_KEY eksik). Lütfen daha sonra tekrar deneyin.'
  }
  if (raw.includes('yapılandırması eksik') || raw.includes('503')) {
    return 'Kalori analizi şu an kullanılamıyor. Lütfen daha sonra tekrar deneyin.'
  }
  if (raw.includes('503') || raw.includes('502')) {
    return 'Analiz servisi geçici olarak kullanılamıyor. Lütfen daha sonra tekrar deneyin.'
  }
  if (raw && !raw.includes('GEMINI') && !/(api[_ ]?key|openai|gemini)/i.test(raw)) {
    return raw.slice(0, 180)
  }
  return 'Analiz tamamlanamadı. Lütfen tekrar deneyin.'
}
