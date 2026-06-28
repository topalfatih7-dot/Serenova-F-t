// Statik CSS arka plan — spin/wave/shimmer/blur orb kaldırıldı (scroll donması önlendi)
export default function PlansAnimatedBackground({ children, className = '' }) {
  return (
    <section className={`plans-aurora-section relative overflow-hidden py-16 sm:py-20 ${className}`}>
      <div aria-hidden className="plans-aurora-bg" />
      <div className="relative z-[1]">{children}</div>
    </section>
  )
}
