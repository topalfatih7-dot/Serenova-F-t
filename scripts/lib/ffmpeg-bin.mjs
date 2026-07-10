/**
 * Sistem ffmpeg veya ffmpeg-static paket yolu.
 */
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export function resolveFfmpegPath() {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' })
    return 'ffmpeg'
  } catch {
    /* fall through */
  }
  try {
    const staticPath = require('ffmpeg-static')
    if (staticPath) return staticPath
  } catch {
    /* fall through */
  }
  return null
}

export function requireFfmpeg() {
  const bin = resolveFfmpegPath()
  if (!bin) {
    console.error('ffmpeg bulunamadı — brew install ffmpeg veya npm i -D ffmpeg-static')
    process.exit(1)
  }
  return bin
}
