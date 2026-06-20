// Detaylı sağlık testi tanımı (veri odaklı).
// Her bölüm bir alt-adımdır; kayıt formunun 5. adımında soru-soru gösterilir.
// Cevaplar member.data.healthTest içinde JSONB olarak veritabanına kaydedilir.

// Soru tipleri: 'emoji' | 'single' | 'multi' | 'text'
export const HEALTH_SECTIONS = [
  {
    id: 'general',
    title: 'Genel Durum',
    subtitle: 'Kendinizi son zamanlarda nasıl hissediyorsunuz?',
    icon: 'HeartPulse',
    questions: [
      {
        key: 'wellbeing', type: 'emoji', required: true,
        label: 'Genel sağlık durumunuzu nasıl değerlendirirsiniz?',
        options: [
          { value: '1', emoji: '😣', label: 'Kötü' },
          { value: '2', emoji: '🙁', label: 'Zayıf' },
          { value: '3', emoji: '😐', label: 'Orta' },
          { value: '4', emoji: '🙂', label: 'İyi' },
          { value: '5', emoji: '😄', label: 'Mükemmel' },
        ],
      },
      {
        key: 'energy', type: 'single', required: true,
        label: 'Gün içindeki enerji seviyeniz genelde nasıldır?',
        options: [
          { value: 'low', label: 'Düşük', desc: 'Sık sık yorgun hissederim' },
          { value: 'medium', label: 'Orta', desc: 'İdare eder' },
          { value: 'high', label: 'Yüksek', desc: 'Gün boyu zinde' },
        ],
      },
    ],
  },
  {
    id: 'medical',
    title: 'Tıbbi Geçmiş',
    subtitle: 'Kronik rahatsızlıklar ve ilaç kullanımı',
    icon: 'Stethoscope',
    questions: [
      {
        key: 'chronicConditions', type: 'multi', required: false,
        label: 'Doktor teşhisli kronik bir rahatsızlığınız var mı?',
        hint: 'Birden fazla seçebilirsiniz. Yoksa boş bırakın.',
        options: [
          { value: 'diabetes', label: 'Diyabet' },
          { value: 'heart', label: 'Kalp/Damar' },
          { value: 'hypertension', label: 'Hipertansiyon' },
          { value: 'cholesterol', label: 'Yüksek Kolesterol' },
          { value: 'asthma', label: 'Astım/KOAH' },
          { value: 'thyroid', label: 'Tiroid' },
          { value: 'joint', label: 'Eklem/Omurga' },
          { value: 'kidney', label: 'Böbrek' },
          { value: 'digestive', label: 'Sindirim Sistemi' },
          { value: 'other', label: 'Diğer' },
        ],
      },
      {
        key: 'medications', type: 'single', required: true,
        label: 'Düzenli olarak ilaç/takviye kullanıyor musunuz?',
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'yes', label: 'Evet' },
        ],
        detail: { key: 'medicationDetail', when: 'yes', placeholder: 'Hangi ilaç/takviye? (ör. tansiyon ilacı, D vitamini)' },
      },
      {
        key: 'familyHistory', type: 'multi', required: false,
        label: 'Ailenizde aşağıdakilerden geçmişi olan var mı?',
        hint: 'Birinci derece akrabalar (anne/baba/kardeş). Yoksa boş bırakın.',
        options: [
          { value: 'heart', label: 'Kalp Hastalığı' },
          { value: 'diabetes', label: 'Diyabet' },
          { value: 'obesity', label: 'Obezite' },
          { value: 'hypertension', label: 'Tansiyon' },
          { value: 'cancer', label: 'Kanser' },
        ],
      },
    ],
  },
  {
    id: 'physical',
    title: 'Fiziksel Durum',
    subtitle: 'Sakatlık, ameliyat ve ağrı geçmişi',
    icon: 'Bone',
    questions: [
      {
        key: 'injuries', type: 'single', required: true,
        label: 'Egzersizi kısıtlayan bir sakatlığınız var mı?',
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'yes', label: 'Evet' },
        ],
        detail: { key: 'injuryDetail', when: 'yes', placeholder: 'Kısaca açıklayın (ör. diz menisküs, bel fıtığı)' },
      },
      {
        key: 'surgeries', type: 'single', required: true,
        label: 'Son 2 yılda geçirdiğiniz bir ameliyat oldu mu?',
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'yes', label: 'Evet' },
        ],
        detail: { key: 'surgeryDetail', when: 'yes', placeholder: 'Hangi ameliyat ve ne zaman?' },
      },
      {
        key: 'painAreas', type: 'multi', required: false,
        label: 'Düzenli ağrı yaşadığınız bölge var mı?',
        hint: 'Yoksa boş bırakın.',
        options: [
          { value: 'lowback', label: 'Bel' },
          { value: 'neck', label: 'Boyun' },
          { value: 'knee', label: 'Diz' },
          { value: 'shoulder', label: 'Omuz' },
          { value: 'hip', label: 'Kalça' },
          { value: 'ankle', label: 'Ayak Bileği' },
          { value: 'wrist', label: 'El Bileği' },
        ],
      },
    ],
  },
  {
    id: 'lifestyle',
    title: 'Yaşam Tarzı',
    subtitle: 'Günlük aktivite ve alışkanlıklar',
    icon: 'Activity',
    questions: [
      {
        key: 'activityFrequency', type: 'single', required: true,
        label: 'Haftalık fiziksel aktivite sıklığınız nedir?',
        options: [
          { value: 'sedentary', label: 'Hareketsiz', desc: 'Neredeyse hiç' },
          { value: 'light', label: 'Hafif', desc: 'Haftada 1–2 gün' },
          { value: 'moderate', label: 'Orta', desc: 'Haftada 3–4 gün' },
          { value: 'active', label: 'Aktif', desc: 'Haftada 5+ gün' },
        ],
      },
      {
        key: 'sittingHours', type: 'single', required: true,
        label: 'Günde ortalama kaç saat oturarak geçiriyorsunuz?',
        options: [
          { value: '<4', label: '4 saatten az' },
          { value: '4-8', label: '4–8 saat' },
          { value: '8+', label: '8 saatten fazla' },
        ],
      },
      {
        key: 'smoking', type: 'single', required: true,
        label: 'Sigara kullanıyor musunuz?',
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'yes', label: 'Evet' },
          { value: 'quit', label: 'Bıraktım' },
        ],
      },
      {
        key: 'alcohol', type: 'single', required: true,
        label: 'Alkol tüketiminiz ne sıklıkta?',
        options: [
          { value: 'never', label: 'Hiç' },
          { value: 'rarely', label: 'Nadiren' },
          { value: 'regularly', label: 'Düzenli' },
        ],
      },
    ],
  },
  {
    id: 'recovery',
    title: 'Uyku & Stres',
    subtitle: 'Dinlenme ve ruhsal denge',
    icon: 'Moon',
    questions: [
      {
        key: 'sleepHours', type: 'single', required: true,
        label: 'Ortalama günlük uyku süreniz?',
        options: [
          { value: '<4', label: '4 saatten az' },
          { value: '4-6', label: '4–6 saat' },
          { value: '7-8', label: '7–8 saat' },
          { value: '8+', label: '8+ saat' },
        ],
      },
      {
        key: 'sleepQuality', type: 'single', required: true,
        label: 'Uyku kaliteniz nasıl?',
        options: [
          { value: 'poor', label: 'Kötü', desc: 'Sık uyanırım' },
          { value: 'fair', label: 'Orta' },
          { value: 'good', label: 'İyi', desc: 'Dinlenmiş uyanırım' },
        ],
      },
      {
        key: 'stressLevel', type: 'single', required: true,
        label: 'Genel stres seviyeniz?',
        options: [
          { value: 'low', label: 'Düşük' },
          { value: 'medium', label: 'Orta' },
          { value: 'high', label: 'Yüksek' },
        ],
      },
      {
        key: 'mood', type: 'emoji', required: true,
        label: 'Son 2 haftadaki genel ruh haliniz?',
        options: [
          { value: 'down', emoji: '😔', label: 'Düşük' },
          { value: 'neutral', emoji: '😐', label: 'Nötr' },
          { value: 'good', emoji: '🙂', label: 'İyi' },
          { value: 'great', emoji: '😄', label: 'Çok İyi' },
        ],
      },
    ],
  },
  {
    id: 'nutrition',
    title: 'Beslenme',
    subtitle: 'Yeme alışkanlıkları ve hedef ilişkisi',
    icon: 'Apple',
    questions: [
      {
        key: 'mealsPerDay', type: 'single', required: true,
        label: 'Günde kaç öğün yersiniz?',
        options: [
          { value: '1-2', label: '1–2 öğün' },
          { value: '3', label: '3 öğün' },
          { value: '4-5', label: '4–5 öğün' },
        ],
      },
      {
        key: 'eatingHabits', type: 'multi', required: false,
        label: 'Sizin için geçerli olanları işaretleyin',
        hint: 'Birden fazla seçebilirsiniz.',
        options: [
          { value: 'skip_meals', label: 'Öğün atlarım' },
          { value: 'night_snack', label: 'Gece atıştırırım' },
          { value: 'fast_food', label: 'Sık fast food' },
          { value: 'sugary_drinks', label: 'Şekerli içecek' },
          { value: 'emotional', label: 'Duygusal yeme' },
          { value: 'regular', label: 'Düzenli beslenirim' },
        ],
      },
      {
        key: 'waterIntake', type: 'single', required: true,
        label: 'Günlük su tüketiminiz?',
        options: [
          { value: 'low', label: '1 L altı' },
          { value: 'medium', label: '1–2 L' },
          { value: 'high', label: '2 L üzeri' },
        ],
      },
      {
        key: 'foodAllergies', type: 'text', required: false,
        label: 'Besin alerjiniz veya intoleransınız var mı?',
        placeholder: 'Ör. laktoz, gluten, fıstık — yoksa boş bırakın',
      },
    ],
  },
  {
    id: 'women',
    title: 'Kadın Sağlığı',
    subtitle: 'Programınızın güvenli planlanması için',
    icon: 'Flower2',
    genderOnly: 'female',
    questions: [
      {
        key: 'pregnancy', type: 'single', required: true,
        label: 'Şu anki durumunuz?',
        options: [
          { value: 'none', label: 'İlgili değil' },
          { value: 'pregnant', label: 'Hamileyim' },
          { value: 'postpartum', label: 'Yeni doğum yaptım' },
          { value: 'breastfeeding', label: 'Emziriyorum' },
        ],
      },
      {
        key: 'menstrualRegular', type: 'single', required: false,
        label: 'Adet döngünüz düzenli mi?',
        options: [
          { value: 'regular', label: 'Düzenli' },
          { value: 'irregular', label: 'Düzensiz' },
          { value: 'na', label: 'Belirtmek istemiyorum' },
        ],
      },
    ],
  },
]

