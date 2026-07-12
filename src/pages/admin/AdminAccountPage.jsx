import { useState } from 'react'
import { Lock, Eye, EyeOff, Loader2, Shield, Mail } from 'lucide-react'
import { supabase } from '../../services/supabaseClient'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { PASSWORD_RULES, isPasswordValid } from '../../services/password'
import { ADMIN_EMAIL } from '../../config/brand'
import PanelPageHeader, { PanelPageShell } from '../../components/layout/PanelPageHeader'
import { PANEL_IMAGES } from '../../utils/panelImages'

export default function AdminAccountPage() {
  const { user } = useApp()
  const { toast } = useToast()
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)

  const email = (user?.email || ADMIN_EMAIL).toLowerCase()

  const handlePasswordSave = async (e) => {
    e.preventDefault()
    if (!currentPassword) {
      toast('Mevcut şifrenizi girin.', 'error')
      return
    }
    if (!isPasswordValid(password)) {
      toast('Yeni şifre gereksinimleri karşılanmıyor.', 'error')
      return
    }
    if (password !== passwordConfirm) {
      toast('Yeni şifreler eşleşmiyor.', 'error')
      return
    }
    if (currentPassword === password) {
      toast('Yeni şifre mevcut şifreden farklı olmalı.', 'error')
      return
    }

    setSaving(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      })
      if (signInError) {
        toast('Mevcut şifre hatalı.', 'error')
        return
      }
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast('Şifreniz güncellendi.', 'success')
      setCurrentPassword('')
      setPassword('')
      setPasswordConfirm('')
    } catch (err) {
      toast(err.message || 'Şifre güncellenemedi.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PanelPageShell>
      <PanelPageHeader
        title="Hesap Ayarları"
        subtitle="Admin e-posta ve şifre yönetimi"
        icon={Shield}
        accent="admin"
        image={PANEL_IMAGES.profileCoverDesktop}
      />

      <div className="mx-auto w-full max-w-xl space-y-6">
        <section className="rounded-2xl border border-cream-200 bg-white p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-cream-900">
            <Mail className="h-5 w-5 text-brand-500" /> Giriş e-postası
          </h2>
          <p className="mt-2 text-sm text-cream-800/65">
            Admin paneline bu adresle giriş yaparsınız. E-posta değişikliği için geliştirici desteği gerekir
            (<code className="mx-1 rounded bg-cream-50 px-1.5 py-0.5 text-xs">is_admin</code>
            + ortam değişkenleri).
          </p>
          <p className="mt-3 rounded-xl border border-cream-100 bg-cream-50/80 px-4 py-3 font-medium text-cream-900">
            {email}
          </p>
        </section>

        <section className="rounded-2xl border border-cream-200 bg-white p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-cream-900">
            <Lock className="h-5 w-5 text-brand-500" /> Şifre değiştir
          </h2>
          <p className="mt-2 text-sm text-cream-800/65">
            Yeni şifre yalnızca sizin bilginizde kalır; kod veya dokümantasyonda saklanmaz.
          </p>

          <div className="mt-4 rounded-xl border border-cream-100 bg-cream-50/60 px-4 py-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-cream-800/60">
              Şifre gereksinimleri
            </p>
            <ul className="space-y-1">
              {PASSWORD_RULES.map((rule) => {
                const ok = rule.test(password)
                return (
                  <li
                    key={rule.label}
                    className={`text-xs ${ok ? 'text-sage-700' : 'text-cream-800/55'}`}
                  >
                    {ok ? '✓' : '·'} {rule.label}
                  </li>
                )
              })}
            </ul>
          </div>

          <form onSubmit={handlePasswordSave} className="mt-5 space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-cream-800/70">Mevcut şifre</span>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-cream-200 px-4 py-3 pr-11 text-sm outline-none focus:border-brand-300"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-800/40"
                  aria-label={showCurrent ? 'Gizle' : 'Göster'}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-cream-800/70">Yeni şifre</span>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-cream-200 px-4 py-3 pr-11 text-sm outline-none focus:border-brand-300"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-800/40"
                  aria-label={showPass ? 'Gizle' : 'Göster'}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-cream-800/70">Yeni şifre (tekrar)</span>
              <input
                type={showPass ? 'text' : 'password'}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm outline-none focus:border-brand-300"
                required
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cream-900 px-4 py-3 text-sm font-semibold text-white hover:bg-cream-800 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              {saving ? 'Kaydediliyor…' : 'Şifreyi güncelle'}
            </button>
          </form>
        </section>
      </div>
    </PanelPageShell>
  )
}
