import { createClient } from '@supabase/supabase-js'
import { authStorage, getRememberMe } from './authStorage'

const url = import.meta.env.VITE_SUPABASE_URL
// Yeni "publishable" anahtar (sb_publishable_...) veya eski "anon" anahtarı destekler
const anonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY

// Supabase bağlantısı — production ortamında zorunlu.
// Ortam değişkenleri tanımlı değilse uygulama yapılandırma ekranı gösterir.
export const isSupabaseEnabled = Boolean(url && anonKey)

export const supabase = isSupabaseEnabled
  ? createClient(url, anonKey, {
      auth: {
        storage: authStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : null

/** "Beni hatırla" kapalıyken token yenilemeyi durdurur; süre dolunca oturum kapanır. */
export function syncAutoRefresh(remember) {
  if (!supabase) return
  if (remember) supabase.auth.startAutoRefresh()
  else supabase.auth.stopAutoRefresh()
}

if (supabase) {
  syncAutoRefresh(getRememberMe())
}
