/**
 * Online diyetisyen / online koçluk para sayfaları — içerik + prerender metni.
 * React bağımlılığı yok; build script de import edebilir.
 * Paragraflarda **kalın** vurgu desteklenir (görsel + prerender).
 */

export const ONLINE_DIYETISYEN = {
  path: '/online-diyetisyen',
  title: 'Online Diyetisyen — Video Görüşmeli Beslenme Danışmanlığı',
  description:
    'Online diyetisyen ile kişiye özel beslenme programı, video görüşme ve ilerleme takibi. Yeni Form Diyet ve VIP paketleriyle evinizden uzman desteği alın.',
  keywords:
    'online diyetisyen, online diyet, online beslenme danışmanlığı, video görüşmeli diyetisyen, online diyetisyen fiyat, diyet paketi',
  h1: 'Online Diyetisyen ile Size Özel Beslenme Programı',
  lead:
    'Yeni Form’da online diyetisyen desteği; WhatsApp listesi değil, **video görüşme**, kişisel program ve panel üzerinden takip demektir. Hedefinize uygun **Diyet veya VIP** paketle başlayın.',
  primaryCta: { to: '/onboarding?plan=diyet', label: 'Diyet Paketi ile Başla' },
  secondaryCta: { to: '/membership', label: 'Paketleri Karşılaştır' },
  teamLink: { to: '/team/dietitians', label: 'Diyetisyen kadromuzu inceleyin' },
  relatedService: { to: '/online-kocluk', label: 'Online koçluk hizmetimiz' },
  serviceName: 'Online Diyetisyen Danışmanlığı',
  serviceType: 'NutritionCounseling',
  sections: [
    {
      h2: 'Online diyetisyen nedir?',
      paragraphs: [
        '**Online diyetisyen**, yüz yüze kliniğe gitmeden uzman bir beslenme danışmanıyla planlı görüşmeler yapmanızı sağlar. Yeni Form’da süreç; sağlık profiliniz, hedefleriniz ve yaşam ritminize göre **kişiselleştirilmiş beslenme programı**, ayda planlanan **video görüşmeler** ve panel üzerinden ilerleme takibi şeklinde ilerler.',
        'Arama motorlarında sık sorulan “online diyet” veya “online beslenme danışmanlığı” ihtiyacı; pratikte aynı niyeti taşır: sürdürülebilir kilo yönetimi, daha iyi enerji ve alışkanlık değişimi. Farkımız, tek seferlik PDF liste yerine **koçluk platformuyla entegre** bir sistem sunmamızdır.',
      ],
    },
    {
      h2: 'Süreç nasıl işler?',
      steps: [
        {
          title: 'Kayıt ve sağlık analizi',
          text: 'Diyet veya VIP paketiyle kayıt olun; kısa sağlık ve hedef sorularını tamamlayın. Bu veriler diyetisyen eşleşmesi ve programın temelini oluşturur.',
        },
        {
          title: 'Diyetisyen eşleşmesi',
          text: 'Diyet paketinde ayda 2 online diyetisyen görüşmesi yer alır. VIP pakette aynı hak koç görüşmeleriyle birlikte gelir.',
        },
        {
          title: 'Video görüşme ve program',
          text: 'Görüntülü seanslarda hedeflerinizi konuşur, menü ve alışkanlık planınızı güncellersiniz. Programınız üye panelinde takip edilebilir.',
        },
        {
          title: 'İlerleme ve kalori desteği',
          text: 'Fotoğraflı / manuel kalori araçları ve ilerleme raporlarıyla süreç görünür kalır; gerekirse bir sonraki seansa hazırlıklı gelirsiniz.',
        },
      ],
    },
    {
      h2: 'Kimler için uygun?',
      paragraphs: [
        '**Yoğun tempolu çalışanlar**, şehir dışında yaşayanlar, yüz yüze randevuya vakit ayıramayanlar ve **düzenli takip** isteyenler için online diyetisyen güçlü bir alternatiftir. Evde veya ofiste, randevu saatinde görüşmeye katılmanız yeterlidir.',
        'Kronik hastalık, gebelik veya özel klinik durumlarınız varsa önce **hekiminize danışın**. Yeni Form bir wellness ve koçluk platformudur; **tıbbi teşhis veya tedavi yerine geçmez**.',
      ],
    },
    {
      h2: 'Paketler ve fiyat yönü',
      paragraphs: [
        'Online diyetisyen görüşmeleri **Diyet paketinde (ayda 2 seans)** ve **VIP pakette (ayda 2 diyetisyen + 2 koç)** sunulur. Güncel aylık ve çok aylık fiyatlar için üyelik karşılaştırma sayfasını inceleyin.',
        'Tek diyetisyen kliniklerinden farkımız: aynı hesapta **antrenman programı**, video kütüphanesi ve isteğe bağlı online koçluk bir arada yönetilir.',
      ],
    },
  ],
  faqs: [
    {
      q: 'Online diyetisyen görüşmesi görüntülü mü?',
      a: 'Evet. Yeni Form’da diyetisyen seansları platform içi video görüşme ile yapılır; ayrı bir uygulama indirmeniz gerekmez.',
    },
    {
      q: 'Online diyetisyen paketi ne kadar?',
      a: 'Diyet paketi aylık ve 3–6 aylık seçeneklerle sunulur. Güncel fiyatları üyelik sayfasından görebilirsiniz.',
    },
    {
      q: 'Sadece diyetisyen mi, yoksa koç da var mı?',
      a: 'Yalnızca beslenme odaklı Diyet paketi veya koç + diyetisyen birleşik VIP paket seçebilirsiniz. Online koçluk için ayrı hizmet sayfamız da vardır.',
    },
    {
      q: 'Program kişiye özel mi hazırlanır?',
      a: 'Evet. Sağlık analizi ve görüşme notlarınıza göre diyetisyeniniz size özel beslenme programı hazırlar ve seanslarda günceller.',
    },
  ],
}

