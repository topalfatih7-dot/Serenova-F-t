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

const BRAND_MARK_BLUE = { r: 27, g: 135, b: 201 }
const BRAND_MARK_GREEN = { r: 85, g: 164, b: 95 }
const NEIGHBOR8 = [
  [1, 0], [1, 1], [0, 1], [-1, 1],
  [-1, 0], [-1, -1], [0, -1], [1, -1],
]

/**
 * Kaynak wordmark'tan kare ikon üretir: şeffaflık yok, 1080² PWA/OAuth.
 * Beyaz glif delinmez; köşeler gradient ile doldurulur (daire kırpma için).
 */
export async function buildOpaqueBrandMarkPng(logoSourceBuffer, { size = 1080, safeArea = 0.1 } = {}) {
  const { width: srcW, height: srcH, paths } = await extractGlyphFromLogo(logoSourceBuffer)
  const glyphPath = pathsToSvg(paths, srcW, srcH, size, safeArea)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="yfMarkBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgb(${BRAND_MARK_BLUE.r},${BRAND_MARK_BLUE.g},${BRAND_MARK_BLUE.b})"/>
      <stop offset="100%" stop-color="rgb(${BRAND_MARK_GREEN.r},${BRAND_MARK_GREEN.g},${BRAND_MARK_GREEN.b})"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#yfMarkBg)"/>
  ${glyphPath}
</svg>`

  return sharp(Buffer.from(svg))
    .png()
    .flatten({ background: BRAND_MARK_BLUE })
    .removeAlpha()
    .png({ compressionLevel: 9, palette: false })
    .toBuffer()
}

async function extractGlyphFromLogo(logoSourceBuffer) {
  const trimmed = await sharp(logoSourceBuffer)
    .trim({ threshold: 12 })
    .ensureAlpha()
    .png()
    .toBuffer()

  const meta = await sharp(trimmed).metadata()
  const side = Math.min(meta.height, meta.width)
  const { data, info } = await sharp(trimmed)
    .extract({ left: 0, top: 0, width: side, height: side })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const w = info.width
  const h = info.height
  const radius = Math.round(side * 0.224)
  const inset = 14
  const innerR = Math.max(8, radius - inset)
  const mask = new Uint8Array(w * h)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!inRoundedRect(x, y, w, h, inset, innerR)) continue
      const i = (y * w + x) * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const lum = (r + g + b) / 3
      const sat = Math.max(r, g, b) - Math.min(r, g, b)
      if (lum > 210 && sat < 45) mask[y * w + x] = 1
    }
  }

  morphClose(mask, w, h, 1)
  const paths = traceAndSmoothContours(mask, w, h)
  if (!paths.length) {
    throw new Error('Marka ikonunda beyaz glif bulunamadı.')
  }
  return { width: w, height: h, paths }
}

function inRoundedRect(x, y, w, h, inset, radius) {
  const x0 = inset
  const y0 = inset
  const x1 = w - 1 - inset
  const y1 = h - 1 - inset
  if (x < x0 || y < y0 || x > x1 || y > y1) return false
  const cx = Math.max(x0 + radius, Math.min(x, x1 - radius))
  const cy = Math.max(y0 + radius, Math.min(y, y1 - radius))
  if ((x < x0 + radius || x > x1 - radius) && (y < y0 + radius || y > y1 - radius)) {
    const dx = x - cx
    const dy = y - cy
    return dx * dx + dy * dy <= radius * radius
  }
  return true
}

function morphClose(mask, w, h, radius) {
  const dil = new Uint8Array(mask)
  for (let pass = 0; pass < radius; pass++) {
    const src = Uint8Array.from(dil)
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        if (src[y * w + x]) continue
        for (const [dx, dy] of NEIGHBOR8) {
          if (src[(y + dy) * w + (x + dx)]) {
            dil[y * w + x] = 1
            break
          }
        }
      }
    }
  }
  const out = Uint8Array.from(dil)
  for (let pass = 0; pass < radius; pass++) {
    const src = Uint8Array.from(out)
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        if (!src[y * w + x]) continue
        for (const [dx, dy] of NEIGHBOR8) {
          if (!src[(y + dy) * w + (x + dx)]) {
            out[y * w + x] = 0
            break
          }
        }
      }
    }
  }
  mask.set(out)
}

function traceAndSmoothContours(mask, w, h) {
  const visited = new Uint8Array(w * h)
  const contours = []

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x
      if (!mask[i] || visited[i]) continue
      if (mask[i - 1]) continue
      const raw = traceMoore(mask, w, h, x, y)
      if (raw.length < 24) continue
      floodVisited(mask, visited, w, h, x, y)
      const simplified = rdp(raw, 1.35)
      const smoothed = chaikinPreserveCorners(simplified, 2, 52)
      contours.push(smoothed)
    }
  }

  contours.sort((a, b) => b.length - a.length)
  return contours.slice(0, 3)
}

function traceMoore(mask, w, h, startX, startY) {
  const points = []
  let x = startX
  let y = startY
  let dir = 0
  const limit = w * h

  for (let n = 0; n < limit; n++) {
    points.push([x + 0.5, y + 0.5])
    const startDir = (dir + 6) % 8
    let found = false
    for (let i = 0; i < 8; i++) {
      const nd = (startDir + i) % 8
      const nx = x + NEIGHBOR8[nd][0]
      const ny = y + NEIGHBOR8[nd][1]
      if (nx >= 0 && ny >= 0 && nx < w && ny < h && mask[ny * w + nx]) {
        x = nx
        y = ny
        dir = nd
        found = true
        break
      }
    }
    if (!found) break
    if (x === startX && y === startY) break
  }
  return points
}

function floodVisited(mask, visited, w, h, sx, sy) {
  const stack = [[sx, sy]]
  visited[sy * w + sx] = 1
  while (stack.length) {
    const [x, y] = stack.pop()
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx
      const ny = y + dy
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
      const i = ny * w + nx
      if (visited[i] || !mask[i]) continue
      visited[i] = 1
      stack.push([nx, ny])
    }
  }
}

function rdp(points, epsilon) {
  if (points.length < 3) return points
  let maxD = 0
  let idx = 0
  const first = points[0]
  const last = points[points.length - 1]
  for (let i = 1; i < points.length - 1; i++) {
    const d = pointLineDistance(points[i], first, last)
    if (d > maxD) {
      maxD = d
      idx = i
    }
  }
  if (maxD > epsilon) {
    const left = rdp(points.slice(0, idx + 1), epsilon)
    const right = rdp(points.slice(idx), epsilon)
    return left.slice(0, -1).concat(right)
  }
  return [first, last]
}

function pointLineDistance(p, a, b) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len2 = dx * dx + dy * dy
  if (len2 < 1e-9) return Math.hypot(p[0] - a[0], p[1] - a[1])
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2))
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy))
}

function chaikinPreserveCorners(points, iterations, sharpDeg) {
  const closed = points
  const sharpRad = (sharpDeg * Math.PI) / 180
  let pts = closed
  for (let n = 0; n < iterations; n++) {
    const sharp = new Array(pts.length).fill(false)
    const len = pts.length
    for (let i = 0; i < len; i++) {
      const prev = pts[(i + len - 1) % len]
      const cur = pts[i]
      const next = pts[(i + 1) % len]
      const a1 = Math.atan2(cur[1] - prev[1], cur[0] - prev[0])
      const a2 = Math.atan2(next[1] - cur[1], next[0] - cur[0])
      let turn = Math.abs(a2 - a1)
      if (turn > Math.PI) turn = 2 * Math.PI - turn
      if (turn >= sharpRad) sharp[i] = true
    }
    const nextPts = []
    for (let i = 0; i < len; i++) {
      const p0 = pts[i]
      const p1 = pts[(i + 1) % len]
      if (sharp[i]) nextPts.push(p0)
      nextPts.push([0.75 * p0[0] + 0.25 * p1[0], 0.75 * p0[1] + 0.25 * p1[1]])
      nextPts.push([0.25 * p0[0] + 0.75 * p1[0], 0.25 * p0[1] + 0.75 * p1[1]])
    }
    pts = nextPts
  }
  return pts
}

function pathsToSvg(paths, srcW, srcH, size, safeArea) {
  const scaleFit = (1 - 2 * safeArea) / Math.max(
    ...paths.flat().map((p) => Math.abs(p[0] / srcW - 0.5) * 2),
    ...paths.flat().map((p) => Math.abs(p[1] / srcH - 0.5) * 2),
    1e-6,
  )
  const scale = Math.min(1, scaleFit) * (size / srcW)
  const cx = size / 2
  const cy = size / 2
  const ox = srcW / 2
  const oy = srcH / 2

  return paths.map((pts) => {
    const mapped = pts.map(([x, y]) => [
      cx + (x - ox) * scale,
      cy + (y - oy) * scale,
    ])
    const d = mapped.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ')
    return `<path d="${d} Z" fill="#ffffff" fill-rule="evenodd"/>`
  }).join('\n  ')
}
