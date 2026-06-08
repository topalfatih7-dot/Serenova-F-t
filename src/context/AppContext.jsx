import { createContext, useContext, useCallback, useState, useMemo } from 'react'
import { ADMIN_CREDENTIALS } from '../config/brand'
import { calculatePackagePrice } from '../services/packagePricing'
import {
  loadDb,
  saveDb,
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
  computeAdminStats,
  computeMembershipBreakdown,
  computeMonthlyGrowth,
  getSessionStats,
} from '../services/localDb'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick((t) => t + 1), [])

  useState(() => {
    initSession()
    return true
  })

  const db = useMemo(() => loadDb(), [tick])
  const currentMember = useMemo(() => getCurrentMember(db), [db])
  const currentStaff = useMemo(() => getCurrentStaff(db), [db])
  const isAdmin = db.session?.type === 'admin'
  const isStaff = db.session?.type === 'staff'
  const isAuthenticated = !!db.session

  const adminStats = useMemo(() => computeAdminStats(db), [db])
  const membershipBreakdown = useMemo(() => computeMembershipBreakdown(db), [db])
  const monthlyGrowth = useMemo(() => computeMonthlyGrowth(db), [db])
  const sessionStats = useMemo(() => getSessionStats(db), [db])

  const syncMember = useCallback((memberId, patch) => {
    const d = loadDb()
    updateMember(d, memberId, patch)
    refresh()
  }, [refresh])

  const login = useCallback((email, password, remember = false) => {
    if (
      email.toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase() &&
      password === ADMIN_CREDENTIALS.password
    ) {
      const d = loadDb()
      loginAdmin(d, remember)
      refresh()
      return { success: true, role: 'admin', isAdmin: true }
    }

    const d = loadDb()
    const memberResult = loginMember(d, email, password, remember)
    if (memberResult.success) {
      refresh()
      return { success: true, role: 'member', isAdmin: false }
    }

    const ds = loadDb()
    const staffResult = loginStaff(ds, email, password, remember)
    if (staffResult.success) {
      refresh()
      return { success: true, role: 'staff', isAdmin: false }
    }

    return { success: false, error: 'E-posta veya şifre hatalı.', isAdmin: false }
  }, [refresh])

  const logout = useCallback(() => {
    const d = loadDb()
    dbLogout(d)
    refresh()
  }, [refresh])

  const register = useCallback((profile, membership, packageConfig) => {
    const d = loadDb()
    const result = registerMember(d, profile, membership, packageConfig)
    if (!result.success) return result
    refresh()
    return result
  }, [refresh])

  const processPremiumPayment = useCallback((packageConfig) => {
    if (!currentMember) return { success: false, error: 'Oturum bulunamadı' }
    const pricing = calculatePackagePrice(packageConfig)
    const d = loadDb()
    upgradeMemberPremium(d, currentMember.id, packageConfig, pricing.total)
    refresh()
    return { success: true, pricing }
  }, [currentMember, refresh])

  const registerWithPayment = useCallback((profile, packageConfig) => {
    const pricing = calculatePackagePrice(packageConfig)
    const d = loadDb()
    const result = registerPremiumWithPayment(d, profile, packageConfig, pricing.total)
    if (!result.success) return result
    refresh()
    return { success: true, member: result.member, pricing }
  }, [refresh])

  const upgradeToPremium = useCallback((packageConfig) => {
    if (!currentMember) return
    const pricing = calculatePackagePrice(packageConfig)
    const d = loadDb()
    upgradeMemberPremium(d, currentMember.id, packageConfig, pricing.total)
    refresh()
    return pricing
  }, [currentMember, refresh])

  const savePackage = useCallback((config) => {
    if (!currentMember) return
    syncMember(currentMember.id, { packageConfig: config })
  }, [currentMember, syncMember])

  const saveSupportSchedule = useCallback((schedule) => {
    if (!currentMember) return
    const d = loadDb()
    dbUpdateSupportSchedule(d, currentMember.id, schedule)
    refresh()
  }, [currentMember, refresh])

  const pauseMembership = useCallback((until) => {
    if (!currentMember) return
    const d = loadDb()
    pauseMember(d, currentMember.id, until)
    refresh()
  }, [currentMember, refresh])

  const resumeMembership = useCallback(() => {
    if (!currentMember) return
    const d = loadDb()
    resumeMember(d, currentMember.id)
    refresh()
  }, [currentMember, refresh])

  const cancelMembership = useCallback(() => {
    if (!currentMember) return
    const d = loadDb()
    cancelMember(d, currentMember.id)
    refresh()
  }, [currentMember, refresh])

  const renewMembership = useCallback(() => {
    if (!currentMember) return
    const d = loadDb()
    renewMember(d, currentMember.id)
    refresh()
  }, [currentMember, refresh])

  const addStaff = useCallback((data) => {
    const d = loadDb()
    const result = dbRegisterStaff(d, data)
    refresh()
    return result
  }, [refresh])

  const editStaff = useCallback((id, patch) => {
    const d = loadDb()
    dbUpdateStaff(d, id, patch)
    refresh()
  }, [refresh])

  const removeStaff = useCallback((id) => {
    const d = loadDb()
    dbDeleteStaff(d, id)
    refresh()
  }, [refresh])

  const createProgram = useCallback((data) => {
    const d = loadDb()
    const program = dbCreateProgram(d, data)
    refresh()
    return program
  }, [refresh])

  const addPost = useCallback((data) => {
    const d = loadDb()
    const post = dbCreatePost(d, data)
    refresh()
    return post
  }, [refresh])

  const editPost = useCallback((id, patch) => {
    const d = loadDb()
    dbUpdatePost(d, id, patch)
    refresh()
  }, [refresh])

  const removePost = useCallback((id) => {
    const d = loadDb()
    dbDeletePost(d, id)
    refresh()
  }, [refresh])

  const createTicket = useCallback((ticketData) => {
    const d = loadDb()
    const memberId = currentMember?.id || null
    const ticket = submitTicket(d, memberId, ticketData)
    refresh()
    return ticket
  }, [currentMember, refresh])

  const setTicketStatus = useCallback((ticketId, status) => {
    const d = loadDb()
    updateTicketStatus(d, ticketId, status)
    refresh()
  }, [refresh])

  const sendTicketReply = useCallback((ticketId, from, text) => {
    const d = loadDb()
    const ticket = dbReplyTicket(d, ticketId, from, text)
    refresh()
    return ticket
  }, [refresh])

  const markNotificationRead = useCallback((id) => {
    if (!currentMember) return
    const notifications = currentMember.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    )
    syncMember(currentMember.id, { notifications })
  }, [currentMember, syncMember])

  const markAllNotificationsRead = useCallback(() => {
    if (!currentMember) return
    const notifications = currentMember.notifications.map((n) => ({ ...n, read: true }))
    syncMember(currentMember.id, { notifications })
  }, [currentMember, syncMember])

  const rescheduleSession = useCallback((id, type, newDate) => {
    if (!currentMember) return
    const key = type === 'coach' ? 'coachSessions' : 'dietitianSessions'
    const sessions = currentMember[key].map((s) =>
      s.id === id ? { ...s, date: newDate, status: 'rescheduled' } : s
    )
    syncMember(currentMember.id, { [key]: sessions })
  }, [currentMember, syncMember])

  const cancelSession = useCallback((id, type) => {
    if (!currentMember) return
    const key = type === 'coach' ? 'coachSessions' : 'dietitianSessions'
    const sessions = currentMember[key].map((s) =>
      s.id === id ? { ...s, status: 'cancelled' } : s
    )
    syncMember(currentMember.id, { [key]: sessions })
  }, [currentMember, syncMember])

  const toggleTask = useCallback((id) => {
    if (!currentMember) return
    const tasks = currentMember.tasks.map((t) =>
      t.id === id ? { ...t, done: !t.done } : t
    )
    syncMember(currentMember.id, { tasks })
  }, [currentMember, syncMember])

  const updateProfile = useCallback((profile) => {
    if (!currentMember) return
    syncMember(currentMember.id, profile)
  }, [currentMember, syncMember])

  const updateSettings = useCallback((settings) => {
    if (!currentMember) return
    syncMember(currentMember.id, {
      settings: { ...currentMember.settings, ...settings },
    })
  }, [currentMember, syncMember])

  const value = {
    isAuthenticated,
    isAdmin,
    isStaff,
    staffUser: currentStaff || {},
    staff: db.staff || [],
    programs: db.programs || [],
    posts: db.posts || [],
    myPrograms: currentMember ? (db.programs || []).filter((p) => p.memberId === currentMember.id) : [],
    myTickets: currentMember ? (db.tickets || []).filter((t) => t.memberId === currentMember.id) : [],
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
    markNotificationRead,
    markAllNotificationsRead,
    rescheduleSession,
    cancelSession,
    toggleTask,
    updateProfile,
    updateSettings,
    refresh,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
