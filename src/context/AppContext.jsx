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
import {
  ALL_PLANS,
  isPaidMembership,
  setPlanCatalog,
} from '../data/membershipPlans'
import { startPresenceTracker } from '../services/presenceService'
import { subscribeRealtimeSync, useActiveUsers } from '../hooks/useRealtimeSync'
import { clearIncomingChatSoundState } from '../hooks/useIncomingChatSound'
import { clearNotificationAlertState } from '../hooks/useNotificationAlerts'
import { completionKey, mealCompletionKey } from '../utils/programSchedule'
import { isProgramListedForMember } from '../utils/programPackageScope'
import { buildProgressPatch } from '../utils/memberProgress'
import * as authVerification from '../services/authVerification'
import { registerActiveSession, verifyActiveSessionOrSignOut } from '../services/singleSession'
import * as chatDb from '../services/chatDb'
import * as adminChatDb from '../services/adminChatDb'
import * as staffCollabChatDb from '../services/staffCollabChatDb'
import { totalUnreadThreads, adminStaffThreadUnreadCount, sortAdminStaffThreads, getStaffClients, staffCollabThreadUnreadCount, sortStaffCollabThreads, chatHydrationKey } from '../utils/chatAccess'
import { normalizeStaffRole } from '../utils/staffRoles'
import { applySessionCompactionToMember } from '../utils/memberSessions'
import { isHydratePassThrough } from '../utils/authPaths'
import { markIntentionalLogout } from '../utils/authRedirect'
import { setStaffNotifications as persistStaffNotifications } from '../services/staffNotifications'

const AuthContext = createContext(null)
const DataContext = createContext(null)
const ActionsContext = createContext(null)

const EMPTY_DB = {
  version: 2, members: [], staff: [], programs: [], posts: [],
  tickets: [], activities: [], payments: [], exercises: [], exerciseCount: 0, plans: ALL_PLANS, session: null,
  content: { testimonials: [], faqs: [], successStories: [] },
}

