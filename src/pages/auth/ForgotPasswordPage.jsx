import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, ArrowLeft, Loader2, CheckCircle2, Send } from 'lucide-react'
import { supabase, isSupabaseEnabled } from '../../services/supabaseClient'
import { getSiteUrl } from '../../config/seo'
import { useToast } from '../../context/ToastContext'
import { BRAND } from '../../config/brand'

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState('')
  const [sent, setSent]     = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.includes('@')) { toast('Geçerli bir e-posta girin', 'error'); return }
    if (!isSupabaseEnabled || !supabase) { toast('Supabase yapılandırması eksik', 'error'); return }

    setLoading(true)
    try {
      // client-side zorunlu: PKCE code_verifier localStorage'a kaydedilmeli.
      const redirectTo = `${getSiteUrl()}/auth/callback?next=reset-password`
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
      if (error) throw error
      setSent(true)
    } catch (err) {
      toast(err.message || 'Bağlantı gönderilemedi', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-cream-900 via-brand-900 to-sage-900 px-4 py-10">
      {/* dekorasyon */}
      <div aria-hidden className="pointer-events-none absolute left-[6%] top-[10%] h-64 w-64 rounded-full bg-brand-400/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute bottom-[8%] right-[5%] h-80 w-80 rounded-full bg-sage-400/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute right-[20%] top-[40%] h-48 w-48 rounded-full bg-violet-400/15 blur-3xl" />

      {/* logo */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative mb-10 flex items-center gap-3"
      >
        <img src={BRAND.assets.mark} alt="" className="h-12 w-12 rounded-2xl shadow-xl ring-2 ring-white/20" />
        <img src={BRAND.assets.logo} alt={BRAND.name} className="h-8 brightness-0 invert" />
      </motion.div>

      {/* kart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white/95 shadow-2xl shadow-black/25 backdrop-blur-xl"
      >
        {/* üst şerit */}
        <div aria-hidden className="h-1.5 w-full bg-gradient-to-r from-brand-500 via-sage-500 to-violet-500" />

        <div className="p-8">
          <AnimatePresence mode="wait">
            {sent ? (
              /* başarı durumu */
              <motion.div
                key="sent"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                  className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sage-400 to-emerald-600 text-white shadow-lg shadow-sage-500/40"
                >
                  <CheckCircle2 className="h-10 w-10" />
                </motion.div>

                <h1 className="mt-6 font-display text-2xl font-bold text-cream-900">
                  E-posta gönderildi!
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-cream-800/65">
                  <span className="font-semibold text-cream-900">{email}</span> adresine şifre
                  sıfırlama bağlantısı gönderildi.
                </p>
                <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
                  <p className="text-xs leading-relaxed text-amber-700">
                    📬 Gelen kutunuzda göremiyorsanız <strong>spam / gereksiz</strong> klasörünü
                    kontrol edin. Bağlantı <strong>1 saat</strong> içinde geçersiz olur.
                  </p>
                </div>

                <div className="mt-6 flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => { setSent(false); setEmail('') }}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-cream-200 bg-white py-3 text-sm font-semibold text-cream-800 transition hover:bg-cream-50"
                  >
                    Farklı e-posta dene
                  </button>
                  <Link
                    to="/login"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-sage-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/30 transition hover:brightness-105"
                  >
                    <ArrowLeft className="h-4 w-4" /> Giriş sayfasına dön
                  </Link>
                </div>
              </motion.div>
            ) : (
              /* form */
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35 }}
              >
                <Link
                  to="/login"
                  className="mb-6 inline-flex items-center gap-1.5 text-sm text-cream-800/55 transition hover:text-brand-600"
                >
                  <ArrowLeft className="h-4 w-4" /> Girişe dön
                </Link>

                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 text-brand-600">
                  <Mail className="h-7 w-7" />
                </div>

                <h1 className="font-display text-2xl font-bold text-cream-900">Şifre Sıfırlama</h1>
                <p className="mt-2 text-sm leading-relaxed text-cream-800/60">
                  Kayıtlı e-posta adresinizi girin; size güvenli bir sıfırlama bağlantısı gönderelim.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-800/35" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-cream-200 bg-cream-50/50 py-3.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-cream-800/35 focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                      placeholder="ornek@email.com"
                      autoComplete="email"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-500 to-sage-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/30 transition hover:brightness-105 disabled:opacity-60"
                  >
                    {loading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Gönderiliyor…</>
                    ) : (
                      <><Send className="h-4 w-4" /> Sıfırlama Bağlantısı Gönder</>
                    )}
                  </button>
                </form>

                <p className="mt-5 text-center text-xs text-cream-800/40">
                  Hesabınızı hatırladınız mı?{' '}
                  <Link to="/login" className="font-semibold text-brand-600 hover:underline">
                    Giriş yapın
                  </Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <p className="relative mt-8 text-center text-xs text-white/35">
        © {new Date().getFullYear()} {BRAND.name}
      </p>
    </div>
  )
}
