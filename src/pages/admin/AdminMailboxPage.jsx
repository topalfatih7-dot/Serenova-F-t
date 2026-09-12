import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Archive, ArrowLeft, Inbox, Loader2, Mail, Paperclip, Plus, RefreshCw,
  Search, Send, Settings2, Trash2,
} from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import PanelPageHeader, { PanelPageShell } from '../../components/layout/PanelPageHeader'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useToast } from '../../context/ToastContext'
import { mailboxRequest, fileToMailboxAttachment } from '../../services/mailboxApi'

const FOLDERS = [
  { id: 'inbox', label: 'Gelen', icon: Inbox },
  { id: 'sent', label: 'Gönderilen', icon: Send },
  { id: 'archive', label: 'Arşiv', icon: Archive },
  { id: 'settings', label: 'Ayarlar', icon: Settings2 },
]

function formatWhen(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })
}

function initials(name, email) {
  const source = String(name || email || '?')
  return source
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?'
}

function MailHtml({ html, text }) {
  const srcDoc = String(html || '').trim()
  if (srcDoc) {
    return (
      <iframe
        title="E-posta içeriği"
        sandbox=""
        referrerPolicy="no-referrer"
        className="h-[min(28rem,50vh)] w-full rounded-xl bg-white"
        srcDoc={srcDoc}
      />
    )
  }
  return <p className="whitespace-pre-line text-sm text-cream-900">{text || '(Boş ileti)'}</p>
}

const emptyCompose = {
  aliasEmail: '',
  to: '',
  cc: '',
  subject: '',
  body: '',
  templateId: '',
}

