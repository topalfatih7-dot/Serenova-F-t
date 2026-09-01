/**
 * Yemek fotoğrafı kalite kontrolü (istemci).
 * Boyut, parlaklık, Laplacian bulanıklık.
 */

const MIN_SIDE_BLOCK = 280
const MIN_SIDE_WARN = 400
const BLUR_BLOCK = 18
const BLUR_WARN = 50
const DARK_LUMA = 28
const BRIGHT_LUMA = 242

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Görüntü okunamadı'))
    }
    img.src = url
  })
}

function laplacianVariance(gray, w, h) {
  let sum = 0
  let sumSq = 0
  let n = 0
  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const i = y * w + x
      const v = gray[i - w] + gray[i + w] + gray[i - 1] + gray[i + 1] - 4 * gray[i]
      sum += v
      sumSq += v * v
      n += 1
    }
  }
  if (!n) return 0
  const mean = sum / n
  return sumSq / n - mean * mean
}

function analyzeCanvas(img) {
  const maxW = 160
  const scale = Math.min(1, maxW / Math.max(img.width, 1))
  const w = Math.max(24, Math.round(img.width * scale))
  const h = Math.max(24, Math.round(img.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, w, h)
  const { data } = ctx.getImageData(0, 0, w, h)
  const gray = new Float32Array(w * h)
  let lumaSum = 0
  for (let i = 0; i < w * h; i += 1) {
    const r = data[i * 4]
    const g = data[i * 4 + 1]
    const b = data[i * 4 + 2]
    const y = 0.299 * r + 0.587 * g + 0.114 * b
    gray[i] = y
    lumaSum += y
  }
  const luma = lumaSum / (w * h)
  const blurVar = laplacianVariance(gray, w, h)
  return { luma, blurVar, sampleWidth: w, sampleHeight: h }
}

/**
 * @returns {Promise<{
 *   ok: boolean,
 *   block: boolean,
 *   score: number,
 *   issues: string[],
 *   width: number,
 *   height: number,
 *   message?: string,
 * }>}
 */
export async function assessImageQuality(file) {
  if (!file) {
    return { ok: false, block: true, score: 0, issues: ['missing'], message: 'Fotoğraf seçilmedi.' }
  }

  let img
  try {
    img = await loadImage(file)
  } catch {
    return { ok: false, block: true, score: 0, issues: ['unreadable'], message: 'Görüntü okunamadı. Farklı bir fotoğraf deneyin.' }
  }

  const width = img.naturalWidth || img.width
  const height = img.naturalHeight || img.height
  const minSide = Math.min(width, height)
  const issues = []

  if (minSide < MIN_SIDE_BLOCK) issues.push('too_small')
  else if (minSide < MIN_SIDE_WARN) issues.push('low_res')

  const { luma, blurVar } = analyzeCanvas(img)
  if (luma < DARK_LUMA) issues.push('dark')
  if (luma > BRIGHT_LUMA) issues.push('bright')
  if (blurVar < BLUR_BLOCK) issues.push('blurry')
  else if (blurVar < BLUR_WARN) issues.push('soft')

  const sizeScore = Math.min(1, minSide / 640)
  const blurScore = Math.max(0, Math.min(1, blurVar / 200))
  const lumaScore = luma < DARK_LUMA || luma > BRIGHT_LUMA ? 0.4 : 1
  const score = Math.round((0.25 * sizeScore + 0.5 * blurScore + 0.25 * lumaScore) * 100) / 100

  const block = issues.includes('too_small') || issues.includes('blurry') || issues.includes('unreadable')
  let message
  if (issues.includes('too_small')) message = 'Fotoğraf çok düşük çözünürlüklü. Daha yakından çekin.'
  else if (issues.includes('blurry')) message = 'Fotoğraf bulanık. Sabit tutup net bir kare çekin.'
  else if (issues.includes('dark')) message = 'Görüntü karanlık. Daha aydınlık bir ortamda çekin.'
  else if (issues.includes('bright')) message = 'Görüntü aşırı parlak. Işığı ayarlayıp tekrar deneyin.'
  else if (issues.includes('low_res') || issues.includes('soft')) {
    message = 'Fotoğraf biraz net değil; yine de analiz deneyebilirsiniz.'
  }

  return {
    ok: !block,
    block,
    score,
    issues,
    width,
    height,
    message,
  }
}

export function qualityIssueLabel(issue) {
  const map = {
    too_small: 'çok küçük',
    low_res: 'düşük çözünürlük',
    dark: 'karanlık',
    bright: 'aşırı parlak',
    blurry: 'bulanık',
    soft: 'yumuşak netlik',
    unreadable: 'okunamadı',
    missing: 'eksik',
  }
  return map[issue] || issue
}
