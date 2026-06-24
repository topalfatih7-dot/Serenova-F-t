import { supabase } from './supabaseClient'
import { getSiteUrl } from '../config/seo'
import { getUser, saveMemberPatch, patchMemberVerification } from './supabaseDb'
import { toE164, DEFAULT_COUNTRY_ISO, digitsOnly } from '../data/countryCodes'

const nowISO = () => new Date().toISOString()
const phoneVerifyViaEmail = () => import.meta.env.VITE_PHONE_VERIFY_VIA_EMAIL === 'true'

export function parsePhoneE164(phone, countryIso = DEFAULT_COUNTRY_ISO) {
  const raw = String(phone || '').trim()
  if (!raw) return ''
  if (raw.startsWith('+')) return `+${digitsOnly(raw)}`
  return toE164(countryIso, raw)
}

export async function getVerificationStatus(member) {
  const authUser = await getUser()
  const phoneVerified = Boolean(member?.phoneVerifiedAt)
  const authPhone = authUser?.phone || ''

  return {
    email: member?.email || authUser?.email || '',
    phone: member?.phone || '',
    // Profil doğrulaması yalnızca members.emailVerifiedAt ile takip edilir.
    // auth.email_confirmed_at kayıt sırasında sunucu tarafından açıldığı için güvenilmez.
    emailVerified: Boolean(member?.emailVerifiedAt),
    phoneVerified,
    authPhone,
    canVerifyEmail: Boolean(member?.email || authUser?.email),
    canVerifyPhone: Boolean(member?.phone || authPhone),
  }
}

async function patchVerification(member, patch) {
  if (!member?.id) return { success: false, error: 'Oturum bulunamadı' }
  if (member.membership !== undefined) {
    await saveMemberPatch(member, patch)
    return { success: true }
  }
  return patchMemberVerification(member.id, patch)
}

export async function markEmailVerified(member) {
  if (!member?.id) return { success: false, error: 'Oturum bulunamadı' }
  const res = await patchVerification(member, { emailVerifiedAt: nowISO() })
  if (res?.success === false) return res
  return { success: true }
}

export async function markPhoneVerified(member, phone) {
  if (!member?.id) return { success: false, error: 'Oturum bulunamadı' }
  const res = await patchVerification(member, {
    phoneVerifiedAt: nowISO(),
    ...(phone ? { phone } : {}),
  })
  if (res?.success === false) return res
  return { success: true }
}

// E-posta bağlantıları sunucudan gönderilir (APP_URL / VITE_SITE_URL) — tarayıcı origin'i kullanılmaz.
export async function sendEmailVerification() {
  const authUser = await getUser()
  if (!authUser?.email) return { success: false, error: 'E-posta adresi bulunamadı.' }

  let token = null
  try {
    const { data } = await supabase.auth.getSession()
    token = data?.session?.access_token || null
  } catch {
    /* oturum okunamadı */
  }
  if (!token) return { success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }

  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'email-send' }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || !json?.ok) {
      return { success: false, error: json?.error || 'Doğrulama e-postası gönderilemedi.' }
    }
    return {
      success: true,
      message: json.message || 'E-postanıza doğrulama bağlantısı gönderildi. Bağlantıya bir kez tıklayın.',
    }
  } catch (e) {
    return { success: false, error: String(e?.message || e) }
  }
}

/** E-posta bağlantısındaki evt jetonu ile profil doğrulamasını tamamlar. */
export async function confirmEmailVerificationByEvt(evt) {
  if (!evt?.trim()) return { success: false, error: 'Doğrulama jetonu eksik.' }

  let bearer = null
  try {
    const { data } = await supabase.auth.getSession()
    bearer = data?.session?.access_token || null
  } catch {
    /* oturum yoksa evt ile devam */
  }

  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      },
      body: JSON.stringify({ action: 'email-confirm', evt: evt.trim() }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || !json?.ok) {
      return { success: false, error: json?.error || 'Doğrulama tamamlanamadı.' }
    }
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e?.message || e) }
  }
}

export async function confirmEmailVerification(code, member) {
  const authUser = await getUser()
  const email = authUser?.email
  if (!email) return { success: false, error: 'E-posta bulunamadı.' }
  if (!code?.trim()) return { success: false, error: 'Doğrulama kodunu girin.' }

  const { error } = await supabase.auth.verifyOtp({
    email,
    token: code.trim(),
    type: 'email',
  })
  if (error) {
    return {
      success: false,
      error: 'Kod doğrulanamadı. E-postadaki bağlantıya tıklamayı deneyin.',
    }
  }

  return markEmailVerified(member)
}

