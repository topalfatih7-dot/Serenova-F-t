/** Üye silindikten sonra kalan yetim kayıtları istemci tarafında da filtreler */

export function memberIdSet(members) {
  return new Set((members || []).map((m) => m.id).filter(Boolean))
}

export function filterByMemberIds(rows, memberIds) {
  if (!memberIds?.size) return []
  return (rows || []).filter((row) => row.memberId && memberIds.has(row.memberId))
}

export function filterProgramsForMembers(programs, memberIds) {
  if (!memberIds?.size) return []
  return (programs || []).filter((p) => p.memberId && memberIds.has(p.memberId))
}
