/**
 * Encode §1.1 (AI_PROJE_REHBERI §70) — canonical exercise clip encode.
 * H.264 High 4.0 / yuv420p / ≤1280w / CRF 28 / -an / +faststart
 */
import { execFileSync } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'

/** Skip files already under this size unless --force (bytes). */
export const DEFAULT_MIN_BYTES = 1_500_000

/** Browser cache TTL for re-uploaded clips (1 day). */
export const ENCODE_CACHE_CONTROL = '86400'

/**
 * @param {string} ffmpegBin
 * @param {string} inputPath
 * @param {string} outputPath
 * @returns {{ ok: true, outBytes: number } | { ok: false, error: string }}
 */
export function encodeExerciseClip(ffmpegBin, inputPath, outputPath) {
  if (!existsSync(inputPath)) {
    return { ok: false, error: 'input missing' }
  }

  try {
    execFileSync(ffmpegBin, [
      '-y',
      '-i', inputPath,
      '-c:v', 'libx264',
      '-profile:v', 'high',
      '-level', '4.0',
      '-pix_fmt', 'yuv420p',
      '-crf', '28',
      '-preset', 'medium',
      '-vf', "scale='min(1280,iw)':-2:force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2",
      '-an',
      '-movflags', '+faststart',
      '-f', 'mp4',
      outputPath,
    ], { stdio: 'ignore' })
  } catch (err) {
    return { ok: false, error: err?.message || 'ffmpeg encode failed' }
  }

  if (!existsSync(outputPath)) {
    return { ok: false, error: 'output missing after encode' }
  }

  const outBytes = statSync(outputPath).size
  if (outBytes < 1024) {
    return { ok: false, error: `output too small (${outBytes} B)` }
  }

  return { ok: true, outBytes }
}
