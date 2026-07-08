import { supabase } from './supabaseClient'

const OFFLINE_MS = 90_000
const HEARTBEAT_MS = 30_000

async function broadcastPresenceStats(stats) {
  if (!supabase || !stats) return
  const channel = supabase.channel('presence:stats', { config: { broadcast: { self: false } } })
  try {
    await channel.httpSend('stats', stats)
  } catch {
    // Non-critical — subscribeOnlineStats also polls get_online_stats
  } finally {
    await supabase.removeChannel(channel)
  }
}

export async function fetchOnlineStats() {
  const { data, error } = await supabase.rpc('get_online_stats')
  if (error) return { onlineNow: 0, totalMembers: 0 }
  return {
    onlineNow: data?.online_now ?? 0,
    totalMembers: data?.total_members ?? 0,
  }
}

export async function fetchActiveUsers() {
  const { data, error } = await supabase.rpc('get_active_users')
  if (error) return []
  return Array.isArray(data) ? data : []
}

export async function fetchPresenceForUsers(userIds = [], { includeAdmins = false } = {}) {
  if (!supabase) return []
  const ids = [...new Set(userIds.filter(Boolean))]
  const rows = []

  // user_presence_public: email sütunu içermeyen view — sohbet karşı tarafının
  // e-postasının konsoldan doğrudan sorgulanamamasını garanti eder (bkz.
  // 20260715_staff_contact_field_hardening.sql).
  if (ids.length) {
    const { data, error } = await supabase
      .from('user_presence_public')
      .select('user_id, last_seen_at, role')
      .in('user_id', ids)
    if (!error && data) rows.push(...data)
  }

  if (includeAdmins) {
    const { data, error } = await supabase
      .from('user_presence_public')
      .select('user_id, last_seen_at, role')
      .eq('role', 'admin')
    if (!error && data) rows.push(...data)
  }

  const seen = new Set()
  return rows.filter((r) => {
    if (seen.has(r.user_id)) return false
    seen.add(r.user_id)
    return true
  })
}

export async function pingPresence({ userId, email, name, role, pagePath }) {
  const now = new Date().toISOString()
  const { data: existing } = await supabase
    .from('user_presence')
    .select('session_started_at, last_seen_at')
    .eq('user_id', userId)
    .maybeSingle()

  const wasOffline = !existing
    || (Date.now() - new Date(existing.last_seen_at).getTime() > OFFLINE_MS)

  let error
  if (!existing) {
    ;({ error } = await supabase.from('user_presence').insert({
      user_id: userId,
      email,
      name: name || email,
      role: role || 'member',
      session_started_at: now,
      last_seen_at: now,
      page_path: pagePath || null,
    }))
  } else if (wasOffline) {
    ;({ error } = await supabase.from('user_presence').update({
      email,
      name: name || email,
      role: role || 'member',
      session_started_at: now,
      last_seen_at: now,
      page_path: pagePath || null,
    }).eq('user_id', userId))
  } else {
    ;({ error } = await supabase.from('user_presence').update({
      email,
      name: name || email,
      role: role || 'member',
      last_seen_at: now,
      page_path: pagePath || null,
    }).eq('user_id', userId))
  }

  if (error) return null

  const stats = await fetchOnlineStats()
  void broadcastPresenceStats(stats)
  return stats
}

export async function clearPresence(userId) {
  if (!userId) return
  await supabase.from('user_presence').delete().eq('user_id', userId)
  const stats = await fetchOnlineStats()
  void broadcastPresenceStats(stats)
}

export function subscribeOnlineStats(onStats) {
  if (!supabase) return () => {}

  let active = true
  fetchOnlineStats().then((s) => { if (active) onStats(s) })

  const poll = setInterval(() => {
    fetchOnlineStats().then((s) => { if (active) onStats(s) })
  }, HEARTBEAT_MS)

  const channel = supabase
    .channel('presence:stats')
    .on('broadcast', { event: 'stats' }, ({ payload }) => {
      if (active && payload) onStats(payload)
    })
    .subscribe()

  return () => {
    active = false
    clearInterval(poll)
    supabase.removeChannel(channel)
  }
}

export function startPresenceTracker({ resolvePresenceInfo, getPagePath }) {
  if (!supabase) return () => {}

  let timer = null
  let stopped = false
  let lastUserId = null

  async function beat() {
    if (stopped) return
    const info = await resolvePresenceInfo()
    if (!info?.userId) return
    lastUserId = info.userId
    await pingPresence({
      ...info,
      pagePath: getPagePath?.() || (typeof window !== 'undefined' ? window.location.pathname : ''),
    })
  }

  beat()
  timer = setInterval(beat, HEARTBEAT_MS)

  const onVis = () => { if (document.visibilityState === 'visible') beat() }
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVis)
  }

  return () => {
    stopped = true
    clearInterval(timer)
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVis)
    }
    if (lastUserId) clearPresence(lastUserId)
  }
}

export { HEARTBEAT_MS, OFFLINE_MS }
