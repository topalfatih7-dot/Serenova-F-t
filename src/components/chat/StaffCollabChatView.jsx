import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Dumbbell, Apple, Radio } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import useStickChatToBottom from '../../hooks/useStickChatToBottom'

const SENDER_META = {
  coach: {
    own: 'bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-md shadow-brand-200/40',
    other: 'bg-gradient-to-br from-brand-50 to-violet-50 text-cream-900 ring-1 ring-brand-100',
    label: 'Koç',
    icon: Dumbbell,
  },
  dietitian: {
    own: 'bg-gradient-to-br from-sage-500 to-emerald-600 text-white shadow-md shadow-sage-200/40',
    other: 'bg-gradient-to-br from-sage-50 to-emerald-50 text-cream-900 ring-1 ring-sage-100',
    label: 'Diyetisyen',
    icon: Apple,
  },
}

export default function StaffCollabChatView({
  messages = [],
  perspective = 'coach',
  onSend,
  disabled = false,
  readOnly = false,
  live = false,
  remoteName = '',
  memberName = '',
  coachName = '',
  dietitianName = '',
}) {
  const [text, setText] = useState('')
  const { scrollRef, onScroll } = useStickChatToBottom(messages)

  const send = () => {
    const value = text.trim()
    if (!value || disabled) return
    onSend?.(value)
    setText('')
  }

  const labelFor = (m) => {
    if (m.senderType === 'coach') return coachName || 'Koç'
    if (m.senderType === 'dietitian') return dietitianName || 'Diyetisyen'
    return 'Sistem'
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      {live && !readOnly && (
        <div className="mb-2 hidden shrink-0 items-center gap-2 rounded-full bg-sage-50 px-3 py-1 font-semibold text-sage-700 sm:flex sm:text-xs">
          <Radio className="h-3.5 w-3.5 animate-pulse" />
          <span className="truncate">Canlı — danışan hakkında ekip içi iletişim kayıt altında</span>
        </div>
      )}

      <div ref={scrollRef} onScroll={onScroll} className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-0.5 sm:space-y-3">
        {messages.length === 0 && (
          <div className="flex min-h-[120px] flex-col items-center justify-center rounded-2xl border border-dashed border-cream-200 bg-cream-50/40 p-4 text-center">
            <Dumbbell className="h-10 w-10 text-cream-300" />
            <p className="mt-3 text-sm font-medium text-cream-800/70">
              {remoteName && memberName
                ? `${remoteName} ile ${memberName} adına koordinasyon`
                : remoteName
                  ? `${remoteName} ile danışan koordinasyonuna başlayın`
                  : 'İlk mesajınızı yazın'}
            </p>
            <p className="mt-1 text-xs text-cream-800/45">Bu kanal atanmış koç ve diyetisyen arasındadır.</p>
          </div>
        )}
        {messages.map((m) => {
          const meta = SENDER_META[m.senderType] || SENDER_META.coach
          const Icon = meta.icon
          const isOwn = m.senderType === perspective
          const bubbleCls = isOwn ? meta.own : meta.other
          return (
            <motion.div
              key={m.id}
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[min(85%,24rem)] break-words rounded-2xl px-3.5 py-2 text-sm sm:px-4 sm:py-2.5 ${bubbleCls}`}>
                <div className={`mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide ${isOwn ? 'text-white/75' : 'text-cream-800/45'}`}>
                  <Icon className="h-3 w-3" />
                  {labelFor(m)}
                </div>
                <p className="whitespace-pre-line break-words leading-relaxed">{m.text}</p>
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
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-sage-600 text-white shadow-md disabled:opacity-40 sm:h-12 sm:w-12 sm:rounded-2xl"
            aria-label="Gönder"
          >
            <Send className="h-4 w-4" />
          </motion.button>
        </div>
      )}
    </div>
  )
}
