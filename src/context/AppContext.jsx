import { createContext, useContext, useCallback, useState, useMemo, useEffect } from 'react'
import { ADMIN_CREDENTIALS } from '../config/brand'
import LoadingScreen from '../components/ui/LoadingScreen'
import { calculatePackagePrice } from '../services/packagePricing'
import { isSupabaseEnabled } from '../services/supabaseClient'
import * as sb from '../services/supabaseDb'
import {
  loadDb,
  initSession,
  registerMember,
  registerPremiumWithPayment,
  loginMember,
  loginAdmin,
  loginStaff,
  logout as dbLogout,
  getCurrentMember,
  getCurrentStaff,
  updateMember,
  upgradeMemberPremium,
  updateSupportSchedule as dbUpdateSupportSchedule,
  registerStaff as dbRegisterStaff,
  updateStaff as dbUpdateStaff,
  deleteStaff as dbDeleteStaff,
  createProgram as dbCreateProgram,
  createPost as dbCreatePost,
  updatePost as dbUpdatePost,
  deletePost as dbDeletePost,
  submitTicket,
  updateTicketStatus,
  replyTicket as dbReplyTicket,
  pauseMember,
  cancelMember,
  renewMember,
  resumeMember,
  addExercise as dbAddExercise,
  updateExercise as dbUpdateExercise,
  deleteExercise as dbDeleteExercise,
  createMembershipRequest as dbCreateRequest,
  resolveMembershipRequest as dbResolveRequest,
  addContent as dbAddContent,
  updateContent as dbUpdateContent,
  deleteContent as dbDeleteContent,
  submitSuccessStory as dbSubmitStory,
  computeAdminStats,
  computeMembershipBreakdown,
  computeMonthlyGrowth,
  getSessionStats,
} from '../services/localDb'

const AppContext = createContext(null)

const EMPTY_DB = {
  version: 2, members: [], staff: [], programs: [], posts: [],
  tickets: [], activities: [], payments: [], exercises: [], requests: [], session: null,
  content: { testimonials: [], faqs: [], successStories: [] },
}

const SUPABASE = isSupabaseEnabled

