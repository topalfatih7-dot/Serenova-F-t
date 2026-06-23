import { Navigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { staffRoleMeta } from '../utils/staffRoles'
import SeoHead from '../components/seo/SeoHead'
import StaffProfileDisplay from '../components/staff/StaffProfileDisplay'
import { buildPersonSchema, buildBreadcrumbSchema, truncateDescription, teamListPathForRole } from '../config/seo'
import { normalizeStaffProfile } from '../data/staffProfile'

export default function StaffProfilePage() {
  const { id } = useParams()
  const { staff } = useApp()
  const member = (staff || []).find((s) => s.id === id && s.active !== false)

  if (!member) {
    return <Navigate to="/" replace />
  }

  const profile = normalizeStaffProfile(member)
  const meta = staffRoleMeta(member.role)

  return (
    <>
      <SeoHead
        title={`${profile.name} — ${meta.label}`}
        description={truncateDescription(
          profile.headline || profile.bio || `${profile.name}, Yeni Form ${meta.label.toLowerCase()} kadrosu.`
        )}
        canonicalPath={`/team/${member.id}`}
        ogImage={profile.photo || undefined}
        jsonLd={[
          buildPersonSchema(profile),
          buildBreadcrumbSchema([
            { name: 'Ana Sayfa', path: '/' },
            { name: meta.label, path: teamListPathForRole(member.role) },
            { name: profile.name, path: `/team/${member.id}` },
          ]),
        ]}
      />
      <StaffProfileDisplay member={member} />
    </>
  )
}
