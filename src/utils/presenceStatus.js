import { OFFLINE_MS } from '../services/presenceService'

export function isUserOnline(lastSeenAt) {
  if (!lastSeenAt) return false
  return Date.now() - new Date(lastSeenAt).getTime() <= OFFLINE_MS
}

export function presenceLabel(lastSeenAt) {
  return isUserOnline(lastSeenAt) ? 'Çevrimiçi' : 'Çevrimdışı'
}
