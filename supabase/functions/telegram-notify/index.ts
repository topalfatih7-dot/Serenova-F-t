import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Payload = {
  event?: string
  message?: string
  name?: string
  email?: string
  role?: string
  membership?: string
  at?: string
}

function buildMessage(body: Payload): string {
  if (body.message) return body.message

  const time = body.at
    ? new Date(body.at).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })
    : new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })

  switch (body.event) {
    case 'member_signup':
      return `🆕 <b>Yeni üye kaydı</b>\n👤 ${body.name || '—'}\n📧 ${body.email || '—'}\n💳 ${body.membership === 'premium' ? 'Premium' : 'Ücretsiz'}\n🕐 ${time}`
    case 'member_login':
      return `✅ <b>Üye girişi</b>\n👤 ${body.name || '—'}\n📧 ${body.email || '—'}\n🕐 ${time}`
    case 'staff_login':
      return `👨‍⚕️ <b>Personel girişi</b>\n👤 ${body.name || '—'}\n🏷 ${body.role || 'Personel'}\n📧 ${body.email || '—'}\n🕐 ${time}`
    case 'staff_logout':
      return `🚪 <b>Personel çıkışı</b>\n👤 ${body.name || '—'}\n🏷 ${body.role || 'Personel'}\n🕐 ${time}`
    case 'member_logout':
      return `🚪 <b>Üye çıkışı</b>\n👤 ${body.name || '—'}\n🕐 ${time}`
    case 'admin_login':
      return `🔐 <b>Admin girişi</b>\n👤 ${body.name || 'Admin'}\n🕐 ${time}`
    default:
      return `📢 <b>${body.event || 'Bildirim'}</b>\n${body.name ? `👤 ${body.name}\n` : ''}${body.email ? `📧 ${body.email}\n` : ''}🕐 ${time}`
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
    const chatId = Deno.env.get('TELEGRAM_CHAT_ID')

    if (!token || !chatId) {
      return new Response(JSON.stringify({ ok: false, error: 'Telegram yapılandırması eksik' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body: Payload = await req.json()
    const text = buildMessage(body)

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })

    if (!tgRes.ok) {
      const err = await tgRes.text()
      return new Response(JSON.stringify({ ok: false, error: err }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
