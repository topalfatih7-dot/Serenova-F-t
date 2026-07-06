import { useEffect, useState } from 'react'

/**
 * Hero arka plan videosu — prefers-reduced-motion ve düşük veri modunda poster gösterir.
 */
export default function HeroBackgroundVideo({
  src,
  poster,
  className = '',
  videoClassName = 'absolute inset-0 h-full w-full object-cover',
  videoStyle,
  overlayClassName = '',
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

  return (
    <div className={`absolute inset-0 ${className}`}>
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
          className={videoClassName}
          style={videoStyle}
        >
          <source src={src} type="video/mp4" />
        </video>
      )}
      {overlayClassName ? <div className={overlayClassName} aria-hidden /> : null}
    </div>
  )
}
