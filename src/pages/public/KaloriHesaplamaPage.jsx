import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calculator, ArrowRight, ShieldCheck } from 'lucide-react'
import JsonLd from '../../components/seo/JsonLd'
import FAQAccordion from '../../components/landing/FAQAccordion'
import {
  buildFaqSchema,
  buildHowToSchema,
  buildBreadcrumbSchema,
  buildSpeakableWebPageSchema,
} from '../../config/seo'
import { KALORI_HESAPLAMA } from '../../data/seoCalorieCalculator'
import {
  ACTIVITY_LEVELS,
  GOALS,
  validateCalorieInputs,
  calcBmrMifflin,
  calcTdee,
  calcGoalCalories,
} from '../../utils/calorieNeeds'
import { BRAND } from '../../config/brand'

const inputClass =
  'mt-1.5 w-full rounded-xl border border-cream-200 bg-white px-3.5 py-2.5 text-sm text-cream-900 outline-none ring-brand-200 transition focus:border-brand-400 focus:ring-2'

function EmLead({ text }) {
  const parts = String(text || '').split(/\*\*(.+?)\*\*/g)
  return parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>))
}

export default function KaloriHesaplamaPage() {
  const page = KALORI_HESAPLAMA
  const [sex, setSex] = useState('female')
  const [age, setAge] = useState('30')
  const [cm, setCm] = useState('165')
  const [kg, setKg] = useState('65')
  const [activity, setActivity] = useState('light')
  const [goal, setGoal] = useState('maintain')
  const [submitted, setSubmitted] = useState(false)

  const inputs = { sex, kg, cm, age }
  const error = submitted ? validateCalorieInputs(inputs) : null
  const bmr = submitted && !error ? calcBmrMifflin(inputs) : null
  const tdee = bmr ? calcTdee(bmr, activity) : null
  const target = tdee ? calcGoalCalories(tdee, bmr, goal) : null

  const schemas = useMemo(
    () => [
      buildSpeakableWebPageSchema({
        name: page.title,
        path: page.path,
        description: page.description,
      }),
      buildHowToSchema({
        name: 'Kalori hesaplama (BMR ve TDEE)',
        description: page.lead.replace(/\*\*/g, ''),
        steps: [
          { title: 'Ölçüleri girin', text: 'Cinsiyet, yaş, boy (cm) ve kilo (kg).' },
          { title: 'Aktiviteyi seçin', text: 'Masa başından çok aktife kadar çarpan uygulanır.' },
          { title: 'BMR ve TDEE okuyun', text: 'Sonuç tahmindir; tıbbi tanı değildir.' },
          { title: 'Kişiye özel plan', text: 'Sürdürülebilir menü için online diyetisyen görüşmesi alın.' },
        ],
      }),
      buildFaqSchema(page.faqs),
      buildBreadcrumbSchema([
        { name: 'Ana Sayfa', path: '/' },
        { name: 'Online Diyetisyen', path: '/online-diyetisyen' },
        { name: 'Kalori hesaplama', path: page.path },
      ]),
    ],
    [page],
  )

  function onSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="overflow-x-hidden bg-cream-50">
      <JsonLd data={schemas} />

      <section className="border-b border-cream-200/80 bg-gradient-to-b from-white to-cream-50">
        <div className="mx-auto max-w-6xl px-4 pb-12 pt-24 sm:px-6 sm:pb-16 sm:pt-28">
          <p className="font-display text-sm font-bold tracking-wide text-cream-900">{BRAND.name}</p>
          <h1 className="mt-3 max-w-2xl font-display text-[1.85rem] font-bold leading-[1.15] tracking-tight text-cream-950 sm:text-4xl">
            {page.h1}
          </h1>
          <p className="speakable-intro mt-5 max-w-2xl text-sm leading-relaxed text-cream-800 sm:text-base">
            <EmLead text={page.lead} />
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <form
            onSubmit={onSubmit}
            className="rounded-3xl border border-cream-200 bg-white p-5 shadow-sm sm:p-7"
          >
            <div className="flex items-center gap-2 text-brand-700">
              <Calculator className="h-5 w-5" />
              <p className="font-display text-lg font-bold text-cream-900">Hesaplayıcı</p>
            </div>
            <p className="mt-1 text-sm text-cream-800/70">Kayıt gerekmez. Sonuç tarayıcınızda kalır.</p>

            <fieldset className="mt-6">
              <legend className="text-xs font-semibold uppercase tracking-wide text-cream-800/70">Cinsiyet</legend>
              <div className="mt-2 flex gap-2">
                {[
                  { id: 'female', label: 'Kadın' },
                  { id: 'male', label: 'Erkek' },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex-1 cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm font-semibold ${
                      sex === opt.id
                        ? 'border-brand-400 bg-brand-50 text-brand-800'
                        : 'border-cream-200 bg-white text-cream-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="sex"
                      value={opt.id}
                      checked={sex === opt.id}
                      onChange={() => setSex(opt.id)}
                      className="sr-only"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <label className="text-sm font-medium text-cream-800">
                Yaş
                <input className={inputClass} inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
              </label>
              <label className="text-sm font-medium text-cream-800">
                Boy (cm)
                <input className={inputClass} inputMode="decimal" value={cm} onChange={(e) => setCm(e.target.value)} />
              </label>
              <label className="text-sm font-medium text-cream-800">
                Kilo (kg)
                <input className={inputClass} inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value)} />
              </label>
            </div>

            <label className="mt-5 block text-sm font-medium text-cream-800">
              Aktivite
              <select className={inputClass} value={activity} onChange={(e) => setActivity(e.target.value)}>
                {ACTIVITY_LEVELS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-5 block text-sm font-medium text-cream-800">
              Hedef (isteğe bağlı)
              <select className={inputClass} value={goal} onChange={(e) => setGoal(e.target.value)}>
                {GOALS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
            </label>

            {error && (
              <p className="mt-4 text-sm font-medium text-warm-700" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-sage-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-900/15 transition hover:brightness-110"
            >
              Hesapla
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="rounded-3xl border border-cream-200 bg-white p-5 shadow-sm sm:p-7">
            <p className="font-display text-lg font-bold text-cream-900">Sonuç</p>
            {!submitted || error ? (
              <p className="mt-3 text-sm leading-relaxed text-cream-800/75">
                Ölçülerinizi girip hesaplayın. Formül popülasyon ortalamasıdır; kas oranı ve hormon durumu sapma yaratır.
              </p>
            ) : (
              <dl className="mt-5 space-y-3">
                <div className="rounded-2xl bg-cream-50 px-4 py-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-cream-800/60">BMR</dt>
                  <dd className="mt-0.5 font-display text-2xl font-bold text-cream-950">{bmr} kcal/gün</dd>
                </div>
                <div className="rounded-2xl bg-brand-50 px-4 py-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-brand-800/70">TDEE (günlük ihtiyaç)</dt>
                  <dd className="mt-0.5 font-display text-2xl font-bold text-brand-900">{tdee} kcal/gün</dd>
                </div>
                <div className="rounded-2xl border border-cream-200 px-4 py-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-cream-800/60">Hedef bandı</dt>
                  <dd className="mt-0.5 font-display text-2xl font-bold text-cream-950">{target} kcal/gün</dd>
                </div>
              </dl>
            )}
            <p className="mt-6 inline-flex items-start gap-2 text-xs leading-relaxed text-cream-800/65">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" />
              18 yaş altı, gebelik ve hastalıkta kullanmayın. Kalori kesme reçetesi değildir.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/online-diyetisyen"
                className="inline-flex items-center gap-1.5 rounded-full bg-cream-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cream-800"
              >
                Online diyetisyen
              </Link>
              <Link
                to="/kilo-verme"
                className="inline-flex items-center gap-1.5 rounded-full border border-cream-300 px-5 py-2.5 text-sm font-semibold text-cream-900 hover:bg-cream-50"
              >
                Kilo verme
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-cream-200/80 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="section-title text-left">BMR ve TDEE nasıl hesaplanır?</h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-cream-800 sm:text-base">
            Erkeklerde BMR = 10×kg + 6,25×cm − 5×yaş + 5; kadınlarda sonda −161. TDEE, BMR’nin aktivite çarpanıyla (1,2–1,9) çarpımıdır.
            Hafif kalori açığı TDEE’den yaklaşık 300 kcal düşmektir; bu araç BMR’nin altına inmez.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-cream-800 sm:text-base">
            Üye panelindeki kalori aracı öğün fotoğrafı / metin kaydı içindir ve giriş ister. Bu sayfa herkese açık tahmindir.
          </p>
        </div>
      </section>

      <section className="faq-section border-t border-cream-200/80 bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FAQAccordion items={page.faqs} />
        </div>
      </section>
    </div>
  )
}
