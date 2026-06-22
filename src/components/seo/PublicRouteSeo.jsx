import { useLocation } from 'react-router-dom'
import SeoHead from './SeoHead'
import { PAGE_SEO } from '../../config/seo'

/** Blog yazısı ve kadro profili gibi dinamik sayfalar kendi SeoHead'lerini render eder. */
const TEAM_LIST = new Set(['/team/coaches', '/team/dietitians', '/team/doctors'])

function isDynamicPublicRoute(pathname) {
  if (pathname.startsWith('/blog/') && pathname !== '/blog') return true
  if (pathname.startsWith('/team/') && !TEAM_LIST.has(pathname)) return true
  return false
}

export default function PublicRouteSeo() {
  const { pathname } = useLocation()

  if (isDynamicPublicRoute(pathname)) return null

  const seo = PAGE_SEO[pathname]
  if (!seo) return null

  return (
    <SeoHead
      title={seo.title}
      description={seo.description}
      keywords={seo.keywords}
      canonicalPath={pathname}
      noindex={seo.noindex}
    />
  )
}
