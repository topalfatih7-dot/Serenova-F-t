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
    'online koçluk, online spor koçluğu, online spor koçu, online fitness koçu, uzaktan antrenman, online antrenman, video koçluk, spor paketi, online antrenör, online spor',
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
    'kilo verme diyetisyen, kilo vermek için diyetisyen, online kilo verme, online zayıflama, zayıflama programı, kilo verme programı, online diyet ve zayıflama',
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
    'evde antrenman programı, ekipmansız antrenman, evde egzersiz, online spor koçluğu ev, online spor koçu ev, online antrenman programı',
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

export const PCOS_BESLENMESI = {
  path: '/beslenme/pcos',
  theme: 'dietitian',
  heroFallback: '/online-diyetisyen',
  pillarPath: '/online-diyetisyen',
  pillarName: 'Online Diyetisyen',
  title: 'PCOS Diyeti — Polikistik Over Beslenmesi ve Programı',
  description:
    'PCOS diyeti ve polikistik over beslenmesi: insülin direnci, kilo yönetimi, hormonal denge. Online diyetisyen ile kişiye özel PCOS beslenme programı. Yeni Form.',
  keywords:
    'PCOS diyeti, polikistik over beslenmesi, PCOS beslenme programı, PCOS için diyetisyen, polikistik yumurtalık diyeti, PCOS kilo verme',
  h1: 'PCOS diyeti — polikistik over için beslenme programı',
  lead:
    '**PCOS (polikistik over sendromu)** beslenmeyle doğrudan ilişkilidir: insülin hassasiyeti, kilo yönetimi ve hormonal denge öğün planına yansıtılır. Yeni Form\'da **online diyetisyen** PCOS özelinde program hazırlar. Bu içerik tıbbi teşhis veya tedavi yerine geçmez.',
  primaryCta: { to: '/onboarding?plan=diyet', label: 'Diyetisyen Desteği Al' },
  secondaryCta: { to: '/online-diyetisyen', label: 'Online diyetisyen nasıl çalışır?' },
  teamLink: { to: '/team/dietitians', label: 'Diyetisyen kadrosu' },
  relatedService: { to: '/beslenme/insulin-direnci', label: 'İnsülin direnci beslenmesi' },
  serviceName: 'PCOS Beslenme Danışmanlığı',
  serviceType: 'NutritionCounseling',
  offerPlanIds: ['eko_diyet', 'diyet', 'vip'],
  sections: [
    {
      h2: 'PCOS\'de beslenme neden bu kadar önemlidir?',
      paragraphs: [
        'Polikistik over sendromu olan kadınların büyük çoğunluğunda **insülin direnci** tabloya eşlik eder. Doğru beslenme planı glisemik yükü dengeler, kilo yönetimine destek olur ve hormonal döngüyü olumlu etkiler.',
        'PCOS diyetinde tek bir şablon yoktur: öğün sıklığı, karbonhidrat tipi, protein dağılımı ve yağ kalitesi kişiye göre farklılaşır. **Online diyetisyen** bu değişkenleri sağlık profiliniz ve hedeflerinize göre özelleştirir.',
      ],
    },
    {
      h2: 'Süreç nasıl işler?',
      steps: [
        { title: 'Sağlık profili', text: 'Kayıt sonrası sağlık analizi; PCOS tanısı, ilaç durumu ve beslenme alışkanlıkları netleşir.' },
        { title: 'Diyetisyen eşleşmesi', text: 'Diyet paketinde ayda 2 video görüşme vardır. VIP pakette online koçluk da eklenir.' },
        { title: 'PCOS odaklı program', text: 'Glisemik indeks kontrolü, anti-inflamatuvar öğünler ve pratik menü örnekleri panele düşer.' },
        { title: 'Takip ve revize', text: 'Döngü değişimleri, enerji düzeyi ve ağırlık trendi seanslarda gözden geçirilir; program güncellenir.' },
      ],
    },
    {
      h2: 'PCOS diyetinde nelere dikkat edilir?',
      paragraphs: [
        'Rafine şeker ve beyaz un ürünleri insülin yanıtını hızlandırır; düşük glisemik karbonhidratlar ve yeterli protein öğün dengesini korur. **Anti-inflamatuvar** besinler (zeytin yağı, yeşil yapraklılar, omega-3 kaynakları) hormonal süreci destekler.',
        'Kilo kaybı zorunluluk değildir; vücut ağırlığının %5–10\'u oranında azalma hormonal dengeye katkı sağlayabilir. Diyetisyeniniz hedefinizi ve sürecinizi birlikte değerlendirir.',
      ],
    },
    {
      h2: 'Kimler için uygun?',
      paragraphs: [
        'PCOS tanısı almış, kilo yönetimine veya insülin dengesine destek arayan kadınlar için **online diyetisyen** desteği uygundur.',
        'Bu sayfa tıbbi teşhis değildir. Tedavi planı için jinekolog veya endokrinoloji uzmanınızla çalışın; beslenme desteği tıbbi süreci tamamlar, yerine geçmez.',
      ],
    },
  ],
  faqs: [
    { q: 'PCOS diyeti nasıl olmalıdır?', a: 'Düşük glisemik indeksli karbonhidratlar, yeterli protein ve omega-3 açısından zengin bir plan PCOS\'u destekler. Ancak kişiye özel düzenleme için diyetisyen gereklidir.' },
    { q: 'PCOS\'ta insülin direnci ne anlama gelir?', a: 'İnsülin direnci hücrelerin insülini etkili kullanamamasıdır. Bu durum kilo almayı kolaylaştırır ve semptomları ağırlaştırabilir. Beslenme ve yaşam tarzı insülin hassasiyetini iyileştirebilir.' },
    { q: 'PCOS için online diyetisyen yeterli mi?', a: 'Beslenme yönetimi için evet. Tıbbi tedavi (ilaç, hormonal destek) için jinekolog veya endokrinologunuzu takip etmeye devam edin.' },
    { q: 'Hangi paket PCOS için uygundur?', a: 'Diyet paketi (ayda 2 diyetisyen seansı) PCOS beslenme takibi için uygundur. Antrenman desteği istiyorsanız VIP değerlendirin.' },
    { q: 'PCOS\'ta hangi besinlerden kaçınılmalı?', a: 'Rafine şeker, beyaz un ürünleri ve işlenmiş gıdalar insülin yanıtını olumsuz etkiler. Diyetisyeniniz kişisel listeyi görüşmede belirler.' },
    { q: 'Kilo vermeden PCOS semptomları düzelir mi?', a: 'Hafif kilo kaybı (vücut ağırlığının %5–10\'u) hormonal dengeyi olumlu etkileyebilir; ancak bu genel bir bilgidir ve kişiye göre değişir.' },
    { q: 'Online görüşme nasıl yapılır?', a: 'Yeni Form\'da diyetisyen seansları platform içi görüntülü görüşme ile yapılır; ek uygulama indirmeniz gerekmez.' },
    { q: 'Bu sayfa tıbbi tavsiye midir?', a: 'Hayır. Genel beslenme bilgisi ve hizmet tanımıdır; tıbbi teşhis veya tedavi yerine geçmez.' },
  ],
}

