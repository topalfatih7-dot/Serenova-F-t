import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, Loader2 } from 'lucide-react'
import { supabase, isSupabaseEnabled } from '../../services/supabaseClient'
import { getSiteUrl } from '../../config/seo'
import { useToast } from '../../context/ToastContext'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.includes('@')) {
      toast('Geçerli bir e-posta girin', 'error')
      return
    }
    if (!isSupabaseEnabled || !supabase) {
      toast('Supabase yapılandırması eksik', 'error')
      return
    }
    setLoading(true)
    try {
      const redirectTo = `${getSiteUrl()}/reset-password`
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
      if (error) throw error
      setSent(true)
      toast('Sıfırlama bağlantısı e-postanıza gönderildi', 'success')
    } catch (err) {
      toast(err.message || 'Bağlantı gönderilemedi', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link to="/login" className="mb-6 inline-flex items-center gap-1 text-sm text-cream-800/60 hover:text-brand-600">
          <ArrowLeft className="h-4 w-4" /> Girişe dön
        </Link>
        <h1 className="font-display text-2xl font-bold text-cream-900">Şifre Sıfırlama</h1>
        <p className="mt-2 text-sm text-cream-800/60">E-posta adresinize sıfırlama bağlantısı göndereceğiz.</p>

        {sent ? (
          <div className="mt-8 rounded-2xl border border-sage-200 bg-sage-50 p-6 text-center">
            <p className="font-medium text-sage-700">Bağlantı gönderildi!</p>
            <p className="mt-2 text-sm text-cream-800/60">
              Gelen kutunuzu ve spam klasörünü kontrol edin. Bağlantı bir süre sonra geçersiz olur.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 rounded-2xl border border-cream-200 bg-white p-6">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-800/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-cream-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-brand-300"
                placeholder="E-posta adresiniz"
                autoComplete="email"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sıfırlama Bağlantısı Gönder
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}
