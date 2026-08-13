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
  offerPlanIds: ['eko_diyet', 'diyet', 'vip'],
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
        'Tek diyetisyen kliniklerinden farkımız: aynı hesapta **antrenman programı**, programınızdaki hareket videoları ve isteğe bağlı online koçluk bir arada yönetilir.',
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
    {
      q: 'Online diyetisyen güvenilir mi?',
      a: 'Yeni Form diyetisyenleri lisanslı ve deneyimli beslenme uzmanlarıdır. Platform içi video görüşme, şifreli iletişim ve KVKK uyumu ile güvenli hizmet sunulur.',
    },
    {
      q: 'İlk seansta neler konuşulur?',
      a: 'İlk seansta beslenme alışkanlıklarınız, hedefleriniz, sağlık geçmişiniz ve günlük rutininiz değerlendirilir. Sağlık testinizi tamamladıysanız diyetisyen analiz sonuçlarınızı da inceler.',
    },
    {
      q: 'Online diyetisyen programı ne kadar sürer?',
      a: 'Süre hedefinize göre değişir. Çoğu üye 3–6 aylık süreçte kalıcı alışkanlık değişimi sağlar. Paket süreniz boyunca diyetisyeninizle çalışmaya devam edersiniz.',
    },
    {
      q: 'Online diyetisyen ile yüz yüze diyetisyen arasındaki fark nedir?',
      a: 'Yüz yüze kliniğe gitme zorunluluğu yoktur; randevu saatinde bilgisayar ya da telefonunuzdan katılırsınız. Yeni Form\'da tüm program, ilerleme ve mesajlaşma aynı platformda yürütüldüğü için takip daha sistematiktir.',
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
    'Yeni Form’da online koçluk; PDF program satışı değil — **video görüşme**, kişiye özel antrenman planı, programınızdaki egzersiz videoları ve panel takibi bir arada. Hedefinize uygun **Spor veya VIP** paketle başlayın.',
  primaryCta: { to: '/onboarding?plan=spor', label: 'Spor Paketi ile Başla' },
  secondaryCta: { to: '/membership', label: 'Paketleri Karşılaştır' },
  teamLink: { to: '/team/coaches', label: 'Koç kadromuzu inceleyin' },
  relatedService: { to: '/online-diyetisyen', label: 'Online diyetisyen hizmetimiz' },
  serviceName: 'Online Fitness Koçluğu',
  serviceType: 'ExerciseProgram',
  offerPlanIds: ['eko_spor', 'spor', 'vip'],
  sections: [
    {
      h2: 'Online koçluk nedir?',
      paragraphs: [
        '**Online koçluk**, antrenörünüzle aynı salonda olmadan kişiye özel program ve düzenli geri bildirim almanızdır. Yeni Form’da süreç; hedefleriniz, ekipmanınız ve antrenman yerinize (ev veya salon) göre **kişiselleştirilmiş antrenman programı**, ayda planlanan **video görüşmeler** ve panel üzerinden ilerleme takibi şeklinde ilerler.',
        '“Online spor koçu” veya “uzaktan antrenman” arayanlar için kritik nokta **sürdürülebilir takiptir**. Farkımız, tek seferlik PDF yerine **koçluk platformuyla entegre** bir sistem sunmamızdır: program panelde kalır, hareketler programınızdaki videolarla desteklenir.',
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
          title: 'Program ve hareket videoları',
          text: 'Size özel antrenman programınız panele düşer; listedeki egzersiz videolarıyla tekniği netleştirirsiniz.',
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
      a: 'Evet. Koçunuz ev veya salon tercihinize ve ekipman erişiminize göre programı uyarlar; programınızdaki hareket videolarıyla ev antrenmanı da yapılabilir.',
    },
    {
      q: 'Online spor koçu paketi hangi planda?',
      a: 'Birebir online koç görüşmesi Spor ve VIP paketlerindedir. Detaylar için üyelik sayfasını inceleyin.',
    },
    {
      q: 'Koç ve diyetisyeni birlikte alabilir miyim?',
      a: 'VIP paket ayda 2 koç ve 2 diyetisyen görüşmesini birleştirir. Ayrıntılar için üyelik karşılaştırma sayfasını inceleyin.',
    },
    {
      q: 'Online koçluk yüz yüze kadar etkili mi?',
      a: 'Araştırmalar, düzenli online koçluk programlarının yüz yüze çalışmaya yakın sonuçlar verdiğini göstermektedir. Yeni Form\'da program, video kütüphanesi ve mesajlaşma aynı platformda olduğu için tutarlılık daha kolay sağlanır.',
    },
    {
      q: 'Online koç beni ne sıklıkla takip eder?',
      a: 'Spor paketinde ayda 2 video görüşmesi yer alır. Görüşmeler arasında mesajlaşma ile koçunuza ulaşabilir, program güncellemesi talep edebilirsiniz.',
    },
    {
      q: 'Daha önce hiç spor yapmadım, online koçluk benim için uygun mu?',
      a: 'Evet. Koçunuz fitness seviyenizi başlangıçta değerlendirir ve tamamen yeni başlayanlara uygun program hazırlar. Yeni Form\'da temel egzersiz videoları da program içinde yer alır.',
    },
    {
      q: 'Online koçluk programım nasıl takip edilir?',
      a: 'Kişisel panelinizdeki takvimde her gün ve egzersiz görünür. Tamamladığınız seansları işaretler, koçunuz ilerlemenizi gerçek zamanlı görerek programı günceller.',
    },
  ],
}

export const KILO_VERME = {
  path: '/kilo-verme',
  theme: 'dietitian',
  heroFallback: '/online-diyetisyen',
  pillarPath: '/online-diyetisyen',
  pillarName: 'Online Diyetisyen',
  title: 'Kilo Verme Diyetisyeni — Online Program ve Takip',
  description:
    'Kilo verme diyetisyeni ile video görüşme, kişiye özel beslenme programı ve panel takibi. Yeni Form Diyet ve VIP paketleriyle sürdürülebilir kilo yönetimi.',
  keywords:
    'kilo verme diyetisyen, kilo vermek için diyetisyen, online kilo verme, kilo verme programı',
  h1: 'Kilo verme diyetisyeni ile sürdürülebilir program',
  lead:
    'Kilo vermek için diyetisyen desteği; yasak listesi değil, **video görüşme**, kişiye özel program ve takip demektir. Yeni Form’da Diyet paketi **ayda 2 diyetisyen seansı** (1.299–2.499 TL/ay aralığı) sunar. Bu içerik tıbbi teşhis veya tedavi yerine geçmez.',
  primaryCta: { to: '/onboarding?plan=diyet', label: 'Diyet Paketi ile Başla' },
  secondaryCta: { to: '/membership', label: 'Paketleri Karşılaştır' },
  teamLink: { to: '/team/dietitians', label: 'Diyetisyen kadromuzu inceleyin' },
  relatedService: { to: '/online-diyetisyen', label: 'Online diyetisyen nasıl çalışır?' },
  serviceName: 'Kilo Verme Diyetisyen Desteği',
  serviceType: 'WeightManagement',
  offerPlanIds: ['eko_diyet', 'diyet', 'vip'],
  sections: [
    {
      h2: 'Kilo vermek için diyetisyen ne işe yarar?',
      paragraphs: [
        '**Kilo verme diyetisyeni**, kalori açığını rastgele kesmek yerine öğün düzeni, protein, uyku ve günlük ritminize göre plan kurar. Yeni Form’da süreç sağlık analizi ve **online diyetisyen** görüşmeleriyle ilerler.',
        'Arama niyeti “kilo vermek için ne yapmalı” ise pratik cevap: ölçülebilir hedef, sürdürülebilir açık ve düzenli geri bildirim. PDF liste tek başına bu döngüyü kurmaz.',
      ],
    },
    {
      h2: 'Süreç nasıl işler?',
      steps: [
        { title: 'Hedef ve sağlık profili', text: 'Kayıt sonrası kısa analiz; kilo hedefi, kısıtlar ve yaşam temposu netleşir.' },
        { title: 'Diyetisyen eşleşmesi', text: 'Diyet paketinde ayda 2 video seans vardır. VIP’te koç görüşmeleri de eklenir.' },
        { title: 'Program ve kalori takibi', text: 'Beslenme programı panele düşer; kalori araçları ile ilerleme görünür kalır.' },
        { title: 'Revize', text: 'Seanslarda plato, sosyal yemek ve enerji düşüşüne göre menü güncellenir.' },
      ],
    },
    {
      h2: 'Kimler için uygun?',
      paragraphs: [
        'Yoğun çalışanlar, evden takip isteyenler ve **sürdürülebilir kilo yönetimi** arayanlar için online süreç güçlü bir alternatiftir.',
        'Kronik hastalık, gebelik veya hekim kısıtı varsa önce sağlık uzmanınıza danışın. Yeni Form wellness platformudur; **tıbbi tedavi yerine geçmez**.',
      ],
    },
  ],
  faqs: [
    { q: 'Kilo verme diyetisyeni online olur mu?', a: 'Evet. Yeni Form’da görüşmeler platform içi videodur; program panelde kalır.' },
    { q: 'Ne kadar sürede sonuç alınır?', a: 'Kişiye göre değişir. Çoğu üye 8–12 haftalık düzenli takipte alışkanlık ve ölçü değişimini görür. Mucize süre vaadi yoktur.' },
    { q: 'Hangi paket kilo verme için uygun?', a: 'Beslenme odaklı Diyet veya Eko Diyet; antrenmanı da istiyorsanız VIP. Fiyatlar üyelik sayfasındadır.' },
    { q: 'Kalori açığı nedir?', a: 'Harcanan enerjinin alınan enerjiden fazla olmasıdır. Diyetisyeniniz bunu aç kalmadan, protein ve öğün düzeniyle planlar.' },
    { q: 'Spor olmadan kilo verilir mi?', a: 'Evet, beslenme temelli açık ile mümkün. Koçluk eklemek yağsız kitle ve enerji için faydalıdır.' },
    { q: 'Online kilo verme güvenilir mi?', a: 'Lisanslı diyetisyen, video seans ve KVKK uyumu ile yürütülür. Teşhis/tedavi iddiası yoktur.' },
    { q: 'Plato olursa ne yapılır?', a: 'Seanslarda öğün, uyku ve aktivite gözden geçirilir; program revize edilir.' },
    { q: 'Yüz yüze klinik şart mı?', a: 'Hayır. Randevu saatinde bilgisayar veya telefondan katılırsınız.' },
  ],
}

export const ONLINE_DIYETISYEN_FIYAT = {
  path: '/online-diyetisyen/fiyat',
  theme: 'dietitian',
  heroFallback: '/online-diyetisyen',
  pillarPath: '/online-diyetisyen',
  pillarName: 'Online Diyetisyen',
  title: 'Online Diyetisyen Fiyatları 2026 — Paket ve Seans',
  description:
    '2026 online diyetisyen fiyatları: Eko Diyet 1.299 TL, Diyet 2.499 TL, VIP 4.999 TL/ay. Video görüşme seans hakları ve paket karşılaştırması.',
  keywords:
    'online diyetisyen fiyat, online diyetisyen fiyat 2026, diyet paketi fiyat, online diyet ücreti',
  h1: 'Online diyetisyen fiyatları 2026',
  lead:
    'Yeni Form’da **online diyetisyen** fiyatı pakete göre değişir: **Eko Diyet 1.299 TL/ay** (ayda 1 seans), **Diyet 2.499 TL/ay** (ayda 2 seans), **VIP 4.999 TL/ay** (2 diyetisyen + 2 koç). Tüm plan tablosu üyelik sayfasındadır.',
  primaryCta: { to: '/membership', label: 'Güncel Fiyatları Gör' },
  secondaryCta: { to: '/onboarding?plan=diyet', label: 'Diyet ile Başla' },
  teamLink: { to: '/team/dietitians', label: 'Diyetisyen kadrosu' },
  relatedService: { to: '/online-diyetisyen', label: 'Hizmet nasıl işler?' },
  serviceName: 'Online Diyetisyen Paket Fiyatları',
  serviceType: 'NutritionCounseling',
  offerPlanIds: ['eko_diyet', 'diyet', 'vip'],
  sections: [
    {
      h2: 'Online diyetisyen ne kadar tutar?',
      paragraphs: [
        '2026’da bireysel klinikler aylık **2.000–6.000 TL** bandında teklif verebilir. Yeni Form’da fiyat şeffaftır: Eko Diyet **1.299 TL**, Diyet **2.499 TL**, koç birleşik VIP **4.999 TL** (aylık liste fiyatı).',
        'Fark: WhatsApp-only takip değil; **video görüşme**, panel programı ve isteğe bağlı koçluk aynı hesaptadır. Tüm paketleri `/membership` üzerinde karşılaştırın.',
      ],
    },
    {
      h2: 'Seans hakları nasıl işler?',
      steps: [
        { title: 'Eko Diyet', text: 'Ayda 1 online diyetisyen görüşmesi — giriş seviyesi takip.' },
        { title: 'Diyet', text: 'Ayda 2 video seans; kilo yönetimi ve alışkanlık değişimi için standart paket.' },
        { title: 'VIP', text: 'Ayda 2 diyetisyen + 2 koç; beslenme ve antrenman birlikte.' },
        { title: 'Ödeme', text: 'Stripe ile aylık veya 3–6 aylık seçenekler üyelik sayfasında görünür.' },
      ],
    },
    {
      h2: 'Neden fiyat sayfası ayrı?',
      paragraphs: [
        '“Online diyetisyen fiyat 2026” arayanlar tüm wellness paketlerini değil, **diyetisyen ücretini** ister. Bu sayfa yalnızca diyet odaklıdır; Spor/Doktor satırları üyelik tablosundadır.',
        'Rakip klinikler fiyatı WhatsApp’ta gizleyebilir. Biz liste fiyatını burada ve üyelik sayfasında açık yazarız.',
      ],
    },
  ],
  faqs: [
    { q: 'Online diyetisyen fiyatı 2026’da ne kadar?', a: 'Yeni Form’da Eko Diyet 1.299 TL, Diyet 2.499 TL, VIP 4.999 TL/ay (liste). Kampanya üyelik sayfasında görünür.' },
    { q: 'Seans başı mı aylık mı?', a: 'Paket aylıktır; seans hakkı pakete dahildir (Eko 1, Diyet 2/ay).' },
    { q: 'Gizli ücret var mı?', a: 'Liste fiyatı üyelik sayfasındadır. Ödeme Stripe ile alınır; ek uygulama ücreti yoktur.' },
    { q: '3 veya 6 aylık indirim var mı?', a: 'Çok aylık katmanlar üyelik sayfasındaki fiyat tablosunda yer alır.' },
    { q: 'Sadece bir seans alınır mı?', a: 'Platform paket modelidir; tek seanslık klinik satışı yoktur. Doktor paketi ayrı, tek seferliktir.' },
    { q: 'Koçluk fiyata dahil mi?', a: 'Diyet paketinde hayır. VIP’de koç + diyetisyen birliktedir.' },
    { q: 'İptal nasıl olur?', a: 'Stripe Müşteri Portalı ve iptal politikası yasal metinlerde açıklanır.' },
    { q: 'Fiyat neden klinikten farklı?', a: 'Platform ölçeği, video altyapısı ve program paneli dahildir; bireysel klinik teklifi kişiye özel kalabilir.' },
  ],
}

export const EV_ANTRENMAN = {
  path: '/online-kocluk/ev-antrenman',
  theme: 'coach',
  heroFallback: '/online-kocluk',
  pillarPath: '/online-kocluk',
  pillarName: 'Online Koçluk',
  title: 'Evde Antrenman Programı — Online Koç ile Ekipmansız',
  description:
    'Evde antrenman programı: ekipmansız veya ev aletleriyle kişiye özel plan, video koçluk ve hareket videoları. Spor ve VIP paketleriyle başlayın.',
  keywords:
    'evde antrenman programı, ekipmansız antrenman, evde egzersiz, online spor koçu ev',
  h1: 'Evde antrenman programı — online koç ile',
  lead:
    '**Evde antrenman programı**, salon üyeliği olmadan kişiye özel plan demektir. Yeni Form’da koçunuz ekipmanınıza göre program yazar; **Spor paketinde ayda 2 video seans** vardır. Ağır sakatlıkta önce hekime danışın.',
  primaryCta: { to: '/onboarding?plan=spor', label: 'Spor Paketi ile Başla' },
  secondaryCta: { to: '/online-kocluk', label: 'Online koçluk nedir?' },
  teamLink: { to: '/team/coaches', label: 'Koç kadromuz' },
  relatedService: { to: '/beslenme/sporcu-beslenmesi', label: 'Sporcu beslenmesi' },
  serviceName: 'Evde Antrenman Koçluğu',
  serviceType: 'ExerciseProgram',
  offerPlanIds: ['eko_spor', 'spor', 'vip'],
  sections: [
    {
      h2: 'Ekipmansız evde antrenman olur mu?',
      paragraphs: [
        'Evet. Koçunuz vücut ağırlığı, direnç bandı veya evdeki sınırlı ekipmana göre programı uyarlar. **Online koçluk** farkı: PDF değil, panel + hareket videoları + video seans.',
        '“Evde egzersiz” arayanlar için kritik olan sürekliliktir. Haftalık yapı, ilerleme ve form düzeltmesi olmadan program çabuk düşer.',
      ],
    },
    {
      h2: 'Süreç nasıl işler?',
      steps: [
        { title: 'Ortam ve ekipman', text: 'Ev, salon veya hibrit; elinizdeki ekipman programa yazılır.' },
        { title: 'Koç eşleşmesi', text: 'Spor paketinde ayda 2 online koç görüşmesi vardır.' },
        { title: 'Program ve videolar', text: 'Günlük akış panele düşer; listedeki egzersiz videoları tekniği netleştirir.' },
        { title: 'Form kontrolü', text: 'Seanslarda tempo, ağrı ve ilerleme konuşulur; program revize edilir.' },
      ],
    },
    {
      h2: 'Kimler için uygun?',
      paragraphs: [
        'Zamanı kısıtlı çalışanlar, seyahat edenler ve salona gitmeden başlamak isteyenler için ev programı uygundur.',
        'Ağır sakatlık veya hekim kısıtı varsa fizyoterapi yerine geçmez; önce sağlık uzmanınıza danışın.',
      ],
    },
  ],
  faqs: [
    { q: 'Evde antrenman programı nasıl hazırlanır?', a: 'Koçunuz seviye, ekipman ve hedefe göre panelde kişiye özel plan yazar.' },
    { q: 'Ekipmansız ilerler miyim?', a: 'Evet. Vücut ağırlığı ve ev varyasyonları ile başlanır; ekipman eklendikçe program güncellenir.' },
    { q: 'Hangi paket?', a: 'Online koç görüşmesi Spor ve VIP’tedir. Eko Spor ayda 1 seanslı ekonomik seçenektir.' },
    { q: 'Video kütüphanesi var mı?', a: 'Egzersiz videoları programınızdaki hareketlere bağlıdır; ayrı uygulama gerekmez.' },
    { q: 'Salon programına geçebilir miyim?', a: 'Evet. Koç hibrit veya salon şablonuna çevirebilir.' },
    { q: 'Yeni başlayan için uygun mu?', a: 'Evet. Seviye değerlendirmesi ilk süreçtedir.' },
    { q: 'Ne sıklıkla antrenman?', a: 'Hedefe göre değişir; koçunuz haftalık sıklığı birlikte belirler.' },
    { q: 'Beslenme de var mı?', a: 'VIP veya ayrı diyet paketi ile online diyetisyen eklenir. Sporcu beslenmesi sayfamıza bakın.' },
  ],
}

export const SPORCU_BESLENMESI = {
  path: '/beslenme/sporcu-beslenmesi',
  theme: 'dietitian',
  heroFallback: '/online-diyetisyen',
  pillarPath: '/online-diyetisyen',
  pillarName: 'Online Diyetisyen',
  title: 'Sporcu Beslenmesi — Antrenman Öncesi ve Sonrası',
  description:
    'Sporcu beslenmesi: antrenman öncesi/sonrası öğün, protein ve performans. Online diyetisyen + koçluk ile kişiye özel plan. Yeni Form.',
  keywords:
    'sporcu beslenmesi, sporcu diyeti, antrenman beslenmesi, sporcu diyetisyen',
  h1: 'Sporcu beslenmesi — antrenman öncesi ve sonrası',
  lead:
    '**Sporcu beslenmesi**, antrenman öncesi enerji ve sonrası toparlanma öğünlerini kişiye göre planlamaktır. Yeni Form’da **online diyetisyen** ve isteğe bağlı **online koçluk** aynı panelde yürür. Performans iddiaları genel bilgilendirmedir; tıbbi tedavi değildir.',
  primaryCta: { to: '/onboarding?plan=diyet', label: 'Diyetisyen Desteği Al' },
  secondaryCta: { to: '/online-kocluk', label: 'Online koçluk' },
  teamLink: { to: '/team/dietitians', label: 'Diyetisyen kadrosu' },
  relatedService: { to: '/online-kocluk/ev-antrenman', label: 'Evde antrenman' },
  serviceName: 'Sporcu Beslenmesi Danışmanlığı',
  serviceType: 'NutritionCounseling',
  offerPlanIds: ['diyet', 'spor', 'vip'],
  sections: [
    {
      h2: 'Sporcu diyeti nedir?',
      paragraphs: [
        'Sporcu diyeti tek menü şablonu değildir. Antrenman günü, dinlenme günü, protein dağılımı ve hidrasyon kişiye göre değişir. **Online diyetisyen** bunu görüşme notlarınıza göre yazar.',
        'Koç programı varsa öğün zamanlaması antrenman saatine hizalanır. VIP pakette iki uzman aynı üye panelinde çalışır.',
      ],
    },
    {
      h2: 'Süreç nasıl işler?',
      steps: [
        { title: 'Hedef', text: 'Yağ kaybı, performans veya kitle — hedef netleşir.' },
        { title: 'Antrenman ritmi', text: 'Ev veya salon programınız öğün zamanlamasını etkiler.' },
        { title: 'Program', text: 'Diyetisyen beslenme planını panele yazar; seanslarda revize eder.' },
        { title: 'Takip', text: 'Enerji, uyku ve antrenman çıktısı birlikte okunur.' },
      ],
    },
    {
      h2: 'Kimler için?',
      paragraphs: [
        'Düzenli antrenman yapan amatörler, evde çalışanlar ve salon sporcuları için uygundur.',
        'Yarışma sporcusu veya klinik durum varsa ilgili hekim/spor hekimliği yönlendirmesi önceliklidir.',
      ],
    },
  ],
  faqs: [
    { q: 'Sporcu beslenmesi için diyetisyen şart mı?', a: 'Hedefli performans ve toparlanma için kişiye özel plan, genel internet listesinden daha güvenlidir.' },
    { q: 'Antrenman öncesi ne yenir?', a: 'Kişiye göre değişir. Diyetisyeniniz sindirimi kolay karbonhidrat ve pratik öğün örnekleri verir.' },
    { q: 'Protein ihtiyacı nasıl hesaplanır?', a: 'Vücut ağırlığı, antrenman hacmi ve hedefe göre diyetisyen hesaplar; tek bir sihirli sayı yoktur.' },
    { q: 'Koç ve diyetisyen birlikte mi?', a: 'VIP pakette evet. Ayrı Diyet + Spor da mümkündür; admin atamasıyla.' },
    { q: 'Ek gıda önerir misiniz?', a: 'Takviye tıbbi öneri değildir. Gerekirse diyetisyen genel çerçevede konuşur; hekim kararı sizinle.' },
    { q: 'Ev antrenmanında da geçerli mi?', a: 'Evet. Öğün planı ev veya salon ritmine uyarlanır.' },
    { q: 'Hangi paket?', a: 'Beslenme için Diyet; antrenman için Spor; ikisi VIP.' },
    { q: 'Bu sayfa tıbbi tavsiye mi?', a: 'Hayır. Genel bilgilendirme ve hizmet tanımıdır; teşhis/tedavi yerine geçmez.' },
  ],
}

export const SERVICE_PAGES = {
  [ONLINE_DIYETISYEN.path]: { ...ONLINE_DIYETISYEN, theme: 'dietitian' },
  [ONLINE_KOCLUK.path]: { ...ONLINE_KOCLUK, theme: 'coach' },
  [KILO_VERME.path]: KILO_VERME,
  [ONLINE_DIYETISYEN_FIYAT.path]: ONLINE_DIYETISYEN_FIYAT,
  [EV_ANTRENMAN.path]: EV_ANTRENMAN,
  [SPORCU_BESLENMESI.path]: SPORCU_BESLENMESI,
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