export const INSULIN_DIRENCI = {
  path: '/beslenme/insulin-direnci',
  theme: 'dietitian',
  heroFallback: '/online-diyetisyen',
  pillarPath: '/online-diyetisyen',
  pillarName: 'Online Diyetisyen',
  title: 'İnsülin Direnci Diyeti — Kişiye Özel Beslenme Programı',
  description:
    'İnsülin direnci diyeti ve beslenme programı: glisemik indeks, öğün zamanlaması ve kilo yönetimi. Online diyetisyen ile kişiye özel insülin direnci planı. Yeni Form.',
  keywords:
    'insülin direnci diyeti, insülin direnci beslenmesi, insülin direncinde ne yenir, insülin direnci beslenme programı, insülin direnci kilo verme',
  h1: 'İnsülin direnci diyeti — kişiye özel beslenme programı',
  lead:
    '**İnsülin direnci** olan kişilerde standart diyet listeleri yetersiz kalabilir: glisemik yük, öğün zamanlaması ve makro dağılımı kişiselleştirilmelidir. Yeni Form\'da **online diyetisyen** insülin direncine özel beslenme programı hazırlar. Bu sayfa tıbbi teşhis veya tedavi yerine geçmez.',
  primaryCta: { to: '/onboarding?plan=diyet', label: 'Diyetisyen Desteği Al' },
  secondaryCta: { to: '/online-diyetisyen', label: 'Online diyetisyen nasıl çalışır?' },
  teamLink: { to: '/team/dietitians', label: 'Diyetisyen kadrosu' },
  relatedService: { to: '/beslenme/pcos', label: 'PCOS beslenmesi' },
  serviceName: 'İnsülin Direnci Beslenme Danışmanlığı',
  serviceType: 'NutritionCounseling',
  offerPlanIds: ['eko_diyet', 'diyet', 'vip'],
  sections: [
    {
      h2: 'İnsülin direnci nedir ve beslenme nasıl etkiler?',
      paragraphs: [
        '**İnsülin direnci**, hücrelerin insülin hormonuna yeterince yanıt vermemesidir. Pankreas bunu telafi etmek için daha fazla insülin üretir; bu döngü kilo almayı kolaylaştırır, yorgunluk ve şeker krizlerine yol açabilir.',
        'Doğru beslenme planıyla glisemik yanıt kontrol altına alınabilir. Düşük glisemik karbonhidratlar, yeterli protein, sağlıklı yağlar ve öğün sıklığının ayarlanması **insülin hassasiyetini** artırabilir.',
      ],
    },
    {
      h2: 'Süreç nasıl işler?',
      steps: [
        { title: 'Profil ve analiz', text: 'Kayıt sonrası sağlık analizi; insülin direnci durumu, hedef ve beslenme alışkanlıkları netleşir.' },
        { title: 'Diyetisyen eşleşmesi', text: 'Diyet paketinde ayda 2 video görüşme vardır; PCOS veya diyabet eşliği varsa bu da programa yansır.' },
        { title: 'Kişiye özel plan', text: 'Glisemik yükü düşük öğünler, protein dağılımı ve öğün zamanlaması panele yazılır.' },
        { title: 'Takip ve revize', text: 'Enerji, açlık döngüsü ve tartı trendi seanslarda gözden geçirilir; program güncellenir.' },
      ],
    },
    {
      h2: 'İnsülin direncinde neler yenir?',
      paragraphs: [
        'Yulaf ezmesi, tam tahıl, baklagiller, yeşil yapraklı sebzeler ve meyve (porsiyon kontrolüyle) glisemik yükü dengeler. **Protein** (yumurta, kurubaklagil, tavuk, balık) tokluk hissini uzatır ve insülin tepkisini yavaşlatır.',
        'Rafine karbonhidrat, şekerli içecekler, hazır meyve suyu ve beyaz ekmek insülin artışını hızlandırır. **Diyetisyeniniz**, bireysel tolerans ve hedef göz önünde bulundurarak kapsamlı listeyi görüşmede hazırlar.',
      ],
    },
    {
      h2: 'Kimler için uygun?',
      paragraphs: [
        'İnsülin direnci tanısı almış ya da semptom yaşayan (yorgunluk, şeker krizi, kilo verme güçlüğü), beslenme desteği arayan kişiler için **online diyetisyen** uygundur.',
        'Bu sayfa tıbbi teşhis değildir. Diyabet başlangıcı ya da metabolik sendrom şüphesi varsa önce endokrinolog veya dahiliye uzmanınıza başvurun.',
      ],
    },
  ],
  faqs: [
    { q: 'İnsülin direnci diyetinde hangi besinler tercih edilmeli?', a: 'Tam tahıl, baklagil, yeşil sebze, yeterli protein ve sağlıklı yağ içeren öğünler önerilir. Kişiye özel liste diyetisyeninizle belirlenir.' },
    { q: 'İnsülin direnci olan biri kilo verebilir mi?', a: 'Evet. Glisemik kontrol ve kalori yönetimiyle kilo kaybı mümkündür; sürdürülebilir program için diyetisyen desteği önemlidir.' },
    { q: 'İnsülin direncinde spor şart mı?', a: 'Düzenli hareket insülin hassasiyetini artırır; ancak beslenme tek başına da etkilidir. İkisini birlikte yönetmek için VIP veya ayrı Spor paketi değerlendirilebilir.' },
    { q: 'Online diyetisyen insülin direncine yardımcı olur mu?', a: 'Beslenme yönetimi açısından evet. Tıbbi tedavi (ilaç, sağlık takibi) için doktorunuzla devam edin.' },
    { q: 'Hangi paket insülin direnci için uygundur?', a: 'Diyet paketi (ayda 2 diyetisyen seansı) öncelikli seçenektir. Hareketi de dahil etmek için VIP değerlendirin.' },
    { q: 'İnsülin direnci PCOS ile ilişkili midir?', a: 'PCOS\'lu kadınların büyük çoğunluğunda insülin direnci eşlik eder. İki durumu birlikte ele alan beslenme programları için PCOS sayfamıza göz atın.' },
    { q: 'Öğün sıklığı insülin direncinde önemli mi?', a: 'Evet. Çok uzun açlık aralıkları veya sık sık atıştırma insülin döngüsünü bozabilir. Diyetisyeniniz kişisel ritminize göre öğün planlar.' },
    { q: 'Bu sayfa tıbbi tavsiye midir?', a: 'Hayır. Genel beslenme bilgisi ve hizmet tanımıdır; tıbbi teşhis veya tedavi yerine geçmez.' },
  ],
}

