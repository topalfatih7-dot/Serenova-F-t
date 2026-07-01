import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { BRAND } from '../config/brand'

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatMessageTime(iso) {
  try {
    return format(new Date(iso), 'd MMM yyyy HH:mm', { locale: tr })
  } catch {
    return iso || ''
  }
}

function buildTranscriptHtml({ title, subtitle, messages, participants = [] }) {
  const generatedAt = format(new Date(), 'd MMMM yyyy HH:mm', { locale: tr })
  const participantLine = participants.filter(Boolean).join(' · ')

  const rows = (messages || []).map((m) => {
    const sender = escapeHtml(m.senderLabel || m.senderType || 'Bilinmiyor')
    const text = escapeHtml(m.text).replace(/\n/g, '<br/>')
    const time = escapeHtml(formatMessageTime(m.createdAt))
    const isSystem = m.senderType === 'system'
    return `
      <div class="msg ${isSystem ? 'msg-system' : ''}">
        <div class="msg-head">
          <strong>${sender}</strong>
          <span>${time}</span>
        </div>
        <div class="msg-body">${text || '—'}</div>
      </div>
    `
  }).join('')

  return `
    <div id="chat-transcript-root" style="font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; color: #1a2332; padding: 24px; max-width: 800px;">
      <div style="border-bottom: 2px solid #2478a8; padding-bottom: 12px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #2478a8;">${escapeHtml(BRAND.name)}</p>
        <h1 style="margin: 8px 0 4px; font-size: 20px;">${escapeHtml(title)}</h1>
        ${subtitle ? `<p style="margin: 0; font-size: 13px; color: #3a4550;">${escapeHtml(subtitle)}</p>` : ''}
        ${participantLine ? `<p style="margin: 8px 0 0; font-size: 12px; color: #3a4550;">${escapeHtml(participantLine)}</p>` : ''}
        <p style="margin: 12px 0 0; font-size: 11px; color: #6b7280;">Oluşturulma: ${generatedAt} · ${messages?.length || 0} mesaj</p>
      </div>
      <style>
        .msg { margin-bottom: 14px; padding: 10px 12px; border: 1px solid #e4eaef; border-radius: 10px; page-break-inside: avoid; }
        .msg-system { background: #fffbeb; border-color: #fde68a; }
        .msg-head { display: flex; justify-content: space-between; gap: 12px; font-size: 11px; margin-bottom: 6px; color: #3a4550; }
        .msg-head strong { color: #1a2332; font-size: 12px; }
        .msg-body { font-size: 13px; line-height: 1.55; white-space: pre-wrap; word-break: break-word; }
      </style>
      ${rows || '<p style="color:#6b7280;">Mesaj bulunamadı.</p>'}
      <p style="margin-top: 24px; font-size: 10px; color: #9ca3af; border-top: 1px solid #e4eaef; padding-top: 12px;">
        Bu belge yalnızca iç denetim ve uyumluluk amaçlıdır. Mesajlar sistemde kalıcı olarak saklanmaktadır.
      </p>
    </div>
  `
}

export async function downloadChatTranscriptPdf({
  filename = 'sohbet-kaydi.pdf',
  title,
  subtitle,
  messages,
  participants,
}) {
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-9999px'
  container.style.top = '0'
  container.innerHTML = buildTranscriptHtml({ title, subtitle, messages, participants })
  document.body.appendChild(container)

  const element = container.querySelector('#chat-transcript-root')
  try {
    const { default: html2pdf } = await import('html2pdf.js')
    await html2pdf()
      .set({
        margin: [12, 12, 12, 12],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      })
      .from(element)
      .save()
  } finally {
    document.body.removeChild(container)
  }
}

export function mapMemberStaffMessagesForExport(messages, { memberName, staffName, staffRole }) {
  const roleLabel = staffRole === 'dietitian' ? 'Diyetisyen' : 'Koç'
  return (messages || []).map((m) => ({
    ...m,
    senderLabel: m.senderType === 'member'
      ? memberName || 'Danışan'
      : m.senderType === 'staff'
        ? `${staffName || roleLabel} (${roleLabel})`
        : 'Sistem',
  }))
}

export function mapAdminStaffMessagesForExport(messages, { staffName }) {
  return (messages || []).map((m) => ({
    ...m,
    senderLabel: m.senderType === 'admin' ? 'Admin' : staffName || 'Personel',
  }))
}

export function mapStaffCollabMessagesForExport(messages, { coachName, dietitianName }) {
  return (messages || []).map((m) => ({
    ...m,
    senderLabel: m.senderType === 'coach'
      ? (coachName || 'Koç')
      : m.senderType === 'dietitian'
        ? (dietitianName || 'Diyetisyen')
        : 'Sistem',
  }))
}
