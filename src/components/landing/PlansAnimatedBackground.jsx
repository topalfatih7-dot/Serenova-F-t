import { motion } from 'framer-motion'

export default function PlansAnimatedBackground({ children, className = '' }) {
  return (
    <section className={`plans-aurora-section relative overflow-hidden py-16 sm:py-20 ${className}`}>
      <div aria-hidden className="plans-aurora-spin absolute -inset-[50%] opacity-55" />

      <motion.div
        aria-hidden
        animate={{ x: ['-5%', '8%', '-5%'], y: ['0%', '-6%', '0%'], scale: [1, 1.15, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -left-20 top-0 h-[420px] w-[420px] rounded-full bg-brand-400/40 blur-[80px]"
      />
      <motion.div
        aria-hidden
        animate={{ x: ['5%', '-8%', '5%'], y: ['0%', '8%', '0%'], scale: [1, 1.2, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -right-16 top-1/4 h-[380px] w-[380px] rounded-full bg-sage-400/45 blur-[80px]"
      />
      <motion.div
        aria-hidden
        animate={{ x: ['0%', '6%', '-4%', '0%'], y: ['0%', '-5%', '5%', '0%'], opacity: [0.45, 0.7, 0.5, 0.45] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute bottom-0 left-1/3 h-[300px] w-[300px] rounded-full bg-amber-300/30 blur-[70px]"
      />

      <div aria-hidden className="plans-aurora-wave absolute inset-0 opacity-50" />
      <div aria-hidden className="plans-aurora-shimmer absolute inset-0" />

      <div className="relative">{children}</div>
    </section>
  )
}
