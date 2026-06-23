/** OG arka plan SVG (logo PNG ayrı bindirilir, alt yazı yok) */

import sharp from 'sharp'

/**
 * Kaynak PNG'deki beyaz/açık gri arka planı şeffaflaştırır (navbar için).
 * @param {Buffer} inputBuffer
 * @param {{ threshold?: number, softness?: number }} opts
 */
export async function removeNearWhiteBackground(inputBuffer, { threshold = 250, softness = 22 } = {}) {
  const { data, info } = await sharp(inputBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const pixels = new Uint8Array(data)
  const floor = threshold - softness

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    const min = Math.min(r, g, b)
    const max = Math.max(r, g, b)
    const spread = max - min
    let alpha = pixels[i + 3]

    if (min >= threshold) {
      pixels[i + 3] = 0
      continue
    }

    // Beyaz arka plan + anti-alias halo (düşük doygunluk, yüksek parlaklık)
    if (max >= floor && spread <= 40) {
      const key = Math.min(1, Math.max(0, (min - floor) / Math.max(1, threshold - floor)))
      alpha = Math.round(alpha * (1 - key))
      pixels[i + 3] = alpha
      if (alpha > 0 && key > 0.15) {
        const boost = 1 / Math.max(0.35, 1 - key * 0.65)
        pixels[i] = Math.min(255, Math.round(r * boost))
        pixels[i + 1] = Math.min(255, Math.round(g * boost))
        pixels[i + 2] = Math.min(255, Math.round(b * boost))
      }
    }
  }

  return sharp(Buffer.from(pixels), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer()
}

/** 1200×630 arka plan + logo kartı */
export function buildOgBackgroundSvg(logoBox) {
  const W = 1200
  const H = 630
  const { x, y, width, height } = logoBox

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bgBase" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f0f7fb"/>
      <stop offset="40%" stop-color="#f2f9f5"/>
      <stop offset="100%" stop-color="#e0f0e6"/>
    </linearGradient>
    <radialGradient id="orbBlue" cx="12%" cy="18%" r="42%">
      <stop offset="0%" stop-color="#4aa3d4" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#4aa3d4" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="orbGreen" cx="88%" cy="78%" r="48%">
      <stop offset="0%" stop-color="#5fad7f" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#5fad7f" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="cardShine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bgBase)"/>
  <rect width="${W}" height="${H}" fill="url(#orbBlue)"/>
  <rect width="${W}" height="${H}" fill="url(#orbGreen)"/>

  <rect x="${x - 48}" y="${y - 40}" width="${width + 96}" height="${height + 80}" rx="36" fill="#ffffff" fill-opacity="0.96"/>
  <rect x="${x - 48}" y="${y - 40}" width="${width + 96}" height="${height + 80}" rx="36" fill="none" stroke="#ffffff" stroke-opacity="0.9" stroke-width="2"/>
  <rect x="${x - 46}" y="${y - 38}" width="220" height="${height + 76}" rx="34" fill="url(#cardShine)" fill-opacity="0.28"/>
</svg>`
}