export const ONLINE_KOCLUK = {
  path: '/online-kocluk',
  title: 'Online Koçluk — Video Görüşmeli Fitness Koçu',
  description:
    'Online koçluk ve online spor koçu desteği ile kişiye özel antrenman programı, video görüşme ve takip. Yeni Form Spor ve VIP paketleriyle evde veya salonda ilerleyin.',
  keywords:
    'online koçluk, online spor koçu, online fitness koçu, uzaktan antrenman, video koçluk, spor paketi, online antrenör',
  h1: 'Online Koçluk ile Size Özel Antrenman Programı',
  lead:
    'Yeni Form’da online koçluk; PDF program satışı değil — **video görüşme**, kişiye özel antrenman planı, egzersiz kütüphanesi ve panel takibi bir arada. Hedefinize uygun **Spor veya VIP** paketle başlayın.',
  primaryCta: { to: '/onboarding?plan=spor', label: 'Spor Paketi ile Başla' },
  secondaryCta: { to: '/membership', label: 'Paketleri Karşılaştır' },
  teamLink: { to: '/team/coaches', label: 'Koç kadromuzu inceleyin' },
  relatedService: { to: '/online-diyetisyen', label: 'Online diyetisyen hizmetimiz' },
  serviceName: 'Online Fitness Koçluğu',
  serviceType: 'ExerciseProgram',
  sections: [
    {
      h2: 'Online koçluk nedir?',
      paragraphs: [
        '**Online koçluk**, antrenörünüzle aynı salonda olmadan kişiye özel program ve düzenli geri bildirim almanızdır. Yeni Form’da süreç; hedefleriniz, ekipmanınız ve antrenman yerinize (ev veya salon) göre **kişiselleştirilmiş antrenman programı**, ayda planlanan **video görüşmeler** ve panel üzerinden ilerleme takibi şeklinde ilerler.',
        '“Online spor koçu” veya “uzaktan antrenman” arayanlar için kritik nokta **sürdürülebilir takiptir**. Farkımız, tek seferlik PDF yerine **koçluk platformuyla entegre** bir sistem sunmamızdır: program panelde kalır, hareketler video kütüphanesiyle desteklenir.',
      ],
    },
    {
      h2: 'Süreç nasıl işler?',
      steps: [
        {
          title: 'Kayıt ve profil',
          text: 'Spor veya VIP paketle başlayın; fitness seviyeniz, hedefleriniz ve antrenman ortamınız sağlık analiziyle netleşir.',
        },
        {
          title: 'Koç eşleşmesi',
          text: 'Spor paketinde ayda 2 online koç görüşmesi vardır. VIP’te aynı hak diyetisyen seanslarıyla birleşir.',
        },
        {
          title: 'Program ve kütüphane',
          text: 'Size özel antrenman programınız panele düşer; egzersiz videolarıyla tekniği netleştirirsiniz.',
        },
        {
          title: 'Video görüşme ve revize',
          text: 'Görüntülü seanslarda form, tempo ve hedef güncellemelerini konuşur; program bir sonraki döneme göre revize edilir.',
        },
      ],
    },
    {
      h2: 'Kimler için uygun?',
      paragraphs: [
        '**Salon üyeliği olsa da rehberlik isteyenler**, evde çalışanlar, seyahat edenler ve **ilk kez düzenli antrenmana** başlayanlar için online koçluk güçlü bir alternatiftir. Programınız yaşam ritminize göre uyarlanır.',
        'Ağır sakatlık veya hekim kısıtı varsa önce **sağlık uzmanınıza danışın**. Yeni Form bir wellness ve performans koçluğu platformudur; **fizyoterapi veya tıbbi rehabilitasyon yerine geçmez**.',
      ],
    },
    {
      h2: 'Paketler ve fiyat yönü',
      paragraphs: [
        'Online koç görüşmeleri **Spor paketinde (ayda 2 seans)** ve **VIP pakette (ayda 2 koç + 2 diyetisyen)** sunulur. Güncel fiyatlar için üyelik sayfasını inceleyin.',
        'Beslenmeyi de aynı çatı altında yönetmek isterseniz **online diyetisyen** hizmetimize veya **VIP pakete** göz atın — antrenman ve beslenme tek hesapta ilerler.',
      ],
    },
  ],
  faqs: [
    {
      q: 'Online koçlukta görüşmeler nasıl yapılıyor?',
      a: 'Koç seansları Yeni Form içi görüntülü görüşme ile yapılır. Randevunuzu panelden yönetir, saatinde katılırsınız.',
    },
    {
      q: 'Evde ekipmansız çalışabilir miyim?',
      a: 'Evet. Koçunuz ev veya salon tercihinize ve ekipman erişiminize göre programı uyarlar; kütüphanede ev antrenmanları da bulunur.',
    },
    {
      q: 'Online spor koçu paketi hangi planda?',
      a: 'Birebir online koç görüşmesi Spor ve VIP paketlerindedir. Detaylar için üyelik sayfasını inceleyin.',
    },
    {
      q: 'Koç ve diyetisyeni birlikte alabilir miyim?',
      a: 'VIP paket ayda 2 koç ve 2 diyetisyen görüşmesini birleştirir. Ayrıntılar için üyelik karşılaştırma sayfasını inceleyin.',
    },
  ],
}

