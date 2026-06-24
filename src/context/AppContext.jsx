import { createContext, useContext, useCallback, useState, useMemo, useEffect, useRef } from 'react'
import LoadingScreen from '../components/ui/LoadingScreen'
import ConfigErrorScreen from '../components/ui/ConfigErrorScreen'
import { isSupabaseEnabled, supabase } from '../services/supabaseClient'
import * as sb from '../services/supabaseDb'
import {
  getCurrentMember,
  getCurrentStaff,
  computeAdminStats,
  computeMembershipBreakdown,
  computeMonthlyGrowth,
  getSessionStats,
} from '../services/platformStats'
import { ALL_PLANS } from '../data/membershipPlans'
import { startPresenceTracker } from '../services/presenceService'
import { subscribeRealtimeSync, useActiveUsers } from '../hooks/useRealtimeSync'
import { completionKey, mealCompletionKey } from '../utils/programSchedule'
import { buildProgressPatch } from '../utils/memberProgress'
import * as authVerification from '../services/authVerification'

const AppContext = createContext(null)

const EMPTY_DB = {
  version: 2, members: [], staff: [], programs: [], posts: [],
  tickets: [], activities: [], payments: [], exercises: [], plans: ALL_PLANS, requests: [], session: null,
  content: { testimonials: [], faqs: [], successStories: [] },
}

