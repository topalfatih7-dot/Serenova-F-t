import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { resolveBlogCover } from '../../utils/blogImages.js'

export default function LatestBlogPosts({ posts = [], limit = 3 }) {
  const latest = [...posts]
    .filter((p) => p.published)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit)

  if (latest.length === 0) return null

  const [featured, ...rest] = latest

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="section-badge">
              <BookOpen className="h-3.5 w-3.5" /> Blog
            </span>
            <h2 className="section-title mt-3">Son Yazılarımız</h2>
            <p className="section-subtitle mt-2 max-w-xl">
              Sağlık, beslenme ve motivasyon üzerine güncel içerikler
            </p>
          </div>
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50"
          >
            Tüm yazılar <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {featured && (
            <motion.article
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-sm transition hover:shadow-md lg:row-span-2"
            >
              <Link to={`/blog/${featured.id}`} className="block h-full">
                <BlogCover post={featured} className="aspect-[16/10] w-full sm:aspect-[16/9]" />
                <div className="p-6">
                  <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                    {featured.category}
                  </span>
                  <h3 className="mt-3 font-display text-xl font-bold leading-snug text-cream-900 group-hover:text-brand-700">
                    {featured.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm text-cream-800/65">{featured.excerpt}</p>
                  <BlogMeta post={featured} className="mt-4" />
                </div>
              </Link>
            </motion.article>
          )}

          <div className="flex flex-col gap-4">
            {rest.map((post, i) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <Link to={`/blog/${post.id}`} className="flex flex-col sm:flex-row">
                  <BlogCover post={post} className="aspect-[16/9] w-full sm:aspect-auto sm:h-full sm:w-40 sm:min-h-[140px] sm:shrink-0" />
                  <div className="flex flex-1 flex-col justify-center p-4">
                    <span className="text-xs font-semibold text-brand-600">{post.category}</span>
                    <h3 className="mt-1 line-clamp-2 font-display text-base font-bold text-cream-900 group-hover:text-brand-700">
                      {post.title}
                    </h3>
                    <BlogMeta post={post} className="mt-2" />
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
    </div>
  )
}

function BlogMeta({ post, className = '' }) {
  return (
    <div className={`flex flex-wrap items-center gap-3 text-xs text-cream-800/50 ${className}`}>
      <span className="flex items-center gap-1">
        <Clock className="h-3.5 w-3.5" /> {post.readMinutes} dk
      </span>
      <span>{format(new Date(post.createdAt), 'd MMM yyyy', { locale: tr })}</span>
    </div>
  )
}
