/** Blog içeriğinden okuma süresi tahmini (dakika) */
export function estimateReadMinutes(content) {
  const words = String(content || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

/**
 * Blog gövdesini render bloklarına ayırır.
 * Destek: ATX başlıklar (#–###), madde / numaralı listeler, paragraflar.
 *
 * @returns {Array<
 *   | { type: 'h1'|'h2'|'h3', text: string }
 *   | { type: 'p', text: string }
 *   | { type: 'ul'|'ol', items: string[] }
 * >}
 */
export function parseBlogContent(content) {
  const lines = String(content || '').replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let para = []
  let list = null

  const flushPara = () => {
    if (!para.length) return
    blocks.push({ type: 'p', text: para.join('\n') })
    para = []
  }

  const flushList = () => {
    if (!list) return
    blocks.push(list)
    list = null
  }

  for (const raw of lines) {
    const trimmed = raw.trim()
    if (!trimmed) {
      flushPara()
      flushList()
      continue
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/)
    if (heading) {
      flushPara()
      flushList()
      blocks.push({
        type: `h${heading[1].length}`,
        text: heading[2].trim(),
      })
      continue
    }

    const bullet = trimmed.match(/^[•\-*]\s+(.+)$/)
    if (bullet) {
      flushPara()
      if (!list || list.type !== 'ul') {
        flushList()
        list = { type: 'ul', items: [] }
      }
      list.items.push(bullet[1].trim())
      continue
    }

    const numbered = trimmed.match(/^\d+[.)]\s+(.+)$/)
    if (numbered) {
      flushPara()
      if (!list || list.type !== 'ol') {
        flushList()
        list = { type: 'ol', items: [] }
      }
      list.items.push(numbered[1].trim())
      continue
    }

    flushList()
    para.push(trimmed)
  }

  flushPara()
  flushList()
  return blocks
}
