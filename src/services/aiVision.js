/**
 * Fotoğraflı kalori — kalite + barkod + vision API.
 */

import { formatAiError } from '../utils/aiErrors.js'
import { getApiAuthHeaders } from './apiAuth.js'
import { assessImageQuality } from '../utils/imageQuality.js'
import { scanBarcode } from '../utils/barcodeScan.js'

const MAX_DIMENSION = 1024
const JPEG_QUALITY = 0.8

export function isAiVisionEnabled() {
  return import.meta.env.VITE_AI_VISION_ENABLED !== 'false'
}

export function downscaleImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > height && width > MAX_DIMENSION) {
        height = Math.round((height * MAX_DIMENSION) / width)
        width = MAX_DIMENSION
      } else if (height > MAX_DIMENSION) {
        width = Math.round((width * MAX_DIMENSION) / height)
        height = MAX_DIMENSION
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
      resolve({ dataUrl, mimeType: 'image/jpeg' })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Görüntü okunamadı'))
    }
    img.src = url
  })
}

/**
 * @param {File} file
 * @param {{ onStep?: (step: 'quality' | 'barcode' | 'analyze') => void }} [opts]
 */
export async function analyzeFoodPhoto(file, opts = {}) {
  const onStep = opts.onStep || (() => {})
  try {
    onStep('quality')
    const clientQuality = await assessImageQuality(file)
    if (clientQuality.block) {
      return {
        ok: false,
        code: 'unusable_image',
        error: clientQuality.message || formatAiError('Fotoğraf analiz için uygun değil.', 'unusable_image'),
        issues: clientQuality.issues,
        clientQuality,
      }
    }

    onStep('barcode')
    const scanned = await scanBarcode(file).catch(() => null)

    onStep('analyze')
    const { dataUrl, mimeType } = await downscaleImage(file)
    const res = await fetch('/api/ai-food-vision', {
      method: 'POST',
      headers: await getApiAuthHeaders(),
      body: JSON.stringify({
        image: dataUrl,
        mimeType,
        barcode: scanned?.barcode || undefined,
        clientQuality: {
          score: clientQuality.score,
          issues: clientQuality.issues,
        },
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.ok) {
      return {
        ok: false,
        code: data.code,
        error: formatAiError(data.error, data.code),
        issues: data.issues,
      }
    }
    return {
      ok: true,
      ...data,
      clientQuality,
      scannedBarcode: scanned?.barcode || null,
    }
  } catch (e) {
    return { ok: false, code: 'network_error', error: formatAiError(e.message, 'network_error') }
  }
}
