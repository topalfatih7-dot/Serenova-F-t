import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight, Sparkles, HeartHandshake, Target, Eye, ShieldCheck, FlaskConical,
  Fingerprint, Globe, Leaf, Users, Dumbbell, Apple, Lock, MessageCircle,
  BadgeCheck, Video, Star, ClipboardList,
} from 'lucide-react'
import TrustStrip from '../components/landing/TrustStrip'
import JsonLd from '../components/seo/JsonLd'
import { buildOrganizationSchema, absoluteUrl } from '../config/seo'
import { BRAND } from '../config/brand'
import { useApp } from '../context/AppContext'
import { usePlatformDisplayStats } from '../hooks/usePlatformDisplayStats'
import { scrollToContactSection } from '../utils/scrollToContact'
import { preloadTeamHero } from '../utils/teamHeroImages'

/** Unsplash CDN — panelImages.js ile aynı desen.
 *  Not: Buradaki görseller sitenin başka hiçbir yerinde kullanılmaz (benzersiz). */
const unsplash = (id, w = 1400) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`

const ABOUT_IMAGES = {
  hero: {
    url: unsplash('photo-1518459031867-a89b944bffe4', 1600),
    alt: 'Aydınlık stüdyoda birlikte antrenman yapan iki üye',
  },
  approach: {
    url: unsplash('photo-1588196749597-9ff075ee6b5b', 1100),
    alt: 'Evden video görüşmeye katılan üye — online koçluk deneyimi',
  },
  community: {
    url: unsplash('photo-1545205597-3d9d02c29597', 1600),
    alt: 'Sahilde birlikte yoga yapan üye topluluğu',
  },
  teamCoach: {
    url: unsplash('photo-1549060279-7e168fcee0c2', 900),
    alt: 'Antrenman ekipmanlarıyla koçluk seansı',
  },
  teamDietitian: {
    url: unsplash('photo-1546069901-ba9599a7e63c', 900),
    alt: 'Renkli ve dengeli bir beslenme tabağı',
  },
}

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Güven & Gizlilik',
    desc: 'Sağlık verileriniz KVKK uyumlu, şifreli altyapıda saklanır; üçüncü taraflarla asla paylaşılmaz.',
    accent: 'from-brand-400 to-brand-600',
    card: 'from-brand-50/80 to-white hover:border-brand-300',
  },
  {
    icon: FlaskConical,
    title: 'Bilimsel Yaklaşım',
    desc: 'Programlarımız güncel spor bilimi ve beslenme araştırmalarına dayanır — moda diyetlere değil.',
    accent: 'from-sage-400 to-sage-600',
    card: 'from-sage-50/80 to-white hover:border-sage-300',
  },
  {
    icon: Fingerprint,
    title: 'Kişiselleştirme',
    desc: 'Hazır şablon yok. Her program; hedefinize, beden yapınıza ve yaşam ritminize göre hazırlanır.',
    accent: 'from-warm-400 to-brand-500',
    card: 'from-warm-50/80 to-white hover:border-warm-200',
  },
  {
    icon: Globe,
    title: 'Erişilebilirlik',
    desc: 'Nerede yaşarsanız yaşayın — uzman koç ve diyetisyen desteği tek tık uzağınızda.',
    accent: 'from-brand-300 to-sage-500',
    card: 'from-brand-50/60 to-white hover:border-brand-200',
  },
  {
    icon: Leaf,
    title: 'Sürdürülebilirlik',
    desc: 'Hızlı ve geçici sonuçlar değil; ömür boyu koruyabileceğiniz sağlıklı alışkanlıklar hedefleriz.',
    accent: 'from-mint-400 to-sage-500',
    card: 'from-mint-50 to-white hover:border-sage-300',
  },
  {
    icon: Users,
    title: 'Topluluk',
    desc: 'Aynı yolculuktaki binlerce üyeyle motivasyonunuzu yüksek tutun, başarıyı birlikte kutlayın.',
    accent: 'from-rose-400 to-brand-500',
    card: 'from-rose-50/80 to-white hover:border-rose-200',
  },
]

const GUARANTEES = [
  {
    icon: ShieldCheck,
    title: 'KVKK Uyumlu',
    desc: 'Sağlık verileriniz Türkiye standartlarında, açık rızanız olmadan asla paylaşılmadan korunur.',
    accent: 'from-brand-400 to-brand-600',
  },
  {
    icon: Lock,
    title: '256-bit SSL Şifreleme',
    desc: 'Tüm bağlantılarınız ve verileriniz uçtan uca şifrelenir; güvenliğiniz her an aktiftir.',
    accent: 'from-sage-400 to-sage-600',
  },
  {
    icon: BadgeCheck,
    title: 'Uzman Onaylı Kadro',
    desc: 'Koç ve diyetisyenlerimiz diploma ve deneyim kontrolünden geçerek kadromuza katılır.',
    accent: 'from-warm-400 to-warm-500',
  },
  {
    icon: ClipboardList,
    title: 'Kişiye Özel Program',
    desc: 'Hazır şablon yok — koç ve diyetisyeniniz hedefinize göre programı birlikte şekillendirir.',
    accent: 'from-rose-400 to-brand-500',
  },
  {
    icon: MessageCircle,
    title: '7/24 Destek',
    desc: 'Sorunuz olduğunda ekibimiz her zaman bir mesaj uzağınızda; yalnız bırakmayız.',
    accent: 'from-mint-400 to-sage-500',
  },
]

const TEAM_LINKS = [
  {
    to: '/team/coaches',
    icon: Dumbbell,
    title: 'Koçlarımız',
    desc: 'Kişisel antrenman programları ve birebir takip',
    accent: 'from-brand-400 to-brand-600',
    image: 'teamCoach',
    prefetchRole: 'coaches',
  },
  {
    to: '/team/dietitians',
    icon: Apple,
    title: 'Diyetisyenlerimiz',
    desc: 'Sürdürülebilir, size özel beslenme planları',
    accent: 'from-sage-400 to-sage-600',
    image: 'teamDietitian',
    prefetchRole: 'dietitians',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  }),
}

function buildAboutPageSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: `Hakkımızda — ${BRAND.name}`,
    url: absoluteUrl('/hakkimizda'),
    description: `${BRAND.name} (${BRAND.domain}) — online koçluk, diyetisyen ve wellness platformunun misyonu, değerleri ve uzman kadrosu.`,
    mainEntity: { '@id': `${absoluteUrl('/')}#organization` },
  }
}

