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

function isRetiredDoctorTeamPath(id) {
  const param = String(id || '').toLowerCase()
  return param === 'doctors' || param.startsWith('doktor-')
}

export default function StaffProfilePage() {
  const { id } = useParams()
  const { staff } = useApp()

  // Eski /team/doktor-* URL'leri `team/:id` ile de eşleşir; RR6 tek segmentte prefix param tutmaz.
  if (isRetiredDoctorTeamPath(id)) {
    return <Navigate to="/hakkimizda" replace />
  }

  const member = findStaffMember(staff, id)

  if (!member) {
    return <Navigate to="/" replace />
  }

  if (member.role === 'doctor') {
    return <Navigate to="/hakkimizda" replace />
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
