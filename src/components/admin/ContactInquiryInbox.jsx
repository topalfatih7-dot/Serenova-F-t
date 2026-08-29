import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, CheckCircle2, Copy, Loader2, Mail, MessageSquare, Phone,
  Search, Send, ShieldCheck, UserRound,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import EmptyState from '../ui/EmptyState'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { contactSubjectLabel } from '../../utils/contactInquiry'

const STATUS = {
  new: { label: 'Yeni', style: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  read: { label: 'Okundu', style: 'bg-brand-50 text-brand-800 ring-brand-200', dot: 'bg-brand-500' },
  resolved: { label: 'Çözüldü', style: 'bg-sage-50 text-sage-800 ring-sage-200', dot: 'bg-sage-500' },
}

const FILTERS = [
  { id: 'new', label: 'Yeni' },
  { id: 'read', label: 'Okundu' },
  { id: 'resolved', label: 'Çözüldü' },
  { id: 'replied', label: 'Yanıtlanan' },
  { id: 'all', label: 'Tümü' },
]

const MAX_REPLY = 4000

function formatWhen(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return formatDistanceToNow(date, { addSuffix: true, locale: tr })
}

function formatExact(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })
}

function initials(name) {
  return String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?'
}

export default function ContactInquiryInbox({
  inquiries = [],
  onStatusChange,
  onReply,
  busyId,
}) {
  const isWide = useMediaQuery('(min-width: 1024px)')
  const [filter, setFilter] = useState('new')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [draft, setDraft] = useState('')
  const [markResolved, setMarkResolved] = useState(true)
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState(false)
  const threadRef = useRef(null)
  const markedReadRef = useRef(new Set())
  const onStatusChangeRef = useRef(onStatusChange)
  onStatusChangeRef.current = onStatusChange

  const counts = useMemo(() => {
    const list = inquiries || []
    return {
      new: list.filter((i) => i.status === 'new').length,
      read: list.filter((i) => i.status === 'read').length,
      resolved: list.filter((i) => i.status === 'resolved').length,
      replied: list.filter((i) => (i.replies || []).length > 0).length,
      all: list.length,
    }
  }, [inquiries])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (inquiries || [])
      .filter((inq) => {
        if (filter === 'replied') return (inq.replies || []).length > 0
        if (filter !== 'all' && inq.status !== filter) return false
        if (!q) return true
        return [inq.name, inq.email, inq.phone, inq.message, contactSubjectLabel(inq.subject)]
          .join(' ')
          .toLowerCase()
          .includes(q)
      })
      .slice()
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  }, [inquiries, filter, search])

  const selected = useMemo(
    () => (inquiries || []).find((i) => i.id === selectedId) || null,
    [inquiries, selectedId],
  )

  useEffect(() => {
    if (!selected || selected.status !== 'new') return
    if (markedReadRef.current.has(selected.id)) return
    markedReadRef.current.add(selected.id)
    onStatusChangeRef.current?.(selected, 'read', { silent: true })
  }, [selected])

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' })
  }, [selected?.id, selected?.replies?.length])

  const openInquiry = (id) => {
    const inq = (inquiries || []).find((i) => i.id === id)
    setSelectedId(id)
    setDraft('')
    setMarkResolved(inq ? inq.status !== 'resolved' : true)
  }
  const closeMobile = () => setSelectedId(null)

  const copyEmail = async () => {
    if (!selected?.email) return
    try {
      await navigator.clipboard.writeText(selected.email)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* ignore */
    }
  }

  const sendReply = async () => {
    const text = draft.trim()
    if (!selected || text.length < 5 || sending) return
    setSending(true)
    try {
      const result = await onReply?.(selected, {
        reply: text,
        markResolved: selected.status === 'resolved' ? false : markResolved,
      })
      if (result?.success) setDraft('')
    } finally {
      setSending(false)
    }
  }

  const showList = isWide || !selected
  const showThread = Boolean(selected && (isWide || selectedId))

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                filter === f.id
                  ? 'bg-cream-900 text-white'
                  : 'bg-white text-cream-800 ring-1 ring-cream-200 hover:bg-cream-50'
              }`}
            >
              {f.label}
              <span className={`ml-1.5 ${filter === f.id ? 'text-white/70' : 'text-cream-800/45'}`}>
                {counts[f.id] || 0}
              </span>
            </button>
          ))}
        </div>
        <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-800/40" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ad, e-posta veya mesaj ara"
            className="w-full rounded-xl border border-cream-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>

      {filtered.length === 0 && !selected ? (
        <EmptyState
          icon={MessageSquare}
          title={search ? 'Sonuç yok' : 'İletişim mesajı yok'}
          description={search ? 'Aramayı veya filtreyi değiştirmeyi deneyin.' : 'Ana sayfa Bize Ulaşın formu'}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-sm lg:grid lg:grid-cols-[minmax(280px,34%)_1fr] lg:min-h-[36rem]">
          {showList && (
            <div className={`border-cream-100 ${isWide ? 'border-r' : ''}`}>
              <ul className="max-h-[min(70vh,36rem)] divide-y divide-cream-100 overflow-y-auto overscroll-contain">
                {filtered.map((inq) => {
                  const st = STATUS[inq.status] || STATUS.new
                  const active = inq.id === selectedId
                  const replyCount = inq.replies?.length || 0
                  return (
                    <li key={inq.id}>
                      <button
                        type="button"
                        onClick={() => openInquiry(inq.id)}
                        className={`flex w-full gap-3 px-4 py-3.5 text-left transition ${
                          active ? 'bg-brand-50/70' : 'hover:bg-cream-50'
                        }`}
                        aria-current={active ? 'true' : undefined}
                      >
                        <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${st.dot}`} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span className="truncate font-semibold text-cream-900">{inq.name}</span>
                            <span className="shrink-0 text-[11px] text-cream-800/45">{formatWhen(inq.createdAt)}</span>
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-cream-800/55">
                            {contactSubjectLabel(inq.subject)} · {inq.email}
                          </span>
                          <span className="mt-1 line-clamp-2 text-sm text-cream-800/70">{inq.message}</span>
                          <span className="mt-2 flex flex-wrap items-center gap-1.5">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${st.style}`}>
                              {st.label}
                            </span>
                            {replyCount > 0 && (
                              <span className="rounded-full bg-cream-100 px-2 py-0.5 text-[10px] font-semibold text-cream-800">
                                {replyCount} yanıt
                              </span>
                            )}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {showThread && selected && (
            <div className="flex min-h-[28rem] flex-col lg:min-h-[36rem]">
              <div className="flex items-start gap-3 border-b border-cream-100 px-4 py-4 sm:px-5">
                {!isWide && (
                  <button
                    type="button"
                    onClick={closeMobile}
                    className="mt-0.5 rounded-lg p-1.5 text-cream-800/60 hover:bg-cream-100"
                    aria-label="Listeye dön"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                )}
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 font-display text-sm font-bold text-brand-700">
                  {initials(selected.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-semibold text-cream-900">{selected.name}</h2>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${STATUS[selected.status]?.style || STATUS.new.style}`}>
                      {STATUS[selected.status]?.label || selected.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-cream-800/60">{contactSubjectLabel(selected.subject)}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-cream-800/70">
                    <a href={`mailto:${selected.email}`} className="inline-flex items-center gap-1 hover:text-brand-700">
                      <Mail className="h-3.5 w-3.5" /> {selected.email}
                    </a>
                    <button
                      type="button"
                      onClick={copyEmail}
                      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-cream-100"
                    >
                      <Copy className="h-3 w-3" /> {copied ? 'Kopyalandı' : 'Kopyala'}
                    </button>
                    {selected.phone ? (
                      <a href={`tel:${selected.phone}`} className="inline-flex items-center gap-1 hover:text-brand-700">
                        <Phone className="h-3.5 w-3.5" /> {selected.phone}
                      </a>
                    ) : null}
                  </div>
                </div>
                {selected.status !== 'resolved' && (
                  <button
                    type="button"
                    disabled={busyId === selected.id}
                    onClick={() => onStatusChange?.(selected, 'resolved')}
                    className="hidden shrink-0 items-center gap-1.5 rounded-xl bg-sage-50 px-3 py-2 text-xs font-semibold text-sage-800 ring-1 ring-sage-200 hover:bg-sage-100 sm:inline-flex"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Çözüldü
                  </button>
                )}
              </div>

              <div ref={threadRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-[linear-gradient(180deg,#faf8f4_0%,#fff_48%)] px-4 py-4 sm:px-5">
                <div className="flex justify-start">
                  <div className="max-w-[92%] rounded-2xl rounded-tl-md bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-cream-200 sm:max-w-[80%]">
                    <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-cream-800/45">
                      <UserRound className="h-3 w-3" /> {selected.name}
                    </div>
                    <p className="whitespace-pre-line text-cream-900">{selected.message}</p>
                    <p className="mt-2 text-[11px] text-cream-800/40">{formatExact(selected.createdAt)}</p>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {(selected.replies || []).map((reply) => (
                    <motion.div
                      key={reply.id || reply.sentAt}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-end"
                    >
                      <div className="max-w-[92%] rounded-2xl rounded-tr-md bg-brand-600 px-4 py-3 text-sm text-white shadow-sm sm:max-w-[80%]">
                        <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/70">
                          <ShieldCheck className="h-3 w-3" /> Yeni Form
                        </div>
                        <p className="whitespace-pre-line">{reply.body}</p>
                        <p className="mt-2 text-[11px] text-white/55">
                          E-posta gönderildi · {formatExact(reply.sentAt)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="border-t border-cream-100 bg-white px-4 py-3 sm:px-5">
                <label htmlFor="contact-reply" className="sr-only">Yanıt yazın</label>
                <textarea
                  id="contact-reply"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.slice(0, MAX_REPLY))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault()
                      sendReply()
                    }
                  }}
                  rows={3}
                  placeholder={`${selected.name} adlı kişinin e-postasına yanıt yazın…`}
                  className="w-full resize-none rounded-xl border border-cream-200 bg-cream-50/40 px-3.5 py-3 text-sm outline-none transition focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100"
                />
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    {selected.status !== 'resolved' && (
                      <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-cream-800/70">
                        <input
                          type="checkbox"
                          checked={markResolved}
                          onChange={(e) => setMarkResolved(e.target.checked)}
                          className="accent-brand-600"
                        />
                        Gönderince çözüldü işaretle
                      </label>
                    )}
                    <span className="text-[11px] text-cream-800/40">{draft.trim().length}/{MAX_REPLY}</span>
                  </div>
                  <button
                    type="button"
                    onClick={sendReply}
                    disabled={sending || draft.trim().length < 5}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {sending ? 'Gönderiliyor…' : 'E-posta gönder'}
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-cream-800/45">
                  Yanıt {selected.email} adresine gider. Gönder: Ctrl/⌘ + Enter
                </p>
              </div>
            </div>
          )}

          {isWide && !selected && filtered.length > 0 && (
            <div className="flex min-h-[36rem] flex-col items-center justify-center px-6 text-center">
              <MessageSquare className="h-10 w-10 text-cream-300" />
              <p className="mt-3 font-display text-lg font-semibold text-cream-900">Bir mesaj seçin</p>
              <p className="mt-1 max-w-xs text-sm text-cream-800/55">Soldan bir talebi açın; yanıtınız ilgili kişinin e-postasına gider.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
