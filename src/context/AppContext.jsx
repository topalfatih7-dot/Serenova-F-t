import { createContext, useContext, useCallback, useState, useMemo, useEffect } from 'react'
import LoadingScreen from '../components/ui/LoadingScreen'
import ConfigErrorScreen from '../components/ui/ConfigErrorScreen'
import { isSupabaseEnabled } from '../services/supabaseClient'
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
    await reloadRemote()
    return t
  }, [currentMember, reloadRemote])

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

  const submitSuccessStory = useCallback(async (data) => {
    const r = await sb.submitSuccessStory(currentMember, data)
    if (r.success) await reloadRemote()
    return r
  }, [currentMember, reloadRemote])

  const setTicketStatus = useCallback(async (ticketId, status) => {
    await sb.setTicketStatus(ticketId, status)
    await reloadRemote()
  }, [reloadRemote])

  const sendTicketReply = useCallback(async (ticketId, from, text) => {
    const t = await sb.sendTicketReply(ticketId, from, text)
    await reloadRemote()
    return t
  }, [reloadRemote])

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

  const updateProfile = useCallback(async (profile) => {
    if (!currentMember) return
    await patchCurrentRemote(profile)
  }, [currentMember, patchCurrentRemote])

  const updateSettings = useCallback(async (settings) => {
    if (!currentMember) return
    await patchCurrentRemote({ settings: { ...currentMember.settings, ...settings } })
  }, [currentMember, patchCurrentRemote])

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
    progress: currentMember?.progress || { weight: [], workouts: [], mood: [] },
    settings: currentMember?.settings || {},
    pauseUntil: currentMember?.pauseUntil,
    premiumExpiresAt: currentMember?.premiumExpiresAt,
    premiumStartedAt: currentMember?.premiumStartedAt,
    testimonials: db.content?.testimonials || [],
    faqs: db.content?.faqs || [],
    successStories: db.content?.successStories || [],
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
    login,
    logout,
    register,
    registerWithPayment,
    registerWithPlan,
    savePlan,
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
    addContent,
    editContent,
    removeContent,
    submitSuccessStory,
    markNotificationRead,
    markAllNotificationsRead,
    rescheduleSession,
    cancelSession,
    toggleTask,
    updateProfile,
    updateSettings,
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
