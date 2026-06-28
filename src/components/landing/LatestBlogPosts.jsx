import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Clock, Sparkles } from 'lucide-react'
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
    <section className="section-blog-vivid relative py-20 sm:py-28">
      <div className="section-blog-vivid-mesh" aria-hidden />
      <span
        aria-hidden
        className="section-blog-orb left-[5%] top-[10%] h-56 w-56 bg-brand-400/40"
        style={{ '--blog-orb-dur': '16s' }}
      />
      <span
        aria-hidden
        className="section-blog-orb right-[8%] top-[15%] h-64 w-64 bg-violet-400/35"
        style={{ '--blog-orb-dur': '20s', animationDelay: '-4s' }}
      />
      <span
        aria-hidden
        className="section-blog-orb bottom-[5%] left-[40%] h-48 w-48 bg-sage-400/30"
        style={{ '--blog-orb-dur': '18s', animationDelay: '-7s' }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="section-badge-vivid">
              <Sparkles className="h-3.5 w-3.5" /> Blog
            </span>
            <h2 className="section-title-gradient mt-4">Son Yazılarımız</h2>
            <p className="mt-3 max-w-xl text-base font-medium text-cream-800/75">
              Sağlık, beslenme ve motivasyon üzerine güncel içerikler
            </p>
          </div>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 via-violet-500 to-sage-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/30 transition hover:scale-105 hover:shadow-xl hover:shadow-violet-500/25"
          >
            Tüm yazılar <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Mobil: stack | Masaüstü: sol 1 featured = sağ 2 kart toplam yüksekliği */}
        <div className="mt-12 grid gap-6 md:grid-cols-2 md:items-stretch md:min-h-[32rem] lg:min-h-[34rem]">
          {featured && (
            <motion.article
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '50px' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="blog-card-vivid group flex min-h-0 flex-col md:h-full"
            >
              <Link to={`/blog/${featured.id}`} className="flex h-full min-h-0 flex-col">
                <BlogCover
                  post={featured}
                  featured
                  className="aspect-[16/10] w-full shrink-0 md:aspect-auto md:min-h-[12rem] md:flex-[1.2]"
                />
                <div className="flex flex-1 flex-col p-6 md:p-7">
                  <span className="inline-flex w-fit rounded-full bg-gradient-to-r from-brand-500 to-violet-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    {featured.category}
                  </span>
                  <h3 className="mt-3 font-display text-xl font-bold leading-snug text-cream-900 transition group-hover:text-brand-600 md:text-2xl">
                    {featured.title}
                  </h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-cream-800/70 md:line-clamp-[7] md:flex-1 md:text-[0.9375rem] md:leading-relaxed">
                    {featured.excerpt}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-cream-200/60 pt-4 md:mt-auto">
                    <BlogMeta post={featured} className="!mt-0" />
                    <span className="hidden items-center gap-1 text-sm font-semibold text-brand-600 transition group-hover:gap-1.5 md:inline-flex">
                      Devamını oku <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.article>
          )}

          <div className="flex min-h-0 flex-col gap-4 md:h-full md:gap-5">
            {rest.map((post, i) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '50px' }}
                transition={{ delay: i * 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="blog-card-vivid group flex min-h-0 flex-1 flex-col"
              >
                <Link
                  to={`/blog/${post.id}`}
                  className="flex h-full min-h-0 flex-col overflow-hidden md:flex-row md:items-stretch"
                >
                  <BlogCover
                    post={post}
                    className="aspect-[16/10] w-full shrink-0 md:aspect-auto md:h-full md:w-[40%] md:max-w-[13.5rem] md:min-h-[8rem] md:self-stretch lg:max-w-[15rem]"
                  />
                  <div className="flex min-h-0 flex-1 flex-col justify-center p-4 md:px-5 md:py-4 lg:p-5">
                    <span className="text-xs font-bold uppercase tracking-wide text-violet-600">{post.category}</span>
                    <h3 className="mt-1.5 line-clamp-2 font-display text-base font-bold leading-snug text-cream-900 transition group-hover:text-brand-600 lg:text-[1.0625rem]">
                      {post.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-cream-800/65 md:line-clamp-3">
                      {post.excerpt}
                    </p>
                    <BlogMeta post={post} className="mt-3" />
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

function BlogCover({ post, className = '', featured = false }) {
  const cover = resolveBlogCover(post)
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-brand-100 to-violet-100 ${className}`}>
      <img
        src={cover.url}
        alt={cover.alt}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110"
      />
      <div className={`absolute inset-0 bg-gradient-to-t ${featured ? 'from-violet-900/50 via-brand-900/10' : 'from-black/30 via-transparent'} to-transparent`} />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-violet-500/15 opacity-0 transition group-hover:opacity-100" />
    </div>
  )
}

function BlogMeta({ post, className = '' }) {
  return (
    <div className={`flex flex-wrap items-center gap-3 text-xs font-medium text-cream-800/55 ${className}`}>
      <span className="flex items-center gap-1">
        <Clock className="h-3.5 w-3.5 text-brand-500" /> {post.readMinutes} dk
      </span>
      <span>{format(new Date(post.createdAt), 'd MMM yyyy', { locale: tr })}</span>
    </div>
  )
}