// E-postadaki bağlantıya tıklandıktan sonra profil sayfasında "Durumu Yenile" ile çağrılır.
// Yalnızca gerçekten işaretlenmiş emailVerifiedAt kabul edilir (auth.email_confirmed_at değil).
export async function refreshEmailVerification(member) {
  if (!member?.id) return { success: false, error: 'Oturum bulunamadı.' }

  const { data, error } = await supabase
    .from('members')
    .select('data')
    .eq('id', member.id)
    .maybeSingle()

  if (error || !data) {
    return { success: false, error: 'Profil yüklenemedi.' }
  }

  if (data.data?.emailVerifiedAt) {
    return { success: true }
  }

  return {
    success: false,
    error: 'Henüz doğrulanmadı. E-postadaki bağlantıya tıklayıp onay sayfasını tamamlayın.',
  }
}

export async function sendPhoneVerification(phone, countryIso = DEFAULT_COUNTRY_ISO, member = null) {
  const e164 = parsePhoneE164(phone, countryIso)
  if (!e164 || e164.length < 10) {
    return { success: false, error: 'Geçerli bir telefon numarası girin.' }
  }

  const authUser = await getUser()
  if (!authUser?.email) return { success: false, error: 'Oturum bulunamadı.' }

  const useEmailFallback = phoneVerifyViaEmail()
  // SMS sağlayıcısı (Twilio vb.) yapılandırılmamışsa Supabase bu tür mesajlar döndürür.
  const isSmsProviderError = (msg = '') =>
    /provider|twilio|messagebird|sms|sending|not enabled|disabled|unsupported|could not be found/i.test(msg)

  if (!useEmailFallback) {
    // ÖNEMLİ: signInWithOtp({phone}) yeni (e-postasız) kullanıcı oluşturmaya çalışır ve
    // members.email NOT NULL trigger'ı yüzünden 500 verir. Mevcut kullanıcının telefonunu
    // doğrulamak için updateUser({phone}) kullanılır; bu, numaraya SMS OTP gönderir.
    const { error } = await supabase.auth.updateUser({ phone: e164 })
    if (!error) {
      return { success: true, phone: e164, viaEmail: false, message: 'SMS doğrulama kodu gönderildi.' }
    }
    // Sağlayıcı yoksa sert hata verme; e-posta link yedeğine düş.
    if (!isSmsProviderError(error.message)) {
      return { success: false, error: error.message }
    }
    // Buraya düştüyse SMS sağlayıcı hazır değil → e-posta link yedeği devreye girer.
  }

  if (member?.id) {
    await patchVerification(member, {
      pendingPhoneVerify: { phone, e164, viaEmail: true, sentAt: nowISO() },
    })
  }

  const redirectTo = `${getSiteUrl()}/auth/callback?verify=phone`
  const { error: emailErr } = await supabase.auth.signInWithOtp({
    email: authUser.email,
    options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
  })
  if (emailErr) {
    return {
      success: false,
      error: emailErr.message || 'Doğrulama bağlantısı gönderilemedi.',
    }
  }

  return {
    success: true,
    phone: e164,
    viaEmail: true,
    message: 'SMS yapılandırılmadığı için e-postanıza doğrulama bağlantısı gönderildi. Bağlantıya tıklayın.',
  }
}

export async function confirmPhoneVerification(code, phone, member, countryIso = DEFAULT_COUNTRY_ISO, viaEmail = false) {
  if (!code?.trim()) return { success: false, error: 'Doğrulama kodunu girin.' }

  if (viaEmail || member?.pendingPhoneVerify?.viaEmail) {
    const authUser = await getUser()
    const email = authUser?.email
    if (!email) return { success: false, error: 'E-posta bulunamadı.' }

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'email',
    })
    if (error) return { success: false, error: error.message }

    const verifiedPhone = member?.pendingPhoneVerify?.phone || phone
    await patchVerification(member, { pendingPhoneVerify: null })
    return markPhoneVerified(member, verifiedPhone)
  }

  const e164 = parsePhoneE164(phone, countryIso)
  if (!e164) return { success: false, error: 'Telefon numarası gerekli.' }

  // updateUser({phone}) ile başlatılan doğrulama "phone_change" tipindedir.
  const { error } = await supabase.auth.verifyOtp({
    phone: e164,
    token: code.trim(),
    type: 'phone_change',
  })
  if (error) return { success: false, error: error.message }

  return markPhoneVerified(member, phone)
}
