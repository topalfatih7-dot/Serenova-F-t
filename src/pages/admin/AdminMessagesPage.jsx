import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MessageCircle, Search, Shield, Eye, Download, Loader2 } from 'lucide-react'
import PanelPageHeader, { PanelPageShell } from '../../components/layout/PanelPageHeader'
import AdminStaffChatView from '../../components/chat/AdminStaffChatView'
import ChatThreadView from '../../components/chat/ChatThreadView'
import { ChatPageFrame, ChatThreadBody, ChatThreadHeader, ChatWorkspace } from '../../components/chat/ChatWorkspace'
import EmptyState from '../../components/ui/EmptyState'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { useChatPresence } from '../../hooks/useChatPresence'
import PresenceIndicator, { AvatarWithPresence } from '../../components/ui/PresenceIndicator'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { adminStaffThreadUnreadCount, sortThreadsForInbox, staffRoleLabel } from '../../utils/chatAccess'
import { downloadChatTranscriptPdf, mapMemberStaffMessagesForExport } from '../../utils/exportChatPdf'
import { supabase } from '../../services/supabaseClient'
import { staffRoleMeta } from '../../utils/staffRoles'

function TabLink({ to, active, children }) {
  return (
    <Link
      to={to}
      className={`rounded-xl px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${
        active
          ? 'bg-cream-900 text-white shadow-sm'
          : 'bg-white text-cream-800 ring-1 ring-cream-200 hover:bg-cream-50'
      }`}
    >
      {children}
    </Link>
  )
}

