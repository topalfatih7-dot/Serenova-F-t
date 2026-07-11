import { createContext, useContext, useCallback, useState, useMemo, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import LoadingScreen from '../components/ui/LoadingScreen'
import ConfigErrorScreen from '../components/ui/ConfigErrorScreen'
import { isSupabaseEnabled, supabase } from '../services/supabaseClient'
import * as sb from '../services/supabaseDb'
import {
  getCurrentMember,
  getCurrentStaff,
  computeAdminStats,
  computeMembershipBreakdown,
  computeOnboardingFunnel,
  computeMonthlyGrowth,
  getSessionStats,
} from '../services/platformStats'
import { ALL_PLANS } from '../data/membershipPlans'
import { startPresenceTracker } from '../services/presenceService'
import { subscribeRealtimeSync, useActiveUsers } from '../hooks/useRealtimeSync'
import { completionKey, mealCompletionKey } from '../utils/programSchedule'
import { buildProgressPatch } from '../utils/memberProgress'
import * as authVerification from '../services/authVerification'
import { registerActiveSession, verifyActiveSessionOrSignOut } from '../services/singleSession'
import * as chatDb from '../services/chatDb'
import * as adminChatDb from '../services/adminChatDb'
import * as staffCollabChatDb from '../services/staffCollabChatDb'
import { totalUnreadThreads, adminStaffThreadUnreadCount, sortAdminStaffThreads, getStaffClients, staffCollabThreadUnreadCount, sortStaffCollabThreads, chatHydrationKey } from '../utils/chatAccess'
import { normalizeStaffRole } from '../utils/staffRoles'
import { applySessionCompactionToMember } from '../utils/memberSessions'
import { isAuthFastPath } from '../utils/authPaths'

const AppContext = createContext(null)

const EMPTY_DB = {
  version: 2, members: [], staff: [], programs: [], posts: [],
  tickets: [], activities: [], payments: [], exercises: [], exerciseCount: 0, plans: ALL_PLANS, session: null,
  content: { testimonials: [], faqs: [], successStories: [] },
}

export function AppProvider({ children }) {
  const location = useLocation()
  const authFastPath = isAuthFastPath(location.pathname)
  const [remoteDb, setRemoteDb] = useState(null)
  const [loading, setLoading] = useState(() => isSupabaseEnabled)
  const [syncing, setSyncing] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [chatThreads, setChatThreads] = useState([])
  const [chatMessages, setChatMessages] = useState({})
  const [adminStaffThreads, setAdminStaffThreads] = useState([])
  const [adminStaffMessages, setAdminStaffMessages] = useState({})
  const [staffCollabThreads, setStaffCollabThreads] = useState([])
  const [staffCollabMessages, setStaffCollabMessages] = useState({})
  const chatHydratedKey = useRef(null)
  const chatThreadIdsRef = useRef(new Set())
  const adminStaffThreadIdsRef = useRef(new Set())
  const staffCollabThreadIdsRef = useRef(new Set())
  const sessionTypeRef = useRef(null)

  useEffect(() => {
    chatThreadIdsRef.current = new Set((chatThreads || []).map((t) => t.id))
  }, [chatThreads])

  useEffect(() => {
    adminStaffThreadIdsRef.current = new Set((adminStaffThreads || []).map((t) => t.id))
  }, [adminStaffThreads])

  useEffect(() => {
    staffCollabThreadIdsRef.current = new Set((staffCollabThreads || []).map((t) => t.id))
  }, [staffCollabThreads])

  const reloadRemote = useCallback(async () => {
    setSyncing(true)
    try {
      const d = await sb.hydrate()
      setRemoteDb(d)
      return d
    } finally {
      setSyncing(false)
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseEnabled) {
      return undefined
    }
    let active = true
    ;(async () => {
      try {
        const d = await sb.hydrate()
        if (active) setRemoteDb(d)
      } finally {
        if (active) setLoading(false)
      }
    })()
    const unsub = sb.onAuthChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await registerActiveSession()
      }
      if (event === 'TOKEN_REFRESHED' && session) {
        await verifyActiveSessionOrSignOut()
      }
      if (!sb.AUTH_EVENTS_REQUIRING_HYDRATE.has(event)) return
      const d = await sb.hydrate()
      if (active) setRemoteDb(d)
    })
    return () => { active = false; unsub?.() }
  }, [])

  const db = remoteDb || EMPTY_DB
  const currentMember = useMemo(() => getCurrentMember(db), [db])
  const currentStaff = useMemo(() => getCurrentStaff(db), [db])
  const authUser = db.authUser || null
  const isAdmin = db.session?.type === 'admin'
  const isStaff = db.session?.type === 'staff'

  const user = useMemo(() => {
    if (isStaff) {
      return currentStaff || (authUser ? { ...authUser, role: 'staff' } : {})
    }
    if (isAdmin) {
      return { name: authUser?.name || 'Admin', email: authUser?.email }
    }
    if (currentMember) return currentMember
    if (authUser) return { id: authUser.id, name: authUser.name, email: authUser.email }
    return {}
  }, [isStaff, isAdmin, currentStaff, currentMember, authUser])
  const isAuthenticated = !!db.session

  useEffect(() => {
    if (!isSupabaseEnabled || !isAuthenticated) return undefined

    const tick = () => { verifyActiveSessionOrSignOut() }
    const interval = setInterval(tick, 60_000)
    const onVis = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVis)
    tick()

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [isAuthenticated])

  const adminStats = useMemo(() => computeAdminStats(db), [db])
  const onboardingFunnel = useMemo(() => computeOnboardingFunnel(db), [db])
  const membershipBreakdown = useMemo(() => computeMembershipBreakdown(db), [db])
  const monthlyGrowth = useMemo(() => computeMonthlyGrowth(db), [db])
  const sessionStats = useMemo(() => getSessionStats(db), [db])
  const remoteDbRef = useRef(remoteDb)
  const memberRef = useRef(currentMember)
  const notificationsDirtyRef = useRef(false)
  const notificationFlushTimerRef = useRef(null)
  const notificationFlushInFlightRef = useRef(null)

  useEffect(() => {
    remoteDbRef.current = remoteDb
  }, [remoteDb])

  useEffect(() => {
    memberRef.current = currentMember
  }, [currentMember])

  const chatHydrationKeyString = useMemo(() => {
    if (!remoteDb?.session) return ''
    return chatHydrationKey(
      remoteDb.session,
      getCurrentMember(remoteDb),
      getCurrentStaff(remoteDb),
      remoteDb.members || [],
      remoteDb.staff || [],
    )
  }, [remoteDb])

  const hasChatSession = Boolean(isSupabaseEnabled && remoteDb?.session)
  const [prevHasChatSession, setPrevHasChatSession] = useState(hasChatSession)
  if (hasChatSession !== prevHasChatSession) {
    setPrevHasChatSession(hasChatSession)
    if (!hasChatSession) {
      setChatThreads([])
      setChatMessages({})
      setAdminStaffThreads([])
      setAdminStaffMessages({})
      setStaffCollabThreads([])
      setStaffCollabMessages({})
    }
  }

  useEffect(() => {
    if (hasChatSession) return
    chatHydratedKey.current = null
    chatThreadIdsRef.current = new Set()
    adminStaffThreadIdsRef.current = new Set()
    staffCollabThreadIdsRef.current = new Set()
  }, [hasChatSession])

  useEffect(() => {
    if (!hasChatSession) return undefined
    if (!chatHydrationKeyString) return undefined
    if (chatHydratedKey.current === chatHydrationKeyString) return undefined

    const remoteDbSnapshot = remoteDbRef.current
    if (!remoteDbSnapshot?.session) return undefined

    const session = remoteDbSnapshot.session
    const staffUser = getCurrentStaff(remoteDbSnapshot)
    const key = chatHydrationKeyString

    let active = true
    ;(async () => {
      const member = getCurrentMember(remoteDbSnapshot)
      const [threads, adminThreads, collabThreads] = await Promise.all([
        chatDb.hydrateChatThreads(
          session,
          member,
          remoteDbSnapshot.staff || [],
          staffUser,
          remoteDbSnapshot.members || [],
        ),
        adminChatDb.hydrateAdminStaffThreads(
          session,
          remoteDbSnapshot.staff || [],
          staffUser,
        ),
        staffCollabChatDb.hydrateStaffCollabThreads(
          session,
          remoteDbSnapshot.members || [],
          remoteDbSnapshot.staff || [],
          staffUser,
        ),
      ])
      if (active) {
        setChatThreads(threads)
        setAdminStaffThreads(adminThreads)
        setStaffCollabThreads(collabThreads)
        chatThreadIdsRef.current = new Set(threads.map((t) => t.id))
        adminStaffThreadIdsRef.current = new Set(adminThreads.map((t) => t.id))
        staffCollabThreadIdsRef.current = new Set(collabThreads.map((t) => t.id))
        chatHydratedKey.current = key
      }
    })()
    return () => { active = false }
  }, [chatHydrationKeyString, hasChatSession])

  const chatUnreadCount = useMemo(() => {
    if (isStaff) {
      return totalUnreadThreads(
        chatThreads.filter((t) => String(t.staffId) === String(currentStaff?.id)),
        'staff',
      )
    }
    return totalUnreadThreads(chatThreads, 'member')
  }, [chatThreads, isStaff, currentStaff?.id])

  const staffAdminUnreadCount = useMemo(() => (
    adminStaffThreads.reduce((sum, t) => sum + adminStaffThreadUnreadCount(t, 'staff'), 0)
  ), [adminStaffThreads])

  const adminStaffUnreadCount = useMemo(() => (
    adminStaffThreads.reduce((sum, t) => sum + adminStaffThreadUnreadCount(t, 'admin'), 0)
  ), [adminStaffThreads])

  const staffCollabUnreadCount = useMemo(() => {
    const role = normalizeStaffRole(currentStaff?.role)
    if (role !== 'coach' && role !== 'dietitian') return 0
    return staffCollabThreads.reduce((sum, t) => sum + staffCollabThreadUnreadCount(t, role), 0)
  }, [staffCollabThreads, currentStaff?.role])

  const sortedStaffCollabThreads = useMemo(() => {
    const role = normalizeStaffRole(currentStaff?.role)
    return sortStaffCollabThreads(staffCollabThreads, role === 'dietitian' ? 'dietitian' : 'coach')
  }, [staffCollabThreads, currentStaff?.role])

  const pendingApplicationsCount = useMemo(() => {
    if (!isAdmin) return 0
    const staffPending = (db.staffApplications || []).filter((a) => a.status === 'pending').length
    const corpPending = (db.corporateApplications || []).filter((a) => a.status === 'pending').length
    const contactNew = (db.contactInquiries || []).filter((a) => a.status === 'new').length
    return staffPending + corpPending + contactNew
  }, [isAdmin, db.staffApplications, db.corporateApplications, db.contactInquiries])

  const openSupportTicketsCount = useMemo(() => {
    const memberId = currentMember?.id
    if (isAdmin) {
      return (db.tickets || []).filter((t) => t.status === 'open' || t.status === 'pending').length
    }
    if (memberId) {
      return (db.tickets || []).filter(
        (t) => t.memberId === memberId && (t.status === 'open' || t.status === 'pending'),
      ).length
    }
    return 0
  }, [isAdmin, db.tickets, currentMember?.id])

  const notificationUnreadCount = useMemo(
    () => (currentMember?.notifications || []).filter((n) => !n.read).length,
    [currentMember?.notifications],
  )

  const loadChatMessages = useCallback(async (threadId) => {
    const messages = await chatDb.fetchChatMessages(threadId)
    setChatMessages((prev) => ({ ...prev, [threadId]: messages }))
    return messages
  }, [])

  const sendChatMessage = useCallback(async (thread, senderType, senderId, text) => {
    const r = await chatDb.sendChatMessage({ thread, senderType, senderId, text })
    if (r.success) {
      setChatMessages((prev) => ({
        ...prev,
        [thread.id]: [...(prev[thread.id] || []), r.message],
      }))
      setChatThreads((prev) => prev.map((t) => (t.id === thread.id ? r.thread : t)))
    }
    return r
  }, [])

  const markChatThreadRead = useCallback(async (threadId, readerType) => {
    const updated = await chatDb.markChatThreadRead(threadId, readerType)
    if (updated) {
      setChatThreads((prev) => prev.map((t) => (t.id === threadId ? updated : t)))
    }
    return updated
  }, [])

  const refreshStaffChatThreads = useCallback(async () => {
    const dbNow = remoteDbRef.current
    const staffUser = getCurrentStaff(dbNow)
    if (!staffUser?.id) return []
    const clients = getStaffClients(dbNow?.members || [], staffUser.role, staffUser.id)
    const threads = await chatDb.ensureStaffChatThreads(staffUser, clients)
    setChatThreads(threads)
    return threads
  }, [])

  const ensureStaffChatThread = useCallback(async (member) => {
    const dbNow = remoteDbRef.current
    const staffUser = getCurrentStaff(dbNow)
    if (!staffUser?.id || !member?.id) return null
    const thread = await chatDb.getOrCreateChatThread(member, {
      role: normalizeStaffRole(staffUser.role),
      staffId: staffUser.id,
      name: staffUser.name,
    })
    if (thread) {
      setChatThreads((prev) => {
        if (prev.some((t) => t.id === thread.id)) {
          return prev.map((t) => (t.id === thread.id ? thread : t))
        }
        return [thread, ...prev]
      })
    }
    return thread
  }, [])

  const acceptChatConsent = useCallback(async (threadId) => {
    const updated = await chatDb.recordChatConsent(threadId)
    if (updated) {
      setChatThreads((prev) => prev.map((t) => (t.id === threadId ? updated : t)))
    }
    return updated
  }, [])

  const loadAdminStaffMessages = useCallback(async (threadId) => {
    const messages = await adminChatDb.fetchAdminStaffMessages(threadId)
    setAdminStaffMessages((prev) => ({ ...prev, [threadId]: messages }))
    return messages
  }, [])

  const sendAdminStaffMessage = useCallback(async (thread, senderType, senderId, text) => {
    const r = await adminChatDb.sendAdminStaffMessage({ thread, senderType, senderId, text })
    if (r.success) {
      setAdminStaffMessages((prev) => ({
        ...prev,
        [thread.id]: [...(prev[thread.id] || []), r.message],
      }))
      setAdminStaffThreads((prev) => prev.map((t) => (t.id === thread.id ? r.thread : t)))
    }
    return r
  }, [])

  const markAdminStaffThreadRead = useCallback(async (threadId, readerType) => {
    const updated = await adminChatDb.markAdminStaffThreadRead(threadId, readerType)
    if (updated) {
      setAdminStaffThreads((prev) => prev.map((t) => (t.id === threadId ? updated : t)))
    }
    return updated
  }, [])

  const ensureAdminStaffThread = useCallback(async (staff) => {
    const thread = await adminChatDb.getOrCreateAdminStaffThread(staff)
    if (thread) {
      setAdminStaffThreads((prev) => {
        const idx = prev.findIndex((t) => String(t.staffId) === String(thread.staffId))
        if (idx >= 0) return prev.map((t, i) => (i === idx ? thread : t))
        return [thread, ...prev]
      })
    }
    return thread
  }, [])

  const loadStaffCollabMessages = useCallback(async (threadId) => {
    const messages = await staffCollabChatDb.fetchStaffCollabMessages(threadId)
    setStaffCollabMessages((prev) => ({ ...prev, [threadId]: messages }))
    return messages
  }, [])

  const sendStaffCollabMessage = useCallback(async (thread, senderType, senderId, text) => {
    const r = await staffCollabChatDb.sendStaffCollabMessage({ thread, senderType, senderId, text })
    if (r.success) {
      setStaffCollabMessages((prev) => ({
        ...prev,
        [thread.id]: [...(prev[thread.id] || []), r.message],
      }))
      setStaffCollabThreads((prev) => prev.map((t) => (t.id === thread.id ? r.thread : t)))
    }
    return r
  }, [])

  const markStaffCollabThreadRead = useCallback(async (threadId, readerType) => {
    const updated = await staffCollabChatDb.markStaffCollabThreadRead(threadId, readerType)
    if (updated) {
      setStaffCollabThreads((prev) => prev.map((t) => (t.id === threadId ? updated : t)))
    }
    return updated
  }, [])

  const refreshStaffCollabThreads = useCallback(async () => {
    const dbNow = remoteDbRef.current
    const staffUser = getCurrentStaff(dbNow)
    if (!staffUser?.id) return []
    const threads = await staffCollabChatDb.ensureStaffCollabThreads(
      staffUser,
      dbNow?.members || [],
      dbNow?.staff || [],
    )
    setStaffCollabThreads(threads)
    return threads
  }, [])

  const ensureStaffCollabThread = useCallback(async (member) => {
    const dbNow = remoteDbRef.current
    if (!member?.id) return null
    const thread = await staffCollabChatDb.getOrCreateStaffCollabThread(member, dbNow?.staff || [])
    if (thread) {
      setStaffCollabThreads((prev) => {
        if (prev.some((t) => t.id === thread.id)) {
          return prev.map((t) => (t.id === thread.id ? thread : t))
        }
        return [thread, ...prev]
      })
    }
    return thread
  }, [])

  const sortedAdminStaffThreads = useMemo(() => {
    const perspective = isStaff ? 'staff' : 'admin'
    return sortAdminStaffThreads(adminStaffThreads, perspective)
  }, [adminStaffThreads, isStaff])

  useEffect(() => {
    if (!isSupabaseEnabled || !isAuthenticated) return undefined

    return startPresenceTracker({
      resolvePresenceInfo: async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null
        const dbNow = remoteDbRef.current
        const s = dbNow?.session
        // Oturum tipi henüz çözülmediyse presence yazma — yanlış 'member' rolü
        // kaydedilmesin (koç/diyetisyen/admin online durumu bozulur).
        if (!s?.type) return null
        let name = user.user_metadata?.name || user.email
        if (s.type === 'member') {
          const m = dbNow?.members?.find((x) => x.id === user.id)
          if (m?.name) name = m.name
        } else if (s.type === 'staff') {
          const st = dbNow?.staff?.find((x) => x.id === s.staffId || (x.email || '').toLowerCase() === (user.email || '').toLowerCase())
          if (st?.name) name = st.name
        } else if (s.type === 'admin') {
          name = dbNow?.authUser?.name || user.user_metadata?.name || 'Admin'
        }
        return { userId: user.id, email: user.email, name, role: s.type }
      },
      getPagePath: () => window.location.pathname,
    })
  }, [isAuthenticated])

  const sessionType = remoteDb?.session?.type

  useEffect(() => {
    sessionTypeRef.current = sessionType
  }, [sessionType])

  useEffect(() => {
    if (!isSupabaseEnabled || !sessionType) return undefined

    // Bağımlılıklar primitive (sessionType + id'ler) — remoteDb nesnesi her veri
    // güncellemesinde değiştiği için object referansına bağlanırsak kanallar sürekli
    // yeniden kurulur ve realtime sessizce durur. Bu yüzden yalnızca oturum kimliği
    // değiştiğinde yeniden abone oluruz.
    return subscribeRealtimeSync({
      session: { type: sessionType, memberId: currentMember?.id, staffId: currentStaff?.id },
      memberId: currentMember?.id,
      staffId: currentStaff?.id,
      isChatMessageRelevant: (threadId) => {
        if (!threadId) return false
        if (sessionTypeRef.current === 'admin') return true
        return chatThreadIdsRef.current.has(threadId)
      },
      isAdminStaffMessageRelevant: (threadId) => {
        if (!threadId) return false
        if (sessionTypeRef.current === 'admin') return true
        return adminStaffThreadIdsRef.current.has(threadId)
      },
      isStaffCollabMessageRelevant: (threadId) => {
        if (!threadId) return false
        if (sessionTypeRef.current === 'admin') return true
        return staffCollabThreadIdsRef.current.has(threadId)
      },
      onTicketsChange: ({ type, id, ticket }) => {
        setRemoteDb((prev) => {
          if (!prev) return prev
          if (type === 'delete') {
            return { ...prev, tickets: prev.tickets.filter((t) => t.id !== id) }
          }
          const idx = prev.tickets.findIndex((t) => t.id === ticket.id)
          const tickets = idx >= 0
            ? prev.tickets.map((t, i) => (i === idx ? ticket : t))
            : [ticket, ...prev.tickets]
          return { ...prev, tickets }
        })
      },
      onMemberChange: (member) => {
        setRemoteDb((prev) => {
          if (!prev) return prev
          const staffUser = getCurrentStaff(prev)
          const compacted = applySessionCompactionToMember(
            member,
            prev.session?.type,
            staffUser,
            prev.members,
          )
          return { ...prev, members: prev.members.map((m) => (m.id === compacted.id ? compacted : m)) }
        })
      },
      onChatThreadChange: (thread) => {
        chatThreadIdsRef.current.add(thread.id)
        setChatThreads((prev) => {
          const idx = prev.findIndex((t) => t.id === thread.id)
          if (idx >= 0) return prev.map((t, i) => (i === idx ? thread : t))
          return [thread, ...prev]
        })
      },
      onChatMessageChange: (message) => {
        setChatMessages((prev) => {
          const list = prev[message.threadId] || []
          if (list.some((m) => m.id === message.id)) return prev
          return { ...prev, [message.threadId]: [...list, message] }
        })
      },
      onAdminStaffThreadChange: (thread) => {
        adminStaffThreadIdsRef.current.add(thread.id)
        setAdminStaffThreads((prev) => {
          const idx = prev.findIndex((t) => t.id === thread.id)
          if (idx >= 0) return prev.map((t, i) => (i === idx ? thread : t))
          return [thread, ...prev]
        })
      },
      onAdminStaffMessageChange: (message) => {
        setAdminStaffMessages((prev) => {
          const list = prev[message.threadId] || []
          if (list.some((m) => m.id === message.id)) return prev
          return { ...prev, [message.threadId]: [...list, message] }
        })
      },
      onStaffCollabThreadChange: (thread) => {
        staffCollabThreadIdsRef.current.add(thread.id)
        setStaffCollabThreads((prev) => {
          const idx = prev.findIndex((t) => t.id === thread.id)
          if (idx >= 0) return prev.map((t, i) => (i === idx ? thread : t))
          return [thread, ...prev]
        })
      },
      onStaffCollabMessageChange: (message) => {
        setStaffCollabMessages((prev) => {
          const list = prev[message.threadId] || []
          if (list.some((m) => m.id === message.id)) return prev
          return { ...prev, [message.threadId]: [...list, message] }
        })
      },
      onApplicationsChange: () => {
        reloadRemote()
      },
      onProgramsChange: ({ type, id, program }) => {
        setRemoteDb((prev) => {
          if (!prev) return prev
          if (type === 'delete') {
            return { ...prev, programs: prev.programs.filter((p) => p.id !== id) }
          }
          const idx = prev.programs.findIndex((p) => p.id === program.id)
          const programs = idx >= 0
            ? prev.programs.map((p, i) => (i === idx ? program : p))
            : [program, ...prev.programs]
          return { ...prev, programs }
        })
      },
    })
  }, [sessionType, currentMember?.id, currentStaff?.id, reloadRemote])

  const { activeUsers } = useActiveUsers(isAdmin)

  const patchCurrentRemote = useCallback(async (patch) => {
    if (!currentMember) return
    await sb.saveMemberPatch(currentMember, patch)
    await reloadRemote()
  }, [currentMember, reloadRemote])

  const applyNotificationsOptimistic = useCallback((notifications) => {
    notificationsDirtyRef.current = true
    if (memberRef.current) {
      memberRef.current = { ...memberRef.current, notifications }
    }
    setRemoteDb((prev) => {
      const memberId = memberRef.current?.id
      if (!prev || !memberId) return prev
      return {
        ...prev,
        members: prev.members.map((m) => (m.id === memberId ? { ...m, notifications } : m)),
      }
    })
  }, [])

  const flushNotificationReads = useCallback(async () => {
    if (notificationFlushTimerRef.current) {
      clearTimeout(notificationFlushTimerRef.current)
      notificationFlushTimerRef.current = null
    }
    if (!notificationsDirtyRef.current) return

    const member = memberRef.current
    if (!member) return

    const latest = remoteDbRef.current?.members?.find((m) => m.id === member.id)
    const notifications = latest?.notifications ?? member.notifications ?? []
    notificationsDirtyRef.current = false

    const persist = sb.saveMemberPatch(member, { notifications }).catch(() => {
      notificationsDirtyRef.current = true
    })

    if (notificationFlushInFlightRef.current) {
      await notificationFlushInFlightRef.current.catch(() => {})
    }
    notificationFlushInFlightRef.current = persist
    try {
      await persist
    } finally {
      if (notificationFlushInFlightRef.current === persist) {
        notificationFlushInFlightRef.current = null
      }
    }
  }, [])

  const scheduleNotificationFlush = useCallback(() => {
    if (notificationFlushTimerRef.current) {
      clearTimeout(notificationFlushTimerRef.current)
    }
    notificationFlushTimerRef.current = setTimeout(() => {
      notificationFlushTimerRef.current = null
      flushNotificationReads()
    }, 1500)
  }, [flushNotificationReads])

  useEffect(() => {
    const onPageHide = () => { flushNotificationReads() }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flushNotificationReads()
    }
    window.addEventListener('pagehide', onPageHide)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', onPageHide)
      document.removeEventListener('visibilitychange', onVisibility)
      flushNotificationReads()
    }
  }, [flushNotificationReads])

  const login = useCallback(async (email, password, remember = false) => {
    const r = await sb.login(email, password, remember)
    if (!r.success) return { success: false, error: r.error, isAdmin: false }
    await reloadRemote()
    return { success: true, role: r.role, isAdmin: r.role === 'admin' }
  }, [reloadRemote])

  const logout = useCallback(async () => {
    setLoggingOut(true)
    try {
      await flushNotificationReads()
      await sb.logout()
      await reloadRemote()
    } finally {
      setLoggingOut(false)
    }
  }, [flushNotificationReads, reloadRemote])

  const register = useCallback(async (profile, membership, packageConfig) => {
    const r = await sb.register(profile, membership, packageConfig)
    if (r.success) await reloadRemote()
    return r
  }, [reloadRemote])

  const registerWithPayment = useCallback(async (profile, packageConfig) => {
    const r = await sb.registerWithPayment(profile, packageConfig)
    if (r.success) await reloadRemote()
    return r
  }, [reloadRemote])

  const registerWithPlan = useCallback(async (profile, planId, planPrice, durationMonths = 1) => {
    const r = await sb.registerWithPlan(profile, planId, planPrice, durationMonths)
    if (r.success) await reloadRemote()
    return r
  }, [reloadRemote])

  const completeOAuthMember = useCallback(async (profile, membership, packageConfig, opts = {}) => {
    const r = await sb.completeOAuthMember(profile, membership, packageConfig, opts)
    if (r.success) await reloadRemote()
    return r
  }, [reloadRemote])

  const savePlan = useCallback(async (plan) => {
    await sb.upsertPlan(plan)
    await reloadRemote()
  }, [reloadRemote])

  // Mevcut üyenin planını değiştirir (yeni kayıt oluşturmaz)
  const changePlan = useCallback(async (planId, planPrice = 0, durationMonths = 1) => {
    if (!currentMember) return { success: false, error: 'Oturum bulunamadı' }
    const r = await sb.changeMemberPlan(currentMember, planId, planPrice, durationMonths)
    if (r.success) await reloadRemote()
    return r
  }, [currentMember, reloadRemote])

  const processPremiumPayment = useCallback(async (packageConfig, schedule) => {
    if (!currentMember) return { success: false, error: 'Oturum bulunamadı' }
    const r = await sb.processPremiumPayment(currentMember, packageConfig, schedule)
    await reloadRemote()
    return r
  }, [currentMember, reloadRemote])

  const upgradeToPremium = useCallback(async (packageConfig, schedule) => {
    if (!currentMember) return
    const r = await sb.processPremiumPayment(currentMember, packageConfig, schedule)
    await reloadRemote()
    return r.pricing
  }, [currentMember, reloadRemote])

  const savePackage = useCallback(async (config) => {
    if (!currentMember) return
    await patchCurrentRemote({ packageConfig: config })
  }, [currentMember, patchCurrentRemote])

  const saveSupportSchedule = useCallback(async (schedule) => {
    if (!currentMember) return
    await sb.saveSupportSchedule(currentMember, schedule)
    await reloadRemote()
  }, [currentMember, reloadRemote])

  const adminPatchMember = useCallback(async (memberId, patch) => {
    const member = (remoteDb?.members || []).find((m) => m.id === memberId)
    if (!member) return
    await sb.saveMemberPatch(member, patch)
    await reloadRemote()
  }, [remoteDb, reloadRemote])

  const staffPatchMember = useCallback(async (memberId, patch) => {
    const member = (remoteDb?.members || []).find((m) => m.id === memberId)
    if (!member) return
    await sb.saveMemberPatch(member, patch)
    await reloadRemote()
  }, [remoteDb, reloadRemote])

  const adminUpdatePremium = useCallback(async (memberId, options) => {
    const r = await sb.adminUpdatePremiumMembership(memberId, options)
    if (r.success) await reloadRemote()
    return r
  }, [reloadRemote])

  const adminSetMembershipStatus = useCallback(async (memberId, options) => {
    const r = await sb.adminSetMembershipStatus(memberId, options)
    if (r.success) await reloadRemote()
    return r
  }, [reloadRemote])

  const addStaff = useCallback(async (data) => {
    const r = await sb.addStaff(data)
    if (r.success) await reloadRemote()
    return r
  }, [reloadRemote])

  const editStaff = useCallback(async (id, patch) => {
    const r = await sb.editStaff(id, patch)
    await reloadRemote()
    return r
  }, [reloadRemote])

  const updateStaffProfile = useCallback(async (id, patch) => {
    const r = await sb.updateStaffSelfProfile(id, patch)
    if (r.success) await reloadRemote()
    return r
  }, [reloadRemote])

  const removeStaff = useCallback(async (id) => {
    await sb.removeStaff(id)
    await reloadRemote()
  }, [reloadRemote])

  const removeMember = useCallback(async (id) => {
    await sb.removeMember(id)
    await reloadRemote()
  }, [reloadRemote])

  const createProgram = useCallback(async (data) => {
    const p = await sb.createProgram(data)
    if (p) {
      setRemoteDb((prev) => {
        if (!prev) return prev
        const idx = prev.programs.findIndex((x) => x.id === p.id)
        const programs = idx >= 0
          ? prev.programs.map((x, i) => (i === idx ? p : x))
          : [p, ...prev.programs]
        return { ...prev, programs }
      })
    } else {
      await reloadRemote()
    }
    return p
  }, [reloadRemote])

  const addPost = useCallback(async (data) => {
    const p = await sb.addPost(data)
    await reloadRemote()
    return p
  }, [reloadRemote])

  const editPost = useCallback(async (id, patch) => {
    await sb.editPost(id, patch)
    await reloadRemote()
  }, [reloadRemote])

  const removePost = useCallback(async (id) => {
    await sb.removePost(id)
    await reloadRemote()
  }, [reloadRemote])

  const createTicket = useCallback(async (ticketData) => {
    const t = await sb.createTicket(currentMember, ticketData)
    if (t) {
      setRemoteDb((prev) => (prev ? { ...prev, tickets: [t, ...prev.tickets] } : prev))
    }
    return t
  }, [currentMember])

  const uploadExerciseVideo = useCallback((file) => sb.uploadExerciseVideo(file), [])
  const getExerciseVideoUrl = useCallback((path) => sb.getExerciseVideoUrl(path), [])

  const addExercise = useCallback(async (data) => {
    const r = await sb.addExercise(data)
    if (r.success) await reloadRemote()
    return r
  }, [reloadRemote])

  const editExercise = useCallback(async (id, patch) => {
    const r = await sb.editExercise(id, patch)
    if (r.success) await reloadRemote()
    return r
  }, [reloadRemote])

  const removeExercise = useCallback(async (id) => {
    await sb.removeExercise(id)
    await reloadRemote()
  }, [reloadRemote])

  const reassignExerciseCategory = useCallback(async (fromCategory, toCategory) => {
    const r = await sb.reassignExerciseCategory(fromCategory, toCategory)
    if (r.success) await reloadRemote()
    return r
  }, [reloadRemote])

  const resolveStaffApplication = useCallback(async (application, approve, adminNote = '') => {
    const r = await sb.resolveStaffApplication(application, approve, adminNote)
    if (r.success) await reloadRemote()
    return r
  }, [reloadRemote])

  const resolveCorporateApplication = useCallback(async (application, status, adminNote = '') => {
    const r = await sb.resolveCorporateApplication(application, status, adminNote)
    if (r.success) await reloadRemote()
    return r
  }, [reloadRemote])

  const updateContactInquiryStatus = useCallback(async (inquiry, status) => {
    const r = await sb.updateContactInquiryStatus(inquiry, status)
    if (r.success) await reloadRemote()
    return r
  }, [reloadRemote])

  const addContent = useCallback(async (kind, data) => {
    const r = await sb.addContent(kind, data)
    if (r.success) await reloadRemote()
    return r
  }, [reloadRemote])

  const editContent = useCallback(async (id, data) => {
    const r = await sb.editContent(id, data)
    if (r.success) await reloadRemote()
    return r
  }, [reloadRemote])

  const removeContent = useCallback(async (id) => {
    await sb.removeContent(id)
    await reloadRemote()
  }, [reloadRemote])

  const saveExerciseTaxonomy = useCallback(async (taxonomy) => {
    const r = await sb.upsertExerciseTaxonomy(taxonomy)
    if (r.success) await reloadRemote()
    return r
  }, [reloadRemote])

  const submitSuccessStory = useCallback(async (data) => {
    const r = await sb.submitSuccessStory(currentMember, data)
    if (r.success) await reloadRemote()
    return r
  }, [currentMember, reloadRemote])

  const setTicketStatus = useCallback(async (ticketId, status) => {
    await sb.setTicketStatus(ticketId, status)
    setRemoteDb((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        tickets: prev.tickets.map((t) => (t.id === ticketId ? { ...t, status } : t)),
      }
    })
  }, [])

  const sendTicketReply = useCallback(async (ticketId, from, text) => {
    const t = await sb.sendTicketReply(ticketId, from, text)
    if (t?.id) {
      setRemoteDb((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          tickets: prev.tickets.map((x) => (x.id === ticketId ? t : x)),
        }
      })
    }
    return t
  }, [])

  const markNotificationRead = useCallback((id) => {
    const member = memberRef.current
    if (!member) return
    const prev = member.notifications || []
    if (prev.find((n) => n.id === id)?.read) return
    const notifications = prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    applyNotificationsOptimistic(notifications)
    scheduleNotificationFlush()
  }, [applyNotificationsOptimistic, scheduleNotificationFlush])

  const markAllNotificationsRead = useCallback(() => {
    const member = memberRef.current
    if (!member) return
    const prev = member.notifications || []
    if (prev.length > 0 && prev.every((n) => n.read)) return
    const notifications = prev.map((n) => ({ ...n, read: true }))
    applyNotificationsOptimistic(notifications)
    flushNotificationReads()
  }, [applyNotificationsOptimistic, flushNotificationReads])

  const sessionKey = (type) => {
    if (type === 'coach') return 'coachSessions'
    if (type === 'doctor') return 'doctorSessions'
    return 'dietitianSessions'
  }

  const rescheduleSession = useCallback(async (id, type, newDate) => {
    if (!currentMember) return
    const key = sessionKey(type)
    const sessions = (currentMember[key] || []).map((s) => (s.id === id ? { ...s, date: newDate, status: 'rescheduled' } : s))
    await patchCurrentRemote({ [key]: sessions })
  }, [currentMember, patchCurrentRemote])

  const cancelSession = useCallback(async (id, type) => {
    if (!currentMember) return
    const key = sessionKey(type)
    const sessions = (currentMember[key] || []).map((s) => (s.id === id ? { ...s, status: 'cancelled' } : s))
    await patchCurrentRemote({ [key]: sessions })
  }, [currentMember, patchCurrentRemote])

  // Self-servis randevu: personel müsaitliğinden çakışmasız randevu oluştur
  const bookSession = useCallback(async (type, dateISO, duration) => {
    const r = await sb.bookStaffSession(type, dateISO, duration)
    if (r.success) await reloadRemote()
    return r
  }, [reloadRemote])

  const getStaffBookedSlots = useCallback(
    (staffId, type, fromISO, toISO) => sb.getStaffBookedSlots(staffId, type, fromISO, toISO),
    [],
  )

  const toggleTask = useCallback(async (id) => {
    if (!currentMember) return
    const tasks = (currentMember.tasks || []).map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    await patchCurrentRemote({ tasks })
  }, [currentMember, patchCurrentRemote])

  const toggleActivityCompletion = useCallback(async (dateStr, entryId) => {
    if (!currentMember || !dateStr) return
    const current = currentMember.completedActivities || {}
    const dayKeys = current[dateStr] || []
    const key = completionKey(dateStr, entryId)
    const newKeys = dayKeys.includes(key) ? dayKeys.filter((k) => k !== key) : [...dayKeys, key]
    const completedActivities = { ...current, [dateStr]: newKeys }
    const myProgs = (remoteDb?.programs || []).filter((p) => p.memberId === currentMember.id)
    const progressPatch = buildProgressPatch(myProgs, completedActivities, currentMember.progress, currentMember)
    await patchCurrentRemote({ completedActivities, ...progressPatch })
  }, [currentMember, remoteDb?.programs, patchCurrentRemote])

  /** Beslenme listesi — öğün bazlı tamamlama (tüm öğün kalemleri birlikte) */
  const toggleMealCompletion = useCallback(async (dateStr, mealType, entryIds = []) => {
    if (!currentMember || !dateStr || !mealType) return
    const current = currentMember.completedActivities || {}
    const dayKeys = current[dateStr] || []
    const mealKey = mealCompletionKey(dateStr, mealType)
    const entryKeys = entryIds.map((id) => completionKey(dateStr, id))
    const isDone = dayKeys.includes(mealKey)
    let newKeys
    if (isDone) {
      newKeys = dayKeys.filter((k) => k !== mealKey && !entryKeys.includes(k))
    } else {
      newKeys = [...new Set([...dayKeys, mealKey, ...entryKeys])]
    }
    const completedActivities = { ...current, [dateStr]: newKeys }
    const myProgs = (remoteDb?.programs || []).filter((p) => p.memberId === currentMember.id)
    const progressPatch = buildProgressPatch(myProgs, completedActivities, currentMember.progress, currentMember)
    await patchCurrentRemote({ completedActivities, ...progressPatch })
  }, [currentMember, remoteDb?.programs, patchCurrentRemote])

  const updateProfile = useCallback(async (profile) => {
    if (!currentMember) return
    await patchCurrentRemote(profile)
  }, [currentMember, patchCurrentRemote])

  /** Sağlık testi ara kaydı — tam reloadRemote yapmaz (loading döngüsünü önler). */
  const saveHealthTestProgress = useCallback(async (healthTest) => {
    const member = memberRef.current
    if (!member) return

    memberRef.current = { ...member, healthTest }
    setRemoteDb((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        members: prev.members.map((m) => (
          m.id === member.id ? { ...m, healthTest } : m
        )),
      }
    })

    try {
      await sb.saveMemberPatch(member, { healthTest })
    } catch {
      await reloadRemote()
    }
  }, [reloadRemote])

  const updateSettings = useCallback(async (settingsPatch) => {
    if (!currentMember) return
    const nextSettings = { ...currentMember.settings, ...settingsPatch }
    setRemoteDb((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        members: prev.members.map((m) => (
          m.id === currentMember.id ? { ...m, settings: nextSettings } : m
        )),
      }
    })
    try {
      await sb.saveMemberPatch(currentMember, { settings: nextSettings })
    } catch {
      await reloadRemote()
    }
  }, [currentMember, reloadRemote])

  const verificationStatus = useMemo(() => {
    if (!currentMember) return null
    return {
      email: currentMember.email,
      phone: currentMember.phone,
      emailVerified: Boolean(currentMember.emailVerifiedAt),
      phoneVerified: Boolean(currentMember.phoneVerifiedAt),
    }
  }, [currentMember])

  const sendEmailVerification = useCallback(async () => authVerification.sendEmailVerification(), [])
  const confirmEmailVerification = useCallback(
    async (code) => authVerification.confirmEmailVerification(code, currentMember),
    [currentMember],
  )
  const sendPhoneVerification = useCallback(
    async (phone, countryIso) => authVerification.sendPhoneVerification(phone, countryIso, currentMember),
    [currentMember],
  )
  const confirmPhoneVerification = useCallback(
    async (code, phone, countryIso, viaEmail) =>
      authVerification.confirmPhoneVerification(code, phone, currentMember, countryIso, viaEmail),
    [currentMember],
  )

  const refreshVerification = useCallback(async () => {
    const res = await authVerification.refreshEmailVerification(currentMember)
    await reloadRemote()
    return res
  }, [currentMember, reloadRemote])

  const myPrograms = useMemo(() => {
    const memberId = currentMember?.id
    if (!memberId) return []
    return (db.programs || []).filter((p) => p.memberId === memberId)
  }, [currentMember?.id, db.programs])

  const myTickets = useMemo(() => {
    const memberId = currentMember?.id
    if (!memberId) return []
    return (db.tickets || []).filter((t) => t.memberId === memberId)
  }, [currentMember?.id, db.tickets])

  const platform = useMemo(() => ({
    members: db.members,
    staff: db.staff || [],
    programs: db.programs || [],
    tickets: db.tickets,
    activities: db.activities,
    payments: db.payments,
  }), [db.members, db.staff, db.programs, db.tickets, db.activities, db.payments])

  const isFreeTrialExpired = useMemo(
    () => Boolean(
      currentMember?.membership === 'free'
      && currentMember?.freeTrialExpiresAt
      && new Date() > new Date(currentMember.freeTrialExpiresAt),
    ),
    [currentMember],
  )

  const value = useMemo(() => ({
    mode: 'supabase',
    loading,
    syncing,
    isAuthenticated,
    isAdmin,
    isStaff,
    staffUser: currentStaff || {},
    staff: db.staff || [],
    programs: db.programs || [],
    posts: db.posts || [],
    myPrograms,
    myTickets,
    exercises: db.exercises || [],
    exerciseCount: db.exerciseCount ?? 0,
    plans: db.plans || ALL_PLANS,
    staffApplications: db.staffApplications || [],
    corporateApplications: db.corporateApplications || [],
    contactInquiries: db.contactInquiries || [],
    user,
    authUser,
    membership: currentMember?.membership || 'free',
    membershipStatus: currentMember?.membershipStatus || 'active',
    packageConfig: currentMember?.packageConfig,
    supportSchedule: currentMember?.supportSchedule || null,
    coachSessions: currentMember?.coachSessions || [],
    dietitianSessions: currentMember?.dietitianSessions || [],
    doctorSessions: currentMember?.doctorSessions || [],
    notifications: currentMember?.notifications || [],
    chatThreads,
    chatMessages,
    chatUnreadCount,
    adminStaffThreads: sortedAdminStaffThreads,
    adminStaffMessages,
    adminStaffUnreadCount,
    staffAdminUnreadCount,
    pendingApplicationsCount,
    openSupportTicketsCount,
    notificationUnreadCount,
    loadChatMessages,
    sendChatMessage,
    markChatThreadRead,
    refreshStaffChatThreads,
    ensureStaffChatThread,
    acceptChatConsent,
    loadAdminStaffMessages,
    sendAdminStaffMessage,
    markAdminStaffThreadRead,
    ensureAdminStaffThread,
    staffCollabThreads: sortedStaffCollabThreads,
    staffCollabMessages,
    staffCollabUnreadCount,
    loadStaffCollabMessages,
    sendStaffCollabMessage,
    markStaffCollabThreadRead,
    refreshStaffCollabThreads,
    ensureStaffCollabThread,
    tasks: currentMember?.tasks || [],
    progress: currentMember?.progress || { weight: [], workouts: [], meals: [], mood: [] },
    settings: currentMember?.settings || {},
    premiumExpiresAt: currentMember?.premiumExpiresAt,
    premiumStartedAt: currentMember?.premiumStartedAt,
    freeTrialExpiresAt: currentMember?.freeTrialExpiresAt || null,
    isFreeTrialExpired,
    testimonials: db.content?.testimonials || [],
    faqs: db.content?.faqs || [],
    successStories: db.content?.successStories || [],
    exerciseTaxonomy: db.content?.exerciseTaxonomy || null,
    platform,
    adminStats,
    onboardingFunnel,
    membershipBreakdown,
    monthlyGrowth,
    sessionStats,
    activeUsers,
    login,
    logout,
    loggingOut,
    register,
    completeOAuthMember,
    registerWithPayment,
    registerWithPlan,
    savePlan,
    changePlan,
    processPremiumPayment,
    upgradeToPremium,
    savePackage,
    saveSupportSchedule,
    addStaff,
    editStaff,
    updateStaffProfile,
    removeStaff,
    removeMember,
    adminPatchMember,
    staffPatchMember,
    adminUpdatePremium,
    adminSetMembershipStatus,
    createProgram,
    addPost,
    editPost,
    removePost,
    createTicket,
    setTicketStatus,
    sendTicketReply,
    uploadExerciseVideo,
    getExerciseVideoUrl,
    addExercise,
    editExercise,
    removeExercise,
    reassignExerciseCategory,
    resolveStaffApplication,
    resolveCorporateApplication,
    updateContactInquiryStatus,
    addContent,
    editContent,
    removeContent,
    saveExerciseTaxonomy,
    submitSuccessStory,
    markNotificationRead,
    markAllNotificationsRead,
    flushNotificationReads,
    rescheduleSession,
    cancelSession,
    bookSession,
    getStaffBookedSlots,
    toggleTask,
    toggleActivityCompletion,
    toggleMealCompletion,
    updateProfile,
    saveHealthTestProgress,
    updateSettings,
    verificationStatus,
    sendEmailVerification,
    confirmEmailVerification,
    sendPhoneVerification,
    confirmPhoneVerification,
    refreshVerification,
    refresh: reloadRemote,
    reloadRemote,
  }), [
    loading,
    syncing,
    isAuthenticated,
    isAdmin,
    isStaff,
    currentStaff,
    db.staff,
    db.programs,
    db.posts,
    db.plans,
    db.staffApplications,
    db.corporateApplications,
    db.contactInquiries,
    db.content,
    myPrograms,
    myTickets,
    db.exercises,
    db.exerciseCount,
    user,
    authUser,
    currentMember,
    chatThreads,
    chatMessages,
    chatUnreadCount,
    sortedAdminStaffThreads,
    adminStaffMessages,
    adminStaffUnreadCount,
    staffAdminUnreadCount,
    pendingApplicationsCount,
    openSupportTicketsCount,
    notificationUnreadCount,
    sortedStaffCollabThreads,
    staffCollabMessages,
    staffCollabUnreadCount,
    isFreeTrialExpired,
    platform,
    adminStats,
    onboardingFunnel,
    membershipBreakdown,
    monthlyGrowth,
    sessionStats,
    activeUsers,
    verificationStatus,
    loadChatMessages,
    sendChatMessage,
    markChatThreadRead,
    refreshStaffChatThreads,
    ensureStaffChatThread,
    acceptChatConsent,
    loadAdminStaffMessages,
    sendAdminStaffMessage,
    markAdminStaffThreadRead,
    ensureAdminStaffThread,
    loadStaffCollabMessages,
    sendStaffCollabMessage,
    markStaffCollabThreadRead,
    refreshStaffCollabThreads,
    ensureStaffCollabThread,
    login,
    logout,
    loggingOut,
    register,
    completeOAuthMember,
    registerWithPayment,
    registerWithPlan,
    savePlan,
    changePlan,
    processPremiumPayment,
    upgradeToPremium,
    savePackage,
    saveSupportSchedule,
    addStaff,
    editStaff,
    updateStaffProfile,
    removeStaff,
    removeMember,
    adminPatchMember,
    staffPatchMember,
    adminUpdatePremium,
    adminSetMembershipStatus,
    createProgram,
    addPost,
    editPost,
    removePost,
    createTicket,
    setTicketStatus,
    sendTicketReply,
    uploadExerciseVideo,
    getExerciseVideoUrl,
    addExercise,
    editExercise,
    removeExercise,
    reassignExerciseCategory,
    resolveStaffApplication,
    resolveCorporateApplication,
    updateContactInquiryStatus,
    addContent,
    editContent,
    removeContent,
    saveExerciseTaxonomy,
    submitSuccessStory,
    markNotificationRead,
    markAllNotificationsRead,
    flushNotificationReads,
    rescheduleSession,
    cancelSession,
    bookSession,
    getStaffBookedSlots,
    toggleTask,
    toggleActivityCompletion,
    toggleMealCompletion,
    updateProfile,
    saveHealthTestProgress,
    updateSettings,
    sendEmailVerification,
    confirmEmailVerification,
    sendPhoneVerification,
    confirmPhoneVerification,
    refreshVerification,
    reloadRemote,
  ])

  if (!isSupabaseEnabled) {
    return <ConfigErrorScreen />
  }

  return (
    <AppContext.Provider value={value}>
      {loading && !authFastPath ? (
        <LoadingScreen />
      ) : (
        <>
          {children}
          {syncing && !authFastPath && <LoadingScreen overlay />}
        </>
      )}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
