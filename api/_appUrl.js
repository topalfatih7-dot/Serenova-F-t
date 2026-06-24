/**
 * E-posta doğrulama ve ödeme yönlendirmeleri için kanonik site adresi.
 * Tarayıcı origin'i kullanılmaz — e-posta bağlantıları her zaman bu değere gider.
 */
export function getAppUrl() {
  const raw =
    process.env.APP_URL ||
    process.env.VITE_SITE_URL ||
    'https://www.yeniform.com'
  return String(raw).replace(/\/$/, '')
}
