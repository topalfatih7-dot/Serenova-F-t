import { useEffect, useRef, useState } from 'react'

/**
 * Hero arka plan videosu — prefers-reduced-motion / düşük veri modunda yalnızca poster.
 *
 * @param {'cover'|'inline'} layout
 *   - cover (varsayılan): absolute inset-0 — tam ekran hero bölümleri (Landing, Corporate hero)
 *   - inline: relative w-full — kart/vitrin içinde; aspect-ratio sınıfı akışta yükseklik verir
 */
function shouldPreferPosterOnly() {
  if (typeof window === 'undefined') return false
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true
    if (window.matchMedia('(prefers-reduced-data: reduce)').matches) return true
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    if (conn?.saveData) return true
  } catch {
    /* ignore */
  }
  return false
}

export default function HeroBackgroundVideo({
  src,
  poster,
  className = '',
  videoClassName,
  videoStyle,
  overlayClassName = '',
  layout = 'cover',
}) {
  const videoRef = useRef(null)
  const [posterOnly, setPosterOnly] = useState(shouldPreferPosterOnly)

  useEffect(() => {
    setPosterOnly(shouldPreferPosterOnly())
  }, [])

  useEffect(() => {
    if (posterOnly || !src) return undefined
    const el = videoRef.current
    if (!el) return undefined
    void el.play?.().catch(() => {})
    return undefined
  }, [posterOnly, src])

  const showVideo = Boolean(src) && !posterOnly
  const isCover = layout === 'cover'
  const wrapperClass = isCover
    ? `absolute inset-0 ${className}`.trim()
    : `relative w-full ${className}`.trim()
  const coverMediaClass = videoClassName || 'absolute inset-0 h-full w-full object-cover'
  const inlineMediaClass = videoClassName || 'block h-full w-full object-cover'

  if (isCover) {
    return (
      <div className={wrapperClass}>
        {showVideo ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden
            className={coverMediaClass}
            style={videoStyle}
          >
            <source src={src} type="video/mp4" />
          </video>
        ) : poster ? (
          <img
            src={poster}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
            decoding="async"
          />
        ) : null}
        {overlayClassName ? <div className={overlayClassName} aria-hidden /> : null}
      </div>
    )
  }

  return (
    <div className={wrapperClass}>
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
          className={inlineMediaClass}
          style={videoStyle}
        >
          <source src={src} type="video/mp4" />
        </video>
      ) : poster ? (
        <img
          src={poster}
          alt=""
          aria-hidden
          className={inlineMediaClass}
          loading="eager"
          decoding="async"
        />
      ) : null}
      {overlayClassName ? <div className={overlayClassName} aria-hidden /> : null}
    </div>
  )
}