export function AppProvider({ children }) {
  const [remoteDb, setRemoteDb] = useState(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

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
      setLoading(false)
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
    const unsub = sb.onAuthChange(async (event) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        const d = await sb.hydrate()
        if (active) setRemoteDb(d)
      }
    })
    return () => { active = false; unsub?.() }
  }, [])

  const db = remoteDb || EMPTY_DB
  const currentMember = useMemo(() => getCurrentMember(db), [db])
  const currentStaff = useMemo(() => getCurrentStaff(db), [db])
  const isAdmin = db.session?.type === 'admin'
  const isStaff = db.session?.type === 'staff'
  const isAuthenticated = !!db.session

  const adminStats = useMemo(() => computeAdminStats(db), [db])
  const membershipBreakdown = useMemo(() => computeMembershipBreakdown(db), [db])
  const monthlyGrowth = useMemo(() => computeMonthlyGrowth(db), [db])
  const sessionStats = useMemo(() => getSessionStats(db), [db])
  const remoteDbRef = useRef(remoteDb)
  remoteDbRef.current = remoteDb

  useEffect(() => {
    if (!isSupabaseEnabled || !isAuthenticated) return undefined

    return startPresenceTracker({
      resolvePresenceInfo: async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null
        const dbNow = remoteDbRef.current
        const s = dbNow?.session
        let name = user.user_metadata?.name || user.email
        if (s?.type === 'member') {
          const m = dbNow?.members?.find((x) => x.id === user.id)
          if (m?.name) name = m.name
        } else if (s?.type === 'staff') {
          const st = dbNow?.staff?.find((x) => x.id === s.staffId)
          if (st?.name) name = st.name
        }
        return { userId: user.id, email: user.email, name, role: s?.type || 'member' }
      },
      getPagePath: () => window.location.pathname,
    })
  }, [isAuthenticated])

  useEffect(() => {
    if (!isSupabaseEnabled || !remoteDb?.session) return undefined

    return subscribeRealtimeSync({
      session: remoteDb.session,
      memberId: currentMember?.id,
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
          return { ...prev, members: prev.members.map((m) => (m.id === member.id ? member : m)) }
        })
      },
    })
  }, [isSupabaseEnabled, remoteDb?.session, currentMember?.id])

  const { activeUsers } = useActiveUsers(isAdmin)

  const patchCurrentRemote = useCallback(async (patch) => {
    if (!currentMember) return
    await sb.saveMemberPatch(currentMember, patch)
    await reloadRemote()
  }, [currentMember, reloadRemote])

  const login = useCallback(async (email, password, remember = false) => {
    const r = await sb.login(email, password, remember)
    if (!r.success) return { success: false, error: r.error, isAdmin: false }
    await reloadRemote()
    return { success: true, role: r.role, isAdmin: r.role === 'admin' }
  }, [reloadRemote])

  const logout = useCallback(async () => {
    await sb.logout()
    await reloadRemote()
  }, [reloadRemote])

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

  const registerWithPlan = useCallback(async (profile, planId, planPrice) => {
    const r = await sb.registerWithPlan(profile, planId, planPrice)
    if (r.success) await reloadRemote()
    return r
  }, [reloadRemote])

  const savePlan = useCallback(async (plan) => {
    await sb.upsertPlan(plan)
    await reloadRemote()
  }, [reloadRemote])

  // Mevcut üyenin planını değiştirir (yeni kayıt oluşturmaz)
  const changePlan = useCallback(async (planId, planPrice = 0) => {
    if (!currentMember) return { success: false, error: 'Oturum bulunamadı' }
    const r = await sb.changeMemberPlan(currentMember, planId, planPrice)
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

  const pauseMembership = useCallback(async (until) => {
    if (!currentMember) return
    await patchCurrentRemote({ membershipStatus: 'paused', pauseUntil: until })
  }, [currentMember, patchCurrentRemote])

  const resumeMembership = useCallback(async () => {
    if (!currentMember) return
    await patchCurrentRemote({ membershipStatus: 'active', pauseUntil: null })
  }, [currentMember, patchCurrentRemote])

  const cancelMembership = useCallback(async () => {
    if (!currentMember) return
    await patchCurrentRemote({ membershipStatus: 'cancelled' })
  }, [currentMember, patchCurrentRemote])

  const renewMembership = useCallback(async () => {
    if (!currentMember) return
    await patchCurrentRemote({ membershipStatus: 'active' })
  }, [currentMember, patchCurrentRemote])

  const adminPatchMember = useCallback(async (memberId, patch) => {
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

  const removeStaff = useCallback(async (id) => {
    await sb.removeStaff(id)
    await reloadRemote()
  }, [reloadRemote])

  const createProgram = useCallback(async (data) => {
    const p = await sb.createProgram(data)
    await reloadRemote()
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

  const createMembershipRequest = useCallback(async (type, requestedUntil = null, note = '') => {
    if (!currentMember) return { success: false, error: 'Giriş gerekli' }
    const r = await sb.createMembershipRequest(currentMember, type, requestedUntil, note)
    if (r.success) await reloadRemote()
    return r
  }, [currentMember, reloadRemote])

  const resolveMembershipRequest = useCallback(async (request, approve) => {
    const r = await sb.resolveMembershipRequest(request, approve)
    await reloadRemote()
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
    if (t) {
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

  const markNotificationRead = useCallback(async (id) => {
    if (!currentMember) return
    const notifications = (currentMember.notifications || []).map((n) => (n.id === id ? { ...n, read: true } : n))
    await patchCurrentRemote({ notifications })
  }, [currentMember, patchCurrentRemote])

  const markAllNotificationsRead = useCallback(async () => {
    if (!currentMember) return
    const notifications = (currentMember.notifications || []).map((n) => ({ ...n, read: true }))
    await patchCurrentRemote({ notifications })
  }, [currentMember, patchCurrentRemote])

  const rescheduleSession = useCallback(async (id, type, newDate) => {
    if (!currentMember) return
    const key = type === 'coach' ? 'coachSessions' : 'dietitianSessions'
    const sessions = (currentMember[key] || []).map((s) => (s.id === id ? { ...s, date: newDate, status: 'rescheduled' } : s))
    await patchCurrentRemote({ [key]: sessions })
  }, [currentMember, patchCurrentRemote])

  const cancelSession = useCallback(async (id, type) => {
    if (!currentMember) return
    const key = type === 'coach' ? 'coachSessions' : 'dietitianSessions'
    const sessions = (currentMember[key] || []).map((s) => (s.id === id ? { ...s, status: 'cancelled' } : s))
    await patchCurrentRemote({ [key]: sessions })
  }, [currentMember, patchCurrentRemote])

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
    const progressPatch = buildProgressPatch(myProgs, completedActivities, currentMember.progress)
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
    const progressPatch = buildProgressPatch(myProgs, completedActivities, currentMember.progress)
    await patchCurrentRemote({ completedActivities, ...progressPatch })
  }, [currentMember, remoteDb?.programs, patchCurrentRemote])

  const updateProfile = useCallback(async (profile) => {
    if (!currentMember) return
    await patchCurrentRemote(profile)
  }, [currentMember, patchCurrentRemote])

  const updateSettings = useCallback(async (settings) => {
    if (!currentMember) return
    await patchCurrentRemote({ settings: { ...currentMember.settings, ...settings } })
  }, [currentMember, patchCurrentRemote])

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

  const value = {
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
    myPrograms: currentMember ? (db.programs || []).filter((p) => p.memberId === currentMember.id) : [],
    myTickets: currentMember ? (db.tickets || []).filter((t) => t.memberId === currentMember.id) : [],
    exercises: db.exercises || [],
    plans: db.plans || ALL_PLANS,
    membershipRequests: db.requests || [],
    staffApplications: db.staffApplications || [],
    corporateApplications: db.corporateApplications || [],
    contactInquiries: db.contactInquiries || [],
    myRequests: currentMember ? (db.requests || []).filter((r) => r.memberId === currentMember.id) : [],
    user: currentMember || {},
    membership: currentMember?.membership || 'free',
    membershipStatus: currentMember?.membershipStatus || 'active',
    packageConfig: currentMember?.packageConfig,
    supportSchedule: currentMember?.supportSchedule || null,
    coachSessions: currentMember?.coachSessions || [],
    dietitianSessions: currentMember?.dietitianSessions || [],
    notifications: currentMember?.notifications || [],
    tasks: currentMember?.tasks || [],
    progress: currentMember?.progress || { weight: [], workouts: [], meals: [], mood: [] },
    settings: currentMember?.settings || {},
    pauseUntil: currentMember?.pauseUntil,
    premiumExpiresAt: currentMember?.premiumExpiresAt,
    premiumStartedAt: currentMember?.premiumStartedAt,
    freeTrialExpiresAt: currentMember?.freeTrialExpiresAt || null,
    isFreeTrialExpired: currentMember?.membership === 'free' && currentMember?.freeTrialExpiresAt
      ? new Date() > new Date(currentMember.freeTrialExpiresAt)
      : false,
    testimonials: db.content?.testimonials || [],
    faqs: db.content?.faqs || [],
    successStories: db.content?.successStories || [],
    exerciseTaxonomy: db.content?.exerciseTaxonomy || null,
    platform: {
      members: db.members,
      staff: db.staff || [],
      programs: db.programs || [],
      tickets: db.tickets,
      activities: db.activities,
      payments: db.payments,
    },
    adminStats,
    membershipBreakdown,
    monthlyGrowth,
    sessionStats,
    activeUsers,
    login,
    logout,
    register,
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
    removeStaff,
    adminPatchMember,
    adminUpdatePremium,
    createProgram,
    addPost,
    editPost,
    removePost,
    pauseMembership,
    resumeMembership,
    cancelMembership,
    renewMembership,
    createTicket,
    setTicketStatus,
    sendTicketReply,
    uploadExerciseVideo,
    addExercise,
    editExercise,
    removeExercise,
    createMembershipRequest,
    resolveMembershipRequest,
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
    rescheduleSession,
    cancelSession,
    toggleTask,
    toggleActivityCompletion,
    toggleMealCompletion,
    updateProfile,
    updateSettings,
    verificationStatus,
    sendEmailVerification,
    confirmEmailVerification,
    sendPhoneVerification,
    confirmPhoneVerification,
    refreshVerification,
    refresh: reloadRemote,
  }

  if (!isSupabaseEnabled) {
    return <ConfigErrorScreen />
  }

  return (
    <AppContext.Provider value={value}>
      {loading ? (
        <LoadingScreen message="Veriler hazırlanıyor…" />
      ) : (
        <>
          {children}
          {syncing && <LoadingScreen message="İşleniyor…" overlay />}
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
