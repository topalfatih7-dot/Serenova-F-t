import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, ChevronDown } from 'lucide-react'
import JsonLd from '../../components/seo/JsonLd'
import {
  buildServiceSchema,
  buildFaqSchema,
  buildBreadcrumbSchema,
} from '../../config/seo'
import { SERVICE_PAGES } from '../../data/seoServiceContent'

export default function ServiceLandingPage({ path }) {
  const page = SERVICE_PAGES[path]
  if (!page) return null

  const schemas = [
    buildServiceSchema({
      name: page.serviceName,
      description: page.description,
      path: page.path,
      serviceType: page.serviceType,
      offers: [
        {
          name: path === '/online-diyetisyen' ? 'Diyet Paketi' : 'Spor Paketi',
          path: '/membership',
          description: page.lead,
        },
        {
          name: 'VIP Paket',
          path: '/membership',
          description: 'Koç ve diyetisyen desteğini birleştiren paket',
        },
      ],
    }),
    buildFaqSchema(page.faqs),
    buildBreadcrumbSchema([
      { name: 'Ana Sayfa', path: '/' },
      { name: page.serviceName, path: page.path },
    ]),
  ]

  return (
    <div className="overflow-x-hidden bg-cream-50/40">
      <JsonLd data={schemas} />

      <section className="relative border-b border-brand-100/60 bg-gradient-to-br from-cream-100 via-white to-sage-50/80">
        <div className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            Yeni Form Hizmetleri
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-cream-950 sm:text-4xl lg:text-[2.75rem]">
            {page.h1}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-cream-800/85 sm:text-lg">
            {page.lead}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to={page.primaryCta.to}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-sage-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-110"
            >
              {page.primaryCta.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to={page.secondaryCta.to}
              className="inline-flex items-center gap-2 rounded-full border border-cream-300 bg-white px-5 py-3 text-sm font-semibold text-cream-900 transition hover:border-brand-300 hover:text-brand-700"
            >
              {page.secondaryCta.label}
            </Link>
          </div>
          <p className="mt-4 text-sm text-cream-700/70">
            <Link to={page.teamLink.to} className="font-medium text-brand-700 underline-offset-2 hover:underline">
              {page.teamLink.label}
            </Link>
            {' · '}
            <Link to={page.relatedService.to} className="font-medium text-brand-700 underline-offset-2 hover:underline">
              {page.relatedService.label}
            </Link>
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl space-y-14 px-4 py-14 sm:px-6 sm:py-16">
        {page.sections.map((section) => (
          <section key={section.h2}>
            <h2 className="font-display text-2xl font-bold text-cream-950 sm:text-3xl">
              {section.h2}
            </h2>
            {(section.paragraphs || []).map((p) => (
              <p key={p.slice(0, 48)} className="mt-4 text-[15px] leading-relaxed text-cream-800/90">
                {p}
              </p>
            ))}
            {section.steps?.length > 0 && (
              <ol className="mt-6 space-y-4">
                {section.steps.map((step, i) => (
                  <li key={step.title} className="flex gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-cream-950">{step.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-cream-800/85">{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        ))}

        <section>
          <h2 className="font-display text-2xl font-bold text-cream-950 sm:text-3xl">
            Neden Yeni Form?
          </h2>
          <ul className="mt-5 space-y-3">
            {[
              'Platform içi video görüşme — ayrı uygulama gerekmez',
              'Kişiye özel program üye panelinde takip edilir',
              'İsterseniz koç ve diyetisyeni VIP ile birleştirin',
              'KVKK uyumlu altyapı ve uzman onaylı kadro',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-cream-800/90">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm leading-relaxed text-cream-700/80">
            Hizmet standartları:{' '}
            <Link to="/legal/diyetisyen-hizmet-standartlari" className="text-brand-700 underline-offset-2 hover:underline">
              Diyetisyen
            </Link>
            {' · '}
            <Link to="/legal/antrenor-hizmet-standartlari" className="text-brand-700 underline-offset-2 hover:underline">
              Antrenör
            </Link>
            {' · '}
            <Link to="/hakkimizda" className="text-brand-700 underline-offset-2 hover:underline">
              Hakkımızda
            </Link>
            {' · '}
            <Link to="/stories" className="text-brand-700 underline-offset-2 hover:underline">
              Başarı hikayeleri
            </Link>
          </p>
        </section>

        <section>
          <h2 className="mb-4 font-display text-2xl font-bold text-cream-950 sm:text-3xl">
            Sık sorulan sorular
          </h2>
          <ServiceFaqList faqs={page.faqs} />
        </section>

        <section className="rounded-2xl bg-gradient-to-br from-brand-600 to-sage-700 px-6 py-10 text-center text-white sm:px-10">
          <h2 className="font-display text-2xl font-bold">Hazır mısınız?</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/85">
            Ücretsiz Basic ile başlayın veya doğrudan uzman destekli pakete geçin.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={page.primaryCta.to}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-800 transition hover:bg-cream-50"
            >
              {page.primaryCta.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/onboarding?plan=free"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Ücretsiz Başla
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}

function ServiceFaqList({ faqs = [] }) {
  const [open, setOpen] = useState(0)
  return (
    <div className="divide-y divide-cream-200 rounded-2xl border border-cream-200/80 bg-white">
      {faqs.map((faq, i) => {
        const isOpen = open === i
        return (
          <div key={faq.q}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left sm:px-5"
              aria-expanded={isOpen}
            >
              <span className="text-sm font-semibold text-cream-950 sm:text-[15px]">{faq.q}</span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-cream-500 transition ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <p className="px-4 pb-4 text-sm leading-relaxed text-cream-800/85 sm:px-5">
                {faq.a}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
