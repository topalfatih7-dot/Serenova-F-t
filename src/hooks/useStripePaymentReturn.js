import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import {
  clearStripePaymentGrace,
  markStripePaymentGrace,
} from '../utils/stripePaymentGrace'
import { findStripePaymentBySession } from '../services/supabaseDb'
import { trackGa4Event } from '../utils/ga4Loader'

const POLL_DELAYS_MS = [400, 800, 1200, 1800, 2500, 3500, 5000, 7000]

function sleep(ms) {
  return new Promise((resolve) => { setTimeout(resolve, ms) })
}

/**
 * Stripe Checkout dönüşü: webhook gecikmesine karşı ödeme kaydını poll eder,
 * üyeliği tazeler; süre dolumu senkronunun ödemeyi ezmesini engeller.
 */
export default function useStripePaymentReturn(refresh, options = {}) {
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const successMessage = options.successMessage
    || 'Ödeme alındı! Üyeliğiniz birkaç saniye içinde aktifleşecek.'

  useEffect(() => {
    if (searchParams.get('payment') !== 'success') return undefined

    markStripePaymentGrace()
    const sessionId = searchParams.get('session_id')
    toast(successMessage, 'success')
    trackGa4Event('purchase', {
      transaction_id: sessionId || undefined,
      currency: 'TRY',
    })

    const next = new URLSearchParams(searchParams)
    next.delete('payment')
    next.delete('session_id')
    setSearchParams(next, { replace: true })

    let active = true

    ;(async () => {
      for (let i = 0; i < POLL_DELAYS_MS.length; i++) {
        if (!active) return
        await refresh?.()
        if (sessionId) {
          const payment = await findStripePaymentBySession(sessionId)
          if (payment) {
            clearStripePaymentGrace()
            await refresh?.()
            return
          }
        }
        await sleep(POLL_DELAYS_MS[i])
      }
      if (active) {
        await refresh?.()
        clearStripePaymentGrace()
      }
    })()

    return () => { active = false }
  // Yalnızca ilk mount — URL temizlendikten sonra tekrar tetiklenmesin
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
