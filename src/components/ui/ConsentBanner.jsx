import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, X } from 'lucide-react'
import { ANALYTICS_CONSENT_KEY, hasAnalyticsConsent, initGa4 } from '../../utils/ga4Loader'

export default function ConsentBanner() {
  const [visible, setVisible] = useState(() => !hasAnalyticsConsent())

  useEffect(() => {
    if (hasAnalyticsConsent()) {
      initGa4({ analyticsGranted: true }).catch(() => {})
    }
  }, [])

  const accept = async () => {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, '1')
    setVisible(false)
    try {
      await initGa4({ analyticsGranted: true })
    } catch {
      /* analytics opsiyonel */
    }
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 sm:bottom-4 sm:left-auto sm:right-6 sm:max-w-md">
      <div className="flex gap-3 rounded-2xl border border-cream-200 bg-white p-4 shadow-xl">
        <Shield className="h-5 w-5 shrink-0 text-brand-500" />
        <div className="flex-1">
          <p className="text-sm font-medium text-cream-900">Gizlilik ve KVKK</p>
          <p className="mt-1 text-xs text-cream-800/60">
            Deneyiminizi iyileştirmek için çerezler ve anonim analitik kullanıyoruz. Devam ederek{' '}
            <Link to="/legal/kvkk" className="font-medium text-brand-600 underline hover:text-brand-700">KVKK aydınlatma metnini</Link>
            {' '}ve{' '}
            <Link to="/legal/gizlilik-politikasi" className="font-medium text-brand-600 underline hover:text-brand-700">gizlilik politikasını</Link>
            {' '}kabul etmiş olursunuz.
          </p>
          <button
            type="button"
            onClick={accept}
            className="mt-3 rounded-lg bg-brand-500 px-4 py-1.5 text-xs font-semibold text-white"
          >
            Kabul Et
          </button>
        </div>
        <button type="button" onClick={accept} className="text-cream-800/40 hover:text-cream-800" aria-label="Kapat ve kabul et">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
