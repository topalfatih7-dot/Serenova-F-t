/**
 * Fotoğraflı Kalori Tespiti — frontend servisi.
 * Yemek fotoğrafını küçültüp /api/ai-food-vision endpoint'ine gönderir.
 * API anahtarı sunucuda tutulur (bkz. api/ai-food-vision.js).
 *
 * Maliyet optimizasyonu: görüntü gönderilmeden önce maks. 1024px'e küçültülür
 * ve JPEG %80 kalite ile sıkıştırılır → daha az giriş token → daha düşük maliyet.
 */

const MAX_DIMENSION = 1024
const JPEG_QUALITY = 0.8

/**
 * AI fotoğraf analizinin açık olup olmadığını gösteren ipucu (UI için).
 * Gerçek anahtar sunucuda olduğundan, bu yalnızca arayüz kararı içindir.
 * VITE_AI_VISION_ENABLED=true ise UI gerçek analiz dener; değilse demo moda düşer.
 */
export function isAiVisionEnabled() {
  return import.meta.env.VITE_AI_VISION_ENABLED === 'true'
}

/**
 * File/Blob'u küçültülmüş JPEG base64'e çevirir.
 * @returns {Promise<{dataUrl: string, mimeType: string}>}
 */
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
 * Yemek fotoğrafını analiz eder.
 * @param {File} file - kullanıcının yüklediği görsel
 * @returns {Promise<{ok: boolean, label?, items?, confidence?, error?}>}
 */
export async function analyzeFoodPhoto(file) {
  try {
    const { dataUrl, mimeType } = await downscaleImage(file)
    const res = await fetch('/api/ai-food-vision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl, mimeType }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || 'Analiz başarısız' }
    }
    return { ok: true, label: data.label, items: data.items, confidence: data.confidence }
  } catch (e) {
    return { ok: false, error: String(e.message || e) }
  }
}
