import { useState } from 'react'
import { unlockNotificationAudio } from '../../utils/browserNotifications'
import { motion } from 'framer-motion'
import useStickChatToBottom from '../../hooks/useStickChatToBottom'
import { Send, Dumbbell, Apple, UserRound, Info, Radio, Stethoscope } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

const ROLE_META = {
  coach: {
    own: 'bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-md shadow-brand-200/40',
    other: 'bg-gradient-to-br from-brand-50 to-violet-50 text-cream-900 ring-1 ring-brand-100',
    icon: Dumbbell,
    staffLabel: 'Koç',
  },
  dietitian: {
    own: 'bg-gradient-to-br from-sage-500 to-emerald-600 text-white shadow-md shadow-sage-200/40',
    other: 'bg-gradient-to-br from-sage-50 to-emerald-50 text-cream-900 ring-1 ring-sage-100',
    icon: Apple,
    staffLabel: 'Diyetisyen',
  },
  doctor: {
    own: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-200/40',
    other: 'bg-gradient-to-br from-amber-50 to-orange-50 text-cream-900 ring-1 ring-amber-100',
    icon: Stethoscope,
    staffLabel: 'Doktor',
  },
}

export default function ChatThreadView({
  messages = [],
  perspective = 'member',
  staffRole = 'coach',
  onSend,
  disabled = false,
  readOnly = false,
  live = false,
  remoteName = '',
}) {
  const [text, setText] = useState('')
  const { scrollRef, onScroll } = useStickChatToBottom(messages)
  const meta = ROLE_META[staffRole] || ROLE_META.coach
  const StaffIcon = meta.icon

  const send = () => {
    const value = text.trim()
    if (!value || disabled) return
    unlockNotificationAudio().catch(() => {})
    onSend?.(value)
    setText('')
  }

  const labelFor = (m) => {
    if (m.senderType === 'system') return 'Sistem'
    const own = (perspective === 'member' && m.senderType === 'member')
      || (perspective === 'staff' && m.senderType === 'staff')
    if (own) return 'Siz'
    if (m.senderType === 'staff') return meta.staffLabel
    return remoteName || 'Danışan'
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      {live && !readOnly && (
        <div className="mb-2 hidden shrink-0 items-center gap-2 rounded-full bg-sage-50 px-3 py-1 sm:flex sm:text-xs font-semibold text-sage-700">
          <Radio className="h-3.5 w-3.5 animate-pulse" />
          <span className="truncate">Canlı — mesajlar kayıt altına alınır</span>
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-0.5 sm:space-y-3"
      >
        {messages.length === 0 && (
          <div className="flex min-h-[120px] flex-col items-center justify-center rounded-2xl border border-dashed border-cream-200 bg-cream-50/40 p-4 text-center">
            <StaffIcon className="h-10 w-10 text-cream-300" />
            <p className="mt-3 text-sm font-medium text-cream-800/70">
              {remoteName ? `${remoteName} ile sohbete başlayın` : 'İlk mesajınızı yazın'}
            </p>
            <p className="mt-1 text-xs text-cream-800/45">Mesajlar güvenli şekilde saklanır.</p>
          </div>
        )}
        {messages.map((m) => {
          if (m.senderType === 'system') {
            return (
              <div key={m.id} className="mx-auto flex max-w-[92%] items-start gap-2 rounded-2xl bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-100">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-pre-line">{m.text}</span>
              </div>
            )
          }
          const isOwn = (perspective === 'member' && m.senderType === 'member')
            || (perspective === 'staff' && m.senderType === 'staff')
          const bubbleCls = isOwn ? meta.own : meta.other
          return (
            <motion.div
              key={m.id}
              initial={false}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[min(100%,20rem)] rounded-2xl px-3.5 py-2 text-sm sm:max-w-[88%] sm:px-4 sm:py-2.5 ${bubbleCls}`}>
                <div className={`mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide ${isOwn ? 'text-white/75' : 'text-cream-800/45'}`}>
                  {m.senderType === 'staff' ? <StaffIcon className="h-3 w-3" /> : <UserRound className="h-3 w-3" />}
                  {labelFor(m)}
                </div>
                <p className="whitespace-pre-line leading-relaxed">{m.text}</p>
                <p className={`mt-1.5 text-[10px] ${isOwn ? 'text-white/60' : 'text-cream-800/40'}`}>
                  {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true, locale: tr })}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {!readOnly && (
        <div className="relative z-10 mt-2 flex shrink-0 items-end gap-2 border-t border-cream-100 bg-white pt-2 sm:mt-3 sm:pt-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            rows={1}
            placeholder="Mesaj yazın…"
            className="max-h-28 min-h-[44px] flex-1 resize-none rounded-xl border border-cream-200 bg-cream-50/50 px-3 py-2.5 text-base outline-none transition focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
          />
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={send}
            disabled={disabled || !text.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-md shadow-brand-200/50 disabled:opacity-40 sm:h-12 sm:w-12 sm:rounded-2xl sm:shadow-lg"
            aria-label="Gönder"
          >
            <Send className="h-4 w-4" />
          </motion.button>
        </div>
      )}
    </div>
  )
}