export function AppProvider({ children }) {
  // --- Yerel mod state ---
  const [tick, setTick] = useState(0)
  const localRefresh = useCallback(() => setTick((t) => t + 1), [])

  // --- Supabase mod state ---
  const [remoteDb, setRemoteDb] = useState(null)
  const [loading, setLoading] = useState(SUPABASE)
  const [syncing, setSyncing] = useState(false)

  // Yerel modda oturumu senkron hazırla
  useState(() => {
    if (!SUPABASE) initSession()
    return true
  })

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
    if (!SUPABASE) return
    let active = true
    ;(async () => {
      try {
        const d = await sb.hydrate()
        if (active) setRemoteDb(d)
      } finally {
        if (active) setLoading(false)
      }
    })()
    const unsub = sb.onAuthChange(async () => {
      const d = await sb.hydrate()
      if (active) setRemoteDb(d)
    })
    return () => { active = false; unsub?.() }
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps -- tick yerel mutasyonlardan sonra yeniden okumayı tetikler
  const localDbValue = useMemo(() => (SUPABASE ? EMPTY_DB : loadDb()), [tick])
  const db = SUPABASE ? (remoteDb || EMPTY_DB) : localDbValue

  const currentMember = useMemo(() => getCurrentMember(db), [db])
  const currentStaff = useMemo(() => getCurrentStaff(db), [db])
  const isAdmin = db.session?.type === 'admin'
  const isStaff = db.session?.type === 'staff'
  const isAuthenticated = !!db.session

  const adminStats = useMemo(() => computeAdminStats(db), [db])
  const membershipBreakdown = useMemo(() => computeMembershipBreakdown(db), [db])
  const monthlyGrowth = useMemo(() => computeMonthlyGrowth(db), [db])
  const sessionStats = useMemo(() => getSessionStats(db), [db])

  // Yerel mod yardımcıları
  const syncMember = useCallback((memberId, patch) => {
    const d = loadDb()
    updateMember(d, memberId, patch)
    localRefresh()
  }, [localRefresh])

  // Supabase modunda mevcut üyeyi patch'le
  const patchCurrentRemote = useCallback(async (patch) => {
    if (!currentMember) return
    await sb.saveMemberPatch(currentMember, patch)
    await reloadRemote()
  }, [currentMember, reloadRemote])

  // ---------------------------------------------------------------------
  const login = useCallback(async (email, password, remember = false) => {
    if (SUPABASE) {
      const r = await sb.login(email, password)
      if (!r.success) return { success: false, error: r.error, isAdmin: false }
      await reloadRemote()
      return { success: true, role: r.role, isAdmin: r.role === 'admin' }
    }
    if (
      email.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase() &&
      password === ADMIN_CREDENTIALS.password
    ) {
      const d = loadDb()
      loginAdmin(d, remember)
      localRefresh()
      return { success: true, role: 'admin', isAdmin: true }
    }
    const d = loadDb()
    const memberResult = loginMember(d, email, password, remember)
    if (memberResult.success) {
      localRefresh()
      return { success: true, role: 'member', isAdmin: false }
    }
    const ds = loadDb()
    const staffResult = loginStaff(ds, email, password, remember)
    if (staffResult.success) {
      localRefresh()
      return { success: true, role: 'staff', isAdmin: false }
    }
    return { success: false, error: 'E-posta veya şifre hatalı.', isAdmin: false }
  }, [localRefresh, reloadRemote])

  const logout = useCallback(async () => {
    if (SUPABASE) { await sb.logout(); await reloadRemote(); return }
    const d = loadDb()
    dbLogout(d)
    localRefresh()
  }, [localRefresh, reloadRemote])

  const register = useCallback(async (profile, membership, packageConfig) => {
    if (SUPABASE) {
      const r = await sb.register(profile, membership, packageConfig)
      if (r.success) await reloadRemote()
      return r
    }
    const d = loadDb()
    const result = registerMember(d, profile, membership, packageConfig)
    if (!result.success) return result
    localRefresh()
    return result
  }, [localRefresh, reloadRemote])

  const registerWithPayment = useCallback(async (profile, packageConfig) => {
    if (SUPABASE) {
      const r = await sb.registerWithPayment(profile, packageConfig)
      if (r.success) await reloadRemote()
      return r
    }
    const pricing = calculatePackagePrice(packageConfig)
    const d = loadDb()
    const result = registerPremiumWithPayment(d, profile, packageConfig, pricing.total)
    if (!result.success) return result
    localRefresh()
    return { success: true, member: result.member, pricing }
  }, [localRefresh, reloadRemote])

  const processPremiumPayment = useCallback(async (packageConfig, schedule) => {
    if (!currentMember) return { success: false, error: 'Oturum bulunamadı' }
    if (SUPABASE) {
      const r = await sb.processPremiumPayment(currentMember, packageConfig, schedule)
      await reloadRemote()
      return r
    }
    const pricing = calculatePackagePrice(packageConfig)
    const d = loadDb()
    upgradeMemberPremium(d, currentMember.id, packageConfig, pricing.total, schedule)
    localRefresh()
    return { success: true, pricing }
  }, [currentMember, localRefresh, reloadRemote])

  const upgradeToPremium = useCallback(async (packageConfig, schedule) => {
    if (!currentMember) return
    if (SUPABASE) {
      const r = await sb.processPremiumPayment(currentMember, packageConfig, schedule)
      await reloadRemote()
      return r.pricing
    }
    const pricing = calculatePackagePrice(packageConfig)
    const d = loadDb()
    upgradeMemberPremium(d, currentMember.id, packageConfig, pricing.total, schedule)
    localRefresh()
    return pricing
  }, [currentMember, localRefresh, reloadRemote])

  const savePackage = useCallback(async (config) => {
    if (!currentMember) return
    if (SUPABASE) { await patchCurrentRemote({ packageConfig: config }); return }
    syncMember(currentMember.id, { packageConfig: config })
  }, [currentMember, syncMember, patchCurrentRemote])

  const saveSupportSchedule = useCallback(async (schedule) => {
    if (!currentMember) return
    if (SUPABASE) { await sb.saveSupportSchedule(currentMember, schedule); await reloadRemote(); return }
    const d = loadDb()
    dbUpdateSupportSchedule(d, currentMember.id, schedule)
    localRefresh()
  }, [currentMember, localRefresh, reloadRemote])

  const pauseMembership = useCallback(async (until) => {
    if (!currentMember) return
    if (SUPABASE) { await patchCurrentRemote({ membershipStatus: 'paused', pauseUntil: until }); return }
    const d = loadDb()
    pauseMember(d, currentMember.id, until)
    localRefresh()
  }, [currentMember, localRefresh, patchCurrentRemote])

  const resumeMembership = useCallback(async () => {
    if (!currentMember) return
    if (SUPABASE) { await patchCurrentRemote({ membershipStatus: 'active', pauseUntil: null }); return }
    const d = loadDb()
    resumeMember(d, currentMember.id)
    localRefresh()
  }, [currentMember, localRefresh, patchCurrentRemote])

  const cancelMembership = useCallback(async () => {
    if (!currentMember) return
    if (SUPABASE) { await patchCurrentRemote({ membershipStatus: 'cancelled' }); return }
    const d = loadDb()
    cancelMember(d, currentMember.id)
    localRefresh()
  }, [currentMember, localRefresh, patchCurrentRemote])

  const renewMembership = useCallback(async () => {
    if (!currentMember) return
    if (SUPABASE) { await patchCurrentRemote({ membershipStatus: 'active' }); return }
    const d = loadDb()
    renewMember(d, currentMember.id)
    localRefresh()
  }, [currentMember, localRefresh, patchCurrentRemote])

  // --- Admin: belirli bir üye üzerinde işlem ---
  const adminPatchMember = useCallback(async (memberId, patch) => {
    if (SUPABASE) {
      const member = (remoteDb?.members || []).find((m) => m.id === memberId)
      if (!member) return
      await sb.saveMemberPatch(member, patch)
      await reloadRemote()
      return
    }
    syncMember(memberId, patch)
  }, [remoteDb, syncMember, reloadRemote])

  const addStaff = useCallback(async (data) => {
    if (SUPABASE) { const r = await sb.addStaff(data); if (r.success) await reloadRemote(); return r }
    const d = loadDb()
    const result = dbRegisterStaff(d, data)
    localRefresh()
    return result
  }, [localRefresh, reloadRemote])

  const editStaff = useCallback(async (id, patch) => {
    if (SUPABASE) { const r = await sb.editStaff(id, patch); await reloadRemote(); return r }
    const d = loadDb()
    dbUpdateStaff(d, id, patch)
    localRefresh()
    return { success: true }
  }, [localRefresh, reloadRemote])

  const removeStaff = useCallback(async (id) => {
    if (SUPABASE) { await sb.removeStaff(id); await reloadRemote(); return }
    const d = loadDb()
    dbDeleteStaff(d, id)
    localRefresh()
  }, [localRefresh, reloadRemote])

  const createProgram = useCallback(async (data) => {
    if (SUPABASE) { const p = await sb.createProgram(data); await reloadRemote(); return p }
    const d = loadDb()
    const program = dbCreateProgram(d, data)
    localRefresh()
    return program
  }, [localRefresh, reloadRemote])

  const addPost = useCallback(async (data) => {
    if (SUPABASE) { const p = await sb.addPost(data); await reloadRemote(); return p }
    const d = loadDb()
    const post = dbCreatePost(d, data)
    localRefresh()
    return post
  }, [localRefresh, reloadRemote])

  const editPost = useCallback(async (id, patch) => {
    if (SUPABASE) { await sb.editPost(id, patch); await reloadRemote(); return }
    const d = loadDb()
    dbUpdatePost(d, id, patch)
    localRefresh()
  }, [localRefresh, reloadRemote])

  const removePost = useCallback(async (id) => {
    if (SUPABASE) { await sb.removePost(id); await reloadRemote(); return }
    const d = loadDb()
    dbDeletePost(d, id)
    localRefresh()
  }, [localRefresh, reloadRemote])

  const createTicket = useCallback(async (ticketData) => {
    if (SUPABASE) { const t = await sb.createTicket(currentMember, ticketData); await reloadRemote(); return t }
    const d = loadDb()
    const memberId = currentMember?.id || null
    const ticket = submitTicket(d, memberId, ticketData)
    localRefresh()
    return ticket
  }, [currentMember, localRefresh, reloadRemote])

  // --- Egzersiz kütüphanesi ---
  const uploadExerciseVideo = useCallback(async (file) => {
    if (SUPABASE) return sb.uploadExerciseVideo(file)
    return { success: false, error: 'Yerel modda video dosyası yüklenemez. Lütfen bir video URL\u2019si girin.' }
  }, [])

  const addExercise = useCallback(async (data) => {
    if (SUPABASE) { const r = await sb.addExercise(data); if (r.success) await reloadRemote(); return r }
    const d = loadDb()
    dbAddExercise(d, data)
    localRefresh()
    return { success: true }
  }, [localRefresh, reloadRemote])

  const editExercise = useCallback(async (id, patch) => {
    if (SUPABASE) { const r = await sb.editExercise(id, patch); if (r.success) await reloadRemote(); return r }
    const d = loadDb()
    dbUpdateExercise(d, id, patch)
    localRefresh()
    return { success: true }
  }, [localRefresh, reloadRemote])

  const removeExercise = useCallback(async (id) => {
    if (SUPABASE) { await sb.removeExercise(id); await reloadRemote(); return }
    const d = loadDb()
    dbDeleteExercise(d, id)
    localRefresh()
  }, [localRefresh, reloadRemote])

  // --- Üyelik talepleri (admin onaylı) ---
  const createMembershipRequest = useCallback(async (type, requestedUntil = null, note = '') => {
    if (!currentMember) return { success: false, error: 'Giriş gerekli' }
    if (SUPABASE) { const r = await sb.createMembershipRequest(currentMember, type, requestedUntil, note); if (r.success) await reloadRemote(); return r }
    const d = loadDb()
    dbCreateRequest(d, currentMember, type, requestedUntil, note)
    localRefresh()
    return { success: true }
  }, [currentMember, localRefresh, reloadRemote])

  const resolveMembershipRequest = useCallback(async (request, approve) => {
    if (SUPABASE) { const r = await sb.resolveMembershipRequest(request, approve); await reloadRemote(); return r }
    const d = loadDb()
    dbResolveRequest(d, request.id, approve)
    localRefresh()
    return { success: true }
  }, [localRefresh, reloadRemote])

  // --- Site içeriği (yorum / SSS / başarı hikâyesi) ---
  const addContent = useCallback(async (kind, data) => {
    if (SUPABASE) { const r = await sb.addContent(kind, data); if (r.success) await reloadRemote(); return r }
    const d = loadDb()
    dbAddContent(d, kind, data)
    localRefresh()
    return { success: true }
  }, [localRefresh, reloadRemote])

  const editContent = useCallback(async (id, data) => {
    if (SUPABASE) { const r = await sb.editContent(id, data); if (r.success) await reloadRemote(); return r }
    const d = loadDb()
    dbUpdateContent(d, id, data)
    localRefresh()
    return { success: true }
  }, [localRefresh, reloadRemote])

  const removeContent = useCallback(async (id) => {
    if (SUPABASE) { await sb.removeContent(id); await reloadRemote(); return }
    const d = loadDb()
    dbDeleteContent(d, id)
    localRefresh()
  }, [localRefresh, reloadRemote])

  const submitSuccessStory = useCallback(async (data) => {
    if (SUPABASE) { const r = await sb.submitSuccessStory(currentMember, data); if (r.success) await reloadRemote(); return r }
    const d = loadDb()
    dbSubmitStory(d, currentMember, data)
    localRefresh()
    return { success: true }
  }, [currentMember, localRefresh, reloadRemote])

  const setTicketStatus = useCallback(async (ticketId, status) => {
    if (SUPABASE) { await sb.setTicketStatus(ticketId, status); await reloadRemote(); return }
    const d = loadDb()
    updateTicketStatus(d, ticketId, status)
    localRefresh()
  }, [localRefresh, reloadRemote])

  const sendTicketReply = useCallback(async (ticketId, from, text) => {
    if (SUPABASE) { const t = await sb.sendTicketReply(ticketId, from, text); await reloadRemote(); return t }
    const d = loadDb()
    const ticket = dbReplyTicket(d, ticketId, from, text)
    localRefresh()
    return ticket
  }, [localRefresh, reloadRemote])

  const markNotificationRead = useCallback(async (id) => {
    if (!currentMember) return
    const notifications = (currentMember.notifications || []).map((n) => (n.id === id ? { ...n, read: true } : n))
    if (SUPABASE) { await patchCurrentRemote({ notifications }); return }
    syncMember(currentMember.id, { notifications })
  }, [currentMember, syncMember, patchCurrentRemote])

  const markAllNotificationsRead = useCallback(async () => {
    if (!currentMember) return
    const notifications = (currentMember.notifications || []).map((n) => ({ ...n, read: true }))
    if (SUPABASE) { await patchCurrentRemote({ notifications }); return }
    syncMember(currentMember.id, { notifications })
  }, [currentMember, syncMember, patchCurrentRemote])

  const rescheduleSession = useCallback(async (id, type, newDate) => {
    if (!currentMember) return
    const key = type === 'coach' ? 'coachSessions' : 'dietitianSessions'
    const sessions = (currentMember[key] || []).map((s) => (s.id === id ? { ...s, date: newDate, status: 'rescheduled' } : s))
    if (SUPABASE) { await patchCurrentRemote({ [key]: sessions }); return }
    syncMember(currentMember.id, { [key]: sessions })
  }, [currentMember, syncMember, patchCurrentRemote])

  const cancelSession = useCallback(async (id, type) => {
    if (!currentMember) return
    const key = type === 'coach' ? 'coachSessions' : 'dietitianSessions'
    const sessions = (currentMember[key] || []).map((s) => (s.id === id ? { ...s, status: 'cancelled' } : s))
    if (SUPABASE) { await patchCurrentRemote({ [key]: sessions }); return }
    syncMember(currentMember.id, { [key]: sessions })
  }, [currentMember, syncMember, patchCurrentRemote])

  const toggleTask = useCallback(async (id) => {
    if (!currentMember) return
    const tasks = (currentMember.tasks || []).map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    if (SUPABASE) { await patchCurrentRemote({ tasks }); return }
    syncMember(currentMember.id, { tasks })
  }, [currentMember, syncMember, patchCurrentRemote])

  const updateProfile = useCallback(async (profile) => {
    if (!currentMember) return
    if (SUPABASE) { await patchCurrentRemote(profile); return }
    syncMember(currentMember.id, profile)
  }, [currentMember, syncMember, patchCurrentRemote])

  const updateSettings = useCallback(async (settings) => {
    if (!currentMember) return
    const merged = { settings: { ...currentMember.settings, ...settings } }
    if (SUPABASE) { await patchCurrentRemote(merged); return }
    syncMember(currentMember.id, merged)
  }, [currentMember, syncMember, patchCurrentRemote])

  const testimonials = db.content?.testimonials || []
  const faqs = db.content?.faqs || []
  const successStories = db.content?.successStories || []

  const value = {
    mode: SUPABASE ? 'supabase' : 'local',
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
    testimonials,
    faqs,
    successStories,
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
    processPremiumPayment,
    upgradeToPremium,
    savePackage,
    saveSupportSchedule,
    addStaff,
    editStaff,
    removeStaff,
    adminPatchMember,
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
    refresh: SUPABASE ? reloadRemote : localRefresh,
  }

  return (
    <AppContext.Provider value={value}>
      {SUPABASE && loading ? (
        <LoadingScreen message="Veriler hazırlanıyor…" />
      ) : (
        <>
          {children}
          {SUPABASE && syncing && <LoadingScreen message="İşleniyor…" overlay />}
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
