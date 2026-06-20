import { useState, useEffect, useRef } from 'react'
import { Send, ShieldCheck, UserRound, Info, Radio } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

function normalize(ticket) {
  if (ticket.messages?.length) return ticket.messages
  return [{ id: 'm0', from: 'member', text: ticket.message, createdAt: ticket.createdAt }]
}

export default function TicketThread({ ticket, perspective = 'admin', onReply, disabled, live = false }) {
  const [text, setText] = useState('')
  const messages = normalize(ticket)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length, ticket?.id])

  const send = () => {
    const value = text.trim()
    if (!value) return
    onReply?.(value)
    setText('')
  }

  return (
    <div className="flex flex-col">
      {live && (
        <div className="mb-3 flex items-center gap-2 text-xs font-medium text-sage-700">
          <Radio className="h-3.5 w-3.5 animate-pulse" />
          Canlı sohbet — mesajlar anında iletilir
        </div>
      )}
      <div ref={scrollRef} className="max-h-72 space-y-3 overflow-y-auto pr-1">
        {messages.map((m) => {
          if (m.from === 'system') {
            return (
              <div key={m.id} className="mx-auto flex max-w-[90%] items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-pre-line">{m.text}</span>
              </div>
            )
          }
          const own = m.from === perspective
          const isAdmin = m.from === 'admin'
          return (
            <div key={m.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${own ? 'bg-brand-500 text-white' : 'bg-cream-100 text-cream-900'}`}>
                <div className={`mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide ${own ? 'text-white/70' : 'text-cream-800/50'}`}>
                  {isAdmin ? <ShieldCheck className="h-3 w-3" /> : <UserRound className="h-3 w-3" />}
                  {isAdmin ? 'Destek Ekibi' : 'Üye'}
                </div>
                <p className="whitespace-pre-line">{m.text}</p>
                <p className={`mt-1 text-[10px] ${own ? 'text-white/60' : 'text-cream-800/40'}`}>
                  {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true, locale: tr })}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {!disabled && (
        <div className="mt-4 flex items-end gap-2 border-t border-cream-100 pt-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send() }}
            rows={2}
            placeholder={perspective === 'admin' ? 'Üyeye yanıt yazın...' : 'Mesajınızı yazın...'}
            className="flex-1 resize-none rounded-xl border border-cream-200 px-4 py-2.5 text-sm outline-none focus:border-brand-300"
          />
          <button
            type="button"
            onClick={send}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white hover:bg-brand-600"
            aria-label="Gönder"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
