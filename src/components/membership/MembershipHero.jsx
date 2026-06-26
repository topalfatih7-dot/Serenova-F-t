import { motion } from 'framer-motion'
import PlansAnimatedBackground from '../landing/PlansAnimatedBackground'
import MembershipReassurance from './MembershipReassurance'

export default function MembershipHero({ title, subtitle, children }) {
  return (
    <>
      <PlansAnimatedBackground className="!py-14 sm:!py-18">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl px-4 text-center sm:px-6"
        >
          <span className="section-badge">Üyeliklerimiz</span>
          <h1 className="section-title mt-4">{title}</h1>
          <p className="section-subtitle mx-auto max-w-2xl">{subtitle}</p>
          <div className="mx-auto mt-8 max-w-2xl">
            <MembershipReassurance compact />
          </div>
        </motion.div>
      </PlansAnimatedBackground>
      {children}
    </>
  )
}
