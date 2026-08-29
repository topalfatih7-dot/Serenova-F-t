import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MessageCircle, Search, Shield, Users } from 'lucide-react'
import PanelPageHeader, { PanelPageShell } from '../../components/layout/PanelPageHeader'
import StaffCollabChatView from '../../components/chat/StaffCollabChatView'
import { ChatPageFrame, ChatThreadBody, ChatThreadHeader, ChatWorkspace, CHAT_PAGE_SHELL_CLASS } from '../../components/chat/ChatWorkspace'
import EmptyState from '../../components/ui/EmptyState'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import {
  buildStaffCollabInbox,
  sortStaffCollabInbox,
  staffCollabThreadUnreadCount,
} from '../../utils/chatAccess'
import { normalizeStaffRole } from '../../utils/staffRoles'
import { getStaffCollabMembers } from '../../services/staffCollabChatDb'
import { getPlanLabel } from '../../data/membershipPlans'

export default function StaffCollabMessagesPage() {
  const { memberId: memberIdParam } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const isWide = useMediaQuery('(min-width: 768px)')
  const {
    staffUser, platform,
    staffCollabThreads, staffCollabMessages,
    loadStaffCollabMessages, sendStaffCollabMessage, markStaffCollabThreadRead,
    refreshStaffCollabThreads, ensureStaffCollabThread,
  } = useApp()

  const role = normalizeStaffRole(staffUser?.role)
  const isAllowedRole = role === 'coach' || role === 'dietitian' || role === 'doctor'

  const [query, setQuery] = useState('')
  const [sending, setSending] = useState(false)
  const [activeThreadId, setActiveThreadId] = useState(null)
  const activeThreadRef = useRef(null)

  const clients = useMemo(
    () => getStaffCollabMembers(platform?.members || [], staffUser),
    [platform?.members, staffUser],
  )

  const inboxItems = useMemo(
    () => sortStaffCollabInbox(buildStaffCollabInbox(clients, staffCollabThreads, staffUser), role),
    [clients, staffCollabThreads, staffUser, role],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return inboxItems
    return inboxItems.filter(({ member, peerName }) =>
      (member?.name || '').toLowerCase().includes(q)
      || (peerName || '').toLowerCase().includes(q),
    )
  }, [inboxItems, query])

  const activeMemberId = memberIdParam || (isWide ? filtered[0]?.member?.id : null)
  const active = inboxItems.find(({ member }) => String(member.id) === String(activeMemberId))
  const effectiveThreadId = active?.member?.id ? activeThreadId : null
  const messages = effectiveThreadId ? (staffCollabMessages[effectiveThreadId] || []) : []
  const showThread = Boolean(active?.member && (memberIdParam || isWide))

  const peerLabel = role === 'coach'
    ? 'Ekip'
    : role === 'dietitian'
      ? 'Ekip'
      : 'Koç & Diyetisyen'
  const peerName = active?.peerName || peerLabel

  useEffect(() => {
    if (staffUser?.id) refreshStaffCollabThreads()
  }, [staffUser?.id, refreshStaffCollabThreads])

  useEffect(() => {
    if (!active?.member?.id) {
      activeThreadRef.current = null
      return undefined
    }

    let cancelled = false
    let poll = null

    ;(async () => {
      const thread = active.thread || await ensureStaffCollabThread(active.member)
      if (cancelled || !thread?.id) return
      activeThreadRef.current = thread
      setActiveThreadId(thread.id)
      loadStaffCollabMessages(thread.id)
      markStaffCollabThreadRead(thread.id, role)
      poll = setInterval(() => loadStaffCollabMessages(thread.id), 8000)
    })()

    return () => {
      cancelled = true
      if (poll) clearInterval(poll)
    }
  }, [active?.member?.id, active?.thread?.id, active?.member, active?.thread, ensureStaffCollabThread, loadStaffCollabMessages, markStaffCollabThreadRead, role])

  if (!isAllowedRole) {
    return <Navigate to="/staff" replace />
  }

  const handleSend = async (text) => {
    if (!active?.member) return
    setSending(true)
    try {
      const thread = activeThreadRef.current || active.thread || await ensureStaffCollabThread(active.member)
      if (!thread?.id) {
        toast('Sohbet başlatılamadı', 'error')
        return
      }
      activeThreadRef.current = thread
      setActiveThreadId(thread.id)
      const r = await sendStaffCollabMessage(thread, role, staffUser.id, text)
      if (!r.success) toast(r.error || 'Mesaj gönderilemedi', 'error')
    } finally {
      setSending(false)
    }
  }

  const inbox = (
    <>
      <div className="shrink-0 border-b border-cream-100 p-2.5 sm:p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Personel veya danışan ara…"
            className="w-full rounded-xl border border-cream-200 py-2.5 pl-9 pr-3 text-base outline-none focus:border-brand-300 sm:text-sm"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-2">
        {filtered.map(({ thread, member, peerName: peer }) => {
          const unread = staffCollabThreadUnreadCount(thread, role)
          const isActive = String(member.id) === String(activeMemberId)
          return (
            <motion.button
              key={member.id}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/staff/collab-messages/${member.id}`)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                isActive ? 'bg-gradient-to-r from-brand-500 to-sage-600 text-white shadow-md' : unread > 0 ? 'bg-rose-50/80 hover:bg-rose-50' : 'hover:bg-cream-50'
              }`}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-sage-100 text-sage-700'}`}>
                <Users className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{peer || peerLabel}</p>
                <p className={`truncate text-[11px] ${isActive ? 'text-white/75' : 'text-cream-800/50'}`}>
                  Danışan adına: {member.name}
                </p>
              </div>
              {unread > 0 && (
                <span className="flex h-5 min-w-[20px] animate-pulse items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </motion.button>
          )
        })}
      </div>
    </>
  )

  const thread = active?.member ? (
    <>
      <ChatThreadHeader
        title={peerName}
        subtitle={`Danışan adına: ${active.member.name} · ${getPlanLabel(active.member?.membership) || active.member?.membership || '—'}`}
      />
      <ChatThreadBody>
        <StaffCollabChatView
          messages={messages}
          perspective={role}
          onSend={handleSend}
          disabled={sending}
          live
          remoteName={peerName}
          memberName={active.member.name}
          coachName={active.thread?.coachName}
          dietitianName={active.thread?.dietitianName}
          doctorName={active.thread?.doctorName}
        />
      </ChatThreadBody>
    </>
  ) : (
    <div className="flex flex-1 items-center justify-center p-6 text-sm text-cream-800/50">Danışan seçin</div>
  )

  return (
    <PanelPageShell maxWidth="max-w-6xl" spacing="" className={`w-full max-w-none md:max-w-6xl ${CHAT_PAGE_SHELL_CLASS}`}>
      {!(showThread && !isWide) && (
        <PanelPageHeader
          className="shrink-0"
          title="Ekip Mesajları"
          subtitle="Ortak danışanlarınız için koç–diyetisyen–doktor koordinasyonu"
          icon={MessageCircle}
          accent="sage"
        />
      )}

      {(!showThread || isWide) && (
        <div className="flex items-start gap-2 rounded-xl border border-sage-100 bg-sage-50/50 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" />
          <p className="text-[11px] leading-relaxed text-sage-900/75 sm:text-xs">
            Bu kanal aynı danışanı paylaşan koç, diyetisyen ve doktor arasındadır. Tüm mesajlar denetim için kayıt altına alınır.
          </p>
        </div>
      )}

      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Ortak danışan yok"
          description="Hem koç hem diyetisyen ataması olan danışanlarınız burada görünür."
        />
      ) : (
        <ChatPageFrame>
          <ChatWorkspace
            showThread={showThread}
            onBack={() => navigate('/staff/collab-messages')}
            backLabel="Ekip mesajları"
            inbox={inbox}
            thread={thread}
            flushMobile={showThread && !isWide}
          />
        </ChatPageFrame>
      )}
    </PanelPageShell>
  )
}
