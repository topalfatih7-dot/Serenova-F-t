import { useMemo } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { blogPostPath, findBlogPost } from '../utils/blogSlug'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock, User, ArrowRight, BookOpen } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useApp } from '../context/AppContext'
import SeoHead from '../components/seo/SeoHead'
import { buildArticleSchema, buildBreadcrumbSchema, truncateDescription, buildBrandKeywords } from '../config/seo'
import { resolveBlogCover } from '../utils/blogImages'
import { parseBlogContent } from '../utils/blogContent'

function BlogBodyBlocks({ blocks }) {
  return (
    <div className="blog-prose mt-10 space-y-6 sm:mt-12 sm:space-y-7">
      {blocks.map((block, i) => {
        if (block.type === 'h1') {
          return (
            <h2
              key={i}
              className="relative mt-10 scroll-mt-28 border-l-[3px] border-brand-500 pl-5 font-display text-2xl font-bold leading-snug tracking-tight text-cream-900 first:mt-0 sm:mt-14 sm:pl-6 sm:text-3xl"
            >
              {block.text}
            </h2>
          )
        }
        if (block.type === 'h2') {
          return (
            <h2
              key={i}
              className="group relative mt-10 scroll-mt-28 first:mt-0 sm:mt-14"
            >
              <span
                aria-hidden
                className="absolute -left-1 top-1.5 h-[calc(100%-0.25rem)] w-[3px] rounded-full bg-gradient-to-b from-brand-500 via-brand-400 to-sage-500 sm:-left-2"
              />
              <span className="block pl-5 font-display text-[1.375rem] font-bold leading-snug tracking-tight text-cream-900 sm:pl-6 sm:text-2xl">
                {block.text}
              </span>
              <span
                aria-hidden
                className="mt-3 block h-px max-w-[4.5rem] bg-gradient-to-r from-brand-400/80 to-transparent sm:max-w-[6rem]"
              />
            </h2>
          )
        }
        if (block.type === 'h3') {
          return (
            <h3
              key={i}
              className="relative mt-8 scroll-mt-28 border-l-2 border-sage-400/80 pl-4 font-display text-lg font-semibold leading-snug text-cream-900 first:mt-0 sm:mt-10 sm:text-xl"
            >
              {block.text}
            </h3>
          )
        }
        if (block.type === 'ul') {
          return (
            <ul key={i} className="space-y-2.5 pl-1">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-3 text-[1.0625rem] leading-relaxed text-cream-800/85">
                  <span
                    aria-hidden
                    className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500"
                  />
                  <span className="min-w-0">{item}</span>
                </li>
              ))}
            </ul>
          )
        }
        if (block.type === 'ol') {
          return (
            <ol key={i} className="list-none space-y-2.5 pl-1">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-3 text-[1.0625rem] leading-relaxed text-cream-800/85">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-50 font-display text-xs font-bold text-brand-700 ring-1 ring-brand-100">
                    {j + 1}
                  </span>
                  <span className="min-w-0 pt-0.5">{item}</span>
                </li>
              ))}
            </ol>
          )
        }
        return (
          <p
            key={i}
            className="whitespace-pre-line text-[1.0625rem] leading-[1.8] text-cream-800/85 sm:text-lg sm:leading-[1.85]"
          >
            {block.text}
          </p>
        )
      })}
    </div>
  )
}