export default function AdminMessagesPage() {
  const { staffId: staffIdParam, threadId: auditThreadId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const isWide = useMediaQuery('(min-width: 768px)')

  const isAudit = location.pathname.includes('/audit')
  const {
    platform, staff, adminStaffThreads, adminStaffMessages, chatThreads, chatMessages,
    loadAdminStaffMessages, sendAdminStaffMessage, markAdminStaffThreadRead,
    ensureAdminStaffThread,
    loadChatMessages,
  } = useApp()

  const [query, setQuery] = useState('')
  const [sending, setSending] = useState(false)
  const [exporting, setExporting] = useState(false)

  const staffList = useMemo(() => {
    return (staff || []).map((s) => {
      const thread = adminStaffThreads.find((t) => String(t.staffId) === String(s.id))
      return { staff: s, thread }
    }).sort((a, b) => {
      const aUnread = threadUnread(a.thread) ? 1 : 0
      const bUnread = threadUnread(b.thread) ? 1 : 0
      if (bUnread !== aUnread) return bUnread - aUnread
      const aTime = new Date(a.thread?.lastMessageAt || 0).getTime()
      const bTime = new Date(b.thread?.lastMessageAt || 0).getTime()
      return bTime - aTime
    })
  }, [staff, adminStaffThreads])

  function threadUnread(thread) {
    return adminStaffThreadUnreadCount(thread, 'admin') > 0
  }

  const filteredStaff = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return staffList
    return staffList.filter(({ staff: s }) => (s.name || '').toLowerCase().includes(q))
  }, [staffList, query])

  const staffPeerIds = useMemo(() => filteredStaff.map(({ staff: s }) => s.id).filter(Boolean), [filteredStaff])
  const { isOnline, lastSeenAt } = useChatPresence(staffPeerIds)

  const activeStaffId = !isAudit
    ? (staffIdParam || (isWide ? filteredStaff[0]?.staff?.id : null))
    : null
  const activeStaffEntry = filteredStaff.find(({ staff: s }) => String(s.id) === String(activeStaffId))
  const activeAdminThread = activeStaffEntry?.thread
  const adminMessages = activeAdminThread ? (adminStaffMessages[activeAdminThread.id] || []) : []
  const showStaffThread = Boolean(!isAudit && activeStaffEntry && (staffIdParam || isWide))

  const auditThreads = useMemo(() => {
    const members = platform?.members || []
    const staffRows = staff || []
    return sortThreadsForInbox(chatThreads, 'staff').map((thread) => {
      const member = members.find((m) => m.id === thread.memberId)
      const staffMember = staffRows.find((s) => s.id === thread.staffId)
      return { thread, member, staffMember }
    })
  }, [chatThreads, platform?.members, staff])

  const filteredAudit = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return auditThreads
    return auditThreads.filter(({ member, staffMember }) =>
      (member?.name || '').toLowerCase().includes(q)
      || (staffMember?.name || '').toLowerCase().includes(q),
    )
  }, [auditThreads, query])

  const activeAuditId = isAudit
    ? (auditThreadId || (isWide ? filteredAudit[0]?.thread?.id : null))
    : null
  const activeAudit = filteredAudit.find(({ thread }) => thread.id === activeAuditId)
  const auditMessages = activeAudit?.thread ? (chatMessages[activeAudit.thread.id] || []) : []
  const showAuditThread = Boolean(isAudit && activeAudit && (auditThreadId || isWide))

  useEffect(() => {
    if (!activeAdminThread?.id || isAudit) return
    loadAdminStaffMessages(activeAdminThread.id)
    markAdminStaffThreadRead(activeAdminThread.id, 'admin')
  }, [activeAdminThread?.id, isAudit, loadAdminStaffMessages, markAdminStaffThreadRead])

  useEffect(() => {
    if (!activeAudit?.thread?.id || !isAudit) return
    loadChatMessages(activeAudit.thread.id)
  }, [activeAudit?.thread?.id, isAudit, loadChatMessages])

  const handleStaffSend = async (text) => {
    if (!activeStaffEntry?.staff) return
    setSending(true)
    try {
      let thread = activeAdminThread
      if (!thread) {
        thread = await ensureAdminStaffThread(activeStaffEntry.staff)
      }
      if (!thread) {
        toast('Sohbet başlatılamadı.', 'error')
        return
      }
      const { data: { user } } = await supabase.auth.getUser()
      const r = await sendAdminStaffMessage(thread, 'admin', user?.id, text)
      if (!r.success) toast(r.error || 'Mesaj gönderilemedi', 'error')
    } finally {
      setSending(false)
    }
  }

  const handleExportPdf = useCallback(async () => {
    if (!activeAudit?.thread) return
    setExporting(true)
    try {
      let messages = auditMessages
      if (!messages.length) {
        messages = await loadChatMessages(activeAudit.thread.id)
      }
      const memberName = activeAudit.member?.name || activeAudit.thread.memberName || 'Danışan'
      const staffName = activeAudit.staffMember?.name || activeAudit.thread.staffName || staffRoleLabel(activeAudit.thread.staffRole)
      const roleLabel = staffRoleLabel(activeAudit.thread.staffRole)
      await downloadChatTranscriptPdf({
        filename: `sohbet-${memberName.replace(/\s+/g, '-').toLowerCase()}-${roleLabel.toLowerCase()}.pdf`,
        title: 'Danışan — Personel Sohbet Kaydı',
        subtitle: `${memberName} ↔ ${staffName} (${roleLabel})`,
        participants: [memberName, `${staffName} (${roleLabel})`],
        messages: mapMemberStaffMessagesForExport(messages, {
          memberName,
          staffName,
          staffRole: activeAudit.thread.staffRole,
        }),
      })
      toast('PDF indirildi.', 'success')
    } catch {
      toast('PDF oluşturulamadı.', 'error')
    } finally {
      setExporting(false)
    }
  }, [activeAudit, auditMessages, loadChatMessages, toast])

  const staffInbox = (
    <>
      <div className="shrink-0 border-b border-cream-100 p-2.5 sm:p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Personel ara…"
            className="w-full rounded-xl border border-cream-200 py-2.5 pl-9 pr-3 text-base outline-none focus:border-brand-300 sm:text-sm"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-2">
        {filteredStaff.map(({ staff: s, thread }) => {
          const unread = adminStaffThreadUnreadCount(thread, 'admin')
          const isActive = String(s.id) === String(activeStaffId)
          const meta = staffRoleMeta(s.role)
          return (
            <motion.button
              key={s.id}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/admin/messages/staff/${s.id}`)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                isActive ? 'bg-cream-900 text-white shadow-md' : unread > 0 ? 'bg-amber-50/80 hover:bg-amber-50' : 'hover:bg-cream-50'
              }`}
            >
              <AvatarWithPresence lastSeenAt={lastSeenAt(s.id)} online={isOnline(s.id)}>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${isActive ? 'bg-white/15 text-white' : 'bg-cream-100 text-cream-800'}`}>
                  {(s.name || '?')[0]}
                </span>
              </AvatarWithPresence>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{s.name}</p>
                <p className={`truncate text-[11px] ${isActive ? 'text-white/75' : 'text-cream-800/50'}`}>
                  {meta.label}{thread?.lastPreview ? ` · ${thread.lastPreview}` : ''}
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

  const auditInbox = (
    <>
      <div className="shrink-0 border-b border-cream-100 p-2.5 sm:p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Danışan veya personel ara…"
            className="w-full rounded-xl border border-cream-200 py-2.5 pl-9 pr-3 text-base outline-none focus:border-brand-300 sm:text-sm"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-2">
        {filteredAudit.map(({ thread, member, staffMember }) => {
          const isActive = thread.id === activeAuditId
          const roleLabel = staffRoleLabel(thread.staffRole)
          return (
            <motion.button
              key={thread.id}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/admin/messages/audit/${thread.id}`)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                isActive ? 'bg-cream-900 text-white shadow-md' : 'hover:bg-cream-50'
              }`}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${isActive ? 'bg-white/15 text-white' : 'bg-brand-100 text-brand-700'}`}>
                <Eye className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{member?.name || thread.memberName || 'Danışan'}</p>
                <p className={`truncate text-[11px] ${isActive ? 'text-white/75' : 'text-cream-800/50'}`}>
                  {staffMember?.name || thread.staffName || roleLabel} · {roleLabel}
                </p>
              </div>
            </motion.button>
          )
        })}
      </div>
    </>
  )

  const staffThreadPanel = activeStaffEntry ? (
    <>
      <ChatThreadHeader
        title={activeStaffEntry.staff.name}
        subtitle={`${staffRoleMeta(activeStaffEntry.staff.role).label} · Admin iletişimi`}
        presence={(
          <PresenceIndicator
            lastSeenAt={lastSeenAt(activeStaffEntry.staff.id)}
            online={isOnline(activeStaffEntry.staff.id)}
            showLabel
          />
        )}
      />
      <ChatThreadBody>
        <AdminStaffChatView
          messages={adminMessages}
          perspective="admin"
          onSend={handleStaffSend}
          disabled={sending}
          live
          remoteName={activeStaffEntry.staff.name}
        />
      </ChatThreadBody>
    </>
  ) : (
    <div className="flex flex-1 items-center justify-center p-6 text-sm text-cream-800/50">Personel seçin</div>
  )

  const auditThreadPanel = activeAudit ? (
    <>
      <ChatThreadHeader
        title={`${activeAudit.member?.name || activeAudit.thread.memberName} ↔ ${activeAudit.staffMember?.name || activeAudit.thread.staffName}`}
        subtitle={`${staffRoleLabel(activeAudit.thread.staffRole)} · Salt okunur denetim görünümü`}
        actions={(
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-50 px-2.5 py-2 text-[11px] font-semibold text-brand-700 ring-1 ring-brand-100 transition hover:bg-brand-100 disabled:opacity-50 sm:px-3 sm:text-xs"
          >
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">PDF İndir</span>
            <span className="sm:hidden">PDF</span>
          </button>
        )}
      />
      <ChatThreadBody>
        <ChatThreadView
          messages={auditMessages}
          perspective="staff"
          staffRole={activeAudit.thread.staffRole}
          readOnly
          remoteName={activeAudit.member?.name || activeAudit.thread.memberName}
        />
      </ChatThreadBody>
    </>
  ) : (
    <div className="flex flex-1 items-center justify-center p-6 text-sm text-cream-800/50">Sohbet seçin</div>
  )

  const showThread = isAudit ? showAuditThread : showStaffThread
  const inbox = isAudit ? auditInbox : staffInbox
  const threadPanel = isAudit ? auditThreadPanel : staffThreadPanel
  const backPath = isAudit ? '/admin/messages/audit' : '/admin/messages'
  const backLabel = isAudit ? 'Denetim listesi' : 'Personel'

  return (
    <PanelPageShell maxWidth="max-w-6xl" className="w-full max-w-none space-y-3 md:max-w-6xl md:space-y-4">
      <PanelPageHeader
        title="Mesajlar"
        subtitle={showThread && !isWide ? undefined : 'Personel ile iletişim ve danışan sohbet denetimi'}
        icon={MessageCircle}
        accent="brand"
        compact={showThread && !isWide}
      />

      <div className="flex flex-wrap gap-2">
        <TabLink to="/admin/messages" active={!isAudit}>Personel Sohbetleri</TabLink>
        <TabLink to="/admin/messages/audit" active={isAudit}>Danışan Denetimi</TabLink>
      </div>

      {(!showThread || isWide) && (
        <div className="flex items-start gap-2 rounded-xl border border-cream-200 bg-cream-50/80 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-cream-700" />
          <p className="text-[11px] leading-relaxed text-cream-800/75 sm:text-xs">
            {isAudit
              ? 'Danışan–personel sohbetleri salt okunurdur. PDF olarak indirip arşivleyebilirsiniz.'
              : 'Personel ile doğrudan mesajlaşın. Tüm konuşmalar kayıt altına alınır.'}
          </p>
        </div>
      )}

      {(isAudit ? filteredAudit.length === 0 : filteredStaff.length === 0) ? (
        <EmptyState
          icon={MessageCircle}
          title={isAudit ? 'Denetlenecek sohbet yok' : 'Personel bulunamadı'}
          description={isAudit ? 'Danışan–personel mesajlaşması başladığında burada görünür.' : 'Kadro listesinden personel ekleyin.'}
        />
      ) : (
        <ChatPageFrame className="min-h-[calc(100dvh-11rem)] md:min-h-[calc(100dvh-13rem)]">
          <ChatWorkspace
            showThread={showThread}
            onBack={() => navigate(backPath)}
            backLabel={backLabel}
            inbox={inbox}
            thread={threadPanel}
          />
        </ChatPageFrame>
      )}
    </PanelPageShell>
  )
}
