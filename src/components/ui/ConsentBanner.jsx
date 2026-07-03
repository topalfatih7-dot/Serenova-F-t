import { Link } from 'react-router-dom'
import { useState } from 'react'
import { X, Shield } from 'lucide-react'

export default function ConsentBanner() {
  const [visible, setVisible] = useState(() => !localStorage.getItem('serenova-consent'))

  const accept = () => {
    localStorage.setItem('serenova-consent', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 sm:bottom-4 sm:left-auto sm:right-6 sm:max-w-md">
      <div className="flex gap-3 rounded-2xl border border-cream-200 bg-white p-4 shadow-xl">
        <Shield className="h-5 w-5 shrink-0 text-brand-500" />
        <div className="flex-1">
          <p className="text-sm font-medium text-cream-900">Gizlilik ve KVKK</p>
          <p className="mt-1 text-xs text-cream-800/60">
            Deneyiminizi iyileştirmek için çerezler kullanıyoruz. Devam ederek{' '}
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
        <button type="button" onClick={accept} className="text-cream-800/40 hover:text-cream-800">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
