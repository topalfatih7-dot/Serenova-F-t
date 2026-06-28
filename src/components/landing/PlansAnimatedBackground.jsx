// JS tabanlı 3 Framer Motion orb kaldırıldı.
// Arka plan efekti yalnızca CSS aurora sınıflarıyla (plans-aurora-spin/wave/shimmer)
// sağlanır — GPU compositor'da çalışır, JS RAF döngüsü oluşturmaz.
export default function PlansAnimatedBackground({ children, className = '' }) {
  return (
    <section className={`plans-aurora-section relative overflow-hidden py-16 sm:py-20 ${className}`}>
      <div aria-hidden className="plans-aurora-spin absolute -inset-[50%] opacity-55" />

      {/* CSS-only dekoratif orb'lar — landing-orb-a/b/c sınıfları index.css'te tanımlı */}
      <div
        aria-hidden
        className="landing-orb-a absolute -left-20 top-0 h-[420px] w-[420px] rounded-full bg-brand-400/40 blur-[80px]"
      />
      <div
        aria-hidden
        className="landing-orb-b absolute -right-16 top-1/4 h-[380px] w-[380px] rounded-full bg-sage-400/45 blur-[80px]"
      />
      <div
        aria-hidden
        className="landing-orb-c absolute bottom-0 left-1/3 h-[300px] w-[300px] rounded-full bg-amber-300/30 blur-[70px]"
      />

      <div aria-hidden className="plans-aurora-wave absolute inset-0 opacity-50" />
      <div aria-hidden className="plans-aurora-shimmer absolute inset-0" />

      <div className="relative">{children}</div>
    </section>
  )
}
