/** AI başarısız olduğunda veya yapılandırma eksikken kullanılan yedek ipuçları */

export const FALLBACK_DAILY_TIPS = [
  'Bugün 10 dakikalık bir yürüyüş bile metabolizmanızı canlandırır.',
  'Su içmeyi unutmayın — güne 1 bardak suyla başlamak sindirimi destekler.',
  'Kaliteli uyku, antrenman kadar önemlidir. Bu gece erken yatmayı deneyin.',
  'Öğünlerinizi yavaş yemek tokluk hissini %20 artırır.',
  'Küçük hedefler koyun: bugün sadece bir sağlıklı tercih yapın.',
  'Esneme hareketleri gün içindeki gerginliği azaltır — 5 dakika ayırın.',
  'Protein ağırlıklı kahvaltı gün boyu tatlı krizlerini azaltır.',
  'Merdiveni tercih edin — günlük küçük hareketler birikir.',
  'İlerlemenizi takip edin: bugünkü kilonuzu veya öğününüzü kaydedin.',
  'Kendinize nazik olun — dönüşüm bir maraton, sprint değil.',
]

export function pickFallbackTip(dateStr) {
  const [y, m, d] = String(dateStr || '').split('-').map(Number)
  const dayOfYear = Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86400000)
  return FALLBACK_DAILY_TIPS[dayOfYear % FALLBACK_DAILY_TIPS.length]
}