export function AppProvider({ children }) {
  const location = useLocation()
  const hydratePassThrough = isHydratePassThrough(location.pathname)
  const [remoteDb, setRemoteDb] = useState(null)
  const [loading, setLoading] = useState(() => isSupabaseEnabled)
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

  /** Sessiz yenileme — tam ekran LoadingScreen göstermez (panel mutasyonları / poll). */
  const reloadRemote = useCallback(async ({ force = true } = {}) => {
    const d = await sb.hydrate({ force })
    setRemoteDb(d)
    return d
  }, [])

  useEffect(() => {
    if (!isSupabaseEnabled) {
      return undefined
    }
    let active = true
    ;(async () => {
      try {
        /* Anonim: UI’yi bloklama — session yoksa soft hydrate (cache / arka plan) */
        const session = await sb.getSession()
        if (!session?.user) {
          if (active) setLoading(false)
          const d = await sb.hydrate({ force: false })
          if (active) setRemoteDb(d)
          return
        }
        /* İlk yükleme: tek getUser() doğrulaması; sonraki hydrate’ler session.user kullanır */
        await sb.resolveAuthUser({ verify: true })
        const d = await sb.hydrate({ force: true })
        if (active) setRemoteDb(d)
      } finally {
        if (active) setLoading(false)
      }
    })()
    const unsub = sb.onAuthChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        /* onAuthStateChange içinde await auth çağrısı deadlock yapabilir —
         * password-login zaten claim ettiyse registerActiveSession no-op (local JWT / grace) */
        void registerActiveSession()
      }
      if (event === 'TOKEN_REFRESHED' && session) {
        /* Claim sonrası refreshSession da TOKEN_REFRESHED üretir — grace içinde no-op */
        void verifyActiveSessionOrSignOut({ forceRemote: true })
      }
      if (!sb.AUTH_EVENTS_REQUIRING_HYDRATE.has(event)) return
      if (event === 'SIGNED_OUT') sb.invalidateHydrateCache()
      /* await callback dışında — auth lock / deadlock riskini azaltır */
      void sb.hydrate({
        force: event === 'SIGNED_OUT' || event === 'USER_UPDATED',
      }).then((d) => {
        if (active) setRemoteDb(d)
      })
    })
    return () => { active = false; unsub?.() }
  }, [])

  const db = remoteDb || EMPTY_DB

  useEffect(() => {
    setPlanCatalog(db.plans?.length ? db.plans : ALL_PLANS)
  }, [db.plans])
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

    /* Yerel JWT kontrolü — API yalnızca TOKEN_REFRESHED'da (forceRemote) */
    const tick = () => { verifyActiveSessionOrSignOut({ forceRemote: false }) }
    const interval = setInterval(tick, 5 * 60_000)
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
    () => {
      if (isStaff) {
        return (currentStaff?.notifications || []).filter((n) => !n.read).length
      }
      return (currentMember?.notifications || []).filter((n) => !n.read).length
    },
    [isStaff, currentStaff?.notifications, currentMember?.notifications],
  )

  const loadChatMessages = useCallback(async (threadId) => {
    const messages = await chatDb.fetchChatMessages(threadId)
    setChatMessages((prev) => ({ ...prev, [threadId]: messages }))
    return messages
  }, [])

  const sendChatMessage = useCallback(async (thread, senderType, senderId, text) => {
    if (senderType === 'member' && !isPaidMembership(currentMember?.membership || 'free')) {
      return { success: false, error: 'Mesaj göndermek için bir paket seçin.' }
    }
    const r = await chatDb.sendChatMessage({ thread, senderType, senderId, text })
    if (r.success) {
      setChatMessages((prev) => ({
        ...prev,
        [thread.id]: [...(prev[thread.id] || []), r.message],
      }))
      setChatThreads((prev) => prev.map((t) => (t.id === thread.id ? r.thread : t)))
    }
    return r
  }, [currentMember?.membership])

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
        /* getSession yerel — getUser ağ çağrısı presence heartbeat’ini geciktirmesin */
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user
        if (!user?.id || !session?.access_token) return null
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
      session: { type: sessionType, memberId: currentMember?.id, staffId: currentStaff?.id, role: currentStaff?.role },
      memberId: currentMember?.id,
      staffId: currentStaff?.id,
      staffRole: currentStaff?.role,
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
          const idx = prev.members.findIndex((m) => m.id === compacted.id)
          if (idx >= 0) {
            return {
              ...prev,
              members: prev.members.map((m, i) => (i === idx ? compacted : m)),
            }
          }
          return { ...prev, members: [compacted, ...prev.members] }
        })
      },
      onStaffChange: (staffRow) => {
        setRemoteDb((prev) => {
          if (!prev) return prev
          const idx = prev.staff.findIndex((s) => s.id === staffRow.id)
          if (idx < 0) return { ...prev, staff: [...prev.staff, staffRow] }
          return {
            ...prev,
            staff: prev.staff.map((s, i) => (i === idx ? { ...s, ...staffRow } : s)),
          }
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
      onApplicationsChange: ({ table, type, id, record }) => {
        const listKey = {
          staff_applications: 'staffApplications',
          corporate_applications: 'corporateApplications',
          contact_inquiries: 'contactInquiries',
        }[table]
        if (!listKey) return
        setRemoteDb((prev) => {
          if (!prev) return prev
          const list = prev[listKey] || []
          if (type === 'delete') {
            return { ...prev, [listKey]: list.filter((r) => r.id !== id) }
          }
          if (!record) return prev
          const idx = list.findIndex((r) => r.id === record.id)
          const next = idx >= 0
            ? list.map((r, i) => (i === idx ? record : r))
            : [record, ...list]
          return { ...prev, [listKey]: next }
        })
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
  }, [sessionType, currentMember?.id, currentStaff?.id, currentStaff?.role])

  const { activeUsers } = useActiveUsers(isAdmin)

  const patchCurrentRemote = useCallback(async (patch, { throwOnError = false } = {}) => {
    if (!currentMember) return null
    const member = memberRef.current || currentMember
    const optimistic = { ...member, ...patch }
    memberRef.current = optimistic
    setRemoteDb((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        members: prev.members.map((m) => (m.id === member.id ? { ...m, ...patch } : m)),
      }
    })
    try {
      const updated = await sb.saveMemberPatch(member, patch)
      memberRef.current = updated
      setRemoteDb((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          members: prev.members.map((m) => (m.id === updated.id ? { ...updated } : m)),
        }
      })
      return updated
    } catch (err) {
      await reloadRemote()
      if (throwOnError) {
        throw err instanceof Error ? err : new Error(String(err?.message || err || 'Profil güncellenemedi.'))
      }
      return null
    }
  }, [currentMember, reloadRemote])

  const applyNotificationsOptimistic = useCallback((notifications) => {
    notificationsDirtyRef.current = true
    if (memberRef.current) {
      memberRef.current = { ...memberRef.current, notifications }
      setRemoteDb((prev) => {
        const memberId = memberRef.current?.id
        if (!prev || !memberId) return prev
        return {
          ...prev,
          members: prev.members.map((m) => (m.id === memberId ? { ...m, notifications } : m)),
        }
      })
      return
    }
    // Staff
    setRemoteDb((prev) => {
      if (!prev) return prev
      const staffUser = getCurrentStaff(prev)
      if (!staffUser?.id) return prev
      const next = {
        ...prev,
        staff: prev.staff.map((s) => (s.id === staffUser.id ? { ...s, notifications } : s)),
      }
      remoteDbRef.current = next
      return next
    })
  }, [])

  const flushNotificationReads = useCallback(async () => {
    if (notificationFlushTimerRef.current) {
      clearTimeout(notificationFlushTimerRef.current)
      notificationFlushTimerRef.current = null
    }
    if (!notificationsDirtyRef.current) return

    const member = memberRef.current
    if (member) {
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
      return
    }

    const staffUser = getCurrentStaff(remoteDbRef.current || EMPTY_DB)
    if (!staffUser?.id) return
    const latest = remoteDbRef.current?.staff?.find((s) => s.id === staffUser.id)
    const notifications = latest?.notifications ?? staffUser.notifications ?? []
    notificationsDirtyRef.current = false

    const persist = persistStaffNotifications(notifications).then((r) => {
      if (!r.success) notificationsDirtyRef.current = true
    }).catch(() => {
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

  const login = useCallback(async (email, password, remember = false, turnstileToken = '') => {
    const r = await sb.login(email, password, remember, turnstileToken)
    if (!r.success) return { success: false, error: r.error, isAdmin: false }
    /* SIGNED_IN hydrate ile birleş / kısa cache — rol hydrate session’dan */
    const d = await reloadRemote({ force: false })
    const role = d?.session?.type || r.role || 'member'
    return { success: true, role, isAdmin: role === 'admin' }
  }, [reloadRemote])

  const logout = useCallback(async () => {
    setLoggingOut(true)
    try {
      /* Bildirim flush çıkışı bloklamaz — arka planda */
      void flushNotificationReads()
      clearIncomingChatSoundState()
      clearNotificationAlertState()
      markIntentionalLogout()
      await sb.logout()
      /* Anında oturumu düşür — SIGNED_OUT hydrate arka planda public veriyi yeniler */
      setRemoteDb((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          session: null,
          authUser: null,
          members: [],
          programs: [],
          tickets: [],
          activities: [],
          payments: [],
          staffApplications: [],
          corporateApplications: [],
          contactInquiries: [],
        }
      })
    } finally {
      setLoggingOut(false)
    }
  }, [flushNotificationReads])

  const patchMemberInDb = useCallback((member) => {
    if (!member?.id) return
    setRemoteDb((prev) => {
      if (!prev) return prev
      const idx = prev.members.findIndex((m) => m.id === member.id)
      const members = idx >= 0
        ? prev.members.map((m, i) => (i === idx ? member : m))
        : [member, ...prev.members]
      return { ...prev, members }
    })
  }, [])

  const patchStaffInDb = useCallback((staffRow) => {
    if (!staffRow?.id) return
    setRemoteDb((prev) => {
      if (!prev) return prev
      const idx = prev.staff.findIndex((s) => s.id === staffRow.id)
      const staff = idx >= 0
        ? prev.staff.map((s, i) => (i === idx ? { ...s, ...staffRow } : s))
        : [...prev.staff, staffRow]
      return { ...prev, staff }
    })
  }, [])

  const contentListKey = (kind) => ({
    testimonial: 'testimonials',
    faq: 'faqs',
    success_story: 'successStories',
  }[kind] || null)

  const register = useCallback(async (profile, membership, packageConfig) => {
    const r = await sb.register(profile, membership, packageConfig)
    if (r.success) {
      if (r.member) patchMemberInDb(r.member)
      void reloadRemote({ force: false })
    }
    return r
  }, [reloadRemote, patchMemberInDb])

  const registerWithPayment = useCallback(async (profile, packageConfig) => {
    const r = await sb.registerWithPayment(profile, packageConfig)
    if (r.success) void reloadRemote({ force: false })
    return r
  }, [reloadRemote])

  const registerWithPlan = useCallback(async (profile, planId, planPrice, durationMonths = 1) => {
    const r = await sb.registerWithPlan(profile, planId, planPrice, durationMonths)
    if (r.success) {
      if (r.member) patchMemberInDb(r.member)
      void reloadRemote({ force: false })
    }
    return r
  }, [reloadRemote, patchMemberInDb])

  const completeOAuthMember = useCallback(async (profile, membership, packageConfig, opts = {}) => {
    const r = await sb.completeOAuthMember(profile, membership, packageConfig, opts)
    if (r.success) {
      if (r.member) patchMemberInDb(r.member)
      void reloadRemote({ force: false })
    }
    return r
  }, [reloadRemote, patchMemberInDb])

  const savePlan = useCallback(async (plan) => {
    const saved = await sb.upsertPlan(plan)
    setRemoteDb((prev) => {
      if (!prev || !saved) return prev
      const idx = (prev.plans || []).findIndex((p) => p.id === saved.id)
      const plans = idx >= 0
        ? prev.plans.map((p, i) => (i === idx ? saved : p))
        : [...(prev.plans || []), saved]
      return { ...prev, plans }
    })
  }, [])

  const createPlan = useCallback(async (plan) => {
    const saved = await sb.upsertPlan({ ...plan, isActive: plan.isActive !== false })
    setRemoteDb((prev) => {
      if (!prev || !saved) return prev
      const idx = (prev.plans || []).findIndex((p) => p.id === saved.id)
      const plans = idx >= 0
        ? prev.plans.map((p, i) => (i === idx ? saved : p))
        : [...(prev.plans || []), saved]
      return { ...prev, plans }
    })
  }, [])

  const deletePlan = useCallback(async (planId, opts = {}) => {
    const result = await sb.deletePlan(planId, opts)
    setRemoteDb((prev) => {
      if (!prev) return prev
      if (result?.hard) {
        return { ...prev, plans: (prev.plans || []).filter((p) => p.id !== planId) }
      }
      return {
        ...prev,
        plans: (prev.plans || []).map((p) => (
          p.id === planId ? { ...p, isActive: false, isSellable: false } : p
        )),
      }
    })
    return result
  }, [])

  // Mevcut üyenin planını değiştirir (yeni kayıt oluşturmaz)
  const changePlan = useCallback(async (planId, planPrice = 0, durationMonths = 1) => {
    if (!currentMember) return { success: false, error: 'Oturum bulunamadı' }
    const r = await sb.changeMemberPlan(currentMember, planId, planPrice, durationMonths)
    if (r.success && r.member) patchMemberInDb(r.member)
    return r
  }, [currentMember, patchMemberInDb])

  const processPremiumPayment = useCallback(async (packageConfig, schedule) => {
    if (!currentMember) return { success: false, error: 'Oturum bulunamadı' }
    const r = await sb.processPremiumPayment(currentMember, packageConfig, schedule)
    return r
  }, [currentMember])

  const upgradeToPremium = useCallback(async (packageConfig, schedule) => {
    if (!currentMember) return
    const r = await sb.processPremiumPayment(currentMember, packageConfig, schedule)
    return r.pricing
  }, [currentMember])

  const savePackage = useCallback(async (config) => {
    if (!currentMember) return
    await patchCurrentRemote({ packageConfig: config })
  }, [currentMember, patchCurrentRemote])

  const saveSupportSchedule = useCallback(async (schedule) => {
    if (!currentMember) return
    const updated = await sb.saveSupportSchedule(currentMember, schedule)
    if (updated) patchMemberInDb(updated)
  }, [currentMember, patchMemberInDb])

  const adminPatchMember = useCallback(async (memberId, patch) => {
    const member = (remoteDbRef.current?.members || []).find((m) => m.id === memberId)
    if (!member) return
    const updated = await sb.saveMemberPatch(member, patch)
    if (updated) patchMemberInDb(updated)
  }, [patchMemberInDb])

  const staffPatchMember = useCallback(async (memberId, patch) => {
    const member = (remoteDbRef.current?.members || []).find((m) => m.id === memberId)
    if (!member) return
    const updated = await sb.saveMemberPatch(member, patch)
    if (updated) patchMemberInDb(updated)
  }, [patchMemberInDb])

  const adminUpdatePremium = useCallback(async (memberId, options) => {
    const r = await sb.adminUpdatePremiumMembership(memberId, options)
    if (!r.success) return r
    if (r.member) patchMemberInDb(r.member)
    return r
  }, [patchMemberInDb])

  const adminSetMembershipStatus = useCallback(async (memberId, options) => {
    const r = await sb.adminSetMembershipStatus(memberId, options)
    if (r.success && r.member) patchMemberInDb(r.member)
    return r
  }, [patchMemberInDb])

  const addStaff = useCallback(async (data) => {
    const r = await sb.addStaff(data)
    if (r.success && r.staff) patchStaffInDb(r.staff)
    return r
  }, [patchStaffInDb])

  const editStaff = useCallback(async (id, patch) => {
    const r = await sb.editStaff(id, patch)
    if (r.success && r.staff) patchStaffInDb(r.staff)
    return r
  }, [patchStaffInDb])

  const updateStaffProfile = useCallback(async (id, patch) => {
    const r = await sb.updateStaffSelfProfile(id, patch)
    if (r.success && r.staff) patchStaffInDb(r.staff)
    return r
  }, [patchStaffInDb])

  const removeStaff = useCallback(async (id) => {
    await sb.removeStaff(id)
    setRemoteDb((prev) => {
      if (!prev) return prev
      return { ...prev, staff: (prev.staff || []).filter((s) => s.id !== id) }
    })
  }, [])

  const removeMember = useCallback(async (id) => {
    await sb.removeMember(id)
    setRemoteDb((prev) => {
      if (!prev) return prev
      return { ...prev, members: (prev.members || []).filter((m) => m.id !== id) }
    })
  }, [])

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

  const deleteProgram = useCallback(async (id) => {
    const result = await sb.deleteProgram(id)
    if (result?.success) {
      setRemoteDb((prev) => {
        if (!prev) return prev
        return { ...prev, programs: (prev.programs || []).filter((p) => p.id !== id) }
      })
    }
    return result
  }, [])

  const updateProgram = useCallback(async (id, patch) => {
    const p = await sb.updateProgram(id, patch)
    if (p) {
      setRemoteDb((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          programs: (prev.programs || []).map((x) => (x.id === id ? p : x)),
        }
      })
    } else {
      await reloadRemote()
    }
    return p
  }, [reloadRemote])

  const addPost = useCallback(async (data) => {
    const p = await sb.addPost(data)
    if (p) {
      setRemoteDb((prev) => (prev ? { ...prev, posts: [p, ...(prev.posts || [])] } : prev))
    }
    return p
  }, [])

  const editPost = useCallback(async (id, patch) => {
    const p = await sb.editPost(id, patch)
    if (p) {
      setRemoteDb((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          posts: (prev.posts || []).map((x) => (x.id === id ? p : x)),
        }
      })
    }
  }, [])

  const removePost = useCallback(async (id) => {
    await sb.removePost(id)
    setRemoteDb((prev) => {
      if (!prev) return prev
      return { ...prev, posts: (prev.posts || []).filter((p) => p.id !== id) }
    })
  }, [])

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
    if (r.success) {
      setRemoteDb((prev) => {
        if (!prev) return prev
        const exercises = r.exercise
          ? [r.exercise, ...(prev.exercises || [])]
          : prev.exercises
        return {
          ...prev,
          exercises,
          exerciseCount: (prev.exerciseCount || 0) + 1,
        }
      })
    }
    return r
  }, [])

  const editExercise = useCallback(async (id, patch) => {
    const r = await sb.editExercise(id, patch)
    if (r.success && r.exercise) {
      setRemoteDb((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          exercises: (prev.exercises || []).map((x) => (x.id === id ? r.exercise : x)),
        }
      })
    }
    return r
  }, [])

  const removeExercise = useCallback(async (id) => {
    const r = await sb.removeExercise(id)
    if (r?.success !== false) {
      setRemoteDb((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          exercises: (prev.exercises || []).filter((x) => x.id !== id),
          exerciseCount: Math.max(0, (prev.exerciseCount || 0) - 1),
        }
      })
    }
  }, [])

  const reassignExerciseCategory = useCallback(async (fromCategory, toCategory) => {
    const r = await sb.reassignExerciseCategory(fromCategory, toCategory)
    if (r.success) {
      setRemoteDb((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          exercises: (prev.exercises || []).map((x) => (
            x.category === fromCategory || x.bodyPart === fromCategory
              ? { ...x, category: toCategory, bodyPart: toCategory }
              : x
          )),
        }
      })
    }
    return r
  }, [])

  const resolveStaffApplication = useCallback(async (application, approve, adminNote = '') => {
    const r = await sb.resolveStaffApplication(application, approve, adminNote)
    if (r.success) {
      setRemoteDb((prev) => {
        if (!prev) return prev
        const staffApplications = (prev.staffApplications || []).map((a) => (
          a.id === application.id ? (r.application || { ...a, status: approve ? 'approved' : 'rejected' }) : a
        ))
        let staff = prev.staff || []
        if (r.staff) {
          const idx = staff.findIndex((s) => s.id === r.staff.id)
          staff = idx >= 0
            ? staff.map((s, i) => (i === idx ? r.staff : s))
            : [...staff, r.staff]
        }
        return { ...prev, staffApplications, staff }
      })
    }
    return r
  }, [])

  const resolveCorporateApplication = useCallback(async (application, status, adminNote = '') => {
    const r = await sb.resolveCorporateApplication(application, status, adminNote)
    if (r.success) {
      setRemoteDb((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          corporateApplications: (prev.corporateApplications || []).map((a) => (
            a.id === application.id ? (r.application || { ...a, status }) : a
          )),
        }
      })
    }
    return r
  }, [])

  const updateContactInquiryStatus = useCallback(async (inquiry, status) => {
    const r = await sb.updateContactInquiryStatus(inquiry, status)
    if (r.success) {
      setRemoteDb((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          contactInquiries: (prev.contactInquiries || []).map((a) => (
            a.id === inquiry.id ? (r.inquiry || { ...a, status }) : a
          )),
        }
      })
    }
    return r
  }, [])

  const addContent = useCallback(async (kind, data) => {
    const r = await sb.addContent(kind, data)
    if (r.success && r.item) {
      const listKey = contentListKey(kind)
      setRemoteDb((prev) => {
        if (!prev) return prev
        const content = { ...(prev.content || {}) }
        if (listKey) {
          content[listKey] = [r.item, ...(content[listKey] || [])]
        }
        return { ...prev, content }
      })
    }
    return r
  }, [])

  const editContent = useCallback(async (id, data) => {
    const r = await sb.editContent(id, data)
    if (r.success && r.item) {
      const listKey = contentListKey(r.kind)
      setRemoteDb((prev) => {
        if (!prev) return prev
        const content = { ...(prev.content || {}) }
        if (listKey) {
          content[listKey] = (content[listKey] || []).map((x) => (x.id === id ? r.item : x))
        }
        return { ...prev, content }
      })
    }
    return r
  }, [])

  const removeContent = useCallback(async (id) => {
    const r = await sb.removeContent(id)
    if (r?.success !== false) {
      setRemoteDb((prev) => {
        if (!prev) return prev
        const content = { ...(prev.content || {}) }
        ;['testimonials', 'faqs', 'successStories'].forEach((key) => {
          content[key] = (content[key] || []).filter((x) => x.id !== id)
        })
        if (content.exerciseTaxonomy?.id === id) content.exerciseTaxonomy = null
        return { ...prev, content }
      })
    }
  }, [])

  const saveExerciseTaxonomy = useCallback(async (taxonomy) => {
    const r = await sb.upsertExerciseTaxonomy(taxonomy)
    if (r.success && r.taxonomy) {
      setRemoteDb((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          content: { ...(prev.content || {}), exerciseTaxonomy: r.taxonomy },
        }
      })
    }
    return r
  }, [])

  const submitSuccessStory = useCallback(async (data) => {
    const r = await sb.submitSuccessStory(currentMember, data)
    if (r.success && r.item) {
      setRemoteDb((prev) => {
        if (!prev) return prev
        const content = { ...(prev.content || {}) }
        content.successStories = [r.item, ...(content.successStories || [])]
        return { ...prev, content }
      })
    }
    return r
  }, [currentMember])

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
    if (member) {
      const prev = member.notifications || []
      if (prev.find((n) => n.id === id)?.read) return
      const notifications = prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      applyNotificationsOptimistic(notifications)
      scheduleNotificationFlush()
      return
    }
    const staffUser = getCurrentStaff(remoteDbRef.current || EMPTY_DB)
    if (!staffUser?.id) return
    const prev = staffUser.notifications || []
    if (prev.find((n) => n.id === id)?.read) return
    const notifications = prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    applyNotificationsOptimistic(notifications)
    scheduleNotificationFlush()
  }, [applyNotificationsOptimistic, scheduleNotificationFlush])

  const markAllNotificationsRead = useCallback(() => {
    const member = memberRef.current
    if (member) {
      const prev = member.notifications || []
      if (prev.length > 0 && prev.every((n) => n.read)) return
      const notifications = prev.map((n) => ({ ...n, read: true }))
      applyNotificationsOptimistic(notifications)
      flushNotificationReads()
      return
    }
    const staffUser = getCurrentStaff(remoteDbRef.current || EMPTY_DB)
    if (!staffUser?.id) return
    const prev = staffUser.notifications || []
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
    const prev = (currentMember[key] || []).find((s) => s.id === id)
    const sessions = (currentMember[key] || []).map((s) => (s.id === id ? { ...s, date: newDate, status: 'rescheduled' } : s))
    await patchCurrentRemote({ [key]: sessions })
    if (prev) {
      const { notifyWhatsAppEvent } = await import('../services/memberNotifications')
      void notifyWhatsAppEvent('appt_rescheduled', {
        memberId: currentMember.id,
        sessionId: id,
        sessionType: type,
        oldStartsAt: prev.date,
        newStartsAt: newDate,
        actor: 'member',
      })
    }
  }, [currentMember, patchCurrentRemote])

  const cancelSession = useCallback(async (id, type) => {
    if (!currentMember) return
    const key = sessionKey(type)
    const prev = (currentMember[key] || []).find((s) => s.id === id)
    const sessions = (currentMember[key] || []).map((s) => (s.id === id ? { ...s, status: 'cancelled' } : s))
    await patchCurrentRemote({ [key]: sessions })
    if (prev) {
      const { notifyWhatsAppEvent } = await import('../services/memberNotifications')
      void notifyWhatsAppEvent('appt_cancelled', {
        memberId: currentMember.id,
        sessionId: id,
        sessionType: type,
        startsAt: prev.date,
        actor: 'member',
      })
    }
  }, [currentMember, patchCurrentRemote])

  // Self-servis randevu: personel müsaitliğinden çakışmasız talep (pending)
  const bookSession = useCallback(async (type, dateISO, duration) => {
    const r = await sb.bookStaffSession(type, dateISO, duration)
    if (r.success && r.session && currentMember) {
      const key = sessionKey(type)
      const nextSessions = [...(currentMember[key] || []), r.session]
      patchMemberInDb({ ...currentMember, [key]: nextSessions })
    } else if (r.success) {
      void reloadRemote({ force: false })
    }
    return r
  }, [currentMember, patchMemberInDb, reloadRemote])

  const respondSession = useCallback(async ({ memberId, sessionId, sessionType, decision }) => {
    const r = await sb.respondStaffSession({ memberId, sessionId, sessionType, decision })
    if (r.success && r.session) {
      const key = sessionKey(sessionType)
      setRemoteDb((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          members: (prev.members || []).map((m) => {
            if (m.id !== memberId) return m
            const sessions = (m[key] || []).map((s) => (s.id === sessionId ? { ...s, ...r.session } : s))
            return { ...m, [key]: sessions }
          }),
        }
      })
    } else if (r.success) {
      void reloadRemote({ force: false })
    }
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
    await patchCurrentRemote(profile, { throwOnError: true })
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
    return (db.programs || []).filter((p) => {
      if (p.memberId !== memberId) return false
      return isProgramListedForMember(p, currentMember)
    })
  }, [currentMember, db.programs])

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

  // Paketsiz üye — soft-lock (sayfa gezinilir, ücretli aksiyonlar kilitli).
  const isUnpaidMember = useMemo(
    () => !isPaidMembership(currentMember?.membership || 'free'),
    [currentMember?.membership],
  )

  const isFreeTrialActive = false
  const isFreeTrialExpired = false
  const canAccessMemberDashboard = true

  const authValue = useMemo(() => ({
    mode: 'supabase',
    loading,
    isAuthenticated,
    isAdmin,
    isStaff,
    staffUser: currentStaff || {},
    user,
    authUser,
    membership: currentMember?.membership || 'free',
    membershipStatus: currentMember?.membershipStatus || 'active',
    packageConfig: currentMember?.packageConfig,
    premiumExpiresAt: currentMember?.premiumExpiresAt,
    premiumStartedAt: currentMember?.premiumStartedAt,
    freeTrialExpiresAt: currentMember?.freeTrialExpiresAt || null,
    isUnpaidMember,
    isFreeTrialActive,
    isFreeTrialExpired,
    canAccessMemberDashboard,
    verificationStatus,
    loggingOut,
    // Kabuk rozetleri — Data listelerinden bağımsız; sohbet gövdesi değişince Auth sabit kalır
    chatUnreadCount,
    notificationUnreadCount,
    openSupportTicketsCount,
  }), [
    loading,
    isAuthenticated,
    isAdmin,
    isStaff,
    currentStaff,
    user,
    authUser,
    currentMember?.membership,
    currentMember?.membershipStatus,
    currentMember?.packageConfig,
    currentMember?.premiumExpiresAt,
    currentMember?.premiumStartedAt,
    currentMember?.freeTrialExpiresAt,
    isUnpaidMember,
    isFreeTrialActive,
    isFreeTrialExpired,
    canAccessMemberDashboard,
    verificationStatus,
    loggingOut,
    chatUnreadCount,
    notificationUnreadCount,
    openSupportTicketsCount,
  ])

  const dataValue = useMemo(() => ({
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
    supportSchedule: currentMember?.supportSchedule || null,
    coachSessions: currentMember?.coachSessions || [],
    dietitianSessions: currentMember?.dietitianSessions || [],
    doctorSessions: currentMember?.doctorSessions || [],
    notifications: isStaff
      ? (currentStaff?.notifications || [])
      : (currentMember?.notifications || []),
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
    staffCollabThreads: sortedStaffCollabThreads,
    staffCollabMessages,
    staffCollabUnreadCount,
    tasks: currentMember?.tasks || [],
    progress: currentMember?.progress || { weight: [], workouts: [], meals: [], mood: [] },
    settings: currentMember?.settings || {},
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
  }), [
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
    currentMember?.supportSchedule,
    currentMember?.coachSessions,
    currentMember?.dietitianSessions,
    currentMember?.doctorSessions,
    currentMember?.notifications,
    isStaff,
    currentStaff?.notifications,
    currentMember?.tasks,
    currentMember?.progress,
    currentMember?.settings,
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
    platform,
    adminStats,
    onboardingFunnel,
    membershipBreakdown,
    monthlyGrowth,
    sessionStats,
    activeUsers,
  ])

  const actionsValue = useMemo(() => ({
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
    register,
    completeOAuthMember,
    registerWithPayment,
    registerWithPlan,
    savePlan,
    createPlan,
    deletePlan,
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
    deleteProgram,
    updateProgram,
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
    respondSession,
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
    refresh: reloadRemote,
    reloadRemote,
  }), [
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
    register,
    completeOAuthMember,
    registerWithPayment,
    registerWithPlan,
    savePlan,
    createPlan,
    deletePlan,
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
    deleteProgram,
    updateProgram,
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
    respondSession,
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
    <AuthContext.Provider value={authValue}>
      <DataContext.Provider value={dataValue}>
        <ActionsContext.Provider value={actionsValue}>
          {loading && !hydratePassThrough ? (
            <LoadingScreen />
          ) : (
            children
          )}
        </ActionsContext.Provider>
      </DataContext.Provider>
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AppProvider')
  return ctx
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within AppProvider')
  return ctx
}

export function useActions() {
  const ctx = useContext(ActionsContext)
  if (!ctx) throw new Error('useActions must be used within AppProvider')
  return ctx
}

export function useApp() {
  const auth = useAuth()
  const data = useData()
  const actions = useActions()
  return useMemo(() => ({ ...auth, ...data, ...actions }), [auth, data, actions])
}
