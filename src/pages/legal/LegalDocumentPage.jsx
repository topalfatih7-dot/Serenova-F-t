import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import SeoHead from '../../components/seo/SeoHead'
import { LEGAL_DOCUMENTS, getLegalMembershipNotice } from '../../data/legalDocuments'
import { BRAND } from '../../config/brand'
import { SEO } from '../../config/seo'
import NotFoundPage from '../NotFoundPage'

export default function LegalDocumentPage() {
  const { slug } = useParams()
  const doc = slug ? LEGAL_DOCUMENTS[slug] : null
  const membershipNotice = getLegalMembershipNotice(BRAND.name)

  if (!doc) return <NotFoundPage />

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <SeoHead
        title={doc.seoTitle}
        description={doc.seoDescription}
        canonicalPath={doc.path}
      />
      <Link
        to="/"
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" /> Ana sayfa
      </Link>
      <header className="border-b border-cream-200 pb-6">
        <h1 className="font-display text-3xl font-bold text-cream-900">{doc.title}</h1>
        <p className="mt-2 text-sm text-cream-800/55">Son güncelleme: {doc.updatedAt}</p>
      </header>
      <div className="prose-cream mt-8 space-y-8">
        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-display text-lg font-semibold text-cream-900">{section.heading}</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-cream-800/75">{section.body}</p>
          </section>
        ))}
      </div>
      <footer className="mt-12 space-y-4 rounded-2xl border border-cream-200 bg-cream-50/80 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-cream-800/50">Üyelik ve kabul beyanı</p>
        {membershipNotice.map((paragraph) => (
          <p key={paragraph.slice(0, 48)} className="text-sm leading-relaxed text-cream-800/70">
            {paragraph}
          </p>
        ))}
        <p className="border-t border-cream-200/80 pt-4 text-xs leading-relaxed text-cream-800/55">
          Bu metin genel bilgilendirme amaçlıdır; bireysel hukuki danışmanlık yerine geçmez.
          Sorularınız için{' '}
          <a href={`mailto:${SEO.contactEmail}`} className="font-medium text-brand-600 underline">{SEO.contactEmail}</a>
          {' '}adresine yazabilirsiniz.
        </p>
      </footer>
    </article>
  )
}
