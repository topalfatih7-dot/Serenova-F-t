/**
 * Marka görselleri — kaynak: public/brand-logo-alt.png
 *   npm run og:image
 */
import sharp from 'sharp'
import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildOgBackgroundSvg, removeNearWhiteBackground } from './brandAssets.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const publicDir = resolve(root, 'public')

const LOGO_SOURCES = [
  resolve(publicDir, 'brand-logo-alt.png'),
  resolve(publicDir, 'brand-logo.png'),
]

const logoSource = LOGO_SOURCES.find((p) => existsSync(p))
if (!logoSource) {
  console.error('Logo bulunamadı. public/brand-logo-alt.png dosyasını ekleyin.')
  process.exit(1)
}

const W = 1200
const H = 630

const trimmedLogo = await sharp(logoSource)
  .trim({ threshold: 12 })
  .ensureAlpha()
  .png()
  .toBuffer()

const transparentLogo = await removeNearWhiteBackground(trimmedLogo)

const logoMeta = await sharp(transparentLogo).metadata()
const logoAspect = logoMeta.width / logoMeta.height

const markSize = logoMeta.height
const markBuf = await sharp(transparentLogo)
  .extract({ left: 0, top: 0, width: Math.min(markSize, logoMeta.width), height: markSize })
  .png()
  .toBuffer()

await sharp(markBuf)
  .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9 })
  .toFile(resolve(publicDir, 'brand-mark.png'))

await sharp(markBuf)
  .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
  .png()
  .toFile(resolve(publicDir, 'favicon-32.png'))

await sharp(markBuf)
  .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
  .png()
  .toFile(resolve(publicDir, 'apple-touch-icon.png'))

const logoMaxW = 780
const logoW = Math.min(logoMaxW, logoMeta.width)
const logoH = Math.round(logoW / logoAspect)
const logoX = Math.round((W - logoW) / 2)
const logoY = Math.round((H - logoH) / 2)

const logoForOg = await sharp(trimmedLogo)
  .resize(logoW, logoH, { fit: 'inside' })
  .png()
  .toBuffer()

const bgSvg = buildOgBackgroundSvg({ x: logoX, y: logoY, width: logoW, height: logoH })
const bgBuf = await sharp(Buffer.from(bgSvg)).png().toBuffer()

await sharp(bgBuf)
  .composite([{ input: logoForOg, left: logoX, top: logoY }])
  .png({ compressionLevel: 9 })
  .toFile(resolve(publicDir, 'og-image.png'))

await sharp(transparentLogo)
  .png({ compressionLevel: 9 })
  .toFile(resolve(publicDir, 'brand-logo.png'))

console.log('Kaynak:', logoSource.replace(root + '\\', '').replace(root + '/', ''))
console.log('Oluşturuldu (brand-logo.png şeffaf arka planlı):')
console.log('  public/brand-logo.png')
console.log('  public/brand-mark.png')
console.log('  public/favicon-32.png')
console.log('  public/apple-touch-icon.png')
console.log('  public/og-image.png')
