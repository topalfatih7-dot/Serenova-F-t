export function getTelegramBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN || ''
}

export async function sendTelegramMessage({ chatId, text, token = getTelegramBotToken() }) {
  if (!token || !chatId) {
    return { ok: false, error: 'Telegram yapılandırması eksik' }
  }

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
    return { ok: false, error: err }
  }

  return { ok: true }
}
