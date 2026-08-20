import { useMemo, useState } from 'react'
import { CreditCard, ExternalLink, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { getPlanLabel } from '../../data/membershipPlans'
import { MEMBERSHIP_CANCEL_COPY, MEMBERSHIP_CANCEL_SUPPORT_EMAIL } from '../../data/membershipCancelCopy'
import {
  isOneTimePackage,
  isPackageEntryActive,
  migrateLegacyToPackages,
  packageBillingSubscriptionId,
} from '../../utils/memberPackages'
import { resumeStripeSubscription, startStripePortal } from '../../services/stripePayment'
import MembershipCancelDialog from './MembershipCancelDialog'

function dateLabel(iso) {
  if (!iso) return '—'
  try {
    return format(new Date(iso), 'd MMMM yyyy', { locale: tr })
  } catch {
    return String(iso)
  }
}

export default function MemberSubscriptionPackages({ user, onRefresh, toast }) {
  const copy = MEMBERSHIP_CANCEL_COPY
  const [busyKey, setBusyKey] = useState(null)
  const [dialog, setDialog] = useState(null)

  const packages = useMemo(
    () => migrateLegacyToPackages(user).filter((p) => isPackageEntryActive(p)),
    [user],
  )

  const runPortal = async (opts) => {
    setBusyKey(opts.key)
    try {
      const result = await startStripePortal(opts)
      if (!result.success) toast(result.error || copy.portalFail, 'error')
    } finally {
      setBusyKey(null)
    }
  }

  const confirmDialog = async () => {
    if (!dialog) return
    const { variant, subscriptionId, key } = dialog
    if (variant === 'resume') {
      setBusyKey(key)
      try {
        const result = await resumeStripeSubscription(subscriptionId)
        if (!result.success) {
          toast(result.error || copy.resumeFail, 'error')
          return
        }
        toast(copy.resumedToast, 'success')
        setDialog(null)
        await onRefresh?.()
      } finally {
        setBusyKey(null)
      }
      return
    }
    setDialog(null)
    await runPortal({
      key,
      intent: 'cancel',
      mode: variant === 'immediate' ? 'immediately' : 'at_period_end',
      subscriptionId,
    })
  }

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-cream-900">
        <CreditCard className="h-5 w-5 text-brand-500" /> {copy.packagesTitle}
      </h2>
      <p className="mb-4 text-sm text-cream-800/70">{copy.independentNote}</p>

      {packages.length === 0 ? (
        <div className="rounded-2xl border border-cream-200 bg-white p-6 text-sm text-cream-800/70">
          Aktif ücretli paketiniz yok. Yeni paket eklemek için Planlar sayfasını kullanın.
        </div>
      ) : (
        <div className="space-y-3">
          {packages.map((pkg) => {
            const subId = packageBillingSubscriptionId(pkg, user)
            const oneTime = isOneTimePackage(pkg)
            const access = pkg.currentPeriodEnd || pkg.expiresAt
            const key = pkg.id || pkg.planId
            const label = getPlanLabel(pkg.planId)
            return (
              <article key={key} className="rounded-2xl border border-cream-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-base font-bold text-cream-900">{label}</p>
                    <p className="mt-1 text-sm text-cream-800/70">
                      {oneTime
                        ? 'Tek seferlik paket'
                        : access
                          ? `${pkg.cancelAtPeriodEnd ? 'Yenileme kapalı · erişim ' : 'Bitiş '}${dateLabel(access)}`
                          : 'Aktif abonelik'}
                    </p>
                    {pkg.cancelAtPeriodEnd ? (
                      <span className="mt-2 inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                        {copy.renewalOffBadge}
                      </span>
                    ) : null}
                  </div>
                </div>

                {oneTime ? (
                  <p className="mt-3 text-sm leading-relaxed text-cream-800">
                    {copy.doctorBody}{' '}
                    <a
                      className="font-semibold text-brand-700 underline-offset-2 hover:underline"
                      href={`mailto:${MEMBERSHIP_CANCEL_SUPPORT_EMAIL}`}
                    >
                      {MEMBERSHIP_CANCEL_SUPPORT_EMAIL}
                    </a>
                  </p>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {subId && !pkg.cancelAtPeriodEnd && (
                      <>
                        <button
                          type="button"
                          disabled={Boolean(busyKey)}
                          onClick={() => setDialog({
                            variant: 'period_end',
                            subscriptionId: subId,
                            planLabel: label,
                            dateLabel: dateLabel(access),
                            key: `${key}-period`,
                          })}
                          className="rounded-xl border border-cream-200 px-3.5 py-2 text-sm font-semibold text-cream-900 hover:bg-cream-50 disabled:opacity-50"
                        >
                          {copy.closeRenewal}
                        </button>
                        <button
                          type="button"
                          disabled={Boolean(busyKey)}
                          onClick={() => setDialog({
                            variant: 'immediate',
                            subscriptionId: subId,
                            planLabel: label,
                            dateLabel: dateLabel(access),
                            key: `${key}-now`,
                          })}
                          className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50"
                        >
                          {copy.closeNow}
                        </button>
                      </>
                    )}
                    {subId && pkg.cancelAtPeriodEnd && (
                      <button
                        type="button"
                        disabled={Boolean(busyKey)}
                        onClick={() => setDialog({
                          variant: 'resume',
                          subscriptionId: subId,
                          planLabel: label,
                          dateLabel: dateLabel(access),
                          key: `${key}-resume`,
                        })}
                        className="rounded-xl bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
                      >
                        {copy.keepRenewal}
                      </button>
                    )}
                    {!subId && (
                      <p className="text-xs text-cream-800/60">
                        Bu paketin Stripe aboneliği eşleşmedi. Kart/fatura veya {MEMBERSHIP_CANCEL_SUPPORT_EMAIL}
                      </p>
                    )}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-cream-200 bg-white p-5">
        <p className="text-sm text-cream-800/70">{copy.manageNote}</p>
        <button
          type="button"
          disabled={Boolean(busyKey)}
          onClick={() => runPortal({ key: 'manage', intent: 'manage' })}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {busyKey === 'manage' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
          {copy.cardInvoice}
        </button>
      </div>

      <MembershipCancelDialog
        open={Boolean(dialog)}
        onClose={() => { if (!busyKey) setDialog(null) }}
        variant={dialog?.variant}
        planLabel={dialog?.planLabel}
        dateLabel={dialog?.dateLabel}
        busy={Boolean(busyKey)}
        onConfirm={() => void confirmDialog()}
      />
    </section>
  )
}
