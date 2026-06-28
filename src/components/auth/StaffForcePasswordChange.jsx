import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, Loader2, ShieldCheck, Check } from 'lucide-react'
import { supabase } from '../../services/supabaseClient'
import { useToast } from '../../context/ToastContext'
import { PASSWORD_RULES, isPasswordValid } from '../../services/password'
import { BRAND } from '../../config/brand'
import BrandLogo from '../ui/BrandLogo'

/**
 * Koç ve diyetisyenler ilk girişte (geçici şifreyle) karşılaşır.
 * Şifre politikasına uygun yeni şifre girmeleri zorunludur.
 * onDone: Supabase updateUser başarılıysa çağrılır.
 */
export default function StaffForcePasswordChange({ staffName, onDone }) {
  const { toast } = useToast()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isPasswordValid(password)) {
      toast('Şifreniz tüm gereksinimleri karşılamalıdır.', 'error')
      return
    }
    if (password !== confirm) {
      toast('Şifreler eşleşmiyor.', 'error')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast('Şifreniz başarıyla güncellendi!', 'success')
      onDone()
    } catch (err) {
      toast(err.message || 'Şifre güncellenemedi, lütfen tekrar deneyin.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-brand-900/95 via-cream-900/90 to-sage-900/95 px-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="mb-6 flex justify-center">
          <BrandLogo size="md" />
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl shadow-black/30">
          {/* Üst çizgi */}
          <div aria-hidden className="h-1.5 bg-gradient-to-r from-brand-500 via-sage-500 to-violet-500" />

          <div className="p-8">
            {/* İkon + başlık */}
            <div className="mb-6 flex flex-col items-center text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-sage-500 text-white shadow-lg shadow-brand-500/30">
                <ShieldCheck className="h-8 w-8" />
              </span>
              <h1 className="mt-4 font-display text-2xl font-bold text-cream-900">
                Şifrenizi Güncelleyin
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-cream-800/65">
                Merhaba{staffName ? ` ${staffName.split(' ')[0]}` : ''},
                {' '}ilk girişiniz olduğu için güvenli bir şifre belirlemeniz gerekmektedir.
              </p>
            </div>

            {/* Şifre gereksinimleri */}
            <div className="mb-5 rounded-xl border border-cream-100 bg-cream-50/60 px-4 py-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-cream-800/60">
                Şifre gereksinimleri
              </p>
              <ul className="space-y-1">
                {PASSWORD_RULES.map((r) => {
                  const ok = r.test(password)
                  return (
                    <li
                      key={r.label}
                      className={`flex items-center gap-1.5 text-xs transition-colors ${ok ? 'text-sage-600' : 'text-cream-800/40'}`}
                    >
                      <Check className={`h-3.5 w-3.5 shrink-0 ${ok ? '' : 'opacity-30'}`} strokeWidth={3} />
                      {r.label}
                    </li>
                  )
                })}
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Yeni şifre */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cream-800">
                  Yeni Şifre
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-700" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-cream-300 bg-white py-3.5 pl-11 pr-12 text-sm text-cream-900 outline-none transition placeholder:text-cream-800/40 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                    placeholder="Yeni şifrenizi girin"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-cream-800/40 hover:text-brand-500"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Şifre tekrarı */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cream-800">
                  Şifre Tekrarı
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-700" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={`w-full rounded-2xl border py-3.5 pl-11 pr-12 text-sm text-cream-900 outline-none transition placeholder:text-cream-800/40 focus:ring-4 ${
                      confirm && confirm !== password
                        ? 'border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-red-100'
                        : 'border-cream-300 bg-white focus:border-brand-500 focus:ring-brand-100'
                    }`}
                    placeholder="Şifrenizi tekrar girin"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-cream-800/40 hover:text-brand-500"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirm && confirm !== password && (
                  <p className="mt-1.5 text-xs font-medium text-red-500">Şifreler eşleşmiyor.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !isPasswordValid(password) || password !== confirm}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-sage-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/30 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Kaydediliyor…' : 'Şifremi Kaydet ve Devam Et'}
              </button>
            </form>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-white/40">© {new Date().getFullYear()} {BRAND.name}</p>
      </motion.div>
    </div>
  )
}
