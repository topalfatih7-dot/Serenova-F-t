import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Check, CheckCircle2, Eye, EyeOff, Loader2, Lock,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { changeAccountPassword } from '../../services/accountPassword'
import { PASSWORD_RULES, isPasswordValid } from '../../services/password'
import { isSocialAuthUser } from '../../utils/memberProfile'

const SOCIAL_LABELS = {
  google: 'Google',
  facebook: 'Facebook',
  apple: 'Apple',
}

const inputCls = (error) => `w-full rounded-xl border bg-white py-2.5 pl-10 pr-11 text-sm text-cream-900 outline-none transition placeholder:text-cream-800/40 focus:ring-2 ${
  error
    ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
    : 'border-cream-200 focus:border-brand-500 focus:ring-brand-100'
}`

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
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-cream-800/70">
        {label}
      </label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-700/55" />
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={inputCls(error)}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-cream-800/40 transition hover:bg-cream-100 hover:text-brand-600"
          aria-label={show ? 'Şifreyi gizle' : 'Şifreyi göster'}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs font-medium text-red-500">{error}</p>
      ) : null}
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
      <div className="rounded-xl border border-cream-100 bg-cream-50/80 px-3.5 py-3">
        <p className="text-sm font-semibold text-cream-900">Şifre</p>
        <p className="mt-1 text-xs leading-relaxed text-cream-800/70">
          Girişiniz {socialLabel} ile; bu hesapta e-posta şifresi yok.
        </p>
        <Link
          to="/forgot-password"
          className="mt-2 inline-block text-xs font-semibold text-brand-700 hover:text-brand-800"
        >
          Şifre belirleme bağlantısı gönder
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-cream-100 bg-cream-50/50 px-3.5 py-3.5">
      <p className="text-sm font-semibold text-cream-900">Şifre değiştir</p>
      {done && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-sage-700">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          Şifreniz güncellendi.
        </p>
      )}
      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
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
        {newPassword ? (
          <ul className="grid grid-cols-2 gap-x-2 gap-y-1">
            {PASSWORD_RULES.map((rule) => {
              const ok = rule.test(newPassword)
              return (
                <li
                  key={rule.label}
                  className={`flex items-center gap-1 text-[11px] ${ok ? 'text-sage-700' : 'text-cream-800/45'}`}
                >
                  <Check className={`h-3 w-3 shrink-0 ${ok ? '' : 'opacity-25'}`} strokeWidth={3} />
                  {rule.label}
                </li>
              )
            })}
          </ul>
        ) : null}
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
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-sage-700 py-2.5 text-sm font-semibold text-white hover:bg-sage-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
          {saving ? 'Güncelleniyor…' : 'Şifreyi güncelle'}
        </button>
        <p className="text-center text-[11px] text-cream-800/50">
          Şifrenizi hatırlamıyor musunuz?{' '}
          <Link to="/forgot-password" className="font-semibold text-brand-700 hover:text-brand-800">
            Sıfırlama bağlantısı alın
          </Link>
        </p>
      </form>
    </div>
  )
}
