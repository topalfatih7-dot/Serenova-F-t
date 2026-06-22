/**
 * 1200×630 Open Graph görseli — public/brand-logo.png + gradient arka plan.
 * Önce logoyu public/brand-logo.png olarak kaydedin, sonra:
 *   node scripts/generate-og-image.mjs
 */
import sharp from 'sharp'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const logoPath = resolve(root, 'public/brand-logo.png')
const outPath = resolve(root, 'public/og-image.png')

if (!existsSync(logoPath)) {
  console.error('public/brand-logo.png bulunamadı. Logoyu bu yola koyun.')
  process.exit(1)
}

const W = 1200
const H = 630

const bgSvg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e8f4fc"/>
      <stop offset="35%" stop-color="#f0faf4"/>
      <stop offset="100%" stop-color="#d4f0e0"/>
    </linearGradient>
    <radialGradient id="orb1" cx="15%" cy="20%" r="45%">
      <stop offset="0%" stop-color="#5eb8f7" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#5eb8f7" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="orb2" cx="85%" cy="75%" r="50%">
      <stop offset="0%" stop-color="#5cb85c" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#5cb85c" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect width="${W}" height="${H}" fill="url(#orb1)"/>
  <rect width="${W}" height="${H}" fill="url(#orb2)"/>
  <text x="600" y="520" text-anchor="middle" font-family="Segoe UI, system-ui, sans-serif" font-size="28" fill="#1a4a7c" font-weight="600">Online Koçluk · Diyetisyen · Wellness</text>
  <text x="600" y="558" text-anchor="middle" font-family="Segoe UI, system-ui, sans-serif" font-size="20" fill="#5cb85c">yeniform.com</text>
</svg>`

const logoMeta = await sharp(logoPath).metadata()
const logoMaxW = 720
const logoScale = logoMaxW / (logoMeta.width || logoMaxW)
const logoW = Math.round((logoMeta.width || logoMaxW) * logoScale)
const logoH = Math.round((logoMeta.height || 200) * logoScale)
const logoX = Math.round((W - logoW) / 2)
const logoY = Math.round((H - logoH) / 2 - 40)

const logoBuf = await sharp(logoPath)
  .resize(logoW, logoH, { fit: 'inside' })
  .png()
  .toBuffer()

await sharp(Buffer.from(bgSvg))
  .composite([{ input: logoBuf, left: logoX, top: logoY }])
  .png({ compressionLevel: 9 })
  .toFile(outPath)

console.log('OG görsel oluşturuldu:', outPath)
