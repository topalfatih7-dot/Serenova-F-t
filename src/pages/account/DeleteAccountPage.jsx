import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, Lock, Mail } from 'lucide-react'
import SeoHead from '../../components/seo/SeoHead'
import FormField from '../../components/ui/FormField'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { ACCOUNT_DELETE_COPY, ACCOUNT_DELETE_SUPPORT_EMAIL } from '../../data/accountDeleteCopy'
import { getApiAuthHeaders } from '../../services/apiAuth'
import { supabase } from '../../services/supabaseClient'

const copy = ACCOUNT_DELETE_COPY

export default function DeleteAccountPage() {
  const [params] = useSearchParams()
  const done = params.get('done') === '1'
  const { isAuthenticated, isAdmin, isStaff, user, logout } = useApp()
  const { toast } = useToast()
  const [password, setPassword] = useState('')
  const [emailConfirm, setEmailConfirm] = useState('')
  const [ack, setAck] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const blocked = isAdmin || isStaff
  const accountEmail = String(user?.email || '').trim()

  const loginState = useMemo(
    () => ({ from: '/hesap-silme', message: 'Hesabı silmek için giriş yapın.' }),
    [],
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!ack) {
      toast(copy.needAck, 'error')
      return
    }
    setSubmitting(true)
    try {
      const headers = await getApiAuthHeaders()
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'delete-account',
          ack: true,
          password,
          emailConfirm,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        toast(json?.error || copy.fail, 'error')
        return
      }
      try {
        await logout()
      } catch {
        try {
          await supabase?.auth.signOut()
        } catch {
          /* already gone */
        }
      }
      window.location.replace('/hesap-silme?done=1')
    } catch {
      toast(copy.fail, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <article className="mx-auto max-w-xl px-4 py-12 sm:px-6 sm:py-16">
        <SeoHead title={copy.doneTitle} description={copy.doneBody} canonicalPath="/hesap-silme" noindex />
        <div className="rounded-3xl border border-sage-200 bg-white p-8 shadow-sm">
          <CheckCircle2 className="h-10 w-10 text-sage-600" />
          <h1 className="mt-4 font-display text-2xl font-bold text-cream-900">{copy.doneTitle}</h1>
          <p className="mt-3 text-sm leading-relaxed text-cream-800/75">{copy.doneBody}</p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-600"
          >
            {copy.homeCta}
          </Link>
        </div>
      </article>
    )
  }

  if (isAuthenticated && blocked) {
    return (
      <article className="mx-auto max-w-xl px-4 py-12 sm:px-6 sm:py-16">
        <SeoHead title={copy.seoTitle} description={copy.seoDescription} canonicalPath="/hesap-silme" />
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700">
          <ArrowLeft className="h-4 w-4" /> Ana sayfa
        </Link>
        <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-8">
          <h1 className="font-display text-2xl font-bold text-cream-900">{copy.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-cream-800/80">{copy.staffBlock}</p>
          <a
            href={`mailto:${ACCOUNT_DELETE_SUPPORT_EMAIL}`}
            className="mt-6 inline-flex rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-600"
          >
            {copy.staffMail}
          </a>
        </div>
      </article>
    )
  }

  return (
    <article className="mx-auto max-w-xl px-4 py-12 sm:px-6 sm:py-16">
      <SeoHead title={copy.seoTitle} description={copy.seoDescription} canonicalPath="/hesap-silme" />
      <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" /> Ana sayfa
      </Link>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-cream-900">{copy.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-cream-800/75">{copy.lead}</p>
      </header>
      <ul className="mb-6 space-y-2 rounded-2xl border border-red-100 bg-red-50/60 p-5 text-sm text-cream-800/80">
        {copy.bullets.map((item) => (
          <li key={item} className="flex gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <p className="mb-8 text-xs leading-relaxed text-cream-800/55">
        {copy.legalNote}{' '}
        <Link to="/legal/veri-saklama-ve-imha-politikasi" className="font-medium text-brand-600 underline">
          Veri Saklama ve İmha Politikası
        </Link>
      </p>

      {!isAuthenticated ? (
        <div className="rounded-3xl border border-cream-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-cream-800/70">{copy.loginHint}</p>
          <Link
            to="/login"
            state={loginState}
            className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600"
          >
            {copy.loginCta}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-cream-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium text-cream-800/55">{accountEmail}</p>
          <FormField
            label={copy.passwordLabel}
            icon={Lock}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint={copy.passwordHint}
          />
          <FormField
            label={copy.emailConfirmLabel}
            icon={Mail}
            type="email"
            autoComplete="email"
            value={emailConfirm}
            onChange={(e) => setEmailConfirm(e.target.value)}
            hint={copy.emailConfirmHint}
          />
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-cream-200 bg-cream-50/80 px-4 py-3 text-sm text-cream-800/80">
            <input
              type="checkbox"
              checked={ack}
              onChange={(e) => setAck(e.target.checked)}
              className="mt-1 h-4 w-4 accent-red-600"
            />
            <span>{copy.ack}</span>
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? copy.submitting : copy.cta}
          </button>
        </form>
      )}
    </article>
  )
}
