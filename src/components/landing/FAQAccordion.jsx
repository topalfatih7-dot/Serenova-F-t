import { useState } from 'react'
import { ChevronDown, HelpCircle, MessageCircle, Sparkles } from 'lucide-react'
import { scrollToContactSection } from '../../utils/scrollToContact'

const REVEAL_DELAY = ['', '-delay-1', '-delay-2', '-delay-3', '-delay-4', '-delay-5', '-delay-6', '-delay-7']

export default function FAQAccordion({ items }) {
  const [open, setOpen] = useState(null)
  const list = items || []

  if (list.length === 0) return null

  return (
    <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:items-start md:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-12">
      {/* Sol panel — CSS reveal (Framer whileInView kaldırıldı) */}
      <div className="section-reveal-left md:sticky md:top-24 lg:top-28">
        <span className="section-badge">
          <HelpCircle className="h-3.5 w-3.5" />
          SSS
        </span>
        <h2 className="section-title mt-4 text-left">Sık Sorulan Sorular</h2>
        <p className="section-subtitle text-left">
          Merak ettiklerinize hızlı yanıtlar. Aradığınızı bulamazsanız ekibimiz yardımcı olur.
        </p>

        <div className="relative mt-8 overflow-hidden rounded-3xl border border-brand-200/60 bg-gradient-to-br from-brand-500 via-brand-600 to-sage-600 p-6 text-white shadow-xl shadow-brand-900/15">
          <div aria-hidden className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20">
              <MessageCircle className="h-6 w-6" />
            </span>
            <div>
              <p className="font-display text-lg font-bold">Hâlâ sorunuz mu var?</p>
              <p className="mt-2 text-sm leading-relaxed text-white/80">
                Destek ekibimiz size en kısa sürede dönüş yapar.
              </p>
              <button
                type="button"
                onClick={scrollToContactSection}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
              >
                <Sparkles className="h-4 w-4" />
                Bize Ulaşın
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {list.map((item, i) => {
          const isOpen = open === i
          const delayClass = REVEAL_DELAY[Math.min(i, REVEAL_DELAY.length - 1)]
          return (
            <div
              key={item.id || i}
              className={`faq-item-reveal faq-item-reveal${delayClass} overflow-hidden rounded-2xl border transition ${
                isOpen
                  ? 'border-brand-300 bg-white shadow-lg shadow-brand-900/[0.06] ring-1 ring-brand-100'
                  : 'border-white/80 bg-white/95 shadow-sm hover:border-brand-200 hover:shadow-md'
              }`}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-start gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
              >
                <span
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition ${
                    isOpen
                      ? 'bg-gradient-to-br from-brand-500 to-sage-500 text-white shadow-md'
                      : 'bg-gradient-to-br from-brand-100 to-sage-100 text-brand-700'
                  }`}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1 pr-2">
                  <span className={`block font-semibold leading-snug sm:text-[1.05rem] ${
                    isOpen ? 'text-brand-800' : 'text-cream-900'
                  }`}>
                    {item.q}
                  </span>
                </span>
                <ChevronDown
                  className={`mt-1 h-5 w-5 shrink-0 text-brand-500 transition-transform duration-300 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Accordion — CSS grid (Framer height:auto kaldırıldı) */}
              <div className={`faq-answer-grid ${isOpen ? 'is-open' : ''}`}>
                <div className="faq-answer-inner">
                  <div className="border-t border-brand-100/80 bg-gradient-to-br from-brand-50/50 to-sage-50/30 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
                    <p className="text-sm leading-relaxed text-cream-800/80 sm:text-[0.9375rem] sm:leading-7">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
