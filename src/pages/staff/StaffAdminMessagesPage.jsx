import { useEffect, useMemo, useState } from 'react'
import { Shield, MessageCircle } from 'lucide-react'
import PanelPageHeader, { PanelPageShell } from '../../components/layout/PanelPageHeader'
import AdminStaffChatView from '../../components/chat/AdminStaffChatView'
import { ChatPageFrame, ChatThreadBody, ChatThreadHeader } from '../../components/chat/ChatWorkspace'
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
    if (!thread?.id) return
    loadAdminStaffMessages(thread.id)
    markAdminStaffThreadRead(thread.id, 'staff')
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
    <PanelPageShell maxWidth="max-w-3xl" className="w-full max-w-none space-y-3 md:max-w-4xl md:space-y-4">
      <PanelPageHeader
        title="Admin Mesajları"
        subtitle="Yönetim ekibi ile doğrudan iletişim"
        icon={MessageCircle}
        accent="brand"
      />

      <div className="flex items-start gap-2 rounded-xl border border-cream-200 bg-cream-50/80 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-cream-700" />
        <p className="text-[11px] leading-relaxed text-cream-800/75 sm:text-xs">
          Admin ile yaptığınız tüm mesajlaşmalar kayıt altına alınır.
        </p>
      </div>

      <ChatPageFrame className="min-h-[calc(100dvh-11rem)] md:min-h-[calc(100dvh-12rem)]">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-cream-200 bg-white shadow-sm md:rounded-2xl">
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
        </div>
      </ChatPageFrame>
    </PanelPageShell>
  )
}
