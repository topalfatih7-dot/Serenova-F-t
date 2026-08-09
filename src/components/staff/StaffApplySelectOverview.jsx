import { motion } from 'framer-motion'
import {
  FileText, UserRound, Briefcase, BadgeCheck, CircleDot,
} from 'lucide-react'

const ease = [0.22, 1, 0.36, 1]

const STEPS = [
  { n: '01', title: 'Rol' },
  { n: '02', title: 'Form' },
  { n: '03', title: 'Onay' },
]

const REQUIRED = [
  {
    Icon: UserRound,
    title: 'İletişim bilgileri',
    detail: 'Ad soyad, e-posta, telefon, cinsiyet ve konum',
  },
  {
    Icon: Briefcase,
    title: 'Uzmanlık & deneyim',
    detail: 'Alan seçimleri ve toplam deneyim yılı',
  },
  {
    Icon: FileText,
    title: 'e-Devlet mezuniyet belgesi',
    detail: 'PDF veya görsel — her iki rol için zorunlu',
  },
]

const OPTIONAL = [
  {
    Icon: BadgeCheck,
    title: 'Sertifikalar',
    detail: 'Federasyon, uluslararası veya branş belgeleri',
  },
  {
    Icon: CircleDot,
    title: 'Profil & sosyal',
    detail: 'Fotoğraf, LinkedIn, Instagram, web sitesi',
  },
]

export default function StaffApplySelectOverview() {
  return (
    <div className="staff-apply-overview relative z-[1] space-y-8 sm:space-y-10">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-32px' }}
        transition={{ duration: 0.5, ease }}
        aria-label="Başvuru adımları"
      >
        <ol className="staff-apply-process">
          {STEPS.map((step, i) => (
            <motion.li
              key={step.n}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06, ease }}
              className="staff-apply-process__item"
            >
              <span className="staff-apply-process__n" aria-hidden>{step.n}</span>
              <p className="staff-apply-process__title">{step.title}</p>
            </motion.li>
          ))}
        </ol>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, ease }}
        className="staff-apply-needs"
        aria-labelledby="staff-apply-needs-title"
      >
        <div className="staff-apply-needs__head">
          <h2 id="staff-apply-needs-title" className="staff-apply-needs__title">
            Başvuruda ne gerekir?
          </h2>
          <p className="staff-apply-needs__lede">
            Formu açmadan önce bunları hazır tutun.
          </p>
        </div>

        <div className="staff-apply-needs__grid">
          <div className="staff-apply-needs__col">
            <p className="staff-apply-needs__label">Zorunlu</p>
            <ul className="staff-apply-needs__list">
              {REQUIRED.map(({ Icon, title, detail }, i) => (
                <motion.li
                  key={title}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: 0.05 + i * 0.05, ease }}
                  className="staff-apply-needs__item is-required"
                >
                  <span className="staff-apply-needs__icon" aria-hidden>
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <p className="staff-apply-needs__item-title">{title}</p>
                    <p className="staff-apply-needs__item-detail">{detail}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>

          <div className="staff-apply-needs__col">
            <p className="staff-apply-needs__label is-optional">İsteğe bağlı</p>
            <ul className="staff-apply-needs__list">
              {OPTIONAL.map(({ Icon, title, detail }, i) => (
                <motion.li
                  key={title}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: 0.12 + i * 0.05, ease }}
                  className="staff-apply-needs__item"
                >
                  <span className="staff-apply-needs__icon is-muted" aria-hidden>
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <p className="staff-apply-needs__item-title">{title}</p>
                    <p className="staff-apply-needs__item-detail">{detail}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </motion.section>
    </div>
  )
}