// Boş test nesnesi (tüm anahtarlar tanımlı olsun ki kontrollü inputlar uyarı vermesin).
export const EMPTY_HEALTH_TEST = (() => {
  const obj = {}
  HEALTH_SECTIONS.forEach((s) => {
    s.questions.forEach((q) => {
      obj[q.key] = q.type === 'multi' ? [] : ''
      if (q.detail) obj[q.detail.key] = ''
    })
  })
  return obj
})()

// Cinsiyete göre uygulanabilir bölümler.
export function getApplicableSections(gender) {
  return HEALTH_SECTIONS.filter((s) => !s.genderOnly || s.genderOnly === gender)
}

// Tüm soruları düz liste olarak döndürür (kayıt akışında soru-soru gösterim için).
export function getApplicableQuestions(gender) {
  return getApplicableSections(gender).flatMap((section) =>
    section.questions.map((q) => ({
      ...q,
      sectionId: section.id,
      sectionTitle: section.title,
      sectionIcon: section.icon,
    })),
  )
}

export function isQuestionAnswered(q, healthTest) {
  if (!q) return false
  const val = healthTest?.[q.key]
  if (q.type === 'multi') {
    if (!q.required) return true
    return Array.isArray(val) && val.length > 0
  }
  if (q.type === 'text') {
    if (!q.required) return true
    return typeof val === 'string' && val.trim().length > 0
  }
  if (!q.required) return true
  return val !== '' && val != null
}

