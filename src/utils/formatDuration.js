/** Milisaniyeyi "X gün Y saat Z dakika" formatına çevirir (sıfır birimler atlanır). */
export function formatDurationTr(ms) {
  if (ms <= 0) return '0 dakika'

  let totalMin = Math.ceil(ms / 60_000)
  const days = Math.floor(totalMin / (24 * 60))
  totalMin -= days * 24 * 60
  const hours = Math.floor(totalMin / 60)
  const minutes = totalMin - hours * 60

  const parts = []
  if (days > 0) parts.push(`${days} gün`)
  if (hours > 0) parts.push(`${hours} saat`)
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes} dakika`)

  return parts.join(' ')
}

/** Dakika cinsinden süreyi formatlar. */
export function formatMinutesTr(minutes) {
  return formatDurationTr(Number(minutes) * 60_000)
}
