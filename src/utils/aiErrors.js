/** AI API hatalarını kullanıcı dostu Türkçe mesaja çevirir */
export function formatAiError(error, code) {
  const raw = String(error || '')
  const c = code || (raw.includes('429') ? 'quota_exceeded' : null)

  if (c === 'quota_exceeded' || raw.includes('429') || raw.toLowerCase().includes('quota')) {
    return 'AI kullanım limitine ulaşıldı. Birkaç dakika bekleyip tekrar deneyin veya Google AI Studio kotanızı kontrol edin.'
  }
  if (c === 'network_error' || raw === 'Failed to fetch' || raw.toLowerCase().includes('fetch failed')) {
    return 'AI sunucusuna bağlanılamadı. Uygulamayı terminalde npm run dev ile çalıştırdığınızdan emin olun.'
  }
  if (raw.includes('GEMINI_API_KEY') || raw.includes('yapılandırması eksik')) {
    return 'AI yapılandırması eksik. GEMINI_API_KEY tanımlayın.'
  }
  if (raw.includes('503')) {
    return 'AI servisi şu an kullanılamıyor. Lütfen daha sonra tekrar deneyin.'
  }
  if (raw.length > 180) {
    return 'AI analizi başarısız oldu. Lütfen tekrar deneyin.'
  }
  return raw || 'AI analizi başarısız oldu.'
}
