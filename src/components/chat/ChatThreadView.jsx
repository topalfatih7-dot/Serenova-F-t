import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Send, Dumbbell, Apple, UserRound, Info, Radio } from 'lucide-react'
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
}

export default function ChatThreadView({
  messages = [],
  perspective = 'member',
  staffRole = 'coach',
  onSend,
  disabled = false,
  live = false,
  remoteName = '',
}) {
  const [text, setText] = useState('')
  const scrollRef = useRef(null)
  const meta = ROLE_META[staffRole] || ROLE_META.coach
  const StaffIcon = meta.icon

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length])

  const send = () => {
    const value = text.trim()
    if (!value) return
    onSend?.(value)
    setText('')
  }

  const labelFor = (m) => {
    if (m.senderType === 'system') return 'Sistem'
    if (m.senderType === 'staff') return meta.staffLabel
    return 'Siz'
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {live && (
        <div className="mb-2 shrink-0 flex items-center gap-2 rounded-full bg-sage-50 px-3 py-1.5 text-xs font-semibold text-sage-700">
          <Radio className="h-3.5 w-3.5 animate-pulse" />
          Canlı — mesajlar kayıt altına alınır
        </div>
      )}

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
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
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm ${bubbleCls}`}>
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

      {!disabled && (
        <div className="mt-3 flex shrink-0 items-end gap-2 border-t border-cream-100 bg-white pt-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            rows={2}
            placeholder="Mesajınızı yazın…"
            className="flex-1 resize-none rounded-2xl border border-cream-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
          />
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={send}
            disabled={!text.trim()}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-lg shadow-brand-200/50 disabled:opacity-40"
            aria-label="Gönder"
          >
            <Send className="h-4 w-4" />
          </motion.button>
        </div>
      )}
    </div>
  )
}
