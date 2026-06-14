import { createClient } from '@supabase/supabase-js'

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
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
