import { useMemo } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { blogPostPath, findBlogPost } from '../utils/blogSlug'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock, User, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useApp } from '../context/AppContext'
import SeoHead from '../components/seo/SeoHead'
import { buildArticleSchema, buildBreadcrumbSchema, truncateDescription } from '../config/seo'
import { resolveBlogCover } from '../utils/blogImages'

export default function BlogPostPage() {
  const { id } = useParams()
  const { posts } = useApp()

  const post = findBlogPost(posts, id)
  const related = useMemo(
    () => (posts || []).filter((p) => p.published && p.id !== post?.id).slice(0, 3),
    [posts, post?.id]
  )

  if (!post || !post.published) {
    return <Navigate to="/blog" replace />
  }

  const paragraphs = post.content.split('\n\n')
  const cover = resolveBlogCover(post)

  const postPath = blogPostPath(post)

  return (
    <>
      <SeoHead
        title={post.title}
        description={post.excerpt || truncateDescription(post.content)}
        keywords={[post.category, post.author, 'Yeni Form blog', 'sağlıklı yaşam', 'fitness'].filter(Boolean).join(', ')}
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
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Tüm yazılar
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-sm">
        <div className="relative aspect-[21/9] min-h-[180px] sm:min-h-[240px]">
          <img src={cover.url} alt={cover.alt} className="h-full w-full object-cover" />
          <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent`} />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 text-white">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">{post.category}</span>
            <h1 className="mt-4 font-display text-2xl font-bold leading-tight sm:text-4xl">{post.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/85">
              <span className="flex items-center gap-1.5"><User className="h-4 w-4" /> {post.author}</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {post.readMinutes} dk okuma</span>
              <span>{format(new Date(post.createdAt), 'd MMMM yyyy', { locale: tr })}</span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="mt-8 space-y-5">
        {paragraphs.map((para, i) => (
          <p key={i} className="whitespace-pre-line leading-relaxed text-cream-800/85">{para}</p>
        ))}
      </div>

      {related.length > 0 && (
        <div className="mt-12 border-t border-cream-200 pt-8">
          <h2 className="font-display text-xl font-bold text-cream-900">Diğer yazılar</h2>
          <div className="mt-4 space-y-3">
            {related.map((p) => (
              <Link key={p.id} to={blogPostPath(p)} className="flex items-center justify-between gap-4 rounded-2xl border border-cream-200 bg-white p-4 transition hover:border-brand-200 hover:shadow-sm">
                <div className="min-w-0">
                  <span className="text-xs font-medium text-brand-600">{p.category}</span>
                  <p className="truncate font-semibold text-cream-900">{p.title}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-cream-800/30" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 rounded-2xl border border-cream-200 bg-cream-50 p-4 text-center text-xs text-cream-800/50">
        Bu içerik genel bilgilendirme amaçlıdır; tıbbi teşhis veya tedavi yerine geçmez. Sağlık sorunlarınız için doktorunuza danışın.
      </div>
    </article>
    </>
  )
}
