/**
 * Admin e-posta kutusu — Resend inbound ingest + admin CRUD.
 * action: admin_mailbox (contact.js) veya Svix webhook.
 */
import { randomUUID } from 'node:crypto'
import { getSupabaseAdmin } from './_supabaseAdmin.js'
import { requireAdmin } from './_guards.js'
import { enforceRateLimit, applyRateLimitHeaders } from './_rateLimit.js'
import { isMailConfigured, sendMail, mailboxPersonalEmail, getMailFrom } from './_mailer.js'
import { verifyResendWebhook } from './_resendWebhook.js'
import {
  extractEmailAddress,
  extractDisplayName,
  uniqueEmails,
  normalizeSubject,
  pickAliasEmail,
  snippetFromBodies,
  attachmentExtOk,
  attachmentMimeOk,
  safeStorageSegment,
  MAX_MAIL_SUBJECT,
  MAX_MAIL_BODY,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS,
  MAILBOX_DOMAIN,
} from './_mailboxUtil.js'

const RESEND_API = 'https://api.resend.com'
const BUCKET = 'mailbox-attachments'
const SIGNED_TTL = 15 * 60

function resendKey() {
  return String(process.env.RESEND_API_KEY || '').trim()
}

async function resendGet(path) {
  const key = resendKey()
  if (!key) return { ok: false, error: 'RESEND_API_KEY tanımlı değil.' }
  const res = await fetch(`${RESEND_API}${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { ok: false, error: json?.message || json?.error || `Resend HTTP ${res.status}` }
  }
  return { ok: true, json }
}

function trimStr(v, max = 500) {
  return String(v || '').trim().slice(0, max)
}

function rfcMessageId() {
  return `<${randomUUID()}@mail.${MAILBOX_DOMAIN}>`
}

function fromHeader(alias) {
  const name = trimStr(alias?.display_name || 'Yeni Form', 80) || 'Yeni Form'
  const email = extractEmailAddress(alias?.email)
  return `${name} <${email}>`
}

function headerBag(headers) {
  const out = {}
  if (!headers || typeof headers !== 'object' || Array.isArray(headers)) return out
  for (const [key, value] of Object.entries(headers)) {
    out[String(key).toLowerCase()] = Array.isArray(value) ? value.join(' ') : String(value || '')
  }
  return out
}

async function loadAliases(admin, { activeOnly = false } = {}) {
  let q = admin.from('mailbox_aliases').select('*').order('sort_order', { ascending: true })
  if (activeOnly) q = q.eq('is_active', true)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return data || []
}

function findAlias(aliases, email) {
  const addr = extractEmailAddress(email)
  return (aliases || []).find((row) => extractEmailAddress(row.email) === addr) || null
}

async function findThreadId(admin, { inReplyTo, referencesHeader, aliasId, subjectNorm }) {
  const ids = []
  if (inReplyTo) ids.push(String(inReplyTo).trim())
  if (referencesHeader) {
    for (const part of String(referencesHeader).split(/\s+/)) {
      if (part) ids.push(part)
    }
  }
  if (ids.length) {
    const { data } = await admin
      .from('mailbox_messages')
      .select('thread_id')
      .in('message_id', ids)
      .limit(1)
    if (data?.[0]?.thread_id) return data[0].thread_id
  }
  if (aliasId && subjectNorm) {
    const { data } = await admin
      .from('mailbox_threads')
      .select('id')
      .eq('alias_id', aliasId)
      .eq('subject_norm', subjectNorm)
      .order('last_message_at', { ascending: false })
      .limit(1)
    if (data?.[0]?.id) return data[0].id
  }
  return null
}

async function touchThread(admin, threadId, {
  snippet,
  unreadDelta = 0,
  folder,
  lastMessageAt,
}) {
  const { data: row } = await admin
    .from('mailbox_threads')
    .select('unread_count, folder')
    .eq('id', threadId)
    .maybeSingle()
  const unread = Math.max(0, Number(row?.unread_count || 0) + unreadDelta)
  const patch = {
    snippet: String(snippet || '').slice(0, 180),
    unread_count: unread,
    last_message_at: lastMessageAt || new Date().toISOString(),
  }
  if (folder) patch.folder = folder
  await admin.from('mailbox_threads').update(patch).eq('id', threadId)
}

async function storeAttachmentBuffer(admin, messageId, {
  filename,
  contentType,
  buffer,
  contentId,
  isInline,
}) {
  if (!buffer?.length || buffer.length > MAX_ATTACHMENT_BYTES) return null
  if (!attachmentExtOk(filename) && !attachmentMimeOk(contentType)) return null
  const path = `${messageId}/${Date.now()}-${safeStorageSegment(filename)}`
  const { error } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType: contentType || 'application/octet-stream',
    upsert: false,
  })
  if (error) {
    console.warn('[mailbox] attachment upload', error.message)
    return null
  }
  const { data, error: insErr } = await admin.from('mailbox_attachments').insert({
    message_id: messageId,
    filename: trimStr(filename, 180) || 'dosya',
    content_type: trimStr(contentType, 120) || 'application/octet-stream',
    size_bytes: buffer.length,
    storage_path: path,
    content_id: contentId || null,
    is_inline: Boolean(isInline),
  }).select('id, filename, content_type, size_bytes, is_inline').maybeSingle()
  if (insErr) {
    console.warn('[mailbox] attachment row', insErr.message)
    return null
  }
  return data
}

async function ingestInboundAttachments(admin, messageId, emailId, listed) {
  const items = Array.isArray(listed) ? listed : []
  if (!items.length) {
    const fetched = await resendGet(`/emails/receiving/${emailId}/attachments`)
    if (!fetched.ok) return
    await ingestInboundAttachments(admin, messageId, emailId, fetched.json?.data || [])
    return
  }
  for (const item of items.slice(0, MAX_ATTACHMENTS)) {
    const url = item.download_url || item.downloadUrl
    if (!url) continue
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      const buffer = Buffer.from(await res.arrayBuffer())
      await storeAttachmentBuffer(admin, messageId, {
        filename: item.filename || 'ek',
        contentType: item.content_type || item.contentType,
        buffer,
        contentId: item.content_id || item.contentId || null,
        isInline: String(item.content_disposition || '').toLowerCase() === 'inline',
      })
    } catch (err) {
      console.warn('[mailbox] inbound attachment', err?.message || err)
    }
  }
}

export async function ingestReceivedEmail(admin, emailId, meta = {}) {
  const id = String(emailId || '').trim()
  if (!id) return { ok: false, skipped: true, error: 'email_id yok' }

  const { data: existing } = await admin
    .from('mailbox_messages')
    .select('id, thread_id')
    .eq('resend_email_id', id)
    .maybeSingle()
  if (existing?.id) return { ok: true, duplicate: true, messageId: existing.id, threadId: existing.thread_id }

  const fetched = await resendGet(`/emails/receiving/${id}`)
  if (!fetched.ok) return fetched
  const email = fetched.json || {}
  const headers = headerBag(email.headers)
  const aliases = await loadAliases(admin, { activeOnly: true })
  const toList = uniqueEmails([
    ...(Array.isArray(email.to) ? email.to : [email.to]),
    ...(Array.isArray(email.cc) ? email.cc : [email.cc]),
    ...(Array.isArray(email.received_for) ? email.received_for : [email.received_for]),
    ...(Array.isArray(meta.to) ? meta.to : [meta.to]),
    ...(Array.isArray(meta.received_for) ? meta.received_for : [meta.received_for]),
  ])
  const aliasEmail = pickAliasEmail(toList, aliases)
  if (!aliasEmail) {
    return { ok: true, skipped: true, reason: 'alias_not_allowed' }
  }
  const alias = findAlias(aliases, aliasEmail)
  const fromRaw = email.from || headers.from || meta.from || ''
  const subject = trimStr(email.subject || meta.subject || '(konu yok)', MAX_MAIL_SUBJECT)
  const subjectNorm = normalizeSubject(subject)
  const inReplyTo = headers['in-reply-to'] || email.in_reply_to || ''
  const referencesHeader = headers.references || ''
  const html = String(email.html || '')
  const textBody = String(email.text || '')
  const createdAt = email.created_at || meta.created_at || new Date().toISOString()

  let threadId = await findThreadId(admin, {
    inReplyTo,
    referencesHeader,
    aliasId: alias.id,
    subjectNorm,
  })
  if (!threadId) {
    const { data: thread, error } = await admin.from('mailbox_threads').insert({
      alias_id: alias.id,
      subject,
      subject_norm: subjectNorm,
      snippet: snippetFromBodies({ text: textBody, html }),
      folder: 'inbox',
      unread_count: 1,
      last_message_at: createdAt,
    }).select('id').maybeSingle()
    if (error || !thread?.id) return { ok: false, error: error?.message || 'Konuşma açılamadı' }
    threadId = thread.id
  } else {
    await touchThread(admin, threadId, {
      snippet: snippetFromBodies({ text: textBody, html }),
      unreadDelta: 1,
      folder: 'inbox',
      lastMessageAt: createdAt,
    })
  }

  const { data: message, error: msgErr } = await admin.from('mailbox_messages').insert({
    thread_id: threadId,
    alias_id: alias.id,
    direction: 'inbound',
    from_email: extractEmailAddress(fromRaw),
    from_name: extractDisplayName(fromRaw),
    to_emails: toList,
    cc_emails: uniqueEmails(email.cc),
    subject,
    html,
    text_body: textBody,
    resend_email_id: id,
    message_id: email.message_id || headers['message-id'] || null,
    in_reply_to: inReplyTo || null,
    references_header: referencesHeader || null,
    read_at: null,
    created_at: createdAt,
  }).select('id').maybeSingle()
  if (msgErr?.code === '23505') {
    return { ok: true, duplicate: true }
  }
  if (msgErr || !message?.id) {
    return { ok: false, error: msgErr?.message || 'Mesaj kaydedilemedi' }
  }

  await ingestInboundAttachments(admin, message.id, id, email.attachments)
  return { ok: true, messageId: message.id, threadId }
}

export async function handleResendInboundWebhook(req, res, raw) {
  const verified = verifyResendWebhook({
    payload: raw,
    headers: req.headers,
    secret: process.env.RESEND_WEBHOOK_SECRET,
  })
  if (!verified.ok) {
    return res.status(400).json({ ok: false, error: verified.error })
  }
  const event = verified.event
  if (event?.type && event.type !== 'email.received') {
    return res.status(200).json({ ok: true, ignored: true })
  }
  const emailId = event?.data?.email_id || event?.data?.id
  const admin = getSupabaseAdmin()
  const ingested = await ingestReceivedEmail(admin, emailId, event?.data || {})
  if (!ingested.ok) {
    return res.status(500).json({ ok: false, error: ingested.error })
  }
  return res.status(200).json({ ok: true, ...ingested })
}

function mapAlias(row) {
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    signature: row.signature || '',
    isActive: row.is_active !== false,
    sortOrder: row.sort_order || 0,
  }
}

function mapTemplate(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    subject: row.subject || '',
    body: row.body || '',
    aliasId: row.alias_id,
    updatedAt: row.updated_at,
  }
}

function mapThread(row) {
  return {
    id: row.id,
    aliasId: row.alias_id,
    aliasEmail: row.mailbox_aliases?.email || row.alias_email || '',
    subject: row.subject,
    snippet: row.snippet || '',
    folder: row.folder,
    unreadCount: row.unread_count || 0,
    lastMessageAt: row.last_message_at,
  }
}

function mapMessage(row, attachments = []) {
  return {
    id: row.id,
    threadId: row.thread_id,
    direction: row.direction,
    fromEmail: row.from_email,
    fromName: row.from_name,
    toEmails: row.to_emails || [],
    ccEmails: row.cc_emails || [],
    subject: row.subject,
    html: row.html || '',
    text: row.text_body || '',
    createdAt: row.created_at,
    readAt: row.read_at,
    attachments: attachments.map((a) => ({
      id: a.id,
      filename: a.filename,
      contentType: a.content_type,
      sizeBytes: a.size_bytes,
      isInline: a.is_inline,
    })),
  }
}

async function parseOutboundAttachments(admin, messageId, files) {
  const list = Array.isArray(files) ? files : []
  const prepared = []
  const stored = []
  for (const file of list.slice(0, MAX_ATTACHMENTS)) {
    const filename = trimStr(file.filename || file.name, 180)
    const contentType = trimStr(file.contentType || file.mimeType, 120)
    const base64 = String(file.dataBase64 || file.content || '')
    if (!filename || !base64) continue
    if (!attachmentExtOk(filename)) {
      return { ok: false, error: `İzin verilmeyen dosya türü: ${filename}` }
    }
    if (contentType && !attachmentMimeOk(contentType)) {
      return { ok: false, error: `İzin verilmeyen MIME: ${filename}` }
    }
    let buffer
    try {
      buffer = Buffer.from(base64, 'base64')
    } catch {
      return { ok: false, error: 'Ek okunamadı' }
    }
    if (!buffer.length || buffer.length > MAX_ATTACHMENT_BYTES) {
      return { ok: false, error: 'Her ek en fazla 8 MB olabilir' }
    }
    prepared.push({
      filename,
      content: base64,
      contentType: contentType || undefined,
    })
    if (messageId) {
      const row = await storeAttachmentBuffer(admin, messageId, {
        filename,
        contentType,
        buffer,
        isInline: false,
      })
      if (row) stored.push(row)
    }
  }
  return { ok: true, prepared, stored }
}

async function handleMeta(admin) {
  const [aliases, templates] = await Promise.all([
    loadAliases(admin),
    admin.from('mailbox_templates').select('*').order('name', { ascending: true }),
  ])
  if (templates.error) throw new Error(templates.error.message)
  const { data: unreadRows } = await admin
    .from('mailbox_threads')
    .select('unread_count')
    .eq('folder', 'inbox')
  const unreadCount = (unreadRows || []).reduce((sum, row) => sum + Number(row.unread_count || 0), 0)
  return {
    ok: true,
    mailConfigured: isMailConfigured(),
    fromDefault: getMailFrom(),
    unreadCount,
    aliases: aliases.map(mapAlias),
    templates: (templates.data || []).map(mapTemplate),
  }
}

async function handleList(admin, body) {
  const folder = ['inbox', 'sent', 'archive'].includes(body.folder) ? body.folder : 'inbox'
  const aliasId = trimStr(body.aliasId, 80)
  const q = trimStr(body.q, 120).toLowerCase()
  let query = admin
    .from('mailbox_threads')
    .select('id, alias_id, subject, snippet, folder, unread_count, last_message_at, mailbox_aliases(email)')
    .eq('folder', folder)
    .order('last_message_at', { ascending: false })
    .limit(80)
  if (aliasId) query = query.eq('alias_id', aliasId)
  const { data, error } = await query
  if (error) return { ok: false, error: error.message }
  let threads = (data || []).map(mapThread)
  if (q) {
    threads = threads.filter((t) => `${t.subject} ${t.snippet} ${t.aliasEmail}`.toLowerCase().includes(q))
  }
  return { ok: true, threads }
}

async function handleThread(admin, body) {
  const threadId = trimStr(body.threadId, 80)
  if (!threadId) return { ok: false, error: 'threadId gerekli' }
  const { data: thread, error } = await admin
    .from('mailbox_threads')
    .select('id, alias_id, subject, snippet, folder, unread_count, last_message_at, mailbox_aliases(email, display_name)')
    .eq('id', threadId)
    .maybeSingle()
  if (error) return { ok: false, error: error.message }
  if (!thread) return { ok: false, error: 'Konuşma bulunamadı' }
  const { data: messages, error: msgErr } = await admin
    .from('mailbox_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
  if (msgErr) return { ok: false, error: msgErr.message }
  const ids = (messages || []).map((m) => m.id)
  let attachments = []
  if (ids.length) {
    const { data: files } = await admin
      .from('mailbox_attachments')
      .select('id, message_id, filename, content_type, size_bytes, is_inline')
      .in('message_id', ids)
    attachments = files || []
  }
  const byMessage = new Map()
  for (const file of attachments) {
    const list = byMessage.get(file.message_id) || []
    list.push(file)
    byMessage.set(file.message_id, list)
  }
  if (thread.unread_count > 0) {
    await admin.from('mailbox_messages').update({ read_at: new Date().toISOString() })
      .eq('thread_id', threadId)
      .is('read_at', null)
    await admin.from('mailbox_threads').update({ unread_count: 0 }).eq('id', threadId)
    thread.unread_count = 0
  }
  return {
    ok: true,
    thread: {
      ...mapThread(thread),
      aliasEmail: thread.mailbox_aliases?.email || '',
      aliasName: thread.mailbox_aliases?.display_name || '',
    },
    messages: (messages || []).map((row) => mapMessage(row, byMessage.get(row.id) || [])),
  }
}

async function persistOutbound(admin, {
  alias,
  threadId,
  to,
  cc,
  subject,
  html,
  text,
  resendId,
  messageId,
  inReplyTo,
  referencesHeader,
  files,
}) {
  const { data: message, error } = await admin.from('mailbox_messages').insert({
    thread_id: threadId,
    alias_id: alias.id,
    direction: 'outbound',
    from_email: extractEmailAddress(alias.email),
    from_name: alias.display_name || 'Yeni Form',
    to_emails: to,
    cc_emails: cc,
    subject,
    html,
    text_body: text,
    resend_email_id: resendId || null,
    message_id: messageId,
    in_reply_to: inReplyTo || null,
    references_header: referencesHeader || null,
    read_at: new Date().toISOString(),
  }).select('id').maybeSingle()
  if (error || !message?.id) return { ok: false, error: error?.message || 'Gönderilen kayıt yazılamadı' }
  if (files?.length) await parseOutboundAttachments(admin, message.id, files)
  return { ok: true, messageId: message.id }
}

async function handleSend(req, res, admin, body, { reply } = {}) {
  const gate = await enforceRateLimit({
    req,
    prefix: 'admin-mailbox-send',
    limit: 40,
    extraKey: String(req.userEmail || ''),
  })
  if (!gate.ok) {
    applyRateLimitHeaders(res, gate.headers)
    return { ok: false, status: gate.status, error: gate.error }
  }
  applyRateLimitHeaders(res, gate.headers)

  const aliases = await loadAliases(admin, { activeOnly: true })
  const alias = findAlias(aliases, body.aliasEmail || body.from) || aliases[0]
  if (!alias) return { ok: false, error: 'Gönderen adres yok' }

  const to = uniqueEmails(String(body.to || '').split(/[,\s;]+/))
  const cc = uniqueEmails(String(body.cc || '').split(/[,\s;]+/))
  if (!to.length) return { ok: false, error: 'Alıcı e-posta gerekli' }
  const subject = trimStr(body.subject, MAX_MAIL_SUBJECT)
  const rawBody = trimStr(body.body, MAX_MAIL_BODY)
  if (!subject || rawBody.length < 2) return { ok: false, error: 'Konu ve mesaj gerekli' }

  const files = Array.isArray(body.attachments) ? body.attachments : []
  const parsedFiles = await parseOutboundAttachments(admin, null, files)
  if (!parsedFiles.ok) return parsedFiles

  let threadId = trimStr(body.threadId, 80)
  let inReplyTo = ''
  let referencesHeader = ''
  let outboundMessageId = rfcMessageId()

  if (reply) {
    if (!threadId) return { ok: false, error: 'Yanıt için konuşma gerekli' }
    const { data: prev } = await admin
      .from('mailbox_messages')
      .select('message_id, in_reply_to, references_header, subject')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })
      .limit(8)
    const lastWithId = (prev || []).find((m) => m.message_id)
    inReplyTo = lastWithId?.message_id || ''
    const refs = []
    for (const row of prev || []) {
      if (row.references_header) refs.push(row.references_header)
      if (row.message_id) refs.push(row.message_id)
    }
    referencesHeader = [...new Set(refs.join(' ').split(/\s+/).filter(Boolean))].slice(-12).join(' ')
  } else {
    const { data: thread, error } = await admin.from('mailbox_threads').insert({
      alias_id: alias.id,
      subject,
      subject_norm: normalizeSubject(subject),
      snippet: snippetFromBodies({ text: rawBody }),
      folder: 'sent',
      unread_count: 0,
      last_message_at: new Date().toISOString(),
    }).select('id').maybeSingle()
    if (error || !thread?.id) return { ok: false, error: error?.message || 'Konuşma açılamadı' }
    threadId = thread.id
  }

  const packed = mailboxPersonalEmail({ body: rawBody, signature: alias.signature || '' })
  const sendSubject = reply && !/^re\s*:/i.test(subject) ? `Re: ${subject}` : subject
  const sent = await sendMail({
    from: fromHeader(alias),
    to,
    cc,
    subject: sendSubject,
    html: packed.html,
    text: packed.text,
    replyTo: alias.email,
    attachments: parsedFiles.prepared,
    headers: {
      'Message-ID': outboundMessageId,
      ...(inReplyTo ? { 'In-Reply-To': inReplyTo } : {}),
      ...(referencesHeader || inReplyTo
        ? { References: [referencesHeader, inReplyTo].filter(Boolean).join(' ').trim() }
        : {}),
    },
  })
  if (!sent.ok) return { ok: false, error: sent.error || 'E-posta gönderilemedi', skipped: sent.skipped }

  const saved = await persistOutbound(admin, {
    alias,
    threadId,
    to,
    cc,
    subject: sendSubject,
    html: packed.html,
    text: packed.text,
    resendId: sent.id,
    messageId: outboundMessageId,
    inReplyTo,
    referencesHeader,
    files,
  })
  if (!saved.ok) return saved
  await touchThread(admin, threadId, {
    snippet: snippetFromBodies({ text: rawBody }),
    unreadDelta: 0,
    folder: reply ? 'inbox' : 'sent',
    lastMessageAt: new Date().toISOString(),
  })
  return { ok: true, threadId, messageId: saved.messageId, emailId: sent.id }
}

async function handleArchive(admin, body) {
  const threadId = trimStr(body.threadId, 80)
  if (!threadId) return { ok: false, error: 'threadId gerekli' }
  const folder = body.folder === 'inbox' ? 'inbox' : 'archive'
  const { error } = await admin.from('mailbox_threads').update({ folder }).eq('id', threadId)
  if (error) return { ok: false, error: error.message }
  return { ok: true, threadId, folder }
}

async function handleAttachmentUrl(admin, body) {
  const id = trimStr(body.attachmentId, 80)
  if (!id) return { ok: false, error: 'attachmentId gerekli' }
  const { data, error } = await admin
    .from('mailbox_attachments')
    .select('id, filename, storage_path, content_type')
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return { ok: false, error: error?.message || 'Ek bulunamadı' }
  const signed = await admin.storage.from(BUCKET).createSignedUrl(data.storage_path, SIGNED_TTL)
  if (signed.error || !signed.data?.signedUrl) {
    return { ok: false, error: signed.error?.message || 'İndirme bağlantısı üretilemedi' }
  }
  return {
    ok: true,
    url: signed.data.signedUrl,
    filename: data.filename,
    contentType: data.content_type,
  }
}

async function handleAliasUpsert(admin, body) {
  const email = extractEmailAddress(body.email)
  if (!email.endsWith(`@${MAILBOX_DOMAIN}`)) {
    return { ok: false, error: 'Adres @yeniform.com ile bitmeli' }
  }
  const patch = {
    email,
    display_name: trimStr(body.displayName || body.display_name || 'Yeni Form', 80) || 'Yeni Form',
    signature: trimStr(body.signature, 500),
    is_active: body.isActive !== false,
    sort_order: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
  }
  const id = trimStr(body.id, 80)
  if (id) {
    const { data, error } = await admin.from('mailbox_aliases').update(patch).eq('id', id).select('*').maybeSingle()
    if (error) return { ok: false, error: error.message }
    return { ok: true, alias: mapAlias(data) }
  }
  const { data, error } = await admin.from('mailbox_aliases').insert(patch).select('*').maybeSingle()
  if (error) return { ok: false, error: error.message }
  return { ok: true, alias: mapAlias(data) }
}

async function handleAliasDelete(admin, body) {
  const id = trimStr(body.id, 80)
  if (!id) return { ok: false, error: 'id gerekli' }
  const { count } = await admin.from('mailbox_aliases').select('id', { count: 'exact', head: true })
  if ((count || 0) <= 1) return { ok: false, error: 'Son adres silinemez' }
  const { error } = await admin.from('mailbox_aliases').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

async function handleTemplateUpsert(admin, body) {
  const name = trimStr(body.name, 80)
  if (!name) return { ok: false, error: 'Şablon adı gerekli' }
  const patch = {
    name,
    subject: trimStr(body.subject, MAX_MAIL_SUBJECT),
    body: trimStr(body.body, MAX_MAIL_BODY),
    alias_id: trimStr(body.aliasId, 80) || null,
    updated_at: new Date().toISOString(),
  }
  const id = trimStr(body.id, 80)
  if (id) {
    const { data, error } = await admin.from('mailbox_templates').update(patch).eq('id', id).select('*').maybeSingle()
    if (error) return { ok: false, error: error.message }
    return { ok: true, template: mapTemplate(data) }
  }
  const { data, error } = await admin.from('mailbox_templates').insert(patch).select('*').maybeSingle()
  if (error) return { ok: false, error: error.message }
  return { ok: true, template: mapTemplate(data) }
}

async function handleTemplateDelete(admin, body) {
  const id = trimStr(body.id, 80)
  if (!id) return { ok: false, error: 'id gerekli' }
  const { error } = await admin.from('mailbox_templates').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

async function handleSync(admin) {
  const listed = await resendGet('/emails/receiving?limit=25')
  if (!listed.ok) return listed
  const rows = listed.json?.data || []
  let ingested = 0
  let skipped = 0
  for (const row of rows) {
    const result = await ingestReceivedEmail(admin, row.id, row)
    if (result.ok && !result.skipped && !result.duplicate) ingested += 1
    else skipped += 1
  }
  return { ok: true, ingested, skipped, scanned: rows.length }
}

async function handleUnreadCount(admin) {
  const { data } = await admin.from('mailbox_threads').select('unread_count').eq('folder', 'inbox')
  const unreadCount = (data || []).reduce((sum, row) => sum + Number(row.unread_count || 0), 0)
  return { ok: true, unreadCount }
}

export async function handleAdminMailbox(req, res, body) {
  const auth = await requireAdmin(req)
  if (!auth.ok) {
    return res.status(auth.status).json({ ok: false, error: auth.error })
  }
  req.userEmail = auth.user?.email || ''
  const admin = getSupabaseAdmin()
  const op = trimStr(body.op || 'meta', 40)

  try {
    let result
    if (op === 'meta') result = await handleMeta(admin)
    else if (op === 'list') result = await handleList(admin, body)
    else if (op === 'thread') result = await handleThread(admin, body)
    else if (op === 'send') result = await handleSend(req, res, admin, body, { reply: false })
    else if (op === 'reply') result = await handleSend(req, res, admin, body, { reply: true })
    else if (op === 'archive') result = await handleArchive(admin, body)
    else if (op === 'attachment-url') result = await handleAttachmentUrl(admin, body)
    else if (op === 'alias-upsert') result = await handleAliasUpsert(admin, body)
    else if (op === 'alias-delete') result = await handleAliasDelete(admin, body)
    else if (op === 'template-upsert') result = await handleTemplateUpsert(admin, body)
    else if (op === 'template-delete') result = await handleTemplateDelete(admin, body)
    else if (op === 'sync') result = await handleSync(admin)
    else if (op === 'unread-count') result = await handleUnreadCount(admin)
    else result = { ok: false, error: 'Geçersiz kutu işlemi' }

    const status = result.status || (result.ok ? 200 : 400)
    return res.status(status).json(result)
  } catch (err) {
    console.error('[mailbox]', err?.message || err)
    return res.status(500).json({ ok: false, error: String(err?.message || err) })
  }
}
