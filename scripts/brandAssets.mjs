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

/**
 * Yatay wordmark PNG'den (ikon + Yeni + Form) Instagram profil karesi üretir.
 * İkon üstte, "Yeni" / "Form" alt alta; harfler kaynaktan kesilir (aynı yazı tipi/renk).
 */
export async function buildInstagramStackedLogo(logoSourceBuffer, { size = 1080 } = {}) {
  const trimmed = await sharp(logoSourceBuffer)
    .trim({ threshold: 12 })
    .ensureAlpha()
    .png()
    .toBuffer()

  const meta = await sharp(trimmed).metadata()
  const markSize = Math.min(meta.height, meta.width)
  // Yuvarlatılmış kare ikon yükseklikten 1–2 px daha geniş olabiliyor; sağ kenarı kesme.
  const markWidth = Math.min(meta.width, markSize + 12)
  const markBuf = await sharp(trimmed)
    .extract({ left: 0, top: 0, width: markWidth, height: markSize })
    .png()
    .toBuffer()

  if (meta.width <= markWidth + 8) {
    throw new Error('Kaynak logoda wordmark (Yeni Form yazısı) bulunamadı.')
  }

  const wordmarkBuf = await sharp(trimmed)
    .extract({
      left: markWidth,
      top: 0,
      width: meta.width - markWidth,
      height: meta.height,
    })
    .trim({ threshold: 12 })
    .png()
    .toBuffer()

  const { yeniBuf, formBuf } = await splitWordmark(wordmarkBuf)

  const iconPx = Math.round(size * 0.40)
  const textMaxW = Math.round(iconPx * 0.92)
  const gapIcon = Math.round(size * 0.032)
  const gapLines = Math.round(size * 0.012)

  const icon = await sharp(markBuf)
    .resize(iconPx, iconPx, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer()

  const yeniMeta = await sharp(yeniBuf).metadata()
  const formMeta = await sharp(formBuf).metadata()
  const textScale = textMaxW / Math.max(yeniMeta.width, formMeta.width)
  const yeniW = Math.round(yeniMeta.width * textScale)
  const yeniH = Math.round(yeniMeta.height * textScale)
  const formW = Math.round(formMeta.width * textScale)
  const formH = Math.round(formMeta.height * textScale)

  const yeni = await sharp(yeniBuf).resize(yeniW, yeniH).png().toBuffer()
  const form = await sharp(formBuf).resize(formW, formH).png().toBuffer()

  const stackH = iconPx + gapIcon + yeniH + gapLines + formH
  const top = Math.round((size - stackH) / 2)

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([
      { input: icon, left: Math.round((size - iconPx) / 2), top },
      { input: yeni, left: Math.round((size - yeniW) / 2), top: top + iconPx + gapIcon },
      {
        input: form,
        left: Math.round((size - formW) / 2),
        top: top + iconPx + gapIcon + yeniH + gapLines,
      },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer()
}

async function splitWordmark(wordmarkBuf) {
  const { data, info } = await sharp(wordmarkBuf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const occupied = Array(info.width).fill(false)
  for (let x = 0; x < info.width; x++) {
    for (let y = 0; y < info.height; y++) {
      const i = (y * info.width + x) * 4
      if (data[i + 3] < 16) continue
      if (data[i] < 248 || data[i + 1] < 248 || data[i + 2] < 248) {
        occupied[x] = true
        break
      }
    }
  }

  const WORD_GAP_MIN = 40
  const gaps = []
  let x = 0
  while (x < occupied.length && !occupied[x]) x++
  while (x < occupied.length) {
    if (!occupied[x]) {
      const start = x
      while (x < occupied.length && !occupied[x]) x++
      if (x < occupied.length) {
        const len = x - start
        if (len >= WORD_GAP_MIN) gaps.push({ start, len })
      }
    } else {
      x++
    }
  }

  const wordGap = gaps.at(-1)
  if (!wordGap) {
    throw new Error('Yeni / Form kelimeleri ayrılamadı.')
  }

  const yeniLeft = gaps.length >= 2 ? gaps[gaps.length - 2].start + gaps[gaps.length - 2].len : 0
  const yeniWidth = wordGap.start - yeniLeft
  const formLeft = wordGap.start + wordGap.len
  const formWidth = info.width - formLeft

  if (yeniWidth < 8 || formWidth < 8) {
    throw new Error('Yeni / Form kelimeleri ayrılamadı.')
  }

  const yeniBox = contentBBox(data, info, yeniLeft, yeniLeft + yeniWidth)
  const formBox = contentBBox(data, info, formLeft, formLeft + formWidth)

  const yeniBuf = await sharp(wordmarkBuf)
    .extract(yeniBox)
    .png()
    .toBuffer()

  const formBuf = await sharp(wordmarkBuf)
    .extract(formBox)
    .png()
    .toBuffer()

  return { yeniBuf, formBuf }
}

function contentBBox(data, info, x0, x1) {
  let minX = x1
  let minY = info.height
  let maxX = x0
  let maxY = 0
  for (let y = 0; y < info.height; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * info.width + x) * 4
      if (data[i + 3] < 16) continue
      if (data[i] < 248 || data[i + 1] < 248 || data[i + 2] < 248) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < minX || maxY < minY) {
    throw new Error('Kelime içeriği bulunamadı.')
  }
  const pad = 1
  const left = Math.max(0, minX - pad)
  const top = Math.max(0, minY - pad)
  const right = Math.min(info.width - 1, maxX + pad)
  const bottom = Math.min(info.height - 1, maxY + pad)
  return {
    left,
    top,
    width: right - left + 1,
    height: bottom - top + 1,
  }
}
