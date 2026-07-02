import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MessageCircle, Search, Shield } from 'lucide-react'
import PanelPageHeader, { PanelPageShell } from '../../components/layout/PanelPageHeader'
import ChatThreadView from '../../components/chat/ChatThreadView'
import ChatCollapsiblePrograms from '../../components/chat/ChatCollapsiblePrograms'
import { ChatPageFrame, ChatThreadBody, ChatThreadHeader, ChatWorkspace, CHAT_PAGE_SHELL_CLASS } from '../../components/chat/ChatWorkspace'
import EmptyState from '../../components/ui/EmptyState'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useChatPresence } from '../../hooks/useChatPresence'
import {
  getStaffClients,
  buildStaffChatInbox,
  sortStaffInboxItems,
  threadUnreadCount,
} from '../../utils/chatAccess'
import { staffRoleMeta } from '../../utils/staffRoles'
import { getPlanLabel } from '../../data/membershipPlans'
import PresenceIndicator, { AvatarWithPresence } from '../../components/ui/PresenceIndicator'

export default function StaffMessagesPage() {
  const { memberId: memberIdParam } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const isWide = useMediaQuery('(min-width: 768px)')
  const {
    staffUser, platform, chatThreads, chatMessages,
    loadChatMessages, sendChatMessage, markChatThreadRead,
    refreshStaffChatThreads, ensureStaffChatThread,
  } = useApp()

  const [query, setQuery] = useState('')
  const [sending, setSending] = useState(false)
  const [activeThreadId, setActiveThreadId] = useState(null)
  const activeThreadRef = useRef(null)

  const clients = useMemo(
    () => getStaffClients(platform?.members || [], staffUser?.role, staffUser?.id),
    [platform?.members, staffUser?.role, staffUser?.id],
  )

  const inboxItems = useMemo(
    () => sortStaffInboxItems(buildStaffChatInbox(clients, chatThreads, staffUser)),
    [clients, chatThreads, staffUser],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return inboxItems
    return inboxItems.filter(({ member }) => (member?.name || '').toLowerCase().includes(q))
  }, [inboxItems, query])

  const peerIds = useMemo(() => filtered.map(({ member }) => member?.id).filter(Boolean), [filtered])
  const { isOnline, lastSeenAt } = useChatPresence(peerIds)

  const activeMemberId = memberIdParam || (isWide ? filtered[0]?.member?.id : null)
  const active = inboxItems.find(({ member }) => String(member.id) === String(activeMemberId))
  const messages = activeThreadId ? (chatMessages[activeThreadId] || []) : []
  const showThread = Boolean(active?.member && (memberIdParam || isWide))

  const memberPrograms = useMemo(
    () => (platform?.programs || []).filter((p) => p.memberId === activeMemberId),
    [platform?.programs, activeMemberId],
  )

  useEffect(() => {
    if (staffUser?.id) refreshStaffChatThreads()
  }, [staffUser?.id, refreshStaffChatThreads])

  useEffect(() => {
    if (!active?.member?.id) {
      setActiveThreadId(null)
      activeThreadRef.current = null
      return undefined
    }

    let cancelled = false
    let poll = null

    ;(async () => {
      const thread = active.thread || await ensureStaffChatThread(active.member)
      if (cancelled || !thread?.id) return
      activeThreadRef.current = thread
      setActiveThreadId(thread.id)
      loadChatMessages(thread.id)
      markChatThreadRead(thread.id, 'staff')
      poll = setInterval(() => loadChatMessages(thread.id), 8000)
    })()

    return () => {
      cancelled = true
      if (poll) clearInterval(poll)
    }
  }, [active?.member?.id, active?.thread?.id, ensureStaffChatThread, loadChatMessages, markChatThreadRead])

  const handleSend = async (text) => {
    if (!active?.member) return
    setSending(true)
    try {
      const thread = activeThreadRef.current || active.thread || await ensureStaffChatThread(active.member)
      if (!thread?.id) {
        toast('Sohbet başlatılamadı', 'error')
        return
      }
      activeThreadRef.current = thread
      setActiveThreadId(thread.id)
      const r = await sendChatMessage(thread, 'staff', staffUser.id, text)
      if (!r.success) toast(r.error || 'Mesaj gönderilemedi', 'error')
    } finally {
      setSending(false)
    }
  }

  const meta = staffRoleMeta(staffUser?.role)
  const programRole = staffUser?.role === 'dietitian' ? 'dietitian' : 'coach'

  const inbox = (
    <>
      <div className="shrink-0 border-b border-cream-100 p-2.5 sm:p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Danışan ara…"
            className="w-full rounded-xl border border-cream-200 py-2.5 pl-9 pr-3 text-base outline-none focus:border-brand-300 sm:text-sm"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-2">
        {filtered.map(({ thread, member }) => {
          const unread = threadUnreadCount(thread, 'staff')
          const isActive = String(member.id) === String(activeMemberId)
          return (
            <motion.button
              key={member.id}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/staff/messages/${member.id}`)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                isActive ? 'bg-gradient-to-r from-brand-500 to-violet-600 text-white shadow-md' : unread > 0 ? 'bg-rose-50/80 hover:bg-rose-50' : 'hover:bg-cream-50'
              }`}
            >
              <AvatarWithPresence lastSeenAt={lastSeenAt(member.id)} online={isOnline(member.id)}>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-brand-100 text-brand-700'}`}>
                  {(member.name || '?')[0]}
                </span>
              </AvatarWithPresence>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{member.name}</p>
                <p className={`truncate text-[11px] ${isActive ? 'text-white/75' : 'text-cream-800/50'}`}>
                  {thread?.lastPreview || 'Henüz mesaj yok'}
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
        title={active.member.name}
        subtitle={`${meta.label} · ${getPlanLabel(active.member?.membership) || active.member?.membership}`}
        presence={(
          <PresenceIndicator
            lastSeenAt={lastSeenAt(active.member.id)}
            online={isOnline(active.member.id)}
            showLabel
          />
        )}
      />
      <div className="shrink-0 px-3 sm:px-4 md:px-5">
        <ChatCollapsiblePrograms
          key={`${activeMemberId}-${programRole}`}
          programs={memberPrograms}
          role={programRole}
          memberName={active.member.name}
        />
      </div>
      <ChatThreadBody>
        <ChatThreadView
          messages={messages}
          perspective="staff"
          staffRole={staffUser.role}
          onSend={handleSend}
          disabled={sending}
          live
          remoteName={active.member.name}
        />
      </ChatThreadBody>
    </>
  ) : (
    <div className="flex flex-1 items-center justify-center p-6 text-sm text-cream-800/50">Danışan seçin</div>
  )

  return (
    <PanelPageShell maxWidth="max-w-6xl" className={`w-full max-w-none md:max-w-6xl ${CHAT_PAGE_SHELL_CLASS}`}>
      <PanelPageHeader
        className="shrink-0"
        title="Mesajlar"
        subtitle={showThread && !isWide ? undefined : 'Tüm danışanlarınız — okunmamış sohbetler üstte'}
        icon={MessageCircle}
        accent="brand"
        compact={showThread && !isWide}
      />

      {(!showThread || isWide) && (
        <div className="shrink-0 flex items-start gap-2 rounded-xl border border-brand-100 bg-brand-50/50 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          <p className="text-[11px] leading-relaxed text-brand-900/75 sm:text-xs">
            Mesajlar kayıt altındadır. Sohbet sırasında ilgili birimin programını açıp kapatabilirsiniz.
          </p>
        </div>
      )}

      {clients.length === 0 ? (
        <EmptyState icon={MessageCircle} title="Henüz danışan yok" description="Size atanan aktif danışanlar burada listelenir." />
      ) : (
        <ChatPageFrame>
          <ChatWorkspace
            showThread={showThread}
            onBack={() => navigate('/staff/messages')}
            backLabel="Danışanlar"
            inbox={inbox}
            thread={thread}
          />
        </ChatPageFrame>
      )}
    </PanelPageShell>
  )
}