export default function AdminMailboxPage() {
  const { toast } = useToast()
  const isWide = useMediaQuery('(min-width: 1024px)')
  const threadRef = useRef(null)
  const [folder, setFolder] = useState('inbox')
  const [meta, setMeta] = useState({ aliases: [], templates: [], mailConfigured: true, unreadCount: 0 })
  const [threads, setThreads] = useState([])
  const [aliasFilter, setAliasFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [thread, setThread] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [loadingThread, setLoadingThread] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [composeOpen, setComposeOpen] = useState(false)
  const [compose, setCompose] = useState(emptyCompose)
  const [composeFiles, setComposeFiles] = useState([])
  const [sending, setSending] = useState(false)
  const [replyBody, setReplyBody] = useState('')
  const [replyFiles, setReplyFiles] = useState([])
  const [aliasDraft, setAliasDraft] = useState({ email: '', displayName: 'Yeni Form', signature: '' })
  const [templateDraft, setTemplateDraft] = useState({ name: '', subject: '', body: '' })
  const folderRef = useRef(folder)
  folderRef.current = folder

  const loadMeta = useCallback(async () => {
    const json = await mailboxRequest('meta')
    setMeta({
      aliases: json.aliases || [],
      templates: json.templates || [],
      mailConfigured: json.mailConfigured !== false,
      unreadCount: json.unreadCount || 0,
    })
    setCompose((prev) => ({
      ...prev,
      aliasEmail: prev.aliasEmail || json.aliases?.[0]?.email || '',
    }))
  }, [])

  const loadList = useCallback(async () => {
    const activeFolder = folderRef.current
    if (activeFolder === 'settings') return
    setLoadingList(true)
    try {
      const json = await mailboxRequest('list', {
        folder: activeFolder,
        aliasId: aliasFilter || undefined,
        q: search,
      })
      setThreads(json.threads || [])
    } catch (err) {
      toast(err.message || 'Liste alınamadı', 'error')
    } finally {
      setLoadingList(false)
    }
  }, [aliasFilter, search, toast])

  useEffect(() => {
    loadMeta().catch((err) => toast(err.message || 'Kutu bilgisi alınamadı', 'error'))
  }, [loadMeta, toast])

  useEffect(() => {
    loadList()
  }, [loadList, folder])

  const openThread = async (id) => {
    setSelectedId(id)
    setLoadingThread(true)
    setReplyBody('')
    setReplyFiles([])
    try {
      const json = await mailboxRequest('thread', { threadId: id })
      setThread(json.thread)
      setMessages(json.messages || [])
      loadList()
      loadMeta()
    } catch (err) {
      toast(err.message || 'Konuşma açılamadı', 'error')
    } finally {
      setLoadingThread(false)
    }
  }

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight })
  }, [messages.length, selectedId])

  const syncInbox = async () => {
    setSyncing(true)
    try {
      const json = await mailboxRequest('sync')
      toast(
        json.ingested
          ? `${json.ingested} yeni mail alındı`
          : 'Yeni gelen mail yok (MX henüz Resend’e bakmıyorsa normal)',
        'success',
      )
      await loadList()
      await loadMeta()
    } catch (err) {
      toast(err.message || 'Senkron başarısız', 'error')
    } finally {
      setSyncing(false)
    }
  }

  const applyTemplate = (id, setter) => {
    const tpl = meta.templates.find((t) => t.id === id)
    if (!tpl) return
    setter((prev) => ({
      ...prev,
      templateId: id,
      subject: prev.subject || tpl.subject,
      body: tpl.body,
      aliasEmail: prev.aliasEmail || meta.aliases.find((a) => a.id === tpl.aliasId)?.email || prev.aliasEmail,
    }))
  }

  const sendCompose = async (event) => {
    event?.preventDefault?.()
    event?.stopPropagation?.()
    if (sending) return
    setSending(true)
    try {
      const attachments = await Promise.all(composeFiles.map(fileToMailboxAttachment))
      const json = await mailboxRequest('send', {
        aliasEmail: compose.aliasEmail,
        to: compose.to,
        cc: compose.cc,
        subject: compose.subject,
        body: compose.body,
        attachments,
      })
      toast('E-posta gönderildi', 'success')
      setComposeOpen(false)
      setCompose((prev) => ({ ...emptyCompose, aliasEmail: prev.aliasEmail }))
      setComposeFiles([])
      setFolder('sent')
      setSelectedId(json.threadId)
      if (json.threadId) await openThread(json.threadId)
      else await loadList()
    } catch (err) {
      toast(err.message || 'Gönderilemedi', 'error')
    } finally {
      setSending(false)
    }
  }

  const lastInbound = useMemo(
    () => [...messages].reverse().find((m) => m.direction === 'inbound'),
    [messages],
  )

  const sendReply = async () => {
    const replyTo = lastInbound?.fromEmail
      || [...messages].reverse().find((m) => m.toEmails?.length)?.toEmails?.[0]
    if (!thread || replyBody.trim().length < 2 || sending || !replyTo) return
    setSending(true)
    try {
      const attachments = await Promise.all(replyFiles.map(fileToMailboxAttachment))
      await mailboxRequest('reply', {
        threadId: thread.id,
        aliasEmail: thread.aliasEmail,
        to: replyTo,
        subject: thread.subject,
        body: replyBody,
        attachments,
      })
      toast('Yanıt gönderildi', 'success')
      setReplyBody('')
      setReplyFiles([])
      await openThread(thread.id)
    } catch (err) {
      toast(err.message || 'Yanıt gönderilemedi', 'error')
    } finally {
      setSending(false)
    }
  }

  const archiveThread = async () => {
    if (!thread) return
    try {
      await mailboxRequest('archive', {
        threadId: thread.id,
        folder: folder === 'archive' ? 'inbox' : 'archive',
      })
      toast(folder === 'archive' ? 'Gelen kutusuna alındı' : 'Arşivlendi', 'success')
      setSelectedId(null)
      setThread(null)
      setMessages([])
      await loadList()
    } catch (err) {
      toast(err.message || 'Arşivlenemedi', 'error')
    }
  }

  const downloadAttachment = async (attachmentId, filename) => {
    try {
      const json = await mailboxRequest('attachment-url', { attachmentId })
      const link = document.createElement('a')
      link.href = json.url
      link.download = filename || 'ek'
      link.rel = 'noopener'
      link.target = '_blank'
      link.click()
    } catch (err) {
      toast(err.message || 'Ek indirilemedi', 'error')
    }
  }

  const saveAlias = async (event) => {
    event.preventDefault()
    try {
      await mailboxRequest('alias-upsert', aliasDraft)
      toast('Adres kaydedildi', 'success')
      setAliasDraft({ email: '', displayName: 'Yeni Form', signature: '' })
      await loadMeta()
    } catch (err) {
      toast(err.message || 'Adres kaydedilemedi', 'error')
    }
  }

  const deleteAlias = async (id) => {
    try {
      await mailboxRequest('alias-delete', { id })
      toast('Adres silindi', 'success')
      await loadMeta()
    } catch (err) {
      toast(err.message || 'Silinemedi', 'error')
    }
  }

  const saveTemplate = async (event) => {
    event.preventDefault()
    try {
      await mailboxRequest('template-upsert', templateDraft)
      toast('Şablon kaydedildi', 'success')
      setTemplateDraft({ name: '', subject: '', body: '' })
      await loadMeta()
    } catch (err) {
      toast(err.message || 'Şablon kaydedilemedi', 'error')
    }
  }

  const deleteTemplate = async (id) => {
    try {
      await mailboxRequest('template-delete', { id })
      toast('Şablon silindi', 'success')
      await loadMeta()
    } catch (err) {
      toast(err.message || 'Silinemedi', 'error')
    }
  }

  const showList = folder !== 'settings' && (isWide || !selectedId)
  const showThread = folder !== 'settings' && Boolean(selectedId && (isWide || selectedId))

  return (
    <PanelPageShell>
      <PanelPageHeader
        title="E-posta yönetimi"
        subtitle={meta.mailConfigured
          ? 'info@ ve diğer yeniform.com adreslerinden oku, yanıtla, yeni mail at.'
          : 'RESEND_API_KEY yok — gönderim kapalı.'}
        icon={Mail}
        accent="teal"
        actions={(
          <>
            <button
              type="button"
              onClick={syncInbox}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold text-white hover:bg-white/25 disabled:opacity-60"
            >
              {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Gelenleri al
            </button>
            <button
              type="button"
              onClick={() => setComposeOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-brand-800 hover:bg-cream-50"
            >
              <Plus className="h-4 w-4" /> Yeni mail
            </button>
          </>
        )}
      />

      <div className="flex flex-wrap gap-1.5">
        {FOLDERS.map((item) => {
          const Icon = item.icon
          const active = folder === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setFolder(item.id)
                setSelectedId(null)
                setThread(null)
              }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                active ? 'bg-cream-900 text-white' : 'bg-white text-cream-800 ring-1 ring-cream-200 hover:bg-cream-50'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
              {item.id === 'inbox' && meta.unreadCount > 0 ? (
                <span className={active ? 'text-white/70' : 'text-cream-800/45'}>{meta.unreadCount}</span>
              ) : null}
            </button>
          )
        })}
      </div>

      {folder === 'settings' ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-cream-200 bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-cream-900">Adresler</h2>
            <p className="mt-1 text-sm text-cream-800/60">Yalnız @yeniform.com. MX Resend’e bakınca yeni alias hemen çalışır.</p>
            <ul className="mt-4 divide-y divide-cream-100">
              {meta.aliases.map((alias) => (
                <li key={alias.id} className="flex items-start justify-between gap-3 py-3">
                  <div>
                    <p className="font-semibold text-cream-900">{alias.displayName}</p>
                    <p className="text-sm text-cream-800/60">{alias.email}</p>
                  </div>
                  <button type="button" onClick={() => deleteAlias(alias.id)} className="rounded-lg p-2 text-cream-800/40 hover:bg-red-50 hover:text-red-600" aria-label="Sil">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <form onSubmit={saveAlias} className="mt-4 space-y-3">
              <input
                required
                value={aliasDraft.email}
                onChange={(e) => setAliasDraft((p) => ({ ...p, email: e.target.value }))}
                placeholder="destek@yeniform.com"
                className="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
              />
              <input
                value={aliasDraft.displayName}
                onChange={(e) => setAliasDraft((p) => ({ ...p, displayName: e.target.value }))}
                placeholder="Görünen ad"
                className="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
              />
              <textarea
                value={aliasDraft.signature}
                onChange={(e) => setAliasDraft((p) => ({ ...p, signature: e.target.value }))}
                placeholder="İmza"
                rows={3}
                className="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
              />
              <button type="submit" className="rounded-xl bg-cream-900 px-4 py-2.5 text-sm font-semibold text-white">Adres ekle</button>
            </form>
          </section>

          <section className="rounded-2xl border border-cream-200 bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-cream-900">Şablonlar</h2>
            <ul className="mt-4 divide-y divide-cream-100">
              {meta.templates.map((tpl) => (
                <li key={tpl.id} className="flex items-start justify-between gap-3 py-3">
                  <div>
                    <p className="font-semibold text-cream-900">{tpl.name}</p>
                    <p className="text-sm text-cream-800/60">{tpl.subject}</p>
                  </div>
                  <button type="button" onClick={() => deleteTemplate(tpl.id)} className="rounded-lg p-2 text-cream-800/40 hover:bg-red-50 hover:text-red-600" aria-label="Sil">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <form onSubmit={saveTemplate} className="mt-4 space-y-3">
              <input
                required
                value={templateDraft.name}
                onChange={(e) => setTemplateDraft((p) => ({ ...p, name: e.target.value }))}
                placeholder="Şablon adı"
                className="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
              />
              <input
                value={templateDraft.subject}
                onChange={(e) => setTemplateDraft((p) => ({ ...p, subject: e.target.value }))}
                placeholder="Konu"
                className="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
              />
              <textarea
                required
                value={templateDraft.body}
                onChange={(e) => setTemplateDraft((p) => ({ ...p, body: e.target.value }))}
                placeholder="Gövde"
                rows={4}
                className="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
              />
              <button type="submit" className="rounded-xl bg-cream-900 px-4 py-2.5 text-sm font-semibold text-white">Şablon kaydet</button>
            </form>
          </section>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={aliasFilter}
              onChange={(e) => setAliasFilter(e.target.value)}
              className="rounded-xl border border-cream-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-300"
            >
              <option value="">Tüm adresler</option>
              {meta.aliases.map((alias) => (
                <option key={alias.id} value={alias.id}>{alias.email}</option>
              ))}
            </select>
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-800/40" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Konu veya özet ara"
                className="w-full rounded-xl border border-cream-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>

          {loadingList && threads.length === 0 ? (
            <div className="flex justify-center py-16 text-cream-800/40"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : threads.length === 0 && !selectedId ? (
            <EmptyState
              icon={Mail}
              title={folder === 'inbox' ? 'Gelen kutu boş' : 'Kayıt yok'}
              description="Yeni mail gönderin veya dışarıdan info@yeniform.com adresine yazılmasını bekleyin."
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-sm lg:grid lg:grid-cols-[minmax(280px,34%)_1fr] lg:min-h-[36rem]">
              {showList && (
                <ul className={`max-h-[min(70vh,36rem)] divide-y divide-cream-100 overflow-y-auto ${isWide ? 'border-r border-cream-100' : ''}`}>
                  {threads.map((item) => {
                    const active = item.id === selectedId
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => openThread(item.id)}
                          className={`flex w-full gap-3 px-4 py-3.5 text-left ${active ? 'bg-brand-50/70' : 'hover:bg-cream-50'}`}
                        >
                          <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.unreadCount ? 'bg-brand-500' : 'bg-cream-200'}`} />
                          <span className="min-w-0 flex-1">
                            <span className="flex justify-between gap-2">
                              <span className="truncate font-semibold text-cream-900">{item.subject || '(konu yok)'}</span>
                              <span className="shrink-0 text-[11px] text-cream-800/45">{formatWhen(item.lastMessageAt)}</span>
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-cream-800/55">{item.aliasEmail}</span>
                            <span className="mt-1 line-clamp-2 text-sm text-cream-800/70">{item.snippet}</span>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}

              {showThread && (
                <div className="flex min-h-[28rem] flex-col lg:min-h-[36rem]">
                  {loadingThread && !thread ? (
                    <div className="flex flex-1 items-center justify-center text-cream-800/40"><Loader2 className="h-6 w-6 animate-spin" /></div>
                  ) : thread ? (
                    <>
                      <div className="flex items-start gap-3 border-b border-cream-100 px-4 py-4">
                        {!isWide && (
                          <button type="button" onClick={() => { setSelectedId(null); setThread(null) }} className="rounded-lg p-1.5 hover:bg-cream-100" aria-label="Listeye dön">
                            <ArrowLeft className="h-5 w-5" />
                          </button>
                        )}
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 font-display text-sm font-bold text-brand-700">
                          {initials(lastInbound?.fromName, lastInbound?.fromEmail || thread.aliasEmail)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h2 className="font-display text-lg font-semibold text-cream-900">{thread.subject}</h2>
                          <p className="text-sm text-cream-800/60">{thread.aliasEmail}{lastInbound?.fromEmail ? ` · ${lastInbound.fromEmail}` : ''}</p>
                        </div>
                        <button
                          type="button"
                          onClick={archiveThread}
                          className="hidden rounded-xl bg-cream-50 px-3 py-2 text-xs font-semibold text-cream-800 ring-1 ring-cream-200 sm:inline-flex"
                        >
                          {folder === 'archive' ? 'Geri al' : 'Arşivle'}
                        </button>
                      </div>

                      <div ref={threadRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[linear-gradient(180deg,#faf8f4_0%,#fff_48%)] px-4 py-4">
                        {messages.map((msg) => {
                          const outbound = msg.direction === 'outbound'
                          return (
                            <article key={msg.id} className={`flex ${outbound ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm shadow-sm sm:max-w-[80%] ${
                                outbound
                                  ? 'rounded-tr-md bg-brand-600 text-white'
                                  : 'rounded-tl-md bg-white ring-1 ring-cream-200'
                              }`}
                              >
                                <p className={`mb-1.5 text-[10px] font-semibold uppercase tracking-wide ${outbound ? 'text-white/70' : 'text-cream-800/45'}`}>
                                  {outbound ? 'Yeni Form' : (msg.fromName || msg.fromEmail)}
                                </p>
                                {outbound ? (
                                  <p className="whitespace-pre-line">{msg.text}</p>
                                ) : (
                                  <div className="overflow-hidden rounded-lg bg-white text-cream-900">
                                    <MailHtml html={msg.html} text={msg.text} />
                                  </div>
                                )}
                                {msg.attachments?.length ? (
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {msg.attachments.map((file) => (
                                      <button
                                        key={file.id}
                                        type="button"
                                        onClick={() => downloadAttachment(file.id, file.filename)}
                                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] ${
                                          outbound ? 'bg-white/15 text-white' : 'bg-cream-100 text-cream-800'
                                        }`}
                                      >
                                        <Paperclip className="h-3 w-3" /> {file.filename}
                                      </button>
                                    ))}
                                  </div>
                                ) : null}
                                <p className={`mt-2 text-[11px] ${outbound ? 'text-white/55' : 'text-cream-800/40'}`}>{formatWhen(msg.createdAt)}</p>
                              </div>
                            </article>
                          )
                        })}
                      </div>

                      <div className="border-t border-cream-100 bg-white px-4 py-3">
                        <textarea
                          value={replyBody}
                          onChange={(e) => setReplyBody(e.target.value)}
                          placeholder={lastInbound ? `${lastInbound.fromEmail} adresine yanıt` : 'Yanıt yazın'}
                          rows={3}
                          className="w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                        />
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-cream-800/70">
                            <Paperclip className="h-4 w-4" />
                            Ek
                            <input
                              type="file"
                              multiple
                              className="sr-only"
                              onChange={(e) => setReplyFiles(Array.from(e.target.files || []))}
                            />
                            {replyFiles.length ? <span>{replyFiles.length} dosya</span> : null}
                          </label>
                          <button
                            type="button"
                            disabled={sending || replyBody.trim().length < 2}
                            onClick={sendReply}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                          >
                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Yanıtla
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-1 items-center justify-center text-sm text-cream-800/45">Bir konuşma seçin</div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <Modal open={composeOpen} onClose={() => setComposeOpen(false)} title="Yeni e-posta" size="lg">
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-cream-800/70">Kimden
            <select
              value={compose.aliasEmail}
              onChange={(e) => setCompose((p) => ({ ...p, aliasEmail: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm"
            >
              {meta.aliases.filter((a) => a.isActive).map((alias) => (
                <option key={alias.id} value={alias.email}>{alias.displayName} · {alias.email}</option>
              ))}
            </select>
          </label>
          {meta.templates.length > 0 && (
            <label className="block text-xs font-semibold text-cream-800/70">Şablon
              <select
                value={compose.templateId}
                onChange={(e) => applyTemplate(e.target.value, setCompose)}
                className="mt-1 w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm"
              >
                <option value="">Şablon yok</option>
                {meta.templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                ))}
              </select>
            </label>
          )}
          <label className="block text-xs font-semibold text-cream-800/70">Kime
            <input
              required
              type="email"
              value={compose.to}
              onChange={(e) => setCompose((p) => ({ ...p, to: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm"
              placeholder="kisi@ornek.com"
            />
          </label>
          <label className="block text-xs font-semibold text-cream-800/70">Konu
            <input
              required
              value={compose.subject}
              onChange={(e) => setCompose((p) => ({ ...p, subject: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm"
            />
          </label>
          <label className="block text-xs font-semibold text-cream-800/70">Mesaj
            <textarea
              required
              rows={8}
              value={compose.body}
              onChange={(e) => setCompose((p) => ({ ...p, body: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-cream-200 px-3 py-2.5 text-sm"
            />
          </label>
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-cream-800/70">
            <Paperclip className="h-4 w-4" />
            Ek ekle
            <input
              type="file"
              multiple
              className="sr-only"
              onChange={(e) => setComposeFiles(Array.from(e.target.files || []))}
            />
            {composeFiles.length ? <span>{composeFiles.length} dosya</span> : null}
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setComposeOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-cream-800">Vazgeç</button>
            <button
              type="button"
              disabled={sending || !meta.mailConfigured}
              onClick={() => sendCompose()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Gönder
            </button>
          </div>
        </div>
      </Modal>
    </PanelPageShell>
  )
}
