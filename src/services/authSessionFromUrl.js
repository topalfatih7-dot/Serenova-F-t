/**
 * Supabase PKCE + token_hash + implicit-hash oturum kurulumu.
 * Tüm Supabase recovery / magic-link yönlendirme biçimlerini destekler.
 */

/** StrictMode / remount: aynı PKCE code için tek exchange. */
const inflightByCode = new Map()

function stripQueryKeys(keys) {
  const params = new URLSearchParams(window.location.search)
  let changed = false
  keys.forEach((key) => {
    if (params.has(key)) { params.delete(key); changed = true }
  })
  if (!changed) return
  const qs = params.toString()
  window.history.replaceState({}, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`)
}

export function stripAuthCodeFromUrl() { stripQueryKeys(['code']) }
export function stripTokenHashFromUrl() { stripQueryKeys(['token_hash', 'type']) }

/** detectSessionInUrl / paralel exchange tamamlanması için kısa süre bekler. */
function waitForDetectedSession(supabase, waitMs = 5000) {
  return new Promise((resolve) => {
    let settled = false
    let subscription = null

    const finish = (session) => {
      if (settled) return
      settled = true
      subscription?.unsubscribe()
      resolve(session?.user ? session : null)
    }

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        finish(session)
      }
    })
    subscription = data?.subscription

    ;(async () => {
      const started = Date.now()
      while (!settled && Date.now() - started < waitMs) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) { finish(session); return }
        await new Promise((r) => setTimeout(r, 150))
      }
      if (!settled) {
        const { data: { session } } = await supabase.auth.getSession()
        finish(session)
      }
    })()
  })
}

/**
 * Aynı code için tek exchange; StrictMode çift mount kodu iki kez tüketmesin.
 * Kod kullanılmışsa kısa poll ile oturumu kurtarır.
 */
async function exchangeCodeSingleFlight(supabase, code, waitMs) {
  const existing = inflightByCode.get(code)
  if (existing) return existing

  const promise = (async () => {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data?.session) {
      stripAuthCodeFromUrl()
      return data.session
    }

    // Kod tüketilmiş olabilir (paralel mount); kısa süre oturum bekle
    const autoSession = await waitForDetectedSession(supabase, Math.min(waitMs, 3000))
    if (autoSession?.user) {
      stripAuthCodeFromUrl()
      return autoSession
    }
    return null
  })()

  inflightByCode.set(code, promise)
  try {
    return await promise
  } finally {
    inflightByCode.delete(code)
  }
}

/**
 * URL'deki her türlü Supabase auth parametresinden oturum kurar:
 *   1. token_hash + type  → verifyOtp  (özel şablon / magic-link)
 *   2. code               → exchangeCodeForSession  (PKCE — en yaygın)
 *   3. hash access_token  → setSession  (implicit — fallback)
 *   4. Bekle & dene       → localStorage'daki mevcut oturum
 */
export async function establishAuthSessionFromUrl(supabase, { waitMs = 2500 } = {}) {
  if (!supabase) return null

  const params    = new URLSearchParams(window.location.search)
  const hashRaw   = (window.location.hash || '').replace(/^#/, '')
  const hashParams = new URLSearchParams(hashRaw)

  // 1) token_hash (özel şablon — Dashboard'da recovery.html yapıştırıldığında)
  const token_hash = params.get('token_hash') || hashParams.get('token_hash')
  const otpType    = params.get('type')        || hashParams.get('type')
  if (token_hash && otpType) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash, type: otpType })
    if (!error && data?.session) { stripTokenHashFromUrl(); return data.session }
  }

  // 2) PKCE oturumu kurmuş olabilir — kod değişiminden önce kontrol
  const { data: { session: preExchange } } = await supabase.auth.getSession()
  if (preExchange?.user) {
    if (params.get('code')) stripAuthCodeFromUrl()
    return preExchange
  }

  // 3) PKCE code — single-flight (StrictMode / remount güvenli)
  const code = params.get('code')
  if (code) {
    const session = await exchangeCodeSingleFlight(supabase, code, waitMs)
    if (session?.user) return session
  }

  // 4) Implicit hash tokens (sunucu taraflı recover — PKCE'siz fallback)
  const accessToken  = hashParams.get('access_token')
  const refreshToken = hashParams.get('refresh_token')
  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
    if (!error && data?.session) {
      window.history.replaceState({}, '', window.location.pathname + window.location.search)
      return data.session
    }
  }

  // 5) Mevcut oturum (zaten localStorage'da)
  const { data: { session: immediate } } = await supabase.auth.getSession()
  if (immediate?.user) return immediate

  // 6) Supabase'in URL'i async işlemesi için kısa bekleme
  const started = Date.now()
  while (Date.now() - started < waitMs) {
    await new Promise((r) => setTimeout(r, 200))
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) return session
  }

  return null
}
