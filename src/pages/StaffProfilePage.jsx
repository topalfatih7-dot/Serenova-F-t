import { Navigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { staffRoleMeta } from '../utils/staffRoles'
import SeoHead from '../components/seo/SeoHead'
import StaffProfileDisplay from '../components/staff/StaffProfileDisplay'
import {
  buildPersonSchema,
  buildBreadcrumbSchema,
  truncateDescription,
  teamListPathForRole,
  findStaffMember,
  staffProfilePath,
  staffPublicSlug,
  buildStaffProfileKeywords,
} from '../config/seo'
import { normalizeStaffProfile, formatStaffDisplayName } from '../data/staffProfile'

export default function StaffProfilePage() {
  const { id } = useParams()
  const { staff } = useApp()
  const member = findStaffMember(staff, id)

  if (!member) {
    return <Navigate to="/" replace />
  }

  const profile = normalizeStaffProfile(member)
  const displayName = formatStaffDisplayName(profile.name)
  const meta = staffRoleMeta(member.role)
  const profilePath = staffProfilePath(member)
  const slug = staffPublicSlug(member)

  // UUID ile erişildiyse SEO slug URL'ine yönlendir (ör. /team/koc-ahmet-yilmaz)
  if (id === member.id && id !== slug) {
    return <Navigate to={profilePath} replace />
  }

  return (
    <>
      <SeoHead
        title={
          member.role === 'dietitian'
            ? `${displayName} — Online Diyetisyen`
            : member.role === 'coach'
              ? `${displayName} — Online Fitness Koçu`
              : `${displayName} — ${meta.label}`
        }
        description={truncateDescription(
          profile.bio
            || (member.role === 'dietitian'
              ? `${displayName}, Yeni Form online diyetisyen kadrosu. Video görüşme ve kişiye özel beslenme programı.`
              : member.role === 'coach'
                ? `${displayName}, Yeni Form online koçluk kadrosu. Video görüşme ve kişiye özel antrenman programı.`
                : `${displayName}, Yeni Form ${meta.label.toLowerCase()} kadrosu.`)
        )}
        keywords={buildStaffProfileKeywords(profile, meta.label)}
        canonicalPath={profilePath}
        ogImage={profile.photo || undefined}
        jsonLd={[
          buildPersonSchema(profile, { profilePath }),
          buildBreadcrumbSchema([
            { name: 'Ana Sayfa', path: '/' },
            { name: meta.label, path: teamListPathForRole(member.role) },
            { name: displayName, path: profilePath },
          ]),
        ]}
      />
      <StaffProfileDisplay member={member} />
    </>
  )
}
