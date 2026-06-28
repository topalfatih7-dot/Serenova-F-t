import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MessageCircle, Dumbbell, Apple, Shield } from 'lucide-react'
import PanelPageHeader, { PanelPageShell } from '../components/layout/PanelPageHeader'
import ChatThreadView from '../components/chat/ChatThreadView'
import ChatConsentModal from '../components/chat/ChatConsentModal'
import ChatCollapsiblePrograms from '../components/chat/ChatCollapsiblePrograms'
import { ChatPageFrame, ChatThreadBody, ChatThreadHeader, ChatWorkspace } from '../components/chat/ChatWorkspace'
import EmptyState from '../components/ui/EmptyState'
import PresenceIndicator, { AvatarWithPresence } from '../components/ui/PresenceIndicator'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useChatPresence } from '../hooks/useChatPresence'
import {
  getMemberChatContacts,
  sortThreadsForInbox,
  threadUnreadCount,
  CHAT_CONSENT_KEY,
} from '../utils/chatAccess'
import { staffRoleMeta } from '../utils/staffRoles'

const ROLE_ICON = { coach: Dumbbell, dietitian: Apple }

export default function MessagesPage() {
  const { role: roleParam } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const isWide = useMediaQuery('(min-width: 768px)')
  const {
    user, myPrograms, staff, chatThreads, chatMessages,
    loadChatMessages, sendChatMessage, markChatThreadRead, acceptChatConsent,
  } = useApp()

  const [consentOpen, setConsentOpen] = useState(false)
  const [pendingRole, setPendingRole] = useState(null)
  const [sending, setSending] = useState(false)

  const contacts = useMemo(() => getMemberChatContacts(user, staff), [user, staff])
  const sortedThreads = useMemo(() => sortThreadsForInbox(chatThreads, 'member'), [chatThreads])
  const peerIds = useMemo(() => contacts.map((c) => c.staffId).filter(Boolean), [contacts])
  const { isOnline, lastSeenAt } = useChatPresence(peerIds)

  const activeRole = roleParam === 'dietitian' ? 'dietitian' : roleParam === 'coach' ? 'coach' : null
  const activeContact = contacts.find((c) => c.role === activeRole)
  const activeThread = activeRole
    ? sortedThreads.find((t) => t.staffRole === activeRole)
    : null

  const messages = activeThread ? (chatMessages[activeThread.id] || []) : []
  const showThread = Boolean(activeRole && activeContact && (roleParam || isWide))

  useEffect(() => {
    if (!activeThread?.id) return
    loadChatMessages(activeThread.id)
    markChatThreadRead(activeThread.id, 'member')
  }, [activeThread?.id, loadChatMessages, markChatThreadRead])

  const openThread = useCallback((role) => {
    const hasConsent = localStorage.getItem(CHAT_CONSENT_KEY) === '1'
      || sortedThreads.find((t) => t.staffRole === role)?.memberConsentAt
    if (!hasConsent) {
      setPendingRole(role)
      setConsentOpen(true)
      return
    }
    navigate(`/messages/${role}`)
  }, [navigate, sortedThreads])

  const handleConsent = async () => {
    localStorage.setItem(CHAT_CONSENT_KEY, '1')
    const thread = sortedThreads.find((t) => t.staffRole === pendingRole)
    if (thread) await acceptChatConsent(thread.id)
    setConsentOpen(false)
    if (pendingRole) navigate(`/messages/${pendingRole}`)
    setPendingRole(null)
  }

  const handleSend = async (text) => {
    if (!activeThread) return
    setSending(true)
    try {
      const r = await sendChatMessage(activeThread, 'member', user.id, text)
      if (!r.success) toast(r.error || 'Mesaj gönderilemedi', 'error')
    } finally {
      setSending(false)
    }
  }

  if (!contacts.length) {
    return (
      <PanelPageShell maxWidth="max-w-3xl">
        <PanelPageHeader title="Mesajlar" subtitle="Paketinize atanmış uzmanlarınızla iletişim" icon={MessageCircle} accent="brand" />
        <EmptyState
          icon={MessageCircle}
          title="Mesajlaşma henüz aktif değil"
          description="Premium paketinizde koç veya diyetisyen atandığında buradan mesajlaşabilirsiniz."
          action={<Link to="/membership" className="btn-wellness">Planları İncele</Link>}
        />
      </PanelPageShell>
    )
  }

  const inbox = (
    <>
      <p className="shrink-0 px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-widest text-cream-800/45">Sohbetler</p>
      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain p-2 sm:p-3">
        {contacts.map((c) => {
          const thread = sortedThreads.find((t) => t.staffRole === c.role)
          const unread = threadUnreadCount(thread, 'member')
          const RoleIcon = ROLE_ICON[c.role]
          const isActive = activeRole === c.role
          return (
            <motion.button
              key={c.role}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => openThread(c.role)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                isActive ? 'bg-gradient-to-r from-brand-500 to-violet-600 text-white shadow-md' : 'hover:bg-cream-50'
              }`}
            >
              <AvatarWithPresence
                lastSeenAt={lastSeenAt(c.staffId)}
                online={isOnline(c.staffId)}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isActive ? 'bg-white/20' : c.role === 'dietitian' ? 'bg-sage-100 text-sage-700' : 'bg-brand-100 text-brand-700'}`}>
                  <RoleIcon className="h-5 w-5" />
                </span>
              </AvatarWithPresence>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{c.name}</p>
                <p className={`truncate text-[11px] ${isActive ? 'text-white/75' : 'text-cream-800/50'}`}>{c.title}</p>
              </div>
              {unread > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </motion.button>
          )
        })}
      </div>
    </>
  )

  const thread = !activeRole || !activeContact ? (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <MessageCircle className="h-12 w-12 text-cream-200" />
      <p className="mt-3 font-medium text-cream-800/70">Bir sohbet seçin</p>
      <p className="mt-1 text-xs text-cream-800/45">Listeden koç veya diyetisyeninize tıklayın</p>
    </div>
  ) : (
    <>
      <ChatThreadHeader
        title={activeContact.name}
        subtitle={staffRoleMeta(activeRole).label}
        presence={(
          <PresenceIndicator
            lastSeenAt={lastSeenAt(activeContact.staffId)}
            online={isOnline(activeContact.staffId)}
            showLabel
          />
        )}
      />
      <div className="shrink-0 px-3 sm:px-4 md:px-5">
        <ChatCollapsiblePrograms key={activeRole} programs={myPrograms} role={activeRole} />
      </div>
      <ChatThreadBody>
        <ChatThreadView
          messages={messages}
          perspective="member"
          staffRole={activeRole}
          onSend={handleSend}
          disabled={sending}
          live
          remoteName={activeContact.name}
        />
      </ChatThreadBody>
    </>
  )

  return (
    <PanelPageShell maxWidth="max-w-6xl" className="w-full max-w-none space-y-3 md:max-w-6xl md:space-y-4">
      <PanelPageHeader
        title="Mesajlar"
        subtitle={showThread && !isWide ? undefined : 'Yalnızca size atanmış koç ve diyetisyeninizle — mesajlar kayıt altındadır'}
        icon={MessageCircle}
        accent="brand"
        compact={showThread && !isWide}
      />

      {(!showThread || isWide) && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50/80 to-orange-50/50 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-[11px] leading-relaxed text-amber-900/80 sm:text-xs">
            Tüm mesajlar güvenli şekilde saklanır. Tıbbi acil durumlarda 112&apos;yi arayın.
          </p>
        </div>
      )}

      <ChatPageFrame className="min-h-[calc(100dvh-10rem)] md:min-h-[calc(100dvh-12rem)]">
        <ChatWorkspace
          showThread={showThread}
          onBack={() => navigate('/messages')}
          backLabel="Sohbetler"
          inbox={inbox}
          thread={thread}
        />
      </ChatPageFrame>

      <ChatConsentModal
        open={consentOpen}
        onClose={() => { setConsentOpen(false); setPendingRole(null) }}
        onAccept={handleConsent}
      />
    </PanelPageShell>
  )
}
