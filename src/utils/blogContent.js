/** Blog içeriğinden okuma süresi tahmini (dakika) */
export function estimateReadMinutes(content) {
  const words = String(content || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}
