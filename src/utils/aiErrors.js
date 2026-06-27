/** Analiz API hatalarını kullanıcı dostu Türkçe mesaja çevirir (müşteriye teknik detay göstermez). */
export function formatAiError(error, code) {
  const raw = String(error || '')
  const c = code || ''

  if (c === 'rate_limit' || raw.includes('429') || raw.toLowerCase().includes('quota')) {
    return 'Analiz limitine ulaşıldı. Birkaç dakika bekleyip tekrar deneyin.'
  }
  if (c === 'network_error' || raw === 'Failed to fetch' || raw.toLowerCase().includes('fetch failed')) {
    return 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.'
  }
  if (raw.includes('yapılandırması eksik') || raw.includes('503')) {
    return 'Kalori analizi şu an kullanılamıyor. Lütfen daha sonra tekrar deneyin.'
  }
  if (raw.includes('503') || raw.includes('502')) {
    return 'Analiz servisi geçici olarak kullanılamıyor. Lütfen daha sonra tekrar deneyin.'
  }
  if (raw && !raw.includes('GEMINI') && !raw.includes('API')) {
    return raw.slice(0, 180)
  }
  return 'Analiz tamamlanamadı. Lütfen tekrar deneyin.'
}
