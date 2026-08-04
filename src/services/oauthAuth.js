import { supabase } from './supabaseClient'
import { setRememberMe } from './authStorage'
import { syncAutoRefresh } from './supabaseClient'

const PROVIDERS = ['google', 'facebook']

const PROVIDER_LABELS = {
  google: 'Google',
  facebook: 'Facebook',
}

/** Site URL köküne ?code= düştüğünde flow kaybolmasın diye. */
const OAUTH_PENDING_KEY = 'nf-oauth-pending'

/**
 * OAuth başlamadan önce flow/plan sakla; callback veya AuthRedirectHandler okur.
 * @param {{ flow: 'login'|'signup', plan?: string }} payload
 */
export function stashOAuthPending(payload) {
  try {
    sessionStorage.setItem(OAUTH_PENDING_KEY, JSON.stringify({
      flow: payload.flow === 'signup' ? 'signup' : 'login',
      plan: payload.plan || null,
      at: Date.now(),
    }))
  } catch {
    /* private mode / quota */
  }
}

/** @returns {{ flow: 'login'|'signup', plan: string|null } | null} */
export function peekOAuthPending() {
  try {
    const raw = sessionStorage.getItem(OAUTH_PENDING_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || (parsed.flow !== 'login' && parsed.flow !== 'signup')) return null
    return { flow: parsed.flow, plan: parsed.plan || null }
  } catch {
    return null
  }
}

export function clearOAuthPending() {
  try {
    sessionStorage.removeItem(OAUTH_PENDING_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * Query'de flow yoksa stash'ten doldur (kök ?code= yönlendirmesi).
 * @param {URLSearchParams} params
 */
export function applyOAuthPendingToParams(params) {
  if (params.get('flow') === 'login' || params.get('flow') === 'signup') return params
  const pending = peekOAuthPending()
  if (!pending) return params
  params.set('flow', pending.flow)
  if (pending.plan && !params.get('plan')) params.set('plan', pending.plan)
  return params
}

/** PKCE verifier ile dönüş origin'i aynı olmalı (www vs apex). */
export function getOAuthRedirectOrigin() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return ''
}

export function getSupabaseAuthProvidersUrl() {
  const url = import.meta.env.VITE_SUPABASE_URL || ''
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/)
  if (match?.[1]) {
    return `https://supabase.com/dashboard/project/${match[1]}/auth/providers`
  }
  return 'https://supabase.com/dashboard'
}

function isProviderNotEnabledError(err) {
  const msg = `${err?.message || ''} ${err?.msg || ''}`.toLowerCase()
  return /provider is not enabled|unsupported provider|validation_failed/.test(msg)
}

export function providerNotEnabledMessage(provider) {
  const label = PROVIDER_LABELS[provider] || provider
  return (
    `${label} girişi Supabase projenizde henüz açılmamış. `
    + 'Supabase Dashboard → Authentication → Sign In / Providers bölümünden ilgili sağlayıcıyı etkinleştirip Client ID ve Secret girmeniz gerekir. '
    + 'Kurulum tamamlanana kadar e-posta ile giriş yapabilirsiniz.'
  )
}

/**
 * @param {'google'|'facebook'} provider
 * @param {{ flow?: 'login'|'signup', plan?: string, remember?: boolean }} opts
 */
export async function signInWithSocial(provider, opts = {}) {
  if (!supabase) return { success: false, error: 'Supabase yapılandırılmamış.' }
  if (!PROVIDERS.includes(provider)) {
    return { success: false, error: 'Geçersiz giriş sağlayıcısı.' }
  }

  const remember = opts.remember !== false
  setRememberMe(remember)
  syncAutoRefresh(remember)

  const flow = opts.flow === 'signup' ? 'signup' : 'login'
  const params = new URLSearchParams({ flow })
  if (opts.plan) params.set('plan', opts.plan)

  stashOAuthPending({ flow, plan: opts.plan })

  const origin = getOAuthRedirectOrigin()
  if (!origin) {
    return { success: false, error: 'Yönlendirme adresi belirlenemedi.' }
  }
  const redirectTo = `${origin}/auth/callback?${params.toString()}`

  const options = { redirectTo }
  if (provider === 'google') {
    options.queryParams = { access_type: 'offline', prompt: 'select_account' }
  }
  if (provider === 'facebook') {
    options.scopes = 'email,public_profile'
  }

  const { data, error } = await supabase.auth.signInWithOAuth({ provider, options })
  if (error) {
    clearOAuthPending()
    if (isProviderNotEnabledError(error)) {
      return {
        success: false,
        providerNotConfigured: true,
        error: providerNotEnabledMessage(provider),
      }
    }
    return { success: false, error: error.message }
  }
  if (data?.url) {
    window.location.replace(data.url)
    return { success: true, redirecting: true }
  }
  clearOAuthPending()
  return { success: false, error: 'Giriş sayfasına yönlendirilemedi.' }
}
