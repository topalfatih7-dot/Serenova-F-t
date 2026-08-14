/**
 * Marka görselleri — kaynak: public/brand-logo-alt.png
 *   npm run og:image
 */
import sharp from 'sharp'
import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildOgBackgroundSvg, buildOpaqueBrandMarkPng, removeNearWhiteBackground } from './brandAssets.mjs'

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

const markPng = await buildOpaqueBrandMarkPng(await sharp(logoSource).png().toBuffer(), { size: 1080 })
await sharp(markPng).toFile(resolve(publicDir, 'brand-mark.png'))

await sharp(markPng)
  .resize(32, 32)
  .png()
  .toFile(resolve(publicDir, 'favicon-32.png'))

await sharp(markPng)
  .resize(180, 180)
  .png()
  .toFile(resolve(publicDir, 'apple-touch-icon.png'))

await sharp(markPng)
  .resize(1024, 1024)
  .png()
  .toFile(resolve(publicDir, 'facebook-oauth-logo.png'))

await sharp(markPng)
  .resize(512, 512)
  .png()
  .toFile(resolve(publicDir, 'google-oauth-logo.png'))

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
  .resize({ width: 480, withoutEnlargement: true })
  .png({ compressionLevel: 9, palette: true, quality: 80 })
  .toFile(resolve(publicDir, 'brand-logo.png'))

await sharp(transparentLogo)
  .resize({ width: 480, withoutEnlargement: true })
  .webp({ quality: 82, alphaQuality: 90 })
  .toFile(resolve(publicDir, 'brand-logo.webp'))

console.log('Kaynak:', logoSource.replace(root + '\\', '').replace(root + '/', ''))
console.log('Oluşturuldu (brand-logo.png şeffaf arka planlı):')
console.log('  public/brand-logo.png')
console.log('  public/brand-logo.webp')
console.log('  public/brand-mark.png')
console.log('  public/favicon-32.png')
console.log('  public/apple-touch-icon.png')
console.log('  public/og-image.png')
