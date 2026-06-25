import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import SeoHead from '../../components/seo/SeoHead'
import { LEGAL_DOCUMENTS } from '../../data/legalDocuments'
import { SEO } from '../../config/seo'
import NotFoundPage from '../NotFoundPage'

const SLUG_MAP = {
  kvkk: 'kvkk',
  privacy: 'privacy',
  terms: 'terms',
}

export default function LegalDocumentPage({ slug: slugProp }) {
  const { slug: slugParam } = useParams()
  const slug = slugProp || slugParam
  const key = SLUG_MAP[slug]
  const doc = key ? LEGAL_DOCUMENTS[key] : null

  if (!doc) return <NotFoundPage />

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <SeoHead
        title={doc.seoTitle}
        description={doc.seoDescription}
        path={doc.path}
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
            <p className="mt-2 text-sm leading-relaxed text-cream-800/75">{section.body}</p>
          </section>
        ))}
      </div>
      <footer className="mt-12 rounded-2xl border border-cream-200 bg-cream-50/80 p-4 text-xs text-cream-800/60">
        Bu metin genel bilgilendirme amaçlıdır. Hukuki danışmanlık yerine geçmez. Sorularınız için{' '}
        <a href={`mailto:${SEO.contactEmail}`} className="text-brand-600 underline">{SEO.contactEmail}</a>
        {' '}adresine yazabilirsiniz.
      </footer>
    </article>
  )
}
