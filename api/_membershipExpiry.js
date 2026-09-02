/**
 * Süresi dolan ücretli üyeleri free fallback'e indirger (cron membership-expiry).
 */

import {
  isPaidMembership,
  memberExpirySyncNeedsPersist,
  syncMemberPackages,
} from './_memberPackages.js'

function memberFromRowForExpiry(row) {
  const data = row.data || {}
  const {
    assignedCoachId: _c,
    assignedDietitianId: _d,
    ...rest
  } = data
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    membership: row.membership,
    membershipStatus: row.membership_status,
    assignedCoachId: row.assigned_coach_id ?? null,
    assignedDietitianId: row.assigned_dietitian_id ?? null,
    ...rest,
  }
}

function memberDataPayloadForExpiry(member, data) {
  const {
    id: _id,
    name: _name,
    email: _email,
    membership: _m,
    membershipStatus: _ms,
    assignedCoachId: _c,
    assignedDietitianId: _d,
    ...rest
  } = member
  return { ...data, ...rest }
}

export async function runMembershipExpiryBatch(admin, { limit = 100 } = {}) {
  const { data: members, error } = await admin
    .from('members')
    .select('id, name, email, membership, membership_status, assigned_coach_id, assigned_dietitian_id, data')
    .neq('membership', 'free')
    .limit(500)

  if (error) throw new Error(error.message || 'Üyeler okunamadı')

  let synced = 0
  const results = []

  for (const row of members || []) {
    if (synced >= limit) break

    const before = memberFromRowForExpiry(row)
    const after = syncMemberPackages(before)
    if (!memberExpirySyncNeedsPersist(before, after)) continue

    const prevMembership = before.membership
    const newData = memberDataPayloadForExpiry(after, row.data || {})
    const { error: updErr } = await admin
      .from('members')
      .update({
        membership: after.membership,
        membership_status: after.membershipStatus || 'active',
        assigned_coach_id: after.assignedCoachId || null,
        assigned_dietitian_id: after.assignedDietitianId || null,
        data: newData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id)

    if (updErr) {
      results.push({ memberId: row.id, ok: false, error: updErr.message })
      continue
    }

    synced += 1
    results.push({
      memberId: row.id,
      ok: true,
      from: prevMembership,
      to: after.membership,
      downgraded: isPaidMembership(prevMembership) && after.membership === 'free',
    })
  }

  return { ok: true, synced, results }
}
