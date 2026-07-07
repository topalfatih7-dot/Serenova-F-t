import { useEffect, useState } from 'react'

/**
 * Hero arka plan videosu — prefers-reduced-motion ve düşük veri modunda poster gösterir.
 *
 * @param {'cover'|'inline'} layout
 *   - cover (varsayılan): absolute inset-0 — tam ekran hero bölümleri (Landing, Corporate hero)
 *   - inline: relative w-full — kart/vitrin içinde; aspect-ratio sınıfı akışta yükseklik verir
 */
export default function HeroBackgroundVideo({
  src,
  poster,
  className = '',
  videoClassName,
  videoStyle,
  overlayClassName = '',
  layout = 'cover',
}) {
  const [reducedMotion, setReducedMotion] = useState(false)
  const [saveData, setSaveData] = useState(false)

  useEffect(() => {
    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const dataMq = window.matchMedia('(prefers-reduced-data: reduce)')
    const update = () => {
      setReducedMotion(motionMq.matches)
      setSaveData(dataMq.matches)
    }
    update()
    motionMq.addEventListener('change', update)
    dataMq.addEventListener('change', update)
    return () => {
      motionMq.removeEventListener('change', update)
      dataMq.removeEventListener('change', update)
    }
  }, [])

  const showVideo = src && !reducedMotion && !saveData
  const isCover = layout === 'cover'
  const wrapperClass = isCover
    ? `absolute inset-0 ${className}`.trim()
    : `relative w-full ${className}`.trim()
  const coverMediaClass = videoClassName || 'absolute inset-0 h-full w-full object-cover'
  const inlineMediaClass = videoClassName || 'block h-full w-full object-cover'

  if (isCover) {
    return (
      <div className={wrapperClass}>
        {poster && (
          <img
            src={poster}
            alt=""
            aria-hidden
            className={`absolute inset-0 h-full w-full object-cover ${showVideo ? 'opacity-0' : 'opacity-100'}`}
            loading="eager"
            decoding="async"
          />
        )}
        {showVideo && (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={poster || undefined}
            aria-hidden
            className={coverMediaClass}
            style={videoStyle}
          >
            <source src={src} type="video/mp4" />
          </video>
        )}
        {overlayClassName ? <div className={overlayClassName} aria-hidden /> : null}
      </div>
    )
  }

  return (
    <div className={wrapperClass}>
      {showVideo ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={poster || undefined}
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
