import { isSupabaseEnabled } from '../../services/supabaseClient'
import BrandLogo from './BrandLogo'

export default function ConfigErrorScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream-50 px-6 py-12">
      <BrandLogo />
      <div className="mt-8 max-w-md rounded-3xl border border-amber-200 bg-white p-6 text-center shadow-sm">
        <p className="font-display text-xl font-bold text-cream-900">Yapılandırma Gerekli</p>
        <p className="mt-3 text-sm leading-relaxed text-cream-800/70">
          Uygulama artık yalnızca Supabase ile çalışır. Lütfen{' '}
          <code className="rounded bg-cream-100 px-1.5 py-0.5 text-xs">VITE_SUPABASE_URL</code> ve{' '}
          <code className="rounded bg-cream-100 px-1.5 py-0.5 text-xs">VITE_SUPABASE_PUBLISHABLE_KEY</code>{' '}
          (veya anon key) değerlerini tanımlayın.
        </p>
        <div className="mt-5 rounded-2xl bg-cream-50 p-4 text-left text-xs text-cream-800/60">
          <p className="font-semibold text-cream-900">Yerel geliştirme</p>
          <p className="mt-1">`.env.example` dosyasını `.env` olarak kopyalayın ve Supabase anahtarlarını girin.</p>
          <p className="mt-3 font-semibold text-cream-900">Vercel / Production</p>
          <p className="mt-1">Vercel Dashboard → Settings → Environment Variables bölümüne aynı değişkenleri ekleyip yeniden deploy edin.</p>
        </div>
        {!isSupabaseEnabled && (
          <p className="mt-4 text-xs font-medium text-red-500">Supabase bağlantı bilgileri algılanamadı.</p>
        )}
      </div>
    </div>
  )
}