export default function AboutPage() {
  const { staff } = useApp()
  const { displayMembers, showMemberPlus } = usePlatformDisplayStats()

  const activeStaffCount = (staff || []).filter((s) => s.active !== false).length
  const stats = [
    {
      value: `${displayMembers.toLocaleString('tr-TR')}${showMemberPlus ? '+' : ''}`,
      label: 'Aktif üye',
      icon: Users,
      accent: 'from-brand-400 to-brand-600',
      card: 'border-brand-100 from-brand-50/70',
    },
    {
      value: activeStaffCount > 0 ? `${activeStaffCount}` : '25+',
      label: 'Uzman kadro',
      icon: BadgeCheck,
      accent: 'from-sage-400 to-sage-600',
      card: 'border-sage-100 from-sage-50/70',
    },
    {
      value: '%94',
      label: 'Üye memnuniyeti',
      icon: Star,
      accent: 'from-warm-400 to-warm-500',
      card: 'border-warm-100 from-warm-50/70',
    },
    {
      value: '7/24',
      label: 'Destek',
      icon: MessageCircle,
      accent: 'from-rose-400 to-brand-500',
      card: 'border-rose-100 from-rose-50/70',
    },
  ]

  return (
    <div className="overflow-x-hidden">
      <JsonLd data={[buildOrganizationSchema(), buildAboutPageSchema()]} />

      {/* ═══ HERO — fotoğraf + net misyon cümlesi + güven rozetleri ═══ */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={ABOUT_IMAGES.hero.url}
            alt={ABOUT_IMAGES.hero.alt}
            className="h-full w-full object-cover object-[70%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-cream-900/95 via-cream-900/80 to-brand-900/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-cream-900/70 via-transparent to-transparent" />
        </div>

        <div
          aria-hidden
          className="absolute -left-24 top-16 -z-0 h-64 w-64 rounded-full bg-brand-400/20 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -right-16 bottom-8 -z-0 h-72 w-72 rounded-full bg-sage-400/20 blur-3xl"
        />

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-32">
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0} className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/90 backdrop-blur">
              <HeartHandshake className="h-3.5 w-3.5 text-brand-300" />
              Hakkımızda
            </span>
            <h1 className="mt-5 font-display text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              Sağlıklı dönüşümü{' '}
              <span className="bg-gradient-to-r from-brand-300 via-sage-300 to-warm-400 bg-clip-text text-transparent">
                herkes için erişilebilir
              </span>{' '}
              kılıyoruz
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
              {BRAND.name} ({BRAND.domain}); uzman koç ve diyetisyenleri tek çatı altında buluşturan
              Türkiye'nin çevrimiçi wellness platformudur. Amacımız basit: nerede olursanız olun,
              size özel programlar ve gerçek uzman desteğiyle sağlıklı yaşamı sürdürülebilir kılmak.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/membership" className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-sage-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:brightness-110">
                Paket Seçin
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/online-diyetisyen" className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20">
                <Sparkles className="h-4 w-4 text-brand-300" />
                Online diyetisyen
              </Link>
              <Link to="/online-kocluk" className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20">
                Online koçluk
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2.5 border-t border-white/15 pt-5">
              {[
                { icon: ShieldCheck, label: 'KVKK uyumlu' },
                { icon: Lock, label: '256-bit SSL güvenliği' },
                { icon: BadgeCheck, label: 'Uzman onaylı kadro' },
              ].map((t) => (
                <span key={t.label} className="inline-flex items-center gap-1.5 text-xs font-medium text-white/75">
                  <t.icon className="h-4 w-4 text-sage-300" />
                  {t.label}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ İSTATİSTİKLER — renkli güven kartları ═══ */}
      <section className="relative border-b border-cream-100 bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-10 sm:px-6 md:grid-cols-4 md:py-12">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              custom={i}
              viewport={{ once: true, margin: '-40px' }}
              className={`flex flex-col items-center rounded-3xl border bg-gradient-to-b to-white px-3 py-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:py-6 ${s.card}`}
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.accent} text-white shadow-md`}>
                <s.icon className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <p className="mt-3 font-display text-2xl font-bold text-cream-900 sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-cream-800/55 sm:text-xs">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ MİSYON & VİZYON ═══ */}
      <section className="about-section-asymmetric py-14 sm:py-20">
        <div aria-hidden className="about-mesh about-mesh-mission" />
        <div aria-hidden className="about-mesh-dot" />
        <div className="relative z-[1] mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '50px' }} className="text-center">
            <span className="section-badge">Biz Kimiz?</span>
            <h2 className="section-title mt-4">Misyonumuz ve Vizyonumuz</h2>
            <p className="section-subtitle mx-auto max-w-2xl">
              Spor salonuna gidemeyenler, nereden başlayacağını bilemeyenler ve tek başına
              motivasyonunu koruyamayanlar için kurulduk.
            </p>
          </motion.div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              custom={0}
              viewport={{ once: true, margin: '50px' }}
              className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50/70 via-white to-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-8"
            >
              <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-brand-400 via-brand-300 to-transparent" />
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-lg">
                <Target className="h-6 w-6" strokeWidth={2.2} />
              </span>
              <h3 className="mt-5 font-display text-xl font-bold text-cream-900">Misyonumuz</h3>
              <p className="mt-3 text-sm leading-relaxed text-cream-800/70">
                Uzman koçluk ve beslenme desteğini yalnızca büyük şehirlerde spor salonuna gidebilenlerin
                değil, herkesin ulaşabildiği bir hizmete dönüştürmek. Kişisel sağlık analizi, size özel
                programlar ve birebir video görüşmelerle her üyemizin yanında olmak.
              </p>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              custom={1}
              viewport={{ once: true, margin: '50px' }}
              className="relative overflow-hidden rounded-3xl border border-sage-100 bg-gradient-to-br from-sage-50/70 via-white to-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-8"
            >
              <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-sage-400 via-sage-300 to-transparent" />
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sage-400 to-sage-600 text-white shadow-lg">
                <Eye className="h-6 w-6" strokeWidth={2.2} />
              </span>
              <h3 className="mt-5 font-display text-xl font-bold text-cream-900">Vizyonumuz</h3>
              <p className="mt-3 text-sm leading-relaxed text-cream-800/70">
                Türkiye'nin en güvenilir dijital wellness platformu olmak. Teknolojiyi insan
                dokunuşuyla birleştirerek; sağlıklı yaşamı bir zorunluluk değil, keyifle sürdürülen
                bir yaşam biçimi haline getirmek.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ DEĞERLERİMİZ ═══ */}
      <section className="about-section-asymmetric py-14 sm:py-20">
        <div aria-hidden className="about-mesh about-mesh-values" />
        <div aria-hidden className="about-mesh-dot" />
        <div className="relative z-[1] mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '50px' }} className="text-center">
            <span className="section-badge">Değerlerimiz</span>
            <h2 className="section-title mt-4">Bizi Biz Yapan İlkeler</h2>
            <p className="section-subtitle mx-auto max-w-2xl">
              Her kararımızda ve hazırladığımız her programda bu altı ilkeye bağlı kalırız.
            </p>
          </motion.div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                custom={i % 3}
                viewport={{ once: true, margin: '-40px' }}
                className={`group rounded-3xl border border-cream-200/80 bg-gradient-to-b p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${v.card}`}
              >
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${v.accent} text-white shadow-lg transition group-hover:scale-110`}>
                  <v.icon className="h-6 w-6" strokeWidth={2.2} />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-cream-900">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cream-800/65">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ YAKLAŞIMIMIZ — video görüşme fotoğrafı + anlatım ═══ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-cream-50 to-white py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-10 md:grid-cols-2 lg:gap-14">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '50px' }}
              transition={{ duration: 0.6 }}
              className="relative order-2 md:order-1"
            >
              <div className="overflow-hidden rounded-3xl shadow-2xl shadow-brand-900/15 ring-1 ring-black/5">
                <div className="aspect-[4/3] w-full">
                  <img
                    src={ABOUT_IMAGES.approach.url}
                    alt={ABOUT_IMAGES.approach.alt}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
              <div aria-hidden className="absolute -bottom-4 -left-4 -z-10 h-full w-full rounded-3xl bg-gradient-to-br from-brand-100 to-sage-100" />

              {/* Yüzen güven kartı */}
              <div className="absolute -bottom-5 right-4 flex items-center gap-2.5 rounded-2xl border border-cream-100 bg-white/95 px-4 py-3 shadow-xl backdrop-blur sm:right-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-sage-500 text-white shadow-md">
                  <Video className="h-[18px] w-[18px]" strokeWidth={2.2} />
                </span>
                <div>
                  <p className="text-xs font-bold text-cream-900">Birebir video görüşme</p>
                  <p className="text-[10px] text-cream-800/55">Uzmanınızla yüz yüze, evinizden</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '50px' }}
              className="order-1 md:order-2"
            >
              <span className="section-badge">Yaklaşımımız</span>
              <h2 className="section-title mt-4">İnsan Odaklı, Teknoloji Destekli</h2>
              <div className="mt-5 space-y-4 text-sm leading-relaxed text-cream-800/70 sm:text-base">
                <p>
                  Sağlıklı yaşam yolculuğunda en büyük engelin bilgi eksikliği değil,{' '}
                  <strong className="font-semibold text-cream-900">doğru rehberlik ve süreklilik</strong> olduğuna
                  inanıyoruz. Bu yüzden her üyemizi gerçek bir uzmanla eşleştiriyor, yolculuğun her
                  adımını tek panelden takip edilebilir kılıyoruz.
                </p>
                <p>
                  Kayıt olduğunuz anda kişisel sağlık testinizle başlıyoruz; hedefinize göre koçunuz
                  antrenman programınızı, diyetisyeniniz beslenme planınızı hazırlıyor. Video
                  görüşmeler ve ilerleme grafikleriyle motivasyonunuz hiç düşmüyor.
                </p>
                <p>
                  Diyet, Spor veya VIP paketleriyle uzman desteği
                  içeren paketlerle koç ve diyetisyen eşleşmenizi güçlendirebilirsiniz.
                </p>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2.5">
                {[
                  { icon: ShieldCheck, label: 'KVKK uyumlu' },
                  { icon: Lock, label: '256-bit SSL' },
                  { icon: Video, label: 'Birebir video görüşme' },
                ].map((t) => (
                  <span key={t.label} className="inline-flex items-center gap-1.5 text-xs font-semibold text-cream-800/70">
                    <t.icon className="h-4 w-4 text-sage-600" />
                    {t.label}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ GÜVENCELERİMİZ — neden bize güvenebilirsiniz ═══ */}
      <section className="about-section-asymmetric py-14 sm:py-20">
        <div aria-hidden className="about-mesh about-mesh-guarantees" />
        <div aria-hidden className="about-mesh-dot" />
        <div className="relative z-[1] mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '50px' }} className="text-center">
            <span className="section-badge">Güvencelerimiz</span>
            <h2 className="section-title mt-4">Neden Bize Güvenebilirsiniz?</h2>
            <p className="section-subtitle mx-auto max-w-2xl">
              Güven, sözle değil sistemle kurulur. İşte her üyemize verdiğimiz altı somut güvence.
            </p>
          </motion.div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {GUARANTEES.map((g, i) => (
              <motion.div
                key={g.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                custom={i % 3}
                viewport={{ once: true, margin: '-40px' }}
                className="group flex items-start gap-4 rounded-3xl border border-cream-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg sm:p-6"
              >
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${g.accent} text-white shadow-lg transition group-hover:scale-110`}>
                  <g.icon className="h-5 w-5" strokeWidth={2.2} />
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-cream-900">{g.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-cream-800/65">{g.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TOPLULUK BANDI — fotoğraflı geniş şerit ═══ */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={ABOUT_IMAGES.community.url}
            alt={ABOUT_IMAGES.community.alt}
            className="h-full w-full object-cover object-center"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-900/85 via-cream-900/70 to-sage-900/60" />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 sm:py-20">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '50px' }}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/90 backdrop-blur">
              <Users className="h-3.5 w-3.5 text-brand-300" />
              Topluluk
            </span>
            <h2 className="mt-5 font-display text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
              Bu yolculukta yalnız değilsiniz
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
              {displayMembers.toLocaleString('tr-TR')}{showMemberPlus ? '+' : ''} üyemiz aynı hedefe birlikte yürüyor.
              Gerçek insanların gerçek dönüşüm hikayelerine göz atın.
            </p>
            <Link
              to="/stories"
              className="group mt-7 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Başarı Hikayelerini Okuyun
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══ UZMAN KADROMUZ — fotoğraflı kartlar ═══ */}
      <section className="relative bg-gradient-to-b from-white to-cream-50/60 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '50px' }} className="text-center">
            <span className="section-badge">Ekibimiz</span>
            <h2 className="section-title mt-4">Uzman Kadromuzla Tanışın</h2>
            <p className="section-subtitle mx-auto max-w-2xl">
              Alanında deneyimli, özenle seçilmiş koç ve diyetisyenlerimiz her adımda yanınızda.
            </p>
          </motion.div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {TEAM_LINKS.map((t, i) => (
              <motion.div
                key={t.to}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                custom={i}
                viewport={{ once: true, margin: '-40px' }}
              >
                <Link
                  to={t.to}
                  onMouseEnter={() => preloadTeamHero(t.prefetchRole)}
                  onFocus={() => preloadTeamHero(t.prefetchRole)}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-cream-200/80 bg-white shadow-sm transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden">
                    <img
                      src={ABOUT_IMAGES[t.image].url}
                      alt={ABOUT_IMAGES[t.image].alt}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-cream-900/50 via-transparent to-transparent" />
                    <span className={`absolute bottom-3 left-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${t.accent} text-white shadow-lg`}>
                      <t.icon className="h-5 w-5" strokeWidth={2.2} />
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-6 pt-5">
                    <h3 className="font-display text-lg font-bold text-cream-900">{t.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-cream-800/65">{t.desc}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition group-hover:gap-2.5">
                      Profilleri görün
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SON CTA ═══ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cream-900 via-brand-900 to-sage-900 py-14 sm:py-20">
        <div aria-hidden className="wellness-orb -left-20 top-0 h-64 w-64 bg-brand-500/25" />
        <div aria-hidden className="wellness-orb -right-16 bottom-0 h-72 w-72 bg-sage-500/20" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '50px' }}>
            <h2 className="font-display text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
              Dönüşüm yolculuğunuza bugün başlayın
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
              Paketinizi seçin, sağlık testinizi tamamlayın; koç veya diyetisyeniniz size özel programı hazırlar.
              Sorularınız mı var? Ekibimiz her zaman bir mesaj uzağınızda.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link to="/membership" className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-sage-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:brightness-110 sm:text-base">
                Paket Seçin
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/#bize-ulasin"
                onClick={(e) => {
                  if (window.location.pathname === '/') {
                    e.preventDefault()
                    scrollToContactSection()
                  }
                }}
                className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                <MessageCircle className="h-4 w-4 text-brand-300" />
                Bize Ulaşın
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <TrustStrip />
    </div>
  )
}
