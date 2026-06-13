import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import PackageBuilder from '../components/package/PackageBuilder'
import SupportScheduler, { DEFAULT_SUPPORT_SCHEDULE } from '../components/package/SupportScheduler'
import DisclaimerBox from '../components/ui/DisclaimerBox'
import Modal from '../components/ui/Modal'
import PaymentForm from '../components/payment/PaymentForm'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import { DEFAULT_PACKAGE } from '../data/membershipPlans'
import { calculatePackagePrice } from '../services/packagePricing'

export default function PackageBuilderPage() {
  const { packageConfig, supportSchedule, savePackage, processPremiumPayment, isAuthenticated } = useApp()
  const [config, setConfig] = useState(packageConfig || { ...DEFAULT_PACKAGE })
  const [schedule, setSchedule] = useState({ ...DEFAULT_SUPPORT_SCHEDULE, ...(supportSchedule || {}) })
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [pricing, setPricing] = useState(null)
  const [paying, setPaying] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  const hasSupport =
    (Number(config?.coachMeetingsPerWeek) || 0) > 0 ||
    (Number(config?.dietitianMeetingsPerMonth) || 0) > 0

  const handleSave = (cfg) => {
    savePackage(cfg)
    toast('Paket kaydedildi', 'success')
  }

  const handleUpgrade = () => {
    const price = calculatePackagePrice(config)
    setPricing(price)
    setPaymentOpen(true)
  }

  const confirmPayment = () => {
    setPaying(true)
    setTimeout(async () => {
      if (!isAuthenticated) {
        toast('Önce kayıt olun', 'warning')
        setPaying(false)
        setPaymentOpen(false)
        navigate('/onboarding')
        return
      }
      await savePackage(config)
      await processPremiumPayment(config, schedule)
      setPaying(false)
      setPaymentOpen(false)
      toast('Premium üyeliğiniz aktif! Ödeme başarılı.', 'success')
      navigate('/dashboard')
    }, 1200)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-cream-900">Premium Paket Oluşturucu</h1>
          <p className="mt-3 text-cream-800/60">İhtiyaçlarınıza göre paketinizi özelleştirin</p>
        </div>

        <div className="mt-10">
          <PackageBuilder
            config={config}
            onChange={setConfig}
            onSave={(cfg) => handleSave(cfg)}
            onReset={() => setConfig({ ...DEFAULT_PACKAGE })}
            userProfile={{}}
          />
        </div>

        {hasSupport && (
          <div className="mt-10">
            <h2 className="text-center font-display text-xl font-bold text-cream-900">Destek Tarihlerinizi Seçin</h2>
            <p className="mt-2 text-center text-sm text-cream-800/60">Koç ve diyetisyen görüşmeleriniz için tercih ettiğiniz gün ve saat</p>
            <div className="mx-auto mt-5 max-w-2xl">
              <SupportScheduler schedule={schedule} packageConfig={config} onChange={setSchedule} />
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={handleUpgrade}
            className="rounded-full bg-brand-500 px-10 py-4 text-sm font-semibold text-white shadow-lg shadow-brand-200 hover:bg-brand-600"
          >
            Premium&apos;a Yükselt & Öde
          </button>
        </div>

        <div className="mt-8">
          <DisclaimerBox variant="prominent" />
        </div>
      </motion.div>

      <Modal open={paymentOpen} onClose={() => !paying && setPaymentOpen(false)} title="Ödeme" size="md">
        <PaymentForm
          amount={pricing?.total}
          loading={paying}
          onCancel={() => setPaymentOpen(false)}
          onSubmit={confirmPayment}
        />
      </Modal>
    </div>
  )
}
