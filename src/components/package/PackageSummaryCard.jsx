import { Clock, Crown } from 'lucide-react'

export default function PackageSummaryCard({ config, pricing }) {
  return (
    <div className="rounded-2xl border border-brand-200 bg-gradient-to-b from-brand-50 to-white p-6 shadow-lg">
      <div className="flex items-center gap-2">
        <Crown className="h-5 w-5 text-gold-500" />
        <h3 className="font-display text-lg font-bold text-cream-900">Paket Özeti</h3>
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-cream-800/60">Koç görüşmesi</span>
          <span className="font-medium">Haftada {config.coachMeetingsPerWeek}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-cream-800/60">Diyetisyen</span>
          <span className="font-medium">Ayda {config.dietitianMeetingsPerMonth}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-cream-800/60">Süre</span>
          <span className="font-medium">{config.durationWeeks} hafta</span>
        </div>
        {config.addOns?.length > 0 && (
          <div className="border-t border-cream-100 pt-3">
            <p className="text-cream-800/60">Eklentiler</p>
            <p className="font-medium">{config.addOns.length} seçili</p>
          </div>
        )}
      </div>

      {pricing && (
        <div className="mt-6 border-t border-brand-100 pt-4">
          {pricing.discount > 0 && (
            <p className="text-xs text-sage-600">%{Math.round((pricing.discount / (pricing.total + pricing.discount)) * 100)} indirim uygulandı</p>
          )}
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-cream-800/60">Toplam</span>
            <span className="font-display text-3xl font-bold text-brand-600">
              {pricing.total.toLocaleString('tr-TR')}₺
            </span>
          </div>
          <p className="mt-1 text-right text-xs text-cream-800/50">
            ~{pricing.monthly.toLocaleString('tr-TR')}₺/ay
          </p>
        </div>
      )}

      <div className="mt-4 flex items-center gap-1.5 text-xs text-cream-800/50">
        <Clock className="h-3.5 w-3.5" /> Anında güncellenir
      </div>
    </div>
  )
}