export default function BlogPostPage() {
  const { id } = useParams()
  const { posts } = useApp()

  const post = findBlogPost(posts, id)
  const related = useMemo(
    () => (posts || []).filter((p) => p.published && p.id !== post?.id).slice(0, 3),
    [posts, post?.id]
  )
  const blocks = useMemo(
    () => parseBlogContent(post?.content),
    [post?.content]
  )

  if (!post || !post.published) {
    return <Navigate to="/blog" replace />
  }

  const cover = resolveBlogCover(post)
  const postPath = blogPostPath(post)

  return (
    <>
      <SeoHead
        title={post.title}
        description={post.excerpt || truncateDescription(post.content)}
        keywords={buildBrandKeywords([post.category, post.author, 'blog', 'sağlıklı yaşam', 'fitness'])}
        canonicalPath={postPath}
        ogType="article"
        jsonLd={[
          buildArticleSchema(post),
          buildBreadcrumbSchema([
            { name: 'Ana Sayfa', path: '/' },
            { name: 'Blog', path: '/blog' },
            { name: post.title, path: postPath },
          ]),
        ]}
      />

      <article className="relative pb-16 pt-8 sm:pb-20 sm:pt-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,color-mix(in_srgb,var(--color-brand-200)_55%,transparent),transparent_70%)]"
        />

        <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 transition hover:gap-2.5 hover:text-brand-700"
          >
            <ArrowLeft className="h-4 w-4" /> Tüm yazılar
          </Link>

          <motion.header
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 sm:mt-8"
          >
            <div className="overflow-hidden rounded-[1.75rem] border border-cream-200/80 bg-cream-100 shadow-[0_24px_60px_-28px_color-mix(in_srgb,var(--color-brand-900)_28%,transparent)]">
              <div className="relative aspect-[16/9] min-h-[200px] sm:min-h-[280px]">
                <img
                  src={cover.url}
                  alt={cover.alt}
                  className="h-full w-full object-cover"
                  fetchPriority="high"
                  decoding="async"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-cream-900/35 via-transparent to-transparent"
                />
              </div>
            </div>

            <div className="mt-7 sm:mt-9">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-700 ring-1 ring-brand-100">
                  {post.category}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-cream-800/55">
                  <BookOpen className="h-3.5 w-3.5" />
                  Makale
                </span>
              </div>

              <h1 className="mt-4 font-display text-[1.85rem] font-bold leading-[1.15] tracking-tight text-cream-900 sm:text-4xl sm:leading-[1.12] lg:text-[2.65rem]">
                {post.title}
              </h1>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-cream-200/90 py-4 text-sm text-cream-800/65">
                <span className="inline-flex items-center gap-1.5 font-medium text-cream-800/80">
                  <User className="h-4 w-4 text-brand-500" />
                  {post.author}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-sage-600" />
                  {post.readMinutes} dk okuma
                </span>
                <time dateTime={post.createdAt}>
                  {format(new Date(post.createdAt), 'd MMMM yyyy', { locale: tr })}
                </time>
              </div>
            </div>
          </motion.header>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <BlogBodyBlocks blocks={blocks} />
          </motion.div>

          {related.length > 0 && (
            <aside className="mt-14 border-t border-cream-200 pt-10 sm:mt-16">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">
                    Devam edin
                  </p>
                  <h2 className="mt-1.5 font-display text-xl font-bold text-cream-900 sm:text-2xl">
                    Diğer yazılar
                  </h2>
                </div>
                <Link
                  to="/blog"
                  className="hidden text-sm font-semibold text-brand-600 hover:underline sm:inline"
                >
                  Tüm blog
                </Link>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-1">
                {related.map((p, idx) => {
                  const relatedCover = resolveBlogCover(p)
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * idx }}
                    >
                      <Link
                        to={blogPostPath(p)}
                        className="group flex items-stretch gap-4 overflow-hidden rounded-2xl border border-cream-200 bg-white transition hover:border-brand-200 hover:shadow-[0_12px_32px_-16px_color-mix(in_srgb,var(--color-brand-700)_35%,transparent)]"
                      >
                        <div className="relative hidden w-28 shrink-0 overflow-hidden sm:block">
                          <img
                            src={relatedCover.url}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                        <div className="min-w-0 flex-1 px-4 py-4 sm:pr-5">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">
                            {p.category}
                          </span>
                          <p className="mt-1 font-display text-base font-semibold leading-snug text-cream-900 transition group-hover:text-brand-700 sm:text-lg">
                            {p.title}
                          </p>
                          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-cream-800/55">
                            {p.excerpt}
                          </p>
                        </div>
                        <span className="flex shrink-0 items-center pr-4 text-cream-800/25 transition group-hover:translate-x-0.5 group-hover:text-brand-500">
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            </aside>
          )}

          <div className="mt-10 rounded-2xl border border-cream-200/90 bg-gradient-to-br from-cream-50 to-brand-50/40 px-5 py-4 text-center text-xs leading-relaxed text-cream-800/55 sm:mt-12">
            Bu içerik genel bilgilendirme amaçlıdır; tıbbi teşhis veya tedavi yerine geçmez. Sağlık sorunlarınız için doktorunuza danışın.
          </div>
        </div>
      </article>
    </>
  )
}
