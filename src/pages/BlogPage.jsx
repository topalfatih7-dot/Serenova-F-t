import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, ArrowRight, BookOpen, User } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import EmptyState from '../components/ui/EmptyState'
import PlansAnimatedBackground from '../components/landing/PlansAnimatedBackground'
import JsonLd from '../components/seo/JsonLd'
import { useApp } from '../context/AppContext'
import { buildItemListSchema } from '../config/seo'
import { BLOG_CATEGORIES } from '../data/blogPosts'
import { resolveBlogCover } from '../utils/blogImages'

export default function BlogPage() {
  const { posts } = useApp()
  const [category, setCategory] = useState('all')

  const published = useMemo(
    () => (posts || []).filter((p) => p.published).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [posts],
  )
  const filtered = category === 'all' ? published : published.filter((p) => p.category === category)
  const featured = filtered[0]
  const rest = filtered.slice(1)

  const blogListSchema = useMemo(
    () =>
      buildItemListSchema({
        name: 'Yeni Form Blog',
        path: '/blog',
        items: published.map((p) => ({ name: p.title, path: `/blog/${p.id}` })),
      }),
    [published],
  )

  return (
    <div>
      <JsonLd data={blogListSchema} />
      <PlansAnimatedBackground className="!py-14 sm:!py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-4xl px-4 text-center sm:px-6"
        >
          <span className="section-badge">
            <BookOpen className="h-3.5 w-3.5" /> Yeni Form Blog
          </span>
          <h1 className="section-title mt-4">Sağlık, beslenme ve motivasyon</h1>
          <p className="section-subtitle mx-auto max-w-2xl">
            Dönüşüm yolculuğunuzda size eşlik edecek uzman içerikler. Herkesin erişimine açık.
          </p>
        </motion.div>
      </PlansAnimatedBackground>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => setCategory('all')}
            className={`rounded-full px-4 py-2 text-sm font-medium ${category === 'all' ? 'bg-brand-500 text-white' : 'bg-cream-100 text-cream-800'}`}
          >
            Tümü
          </button>
          {BLOG_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${category === c ? 'bg-brand-500 text-white' : 'bg-cream-100 text-cream-800'}`}
            >
              {c}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="mt-12">
            <EmptyState icon={BookOpen} title="Henüz yazı yok" description="Bu kategoride yayınlanmış bir makale bulunmuyor." />
          </div>
        ) : (
          <div className="mt-10 space-y-8">
            {featured && (
              <Link to={`/blog/${featured.id}`} className="group block overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-sm transition hover:shadow-md">
                <div className="grid md:grid-cols-2">
                  <BlogCover post={featured} className="min-h-[220px] md:min-h-full" />
                  <div className="flex flex-col justify-center p-6">
                    <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700 w-fit">{featured.category}</span>
                    <h2 className="mt-3 font-display text-2xl font-bold leading-tight text-cream-900 group-hover:text-brand-700">{featured.title}</h2>
                    <p className="mt-2 text-cream-800/70">{featured.excerpt}</p>
                    <div className="mt-4 flex items-center gap-3 text-xs text-cream-800/50">
                      <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {featured.author}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {featured.readMinutes} dk</span>
                      <span>{format(new Date(featured.createdAt), 'd MMM yyyy', { locale: tr })}</span>
                    </div>
                    <span className="mt-4 flex items-center gap-1 text-sm font-semibold text-brand-600 group-hover:gap-2 transition-all">
                      Yazıyı oku <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {rest.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((p) => (
                  <Link key={p.id} to={`/blog/${p.id}`} className="group flex flex-col overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-sm transition hover:shadow-md">
                    <BlogCover post={p} className="aspect-[16/10]" />
                    <div className="flex flex-1 flex-col p-5">
                      <span className="text-xs font-semibold text-brand-600">{p.category}</span>
                      <h3 className="mt-1 font-display text-lg font-bold leading-snug text-cream-900 group-hover:text-brand-700">{p.title}</h3>
                      <p className="mt-2 line-clamp-3 flex-1 text-sm text-cream-800/60">{p.excerpt}</p>
                      <div className="mt-4 flex items-center justify-between text-xs text-cream-800/50">
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {p.readMinutes} dk</span>
                        <span>{format(new Date(p.createdAt), 'd MMM', { locale: tr })}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function BlogCover({ post, className = '' }) {
  const cover = resolveBlogCover(post)
  return (
    <div className={`relative overflow-hidden bg-cream-100 ${className}`}>
      <img
        src={cover.url}
        alt={cover.alt}
        loading="lazy"
        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
    </div>
  )
}
