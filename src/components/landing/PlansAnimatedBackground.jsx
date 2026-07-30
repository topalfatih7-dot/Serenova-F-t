// Statik CSS arka plan — spin/wave/shimmer yok (scroll donması önlendi)
// Section’da overflow-x/y karışımı kullanılmaz: visible+hidden → iç dikey scroll yaratır
export default function PlansAnimatedBackground({ children, className = '' }) {
  const isPlansRef = className.includes('plans-section-ref')

  return (
    <section className={`plans-aurora-section relative py-12 sm:py-16 ${className}`}>
      <div aria-hidden className="plans-aurora-decor">
        <div className="plans-aurora-bg" />
        {isPlansRef && (
          <>
            <div className="plans-ref-wash" />
            <div className="plans-ref-orb plans-ref-orb-tl" />
            <div className="plans-ref-orb plans-ref-orb-tr" />
            <div className="plans-ref-orb plans-ref-orb-bl" />
            <div className="plans-ref-orb plans-ref-orb-br" />
            <div className="plans-ref-shine" />
          </>
        )}
      </div>
      <div className="relative z-[1]">{children}</div>
    </section>
  )
}
