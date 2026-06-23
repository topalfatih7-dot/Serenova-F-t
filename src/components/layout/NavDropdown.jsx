import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

export default function NavDropdown({
  label,
  icon: Icon,
  items,
  footer,
  isOpen,
  onToggle,
  onClose,
  layoutId,
  pathname,
  activePaths = [],
}) {
  const isActive = activePaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`group relative flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition ${
          isOpen || isActive ? 'text-brand-700' : 'text-cream-800 hover:text-brand-600'
        }`}
      >
        {(isOpen || isActive) && (
          <motion.span
            layoutId={layoutId}
            className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-100/90 to-sage-100/90 shadow-sm"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
        <Icon className="relative h-4 w-4 transition-transform group-hover:scale-110" />
        <span className="relative">{label}</span>
        <ChevronDown className={`relative h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute left-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-white/80 bg-white/95 p-1.5 shadow-xl shadow-cream-900/10 backdrop-blur-xl"
          >
            {items.map((sub) => (
              <Link
                key={sub.to}
                to={sub.to}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition hover:bg-cream-50 ${
                  pathname === sub.to || pathname.startsWith(`${sub.to}/`) ? 'bg-brand-50/80 text-brand-700' : 'text-cream-800'
                }`}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${sub.color}`}>
                  <sub.icon className="h-4 w-4" />
                </span>
                {sub.label}
              </Link>
            ))}
            {footer && (
              <div className="mt-1 border-t border-cream-100 pt-1">
                <Link
                  to={footer.to}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    footer.highlight
                      ? 'bg-gradient-to-r from-brand-500 to-sage-500 text-white hover:brightness-105'
                      : 'text-brand-700 hover:bg-brand-50'
                  }`}
                >
                  {footer.icon && (
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${footer.highlight ? 'bg-white/20' : 'bg-brand-50 text-brand-600'}`}>
                      <footer.icon className="h-4 w-4" />
                    </span>
                  )}
                  {footer.label}
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
