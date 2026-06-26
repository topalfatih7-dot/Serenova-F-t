import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MessageCircle, Dumbbell, Apple, Shield } from 'lucide-react'
import PanelPageHeader, { PanelPageShell } from '../components/layout/PanelPageHeader'
import ChatThreadView from '../components/chat/ChatThreadView'
import ChatConsentModal from '../components/chat/ChatConsentModal'
import ChatCollapsiblePrograms from '../components/chat/ChatCollapsiblePrograms'
import EmptyState from '../components/ui/EmptyState'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
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
  const {
    user, myPrograms, staff, chatThreads, chatMessages,
    loadChatMessages, sendChatMessage, markChatThreadRead, acceptChatConsent,
  } = useApp()

  const [consentOpen, setConsentOpen] = useState(false)
  const [pendingRole, setPendingRole] = useState(null)
  const [sending, setSending] = useState(false)

  const contacts = useMemo(() => getMemberChatContacts(user, staff), [user, staff])
  const sortedThreads = useMemo(() => sortThreadsForInbox(chatThreads, 'member'), [chatThreads])

  const activeRole = roleParam === 'dietitian' ? 'dietitian' : roleParam === 'coach' ? 'coach' : null
  const activeThread = sortedThreads.find((t) => t.staffRole === activeRole)
    || (activeRole && contacts.find((c) => c.role === activeRole)
      ? sortedThreads.find((t) => t.staffRole === activeRole)
      : null)

  const messages = activeThread ? (chatMessages[activeThread.id] || []) : []
  const activeContact = contacts.find((c) => c.role === activeRole)

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

  return (
    <PanelPageShell maxWidth="max-w-6xl">
      <PanelPageHeader
        title="Mesajlar"
        subtitle="Yalnızca size atanmış koç ve diyetisyeninizle — mesajlar kayıt altındadır"
        icon={MessageCircle}
        accent="brand"
      />

      <div className="mb-4 flex items-start gap-2 rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50/80 to-orange-50/50 px-4 py-3">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-xs leading-relaxed text-amber-900/80">
          Tüm mesajlar güvenli şekilde saklanır. Tıbbi acil durumlarda 112&apos;yi arayın.
        </p>
      </div>

      <div className="grid h-[min(72vh,680px)] min-h-[420px] grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[280px_1fr]">
        {/* Inbox */}
        <aside className="flex min-h-0 flex-col space-y-2 overflow-y-auto rounded-2xl border border-cream-200 bg-white/90 p-3 shadow-sm backdrop-blur-sm">
          <p className="px-2 text-[10px] font-bold uppercase tracking-widest text-cream-800/45">Sohbetler</p>
          {contacts.map((c) => {
            const thread = sortedThreads.find((t) => t.staffRole === c.role)
            const unread = threadUnreadCount(thread, 'member')
            const RoleIcon = ROLE_ICON[c.role]
            const meta = staffRoleMeta(c.role)
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
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isActive ? 'bg-white/20' : c.role === 'dietitian' ? 'bg-sage-100 text-sage-700' : 'bg-brand-100 text-brand-700'}`}>
                  <RoleIcon className="h-5 w-5" />
                </span>
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
        </aside>

        {/* Chat — sabit yükseklik, mesaj kutusu altta */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-cream-200 bg-white/95 shadow-sm backdrop-blur-sm">
          {!activeRole || !activeContact ? (
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
              <MessageCircle className="h-12 w-12 text-cream-200" />
              <p className="mt-3 font-medium text-cream-800/70">Bir sohbet seçin</p>
              <p className="mt-1 text-xs text-cream-800/45">Sol listeden koç veya diyetisyeninize tıklayın</p>
            </div>
          ) : (
            <>
              <div className="shrink-0 border-b border-cream-100 px-4 py-3 sm:px-5">
                <p className="font-display text-lg font-bold text-cream-900">{activeContact.name}</p>
                <p className="text-xs text-cream-800/55">{staffRoleMeta(activeRole).label}</p>
              </div>

              <div className="shrink-0 px-4 sm:px-5">
                <ChatCollapsiblePrograms
                  key={activeRole}
                  programs={myPrograms}
                  role={activeRole}
                />
              </div>

              <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-2 sm:px-5 sm:pb-5">
                <ChatThreadView
                  messages={messages}
                  perspective="member"
                  staffRole={activeRole}
                  onSend={handleSend}
                  disabled={sending}
                  live
                  remoteName={activeContact.name}
                />
              </div>
            </>
          )}
        </section>
      </div>

      <ChatConsentModal
        open={consentOpen}
        onClose={() => { setConsentOpen(false); setPendingRole(null) }}
        onAccept={handleConsent}
      />
    </PanelPageShell>
  )
}