export const SERVICE_PAGES = {
  [ONLINE_DIYETISYEN.path]: ONLINE_DIYETISYEN,
  [ONLINE_KOCLUK.path]: ONLINE_KOCLUK,
}

/** **kalın** işaretlerini <strong> ile HTML’e çevirir */
export function emphasizeToHtml(str) {
  return escapeHtml(str).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

/** Prerender gövdesi — H1 dışarıda eklenir (includeLead ile lead paragrafı) */
export function servicePagePlainHtml(page, { includeLead = true } = {}) {
  const parts = []
  if (includeLead) parts.push(`<p>${emphasizeToHtml(page.lead)}</p>`)
  for (const section of page.sections) {
    parts.push(`<h2>${escapeHtml(section.h2)}</h2>`)
    for (const p of section.paragraphs || []) {
      parts.push(`<p>${emphasizeToHtml(p)}</p>`)
    }
    if (section.steps) {
      parts.push('<ol>')
      for (const step of section.steps) {
        parts.push(`<li><strong>${escapeHtml(step.title)}</strong> — ${escapeHtml(step.text)}</li>`)
      }
      parts.push('</ol>')
    }
  }
  parts.push('<h2>Sık sorulan sorular</h2>')
  for (const faq of page.faqs) {
    parts.push(`<h3>${escapeHtml(faq.q)}</h3>`)
    parts.push(`<p>${escapeHtml(faq.a)}</p>`)
  }
  parts.push(`<p><a href="${page.primaryCta.to}">${escapeHtml(page.primaryCta.label)}</a></p>`)
  parts.push(`<p><a href="${page.teamLink.to}">${escapeHtml(page.teamLink.label)}</a></p>`)
  return parts.join('\n')
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
