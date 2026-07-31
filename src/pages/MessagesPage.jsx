import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MessageCircle, Shield } from 'lucide-react'
import PanelPageHeader, { PanelPageShell } from '../components/layout/PanelPageHeader'
import UnpaidMemberGate from '../components/membership/UnpaidMemberGate'
import ChatThreadView from '../components/chat/ChatThreadView'
import ChatConsentModal from '../components/chat/ChatConsentModal'
import ChatCollapsiblePrograms from '../components/chat/ChatCollapsiblePrograms'
import { ChatPageFrame, ChatThreadBody, ChatThreadHeader, ChatWorkspace, CHAT_PAGE_SHELL_CLASS } from '../components/chat/ChatWorkspace'
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
import { PANEL_IMAGES } from '../utils/panelImages'

const CHAT_ROLES = ['coach', 'dietitian', 'doctor']

const AVATAR_IDLE = {
  coach: 'bg-brand-100 text-brand-700',
  dietitian: 'bg-sage-100 text-sage-700',
  doctor: 'bg-teal-100 text-teal-700',
}

const CONTACT_ACTIVE = {
  coach: 'border-brand-400 bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-200/50',
  dietitian: 'border-sage-400 bg-gradient-to-br from-sage-500 to-emerald-600 text-white shadow-lg shadow-sage-200/50',
  doctor: 'border-teal-400 bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-200/50',
}

const CONTACT_IDLE = {
  coach: 'border-brand-100 bg-gradient-to-br from-brand-50/90 via-white to-sky-50/50 hover:border-brand-300 hover:shadow-md',
  dietitian: 'border-sage-100 bg-gradient-to-br from-sage-50/90 via-white to-emerald-50/50 hover:border-sage-300 hover:shadow-md',
  doctor: 'border-teal-100 bg-gradient-to-br from-teal-50/90 via-white to-cyan-50/50 hover:border-teal-300 hover:shadow-md',
}

export default function MessagesPage() {
  const { role: roleParam } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const isWide = useMediaQuery('(min-width: 768px)')
  const {
    user, myPrograms, staff, chatThreads, chatMessages,
    loadChatMessages, sendChatMessage, markChatThreadRead, acceptChatConsent,
    isUnpaidMember,
  } = useApp()

  const [consentOpen, setConsentOpen] = useState(false)
  const [pendingRole, setPendingRole] = useState(null)
  const [sending, setSending] = useState(false)

  const contacts = useMemo(() => getMemberChatContacts(user, staff), [user, staff])
  const sortedThreads = useMemo(() => sortThreadsForInbox(chatThreads, 'member'), [chatThreads])
  const peerIds = useMemo(() => contacts.map((c) => c.staffId).filter(Boolean), [contacts])
  const { isOnline, lastSeenAt } = useChatPresence(peerIds)

  const activeRole = CHAT_ROLES.includes(roleParam) ? roleParam : null
  const activeContact = contacts.find((c) => c.role === activeRole)
  const activeThread = activeRole
    ? sortedThreads.find((t) => t.staffRole === activeRole)
    : null

  const messages = activeThread ? (chatMessages[activeThread.id] || []) : []
  const showThread = Boolean(activeRole && activeContact && (roleParam || isWide))

  useEffect(() => {
    if (!activeThread?.id) return undefined
    loadChatMessages(activeThread.id)
    markChatThreadRead(activeThread.id, 'member')
    // Realtime yedeği: açık sohbette mesajları periyodik tazele.
    const poll = setInterval(() => loadChatMessages(activeThread.id), 8000)
    return () => clearInterval(poll)
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

  if (isUnpaidMember) {
    return (
      <PanelPageShell>
        <PanelPageHeader title="Mesajlar" subtitle="Uzmanlarınızla iletişim" icon={MessageCircle} accent="brand" image={PANEL_IMAGES.messages} />
        <UnpaidMemberGate
          title="Mesajlaşma paket gerektirir"
          description="Geçmiş sohbetleriniz saklanır; yeni mesaj göndermek ve uzmanlarla görüşmek için bir plan seçin."
        />
      </PanelPageShell>
    )
  }

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
      <PanelPageShell>
        <PanelPageHeader title="Mesajlar" subtitle="Paketinize atanmış uzmanlarınızla iletişim" icon={MessageCircle} accent="brand" image={PANEL_IMAGES.messages} />
        <EmptyState
          icon={MessageCircle}
          title="Mesajlaşma henüz aktif değil"
          description="Premium paketinizde koç, diyetisyen veya doktor atandığında buradan mesajlaşabilirsiniz."
        />
      </PanelPageShell>
    )
  }

  const inbox = (
    <>
      <div className="shrink-0 border-b border-cream-100 bg-gradient-to-r from-brand-50/80 via-white to-sage-50/50 px-3 pb-2.5 pt-3 sm:px-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-600/70">Sohbetler</p>
        <p className="mt-0.5 text-xs text-cream-800/50">Atanmış uzmanlarınız</p>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-2 sm:p-3">
        {contacts.map((c) => {
          const thread = sortedThreads.find((t) => t.staffRole === c.role)
          const unread = threadUnreadCount(thread, 'member')
          const RoleIcon = staffRoleMeta(c.role).icon
          const isActive = activeRole === c.role
          const idleAvatar = AVATAR_IDLE[c.role] || AVATAR_IDLE.coach
          return (
            <motion.button
              key={c.role}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => openThread(c.role)}
              className={`flex w-full items-center gap-3 rounded-2xl border-2 px-3 py-3.5 text-left transition ${
                isActive
                  ? (CONTACT_ACTIVE[c.role] || CONTACT_ACTIVE.coach)
                  : (CONTACT_IDLE[c.role] || CONTACT_IDLE.coach)
              }`}
            >
              <AvatarWithPresence
                lastSeenAt={lastSeenAt(c.staffId)}
                online={isOnline(c.staffId)}
              >
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isActive ? 'bg-white/20' : idleAvatar}`}>
                  {RoleIcon ? <RoleIcon className="h-5 w-5" /> : null}
                </span>
              </AvatarWithPresence>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{c.name}</p>
              </div>
              {unread > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white shadow-sm">
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
    <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-brand-50/40 via-white to-sage-50/30 p-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-sage-500 text-white shadow-lg shadow-brand-200/40">
        <MessageCircle className="h-8 w-8" />
      </span>
      <p className="mt-4 font-display text-base font-bold text-cream-900">Bir sohbet seçin</p>
      <p className="mt-1.5 max-w-[220px] text-xs leading-relaxed text-cream-800/55">
        Soldaki listeden koç, diyetisyen veya doktorunuzla mesajlaşmaya başlayın
      </p>
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
    <PanelPageShell maxWidth="max-w-6xl" spacing="" className={`w-full max-w-none md:max-w-6xl ${CHAT_PAGE_SHELL_CLASS}`}>
      <PanelPageHeader
        className="shrink-0"
        title="Mesajlar"
        subtitle={showThread && !isWide ? undefined : 'Yalnızca size atanmış uzmanlarınızla — mesajlar kayıt altındadır'}
        icon={MessageCircle}
        accent="brand"
        compact={showThread && !isWide}
        image={showThread && !isWide ? null : PANEL_IMAGES.messages}
      />

      {(!showThread || isWide) && (
        <div className="shrink-0 flex items-start gap-2 rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50/80 to-orange-50/50 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-[11px] leading-relaxed text-amber-900/80 sm:text-xs">
            Tüm mesajlar güvenli şekilde saklanır. Tıbbi acil durumlarda 112&apos;yi arayın.
          </p>
        </div>
      )}

      <ChatPageFrame>
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
