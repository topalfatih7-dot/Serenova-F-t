import { supabase } from './supabaseClient'
import { getSiteUrl } from '../config/seo'
import { setRememberMe } from './authStorage'
import { syncAutoRefresh } from './supabaseClient'

const PROVIDERS = ['google', 'apple', 'facebook']

const PROVIDER_LABELS = {
  google: 'Google',
  apple: 'Apple',
  facebook: 'Facebook',
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
 * @param {'google'|'apple'|'facebook'} provider
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

  const redirectTo = `${getSiteUrl()}/auth/callback?${params.toString()}`

  const options = { redirectTo }
  if (provider === 'google') {
    options.queryParams = { access_type: 'offline', prompt: 'select_account' }
  }
  if (provider === 'apple') {
    options.scopes = 'name email'
  }
  if (provider === 'facebook') {
    options.scopes = 'email public_profile'
  }

  const { data, error } = await supabase.auth.signInWithOAuth({ provider, options })
  if (error) {
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
  return { success: false, error: 'Giriş sayfasına yönlendirilemedi.' }
}