// Bir bölümün zorunlu soruları cevaplanmış mı?
export function isSectionComplete(section, healthTest) {
  return section.questions.every((q) => {
    if (!q.required) return true
    const val = healthTest?.[q.key]
    if (q.type === 'multi') return Array.isArray(val) && val.length > 0
    return val !== '' && val != null
  })
}

// Tüm zorunlu sorular cevaplanmış mı? (gender'a göre)
export function isHealthTestComplete(healthTest, gender) {
  return getApplicableSections(gender).every((s) => isSectionComplete(s, healthTest))
}

// Admin/panel görünümü için: cevaplanmış soruları okunabilir etiket/değer çiftlerine çevirir.
export function describeHealthTest(healthTest, gender) {
  if (!healthTest) return []
  return getApplicableSections(gender)
    .map((section) => {
      const items = []
      section.questions.forEach((q) => {
        const v = healthTest[q.key]
        let display
        if (q.type === 'multi') {
          if (!Array.isArray(v) || v.length === 0) return
          display = v.map((val) => q.options.find((o) => o.value === val)?.label || val).join(', ')
        } else if (q.type === 'text') {
          if (!v) return
          display = v
        } else {
          if (v === '' || v == null) return
          display = q.options?.find((o) => o.value === v)?.label || v
        }
        items.push({ label: q.label, value: display })
        if (q.detail && v === q.detail.when && healthTest[q.detail.key]) {
          items.push({ label: 'Açıklama', value: healthTest[q.detail.key] })
        }
      })
      return { id: section.id, title: section.title, items }
    })
    .filter((s) => s.items.length > 0)
}