export const ONLINE_WELLNESS = {
  path: '/online-wellness',
  theme: 'coach',
  heroFallback: '/online-kocluk',
  pillarPath: '/',
  pillarName: 'Yeni Form',
  title: 'Online Wellness — Dijital Sağlık ve Yaşam Koçluğu Platformu',
  description:
    'Online wellness platformu: online diyetisyen, online spor koçluğu, sağlık analizi ve kişisel program. Türkiye\'de dijital wellness için Yeni Form\'u keşfedin.',
  keywords:
    'online wellness, wellness platformu, dijital wellness, online sağlık koçluğu, online sağlıklı yaşam, wellness Türkiye, online wellness programı',
  h1: 'Online wellness — sağlıklı yaşamı dijitalde yönet',
  lead:
    '**Online wellness**, beslenme, hareket ve sağlık analizini tek platformda bir araya getirir. Yeni Form\'da **online diyetisyen**, **online spor koçluğu** ve AI destekli **kişisel sağlık analizi** video görüşmelerle yürütülür; kliniğe gitmenize gerek yok.',
  primaryCta: { to: '/membership', label: 'Planları Karşılaştır' },
  secondaryCta: { to: '/onboarding', label: 'Hemen Başla' },
  teamLink: { to: '/team/coaches', label: 'Koç ve diyetisyen kadrosu' },
  relatedService: { to: '/online-diyetisyen', label: 'Online diyetisyen hizmeti' },
  serviceName: 'Online Wellness Platformu',
  serviceType: 'WellnessProgram',
  offerPlanIds: ['eko_diyet', 'diyet', 'eko_spor', 'spor', 'vip'],
  sections: [
    {
      h2: 'Online wellness nedir?',
      paragraphs: [
        '**Online wellness**, fiziksel ve zihinsel sağlığı destekleyen hizmetlerin internet ve video görüşme aracılığıyla sunulmasıdır. Beslenme danışmanlığı, spor koçluğu, sağlık analizi ve takip aynı dijital platformda yürütülür.',
        'Türkiye\'de wellness platformlarına olan ilgi hızla artıyor. Kliniğe vakit ayıramayanlar, şehir dışında yaşayanlar ve **bütünsel sağlık yönetimi** arayanlar için online wellness, birebir fiziksel hizmetle karşılaştırılabilir sonuçlar sağlıyor.',
      ],
    },
    {
      h2: 'Yeni Form\'da online wellness nasıl çalışır?',
      steps: [
        { title: 'Sağlık analizi', text: 'Kayıtta sekiz boyutlu kişisel sağlık analizi tamamlanır; koç ve diyetisyen eşleşmesi bu veriye dayanır.' },
        { title: 'Uzman seçimi', text: 'Diyetisyen, koç veya her ikisi (VIP) paket tercihine göre atanır.' },
        { title: 'Video görüşme ve program', text: 'Platform içi görüntülü seanslarda program hazırlanır; antrenman videoları ve beslenme takibi panelde yürütülür.' },
        { title: 'İlerleme takibi', text: 'Kalori, su, antrenman ve sağlık skoru panelde görünür; bir sonraki seans için koç/diyetisyen verileri önceden inceler.' },
      ],
    },
    {
      h2: 'Online wellness\'ın geleneksel kliniğe farkı ne?',
      paragraphs: [
        'Geleneksel klinik; belirli şehir, belirli saat ve ulaşım gereksinimiyle sınırlıdır. **Online wellness** platformu: istediğiniz yerden, randevu saatinde bilgisayar veya telefonunuzdan katılım imkânı sunar.',
        'Yeni Form\'un rakipsiz unsurları: **video görüşme** (WhatsApp değil, platform içi), **AI sağlık skoru** analizi, **egzersiz video kütüphanesi** ve **kalori AI** aynı hesapta entegre çalışır.',
      ],
    },
    {
      h2: 'Hangi hizmetler dahildir?',
      paragraphs: [
        'Platform içinde **online diyetisyenlik**, **online spor koçluğu**, kişisel sağlık analizi, kalori takibi ve video görüşme yer alır. Paket kapsamına göre birini veya ikisini birden kullanabilirsiniz.',
        'Doktor paketi; tek seferlik sağlık danışmanlığı görüşmesidir. VIP paket ise koç ve diyetisyeni bir arada sunar — Türkiye\'de bu entegrasyonu online sunan az sayıda platformdan biriyiz.',
      ],
    },
  ],
  faqs: [
    { q: 'Online wellness nedir?', a: 'Online wellness; beslenme, hareket ve sağlık danışmanlığını internet üzerinden, video görüşme ve kişisel program aracılığıyla sunan dijital sağlık hizmetleridir.' },
    { q: 'Online wellness platformu güvenilir mi?', a: 'Yeni Form\'da tüm koç ve diyetisyenler lisanslı uzmanlar; görüşmeler platform içi şifreli video, veriler KVKK uyumlu işlenir.' },
    { q: 'Online wellness ile kilo verilir mi?', a: 'Online diyetisyen ve spor koçluğuyla kilo yönetimi mümkündür. Sonuçlar kişiden kişiye değişir; sürdürülebilir hedefler için koç/diyetisyeninizle birlikte plan yaparsınız.' },
    { q: 'Yeni Form\'da online wellness kapsamı ne?', a: 'Online diyetisyen (diyet, PCOS, sporcu beslenmesi vb.), online spor koçluğu, AI sağlık analizi, kalori takibi ve video görüşme tek platformda sunulur.' },
    { q: 'Online wellness fiyatları nasıl?', a: 'Eko Diyet 1.299 TL/ay\'dan başlar; VIP (koç + diyetisyen) 4.999 TL/ay\'dır. Güncel tablo üyelik sayfasındadır.' },
    { q: 'Hangi wellness hizmetini seçmeliyim?', a: 'Yalnızca beslenme → Diyet paketi; yalnızca spor → Spor paketi; ikisi birlikte → VIP. Paket karşılaştırma sayfamıza bakın.' },
    { q: 'Online wellness programı ne kadar sürer?', a: 'Hedefe bağlı değişir. Çoğu üye 3–6 ay düzenli takipte alışkanlık değişimi sağlar; paket süresi boyunca uzman desteği devam eder.' },
    { q: 'Şehir dışında yaşıyorum, online wellness işe yarar mı?', a: 'Evet. Platform tüm Türkiye\'ye hizmet verir; randevu saatinde internet bağlantısı yeterlidir.' },
  ],
}

export const SERVICE_PAGES = {
  [ONLINE_DIYETISYEN.path]: { ...ONLINE_DIYETISYEN, theme: 'dietitian' },
  [ONLINE_KOCLUK.path]: { ...ONLINE_KOCLUK, theme: 'coach' },
  [KILO_VERME.path]: KILO_VERME,
  [ONLINE_DIYETISYEN_FIYAT.path]: ONLINE_DIYETISYEN_FIYAT,
  [EV_ANTRENMAN.path]: EV_ANTRENMAN,
  [SPORCU_BESLENMESI.path]: SPORCU_BESLENMESI,
  [PCOS_BESLENMESI.path]: PCOS_BESLENMESI,
  [INSULIN_DIRENCI.path]: INSULIN_DIRENCI,
  [ONLINE_WELLNESS.path]: ONLINE_WELLNESS,
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
