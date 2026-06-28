import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MessageCircle, Search, Shield } from 'lucide-react'
import PanelPageHeader, { PanelPageShell } from '../../components/layout/PanelPageHeader'
import ChatThreadView from '../../components/chat/ChatThreadView'
import ChatCollapsiblePrograms from '../../components/chat/ChatCollapsiblePrograms'
import { ChatPageFrame, ChatThreadBody, ChatThreadHeader, ChatWorkspace } from '../../components/chat/ChatWorkspace'
import EmptyState from '../../components/ui/EmptyState'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useChatPresence } from '../../hooks/useChatPresence'
import { getStaffClients, sortThreadsForInbox, threadUnreadCount } from '../../utils/chatAccess'
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
  } = useApp()

  const [query, setQuery] = useState('')
  const [sending, setSending] = useState(false)

  const clients = useMemo(
    () => getStaffClients(platform?.members || [], staffUser?.role, staffUser?.id),
    [platform?.members, staffUser?.role, staffUser?.id],
  )

  const threads = useMemo(() => {
    const list = chatThreads.filter((t) => t.staffId === staffUser?.id)
    return sortThreadsForInbox(list, 'staff')
  }, [chatThreads, staffUser?.id])

  const enriched = useMemo(() => {
    return threads.map((t) => {
      const member = clients.find((c) => c.id === t.memberId)
      return { thread: t, member }
    }).filter((x) => x.member)
  }, [threads, clients])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return enriched
    return enriched.filter((x) => (x.member?.name || '').toLowerCase().includes(q))
  }, [enriched, query])

  const peerIds = useMemo(() => filtered.map(({ member }) => member?.id).filter(Boolean), [filtered])
  const { isOnline, lastSeenAt } = useChatPresence(peerIds)

  const activeMemberId = memberIdParam || (isWide ? filtered[0]?.thread?.memberId : null)
  const active = enriched.find((x) => x.thread.memberId === activeMemberId)
  const messages = active?.thread ? (chatMessages[active.thread.id] || []) : []
  const showThread = Boolean(active?.member && (memberIdParam || isWide))

  const memberPrograms = useMemo(
    () => (platform?.programs || []).filter((p) => p.memberId === activeMemberId),
    [platform?.programs, activeMemberId],
  )

  useEffect(() => {
    if (!active?.thread?.id) return
    loadChatMessages(active.thread.id)
    markChatThreadRead(active.thread.id, 'staff')
  }, [active?.thread?.id, loadChatMessages, markChatThreadRead])

  const handleSend = async (text) => {
    if (!active?.thread) return
    setSending(true)
    try {
      const r = await sendChatMessage(active.thread, 'staff', staffUser.id, text)
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
          const isActive = member.id === activeMemberId
          return (
            <motion.button
              key={thread.id}
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
                  {thread.lastPreview || 'Henüz mesaj yok'}
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
    <PanelPageShell maxWidth="max-w-6xl" className="w-full max-w-none space-y-3 md:max-w-6xl md:space-y-4">
      <PanelPageHeader
        title="Mesajlar"
        subtitle={showThread && !isWide ? undefined : 'Tüm danışanlarınız — okunmamış sohbetler üstte'}
        icon={MessageCircle}
        accent="brand"
        compact={showThread && !isWide}
      />

      {(!showThread || isWide) && (
        <div className="flex items-start gap-2 rounded-xl border border-brand-100 bg-brand-50/50 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          <p className="text-[11px] leading-relaxed text-brand-900/75 sm:text-xs">
            Mesajlar kayıt altındadır. Sohbet sırasında ilgili birimin programını açıp kapatabilirsiniz.
          </p>
        </div>
      )}

      {clients.length === 0 ? (
        <EmptyState icon={MessageCircle} title="Henüz danışan yok" description="Size atanan aktif danışanlar burada listelenir." />
      ) : (
        <ChatPageFrame className="min-h-[calc(100dvh-10rem)] md:min-h-[calc(100dvh-12rem)]">
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
