import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Lock, Shield,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { changeAccountPassword } from '../../services/accountPassword'
import { PASSWORD_RULES, isPasswordValid } from '../../services/password'
import { isSocialAuthUser } from '../../utils/memberProfile'
import ProfileSectionCard from './ProfileSectionCard'

const SOCIAL_LABELS = {
  google: 'Google',
  facebook: 'Facebook',
  apple: 'Apple',
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  show,
  onToggleShow,
  error,
  hint,
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cream-800/70">
        {label}
      </label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-700/55" />
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={`w-full rounded-2xl border bg-white py-3.5 pl-11 pr-12 text-sm text-cream-900 outline-none transition placeholder:text-cream-800/40 focus:ring-4 ${
            error
              ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
              : 'border-cream-200 focus:border-brand-500 focus:ring-brand-100'
          }`}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-cream-800/40 transition hover:bg-cream-100 hover:text-brand-600"
          aria-label={show ? 'Şifreyi gizle' : 'Şifreyi göster'}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-red-500">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-cream-800/50">{hint}</p>
      ) : null}
    </div>
  )
}

function PasswordStrength({ password }) {
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length
  const total = PASSWORD_RULES.length
  const pct = total ? (passed / total) * 100 : 0
  const bar = pct === 0
    ? 'bg-cream-200'
    : pct <= 40
      ? 'bg-red-400'
      : pct <= 70
        ? 'bg-amber-400'
        : pct < 100
          ? 'bg-brand-400'
          : 'bg-sage-500'
  const label = pct === 0
    ? ''
    : pct <= 40
      ? 'Çok zayıf'
      : pct <= 70
        ? 'Orta'
        : pct < 100
          ? 'İyi'
          : 'Güçlü'

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream-100">
          <div
            className={`h-full rounded-full transition-all duration-300 ${bar}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {label ? <span className="text-[11px] font-semibold text-cream-800/55">{label}</span> : null}
      </div>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(password)
          return (
            <li
              key={rule.label}
              className={`flex items-center gap-1.5 text-xs transition-colors ${
                ok ? 'font-medium text-sage-700' : 'text-cream-800/45'
              }`}
            >
              <Check className={`h-3.5 w-3.5 shrink-0 ${ok ? '' : 'opacity-25'}`} strokeWidth={3} />
              {rule.label}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function PasswordChangeSection() {
  const { authUser } = useApp()
  const { toast } = useToast()
  const socialOnly = isSocialAuthUser(authUser)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const socialLabel = useMemo(() => {
    const identities = authUser?.identities || []
    const provider = identities.find((i) => SOCIAL_LABELS[i.provider])?.provider
    return SOCIAL_LABELS[provider] || 'sosyal hesap'
  }, [authUser])

  const mismatch = Boolean(confirmPassword) && confirmPassword !== newPassword
  const canSubmit = Boolean(
    currentPassword
    && isPasswordValid(newPassword)
    && confirmPassword === newPassword
    && currentPassword !== newPassword
    && !saving,
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!currentPassword) {
      toast('Mevcut şifrenizi girin.', 'error')
      return
    }
    if (!isPasswordValid(newPassword)) {
      toast('Yeni şifre tüm gereksinimleri karşılamalı.', 'error')
      return
    }
    if (newPassword !== confirmPassword) {
      toast('Yeni şifreler eşleşmiyor.', 'error')
      return
    }
    if (currentPassword === newPassword) {
      toast('Yeni şifre mevcut şifreden farklı olmalı.', 'error')
      return
    }

    setSaving(true)
    setDone(false)
    try {
      await changeAccountPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setDone(true)
      toast('Şifreniz güncellendi.', 'success')
    } catch (err) {
      toast(err?.message || 'Şifre güncellenemedi.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (socialOnly) {
    return (
      <ProfileSectionCard
        icon={Shield}
        title="Şifre"
        subtitle="Bu hesap sosyal giriş kullanıyor"
        accent="sage"
        delay={0.18}
      >
        <div className="rounded-2xl border border-sage-100 bg-white/80 px-4 py-4">
          <p className="text-sm leading-relaxed text-cream-800/75">
            Girişiniz {socialLabel} ile. Bu hesapta e-posta şifresi yok.
            İsterseniz e-postanıza sıfırlama bağlantısı göndererek bir şifre belirleyebilirsiniz.
          </p>
          <Link
            to="/forgot-password"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            Şifre belirleme bağlantısı gönder
          </Link>
        </div>
      </ProfileSectionCard>
    )
  }

  return (
    <ProfileSectionCard
      icon={KeyRound}
      title="Şifre Değiştir"
      subtitle="Mevcut şifrenizi doğrulayın, yenisini iki kez girin"
      accent="sage"
      delay={0.18}
    >
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 flex items-center gap-2 rounded-2xl border border-sage-200 bg-sage-50 px-3.5 py-2.5 text-sm font-medium text-sage-800"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Şifreniz güncellendi.
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordField
          id="profile-current-password"
          label="Mevcut şifre"
          value={currentPassword}
          onChange={(e) => { setCurrentPassword(e.target.value); setDone(false) }}
          autoComplete="current-password"
          placeholder="Şu anki şifreniz"
          show={showCurrent}
          onToggleShow={() => setShowCurrent((v) => !v)}
        />

        <div className="rounded-2xl border border-cream-100 bg-cream-50/70 px-4 py-3.5">
          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-cream-800/55">
            Yeni şifre gereksinimleri
          </p>
          <PasswordStrength password={newPassword} />
        </div>

        <PasswordField
          id="profile-new-password"
          label="Yeni şifre"
          value={newPassword}
          onChange={(e) => { setNewPassword(e.target.value); setDone(false) }}
          autoComplete="new-password"
          placeholder="Yeni şifrenizi girin"
          show={showNew}
          onToggleShow={() => setShowNew((v) => !v)}
        />

        <PasswordField
          id="profile-confirm-password"
          label="Yeni şifre (tekrar)"
          value={confirmPassword}
          onChange={(e) => { setConfirmPassword(e.target.value); setDone(false) }}
          autoComplete="new-password"
          placeholder="Yeni şifreyi tekrar girin"
          show={showConfirm}
          onToggleShow={() => setShowConfirm((v) => !v)}
          error={mismatch ? 'Şifreler eşleşmiyor.' : ''}
        />

        <button
          type="submit"
          disabled={!canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sage-600 to-brand-600 py-3.5 text-sm font-bold text-white shadow-md shadow-sage-500/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
          {saving ? 'Güncelleniyor…' : 'Şifreyi güncelle'}
        </button>

        <p className="text-center text-xs text-cream-800/50">
          Mevcut şifrenizi hatırlamıyor musunuz?{' '}
          <Link to="/forgot-password" className="font-semibold text-brand-700 hover:text-brand-800">
            Sıfırlama bağlantısı alın
          </Link>
        </p>
      </form>
    </ProfileSectionCard>
  )
}
