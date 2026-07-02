import { useEffect, useMemo, useState } from 'react'
import { Shield, MessageCircle } from 'lucide-react'
import PanelPageHeader, { PanelPageShell } from '../../components/layout/PanelPageHeader'
import AdminStaffChatView from '../../components/chat/AdminStaffChatView'
import { ChatPageFrame, ChatThreadBody, ChatThreadHeader, ChatThreadPanel, CHAT_PAGE_SHELL_CLASS } from '../../components/chat/ChatWorkspace'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { useChatPresence } from '../../hooks/useChatPresence'
import PresenceIndicator from '../../components/ui/PresenceIndicator'

export default function StaffAdminMessagesPage() {
  const { toast } = useToast()
  const { anyAdminOnline } = useChatPresence([], { includeAdmins: true })
  const {
    staffUser, adminStaffThreads, adminStaffMessages,
    loadAdminStaffMessages, sendAdminStaffMessage, markAdminStaffThreadRead,
  } = useApp()

  const [sending, setSending] = useState(false)

  const thread = useMemo(
    () => adminStaffThreads.find((t) => String(t.staffId) === String(staffUser?.id)) || adminStaffThreads[0],
    [adminStaffThreads, staffUser?.id],
  )

  const messages = thread ? (adminStaffMessages[thread.id] || []) : []

  useEffect(() => {
    if (!thread?.id) return undefined
    loadAdminStaffMessages(thread.id)
    markAdminStaffThreadRead(thread.id, 'staff')
    const poll = setInterval(() => loadAdminStaffMessages(thread.id), 8000)
    return () => clearInterval(poll)
  }, [thread?.id, loadAdminStaffMessages, markAdminStaffThreadRead])

  const handleSend = async (text) => {
    if (!thread) return
    setSending(true)
    try {
      const r = await sendAdminStaffMessage(thread, 'staff', staffUser.id, text)
      if (!r.success) toast(r.error || 'Mesaj gönderilemedi', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <PanelPageShell maxWidth="max-w-3xl" spacing="" className={`w-full max-w-none md:max-w-4xl ${CHAT_PAGE_SHELL_CLASS}`}>
      <PanelPageHeader
        className="shrink-0"
        title="Admin Mesajları"
        subtitle="Yönetim ekibi ile doğrudan iletişim"
        icon={MessageCircle}
        accent="brand"
      />

      <div className="shrink-0 flex items-start gap-2 rounded-xl border border-cream-200 bg-cream-50/80 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-cream-700" />
        <p className="text-[11px] leading-relaxed text-cream-800/75 sm:text-xs">
          Admin ile yaptığınız tüm mesajlaşmalar kayıt altına alınır.
        </p>
      </div>

      <ChatPageFrame>
        <ChatThreadPanel className="overflow-hidden rounded-xl border border-cream-200 bg-white shadow-sm md:rounded-2xl">
          <ChatThreadHeader
            title="Admin"
            subtitle="Yönetim ekibi"
            presence={<PresenceIndicator online={anyAdminOnline} showLabel />}
          />
          <ChatThreadBody>
            <AdminStaffChatView
              messages={messages}
              perspective="staff"
              onSend={handleSend}
              disabled={sending}
              live
              remoteName="Admin"
            />
          </ChatThreadBody>
        </ChatThreadPanel>
      </ChatPageFrame>
    </PanelPageShell>
  )
}
