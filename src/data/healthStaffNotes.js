/** Üye sağlık profili — personel/admin klinik notları (members.data.healthStaffNotes) */

export const HEALTH_NOTE_ROLE_META = {
  coach: { label: 'Koç', chip: 'bg-brand-100 text-brand-800 ring-brand-200', dot: 'bg-brand-500' },
  dietitian: { label: 'Diyetisyen', chip: 'bg-sage-100 text-sage-800 ring-sage-200', dot: 'bg-sage-500' },
  doctor: { label: 'Doktor', chip: 'bg-amber-100 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  admin: { label: 'Admin', chip: 'bg-cream-900 text-white ring-cream-700', dot: 'bg-cream-900' },
}

export function normalizeHealthStaffNotes(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((n) => n && typeof n.text === 'string' && n.text.trim())
    .map((n) => ({
      id: n.id || `hn-${Date.now()}`,
      staffId: n.staffId || '',
      staffName: n.staffName || 'Uzman',
      staffRole: n.staffRole || 'coach',
      text: n.text.trim(),
      createdAt: n.createdAt || new Date().toISOString(),
      updatedAt: n.updatedAt || n.createdAt || new Date().toISOString(),
    }))
}

export function sortHealthStaffNotes(notes = []) {
  return [...notes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function appendHealthStaffNote(notes = [], payload) {
  const text = String(payload?.text || '').trim()
  if (!text) return notes
  const entry = {
    id: `hn-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    staffId: payload.staffId || '',
    staffName: payload.staffName || 'Uzman',
    staffRole: payload.staffRole || 'coach',
    text,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  return [entry, ...normalizeHealthStaffNotes(notes)]
}
