/**
 * Ürün barkodu tarama — önce BarcodeDetector, yoksa jsQR.
 * Orijinal dosya üzerinde çalışır (küçültülmüş JPEG değil).
 */

import jsQR from 'jsqr'

const PRODUCT_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'itf']

export function normalizeBarcodeValue(raw) {
  return String(raw || '').replace(/\D/g, '').slice(0, 20)
}

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

async function scanNative(file) {
  if (typeof window === 'undefined' || typeof window.BarcodeDetector !== 'function') return null
  try {
    const detector = new window.BarcodeDetector({ formats: PRODUCT_FORMATS })
    const bitmap = await createImageBitmap(file)
    const codes = await detector.detect(bitmap)
    bitmap.close?.()
    const raw = codes?.[0]?.rawValue
    const barcode = normalizeBarcodeValue(raw)
    if (barcode.length >= 8) return { barcode, source: 'native' }
  } catch {
    /* native destek yok / izin */
  }
  return null
}

function drawForQr(img, maxSide) {
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height, 1))
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, w, h)
  return ctx.getImageData(0, 0, w, h)
}

async function scanJsQr(file) {
  try {
    const img = await loadImage(file)
    const imageData = drawForQr(img, 1400)
    const result = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    })
    const barcode = normalizeBarcodeValue(result?.data)
    if (barcode.length >= 8) return { barcode, source: 'jsqr' }
  } catch {
    return null
  }
  return null
}

/**
 * @param {File|Blob} file
 * @returns {Promise<{ barcode: string, source: string } | null>}
 */
export async function scanBarcode(file) {
  if (!file) return null
  const native = await scanNative(file)
  if (native) return native
  return scanJsQr(file)
}
