import { DIETITIAN_HEALTH_SECTIONS } from './healthTestDietitianSections'

export const HEALTH_SECTIONS = [
  {
    id: 'general',
    title: 'Genel Değerlendirme',
    subtitle: 'Ruh hali, enerji, motivasyon ve stres yönetimi',
    icon: 'HeartPulse',
    audience: 'shared',
    questions: [
      {
        type: 'emoji',
        key: 'wellbeing',
        label: 'Son 2 hafta içinde kendinizi genel olarak nasıl hissettiniz?',
        required: true,
        options: [
          { value: 'very_low', label: 'Çok kötü', emoji: '😞' },
          { value: 'low', label: 'Kötü', emoji: '🙁' },
          { value: 'medium', label: 'Ne iyi ne kötü', emoji: '😐' },
          { value: 'good', label: 'İyi', emoji: '🙂' },
          { value: 'excellent', label: 'Çok iyi', emoji: '😁' },
        ],
      },
      {
        type: 'emoji',
        key: 'energy',
        label: 'Son 2 hafta içinde gün içindeki enerji seviyenizi nasıl değerlendirirsiniz?',
        required: true,
        options: [
          { value: 'very_low', label: 'Çok düşük', emoji: '🔋' },
          { value: 'low', label: 'Düşük', emoji: '🔋' },
          { value: 'moderate', label: 'Orta', emoji: '🔋' },
          { value: 'high', label: 'Yüksek', emoji: '🔋' },
          { value: 'very_high', label: 'Çok yüksek', emoji: '🔋' },
        ],
      },
      {
        type: 'scale',
        key: 'motivation',
        label: 'Sağlıklı yaşam hedeflerinize ulaşmak için kendinizi ne kadar motive hissediyorsunuz?',
        required: true,
        min: 0,
        max: 10,
        minLabel: '0',
        maxLabel: '10',
      },
      {
        type: 'single',
        key: 'biggestBarrier',
        label: 'Sağlık hedeflerinize ulaşmanızın önündeki en büyük engel nedir?',
        required: true,
        options: [
          { value: 'time', label: 'Zaman bulamıyorum.' },
          { value: 'motivation', label: 'Motivasyonumu koruyamıyorum.' },
          { value: 'how_to_start', label: 'Nasıl başlayacağımı bilmiyorum.' },
          { value: 'nutrition', label: 'Düzenli beslenemiyorum.' },
          { value: 'exercise', label: 'Egzersiz yapamıyorum.' },
          { value: 'stress_eating', label: 'Stres veya duygusal yeme yaşıyorum.' },
          { value: 'health_issues', label: 'Sağlık sorunlarım var.' },
          { value: 'other', label: 'Diğer.' },
        ],
        detail: {
          key: 'biggestBarrierDetail',
          when: ['other'],
          placeholder: 'Engelizi kısaca yazınız',
        },
      },
      {
        type: 'single',
        key: 'concentration',
        label: 'Günlük yaşamınızda dikkatinizi toplamakta zorlanıyor musunuz?',
        required: true,
        options: [
          { value: 'never', label: 'Hiç' },
          { value: 'rarely', label: 'Nadiren' },
          { value: 'sometimes', label: 'Bazen' },
          { value: 'often', label: 'Sık' },
          { value: 'always', label: 'Çok sık' },
        ],
      },
      {
        type: 'single',
        key: 'anxiety',
        label: 'Son 2 hafta içinde kendinizi ne kadar endişeli hissettiniz?',
        required: true,
        options: [
          { value: 'never', label: 'Hiç' },
          { value: 'rarely', label: 'Nadiren' },
          { value: 'sometimes', label: 'Bazen' },
          { value: 'often', label: 'Sık' },
          { value: 'always', label: 'Çok sık' },
        ],
      },
      {
        type: 'single',
        key: 'dailyStressImpact',
        label: 'Son 2 hafta içinde stresin günlük yaşamınızı ne kadar etkilediğini düşünüyorsunuz?',
        required: true,
        options: [
          { value: 'none', label: 'Hiç etkilemiyor' },
          { value: 'low', label: 'Az etkiliyor' },
          { value: 'moderate', label: 'Orta düzeyde etkiliyor' },
          { value: 'high', label: 'Oldukça etkiliyor' },
          { value: 'very_high', label: 'Çok fazla etkiliyor' },
        ],
      },
      {
        type: 'single',
        key: 'stressCoping',
        label: 'Stresle başa çıkabildiğinizi düşünüyor musunuz?',
        required: true,
        options: [
          { value: 'always', label: 'Her zaman' },
          { value: 'often', label: 'Çoğu zaman' },
          { value: 'sometimes', label: 'Bazen' },
          { value: 'rarely', label: 'Nadiren' },
          { value: 'never', label: 'Hiç' },
        ],
      },
      {
        type: 'single',
        key: 'socialSupport',
        label: 'Sağlıklı yaşam hedefleriniz konusunda ailenizden veya yakın çevrenizden destek görüyor musunuz?',
        required: true,
        options: [
          { value: 'strong', label: 'Güçlü destek var' },
          { value: 'partial', label: 'Kısmi destek var' },
          { value: 'limited', label: 'Sınırlı destek var' },
          { value: 'none', label: 'Destek yok' },
        ],
      },
      {
        type: 'single',
        key: 'readinessToChange',
        label: 'Yaşam tarzı değişikliklerine ne kadar hazırsınız?',
        required: true,
        hint: 'Size en uygun destek planını oluşturabilmemiz için, kendinizi en iyi ifade eden seçeneği işaretleyin.',
        options: [
          { value: 'not_ready', label: 'Henüz değişime hazır değilim.' },
          { value: 'thinking', label: 'Değişmeyi düşünüyorum.' },
          { value: 'ready', label: 'Hazırım, yakında başlayacağım.' },
          { value: 'started', label: 'Değişime başladım.' },
          { value: 'maintaining', label: 'Değişiklikleri düzenli olarak sürdürüyorum.' },
        ],
      },
      {
        type: 'scale',
        key: 'painScale',
        label: 'Son bir hafta içindeki genel ağrı seviyenizi nasıl değerlendirirsiniz?',
        required: true,
        min: 0,
        max: 10,
        minLabel: '0 — ağrı yok',
        maxLabel: '10 — çok şiddetli',
      },
      {
        type: 'emoji',
        key: 'lifeQuality',
        label: 'Son zamanlarda yaşam kalitenizi nasıl değerlendirirsiniz?',
        required: true,
        options: [
          { value: '1', label: 'Çok düşük', emoji: '★' },
          { value: '2', label: 'Düşük', emoji: '★★' },
          { value: '3', label: 'Orta', emoji: '★★★' },
          { value: '4', label: 'İyi', emoji: '★★★★' },
          { value: '5', label: 'Çok iyi', emoji: '★★★★★' },
        ],
      },
    ],
  },
  {
    id: 'medical',
    title: 'Tıbbi Geçmiş',
    subtitle: 'Hastalıklar, ilaçlar ve tıbbi takip',
    icon: 'Stethoscope',
    audience: 'shared',
    questions: [
      {
        type: 'multi',
        key: 'chronicConditions',
        label: 'Tanı almis kronik rahatsızlıklarınız var mi?',
        required: true,
        options: [
          { value: 'none', label: 'Yok' },
          { value: 'hypertension', label: 'Yüksek tansiyon' },
          { value: 'diabetes', label: 'Diyabet' },
          { value: 'thyroid', label: 'Tiroid hastalığı' },
          { value: 'pcos', label: 'PKOS' },
          { value: 'asthma', label: 'Astım' },
          { value: 'other', label: 'Diğer' },
        ],
        detail: {
          key: 'chronicConditionsDetail',
          when: ['other'],
          placeholder: 'Diğer kronik durumlari yaziniz',
        },
      },
      {
        type: 'single',
        key: 'medications',
        label: 'Düzenli kullandiginiz ilaç var mi?',
        required: true,
        options: [
          { value: 'none', label: 'Hayır' },
          { value: 'regular', label: 'Evet, düzenli' },
          { value: 'occasional', label: 'Ara sira' },
        ],
        detail: {
          key: 'medicationsDetail',
          when: ['regular', 'occasional'],
          placeholder: 'İlaç adini ve kullanim sıkligini yaziniz',
        },
      },
      {
        type: 'multi',
        key: 'familyHistory',
        label: 'Ailenizde aşağıdaki rahatsızlıklardan hangileri var?',
        required: true,
        options: [
          { value: 'none', label: 'Bilinmiyor / Yok' },
          { value: 'diabetes', label: 'Diyabet' },
          { value: 'obesity', label: 'Obezite' },
          { value: 'heartDisease', label: 'Kalp hastalığı' },
          { value: 'stroke', label: 'İnme' },
          { value: 'cancer', label: 'Kanser' },
        ],
      },
      {
        type: 'single',
        key: 'surgeries',
        label: 'Gecirdiginiz ameliyat var mi?',
        required: true,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'yes', label: 'Evet' },
        ],
        detail: {
          key: 'surgeriesDetail',
          when: ['yes'],
          placeholder: 'Ameliyat turu ve yılini yaziniz',
        },
      },
      {
        type: 'single',
        key: 'hospitalVisits',
        label: 'Son 12 ayda hastane aciline basvurdunuz mu?',
        required: false,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'once', label: '1 kez' },
          { value: 'multiple', label: 'Birden fazla' },
        ],
      },
      {
        type: 'single',
        key: 'lastBloodWork',
        label: 'Son kapsamli kan tahlilinizi ne zaman yaptırdınız?',
        required: true,
        options: [
          { value: 'last_3_months', label: 'Son 3 ay içinde' },
          { value: '3_12_months', label: '3-12 ay once' },
          { value: 'over_year', label: '1 yıldan uzun' },
          { value: 'never', label: 'Hiç yaptirmadim' },
        ],
      },
      {
        type: 'multi',
        key: 'supplements',
        label: 'Düzenli kullandiginiz takviyeler hangileri?',
        required: false,
        options: [
          { value: 'none', label: 'Kullanmiyorum' },
          { value: 'vitaminD', label: 'D vitamini' },
          { value: 'omega3', label: 'Omega-3' },
          { value: 'magnesium', label: 'Magnezyum' },
          { value: 'proteinPowder', label: 'Protein tozu' },
          { value: 'probiotic', label: 'Probiyotik' },
          { value: 'other', label: 'Diğer' },
        ],
        detail: {
          key: 'supplementsDetail',
          when: ['other'],
          placeholder: 'Diğer takviyeleri yaziniz',
        },
      },
      {
        type: 'single',
        key: 'mentalHealthDiagnosis',
        label: 'Bir ruh sagligi tanı veya tedavi geçmişiniz var mi?',
        required: false,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'past', label: 'Geçmişte vardi' },
          { value: 'ongoing', label: 'Şu anda devam ediyor' },
        ],
      },
      {
        type: 'single',
        key: 'doctorClearance',
        label: 'Egzersiz veya kilo yonetimi programi icin doktor onayi aldiniz mi?',
        required: true,
        options: [
          { value: 'yes', label: 'Evet' },
          { value: 'no_need', label: 'Gerek gormedim' },
          { value: 'not_yet', label: 'Henüz almadim' },
        ],
      },
      {
        type: 'single',
        key: 'bloodPressureIssues',
        label: 'Tansiyon dalgalanmasi sorunu yasiyor musunuz?',
        required: false,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'sometimes', label: 'Ara sira' },
          { value: 'yes', label: 'Evet, sık' },
        ],
      },
      {
        type: 'single',
        key: 'digestiveDisorders',
        label: 'Tanı almis sindirim sistemi rahatsizliginiz var mi?',
        required: false,
        options: [
          { value: 'no', label: 'Yok' },
          { value: 'ibs', label: 'IBS' },
          { value: 'reflux', label: 'Reflu' },
          { value: 'gastritis', label: 'Gastrit' },
          { value: 'other', label: 'Diğer' },
        ],
      },
      {
        type: 'single',
        key: 'thyroidStatus',
        label: 'Tiroid degerlerinizle ilgili bilinen bir durum var mi?',
        required: false,
        options: [
          { value: 'normal', label: 'Bilinen sorun yok' },
          { value: 'hypo', label: 'Hipotiroidi' },
          { value: 'hyper', label: 'Hipertiroidi' },
          { value: 'unknown', label: 'Bilmiyorum' },
        ],
      },
      {
        type: 'text',
        key: 'currentComplaints',
        label: 'Şu an sizi en çok zorlayan sağlık sıkayetini kisaça yaziniz',
        required: false,
        hint: 'Örnek: bel ağrısi, nefes darligi, surekli yorgünluk',
      },
    ],
  },
  {
    id: 'physical',
    title: 'Fiziksel Kapasite',
    subtitle: 'Hareket geçmişi ve antrenman hazırlığı',
    icon: 'Dumbbell',
    audience: 'coach',
    questions: [
      {
        type: 'single',
        key: 'injuries',
        label: 'Son 2 yıl içinde hareket etmenizi kısıtlayan bir sakatlık veya ortopedik sorun yaşadınız mı?',
        required: true,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'yes_recovered', label: 'Evet, tamamen iyileşti.' },
          { value: 'yes_partial', label: 'Evet, kısmen devam ediyor.' },
          { value: 'yes_ongoing', label: 'Evet, hâlâ devam ediyor.' },
        ],
        followUps: [
          {
            type: 'multi',
            key: 'injuryRegions',
            label: 'Sakatlık hangi bölgedeydi?',
            when: ['yes_recovered', 'yes_partial', 'yes_ongoing'],
            required: true,
            options: [
              { value: 'neck', label: 'Boyun' },
              { value: 'shoulder', label: 'Omuz' },
              { value: 'elbow', label: 'Dirsek' },
              { value: 'hand_wrist', label: 'El / Bilek' },
              { value: 'upper_back', label: 'Sırt' },
              { value: 'low_back', label: 'Bel' },
              { value: 'hip', label: 'Kalça' },
              { value: 'knee', label: 'Diz' },
              { value: 'ankle', label: 'Ayak bileği' },
              { value: 'foot', label: 'Ayak' },
              { value: 'other', label: 'Diğer' },
            ],
            detail: {
              key: 'injuryRegionsDetail',
              when: ['other'],
              placeholder: 'Diğer bölgeyi yazınız',
            },
          },
          {
            type: 'single',
            key: 'injuryCause',
            label: 'Sakatlığın nedeni neydi?',
            when: ['yes_recovered', 'yes_partial', 'yes_ongoing'],
            required: true,
            options: [
              { value: 'sport', label: 'Spor' },
              { value: 'fall', label: 'Düşme' },
              { value: 'traffic', label: 'Trafik kazası' },
              { value: 'work', label: 'İş kazası' },
              { value: 'post_surgery', label: 'Ameliyat sonrası' },
              { value: 'unknown', label: 'Bilinmiyor' },
              { value: 'other', label: 'Diğer' },
            ],
            detail: {
              key: 'injuryCauseDetail',
              when: ['other'],
              placeholder: 'Nedeni yazınız',
            },
          },
          {
            type: 'single',
            key: 'injuryLimitation',
            label: 'Şu anda hareketlerinizi kısıtlıyor mu?',
            when: ['yes_recovered', 'yes_partial', 'yes_ongoing'],
            required: true,
            options: [
              { value: 'no', label: 'Hayır' },
              { value: 'mild', label: 'Biraz' },
              { value: 'moderate', label: 'Orta düzeyde' },
              { value: 'severe', label: 'Çok' },
            ],
          },
          {
            type: 'single',
            key: 'injuryDoctorRestriction',
            label: 'Doktor tarafından egzersiz kısıtlamanız var mı?',
            when: ['yes_recovered', 'yes_partial', 'yes_ongoing'],
            required: true,
            options: [
              { value: 'no', label: 'Hayır' },
              { value: 'yes', label: 'Evet' },
            ],
          },
        ],
      },
      {
        type: 'single',
        key: 'activityFrequency',
        label: 'Haftada kaç gün düzenli fiziksel aktivite yapiyorsunuz?',
        required: true,
        options: [
          { value: '0', label: '0 gün' },
          { value: '1_2', label: '1-2 gün' },
          { value: '3_4', label: '3-4 gün' },
          { value: '5_plus', label: '5+ gün' }
        ]
      },
      {
        type: 'single',
        key: 'trainingHistoryYears',
        label: 'Toplam düzenli antrenman geçmişiniz ne kadar?',
        required: true,
        options: [
          { value: 'none', label: 'Yok' },
          { value: 'under_6m', label: '6 aydan az' },
          { value: '6m_2y', label: '6 ay - 2 yıl' },
          { value: '2y_plus', label: '2 yıl+' }
        ]
      },
      {
        type: 'multi',
        key: 'currentActivityTypes',
        label: 'Şu anda yaptiginiz aktiviteler hangileri?',
        required: true,
        options: [
          { value: 'walking', label: 'Yürüyüş' },
          { value: 'running', label: 'Koşu' },
          { value: 'strength', label: 'Kuvvet antrenmani' },
          { value: 'pilates', label: 'Pilates/Yoga' },
          { value: 'cycling', label: 'Bisıklet' },
          { value: 'none', label: 'Düzenli aktivitem yok' }
        ]
      },
      {
        type: 'single',
        key: 'movementQuality',
        label: 'Temel hareketlerde koordinasyonunuzu nasıl değerlendirirsiniz?',
        required: false,
        options: [
          { value: 'weak', label: 'Zayif' },
          { value: 'fair', label: 'Gelişmeye açık' },
          { value: 'good', label: 'İyi' },
          { value: 'very_good', label: 'Çok iyi' }
        ]
      },
      {
        type: 'single',
        key: 'flexibilityLevel',
        label: 'Esneklik seviyeniz nasıl?',
        required: true,
        options: [
          { value: 'very_low', label: 'Çok düşük' },
          { value: 'low', label: 'Düşük' },
          { value: 'medium', label: 'Orta' },
          { value: 'high', label: 'Yüksek' }
        ]
      },
      {
        type: 'single',
        key: 'cardioCapacity',
        label: '10-15 dk tempolu yürüyüşte nefes durumunuz nasıl?',
        required: true,
        options: [
          { value: 'very_hard', label: 'Çok zorlaniyorum' },
          { value: 'hard', label: 'Zorlaniyorum' },
          { value: 'manageable', label: 'İdare ediyorum' },
          { value: 'easy', label: 'Rahatim' }
        ]
      },
      {
        type: 'multi',
        key: 'sportsHistory',
        label: 'Geçmişte düzenli yaptiginiz sporlar hangileri?',
        required: false,
        options: [
          { value: 'football', label: 'Futbol' },
          { value: 'basketball', label: 'Basketbol' },
          { value: 'swimming', label: 'Yüzme' },
          { value: 'martialArts', label: 'Dövüş sporlari' },
          { value: 'athletics', label: 'Atletizm' },
          { value: 'none', label: 'Yok' }
        ]
      },
      {
        type: 'multi',
        key: 'equipmentAccess',
        label: 'Antrenman icin hangi ekipmanlara erisiminiz var?',
        required: true,
        options: [
          { value: 'bodyweight', label: 'Sadece vücut agirligi' },
          { value: 'dumbbells', label: 'Dambil' },
          { value: 'bands', label: 'Direnc bandi' },
          { value: 'cardioMachine', label: 'Kondisyon cihazi' },
          { value: 'gym', label: 'Tam donanimli spor salonu' }
        ]
      },
      {
        type: 'multi',
        key: 'preferredTrainingDays',
        label: 'Antrenman icin uygün günleriniz hangileri?',
        required: true,
        options: [
          { value: 'monday', label: 'Pazartesi' },
          { value: 'tuesday', label: 'Salı' },
          { value: 'wednesday', label: 'Çarşamba' },
          { value: 'thursday', label: 'Perşembe' },
          { value: 'friday', label: 'Cuma' },
          { value: 'saturday', label: 'Cumartesi' },
          { value: 'sunday', label: 'Pazar' }
        ]
      },
      {
        type: 'single',
        key: 'sessionDurationGoal',
        label: 'Tek bir antrenmana ayirabileceginiz sure ne kadar?',
        required: true,
        options: [
          { value: '15_25', label: '15-25 dk' },
          { value: '30_40', label: '30-40 dk' },
          { value: '45_60', label: '45-60 dk' },
          { value: '60_plus', label: '60+ dk' }
        ]
      },
      {
        type: 'single',
        key: 'trainingLocation',
        label: 'Nerede antrenman yapmayi tercih edersiniz?',
        required: true,
        options: [
          { value: 'home', label: 'Evde' },
          { value: 'gym', label: 'Spor salonunda' },
          { value: 'outdoor', label: 'Açık alanda' },
          { value: 'mixed', label: 'Karışık' }
        ]
      },
      {
        type: 'single',
        key: 'previousCoachExperience',
        label: 'Daha once bir antrenörle calistiniz mi?',
        required: false,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'online', label: 'Evet, online' },
          { value: 'face_to_face', label: 'Evet, yüz yüze' }
        ]
      },
      {
        type: 'single',
        key: 'exerciseContraindications',
        label: 'Yapmanız önerilen hareket/egzersiz var mi?',
        required: true,
        options: [
          { value: 'no', label: 'Yok' },
          { value: 'yes', label: 'Var' }
        ],
        detail: {
          key: 'exerciseContraindicationsDetail',
          when: ['yes'],
          placeholder: 'Kaçinmaniz gereken hareketleri yaziniz'
        }
      },
      {
        type: 'multi',
        key: 'painAreas',
        label: 'Düzenli ağrı yaşadığınız bölgeler hangileri?',
        required: false,
        hint: 'Yoksa boş bırakın.',
        options: [
          { value: 'lowback', label: 'Bel' },
          { value: 'neck', label: 'Boyun' },
          { value: 'knee', label: 'Diz' },
          { value: 'shoulder', label: 'Omuz' },
          { value: 'hip', label: 'Kalça' },
          { value: 'ankle', label: 'Ayak bileği' },
          { value: 'wrist', label: 'El bileği' }
        ]
      },
      {
        type: 'text',
        key: 'performanceGoal',
        label: 'Önümüzdeki 3 ay icin en öncelikli fiziksel hedefiniz nedir?',
        required: true,
        hint: 'Örnek: 5 km kosabilmek, duzgün squat ogrenmek, 6 kg vermek'
      }
    ]
  },
  {
    id: 'lifestyle',
    title: 'Yaşam Tarzi',
    subtitle: 'Günluk alışkanlıklar ve davranislar',
    icon: 'Activity',
    audience: 'coach',
    questions: [
      {
        type: 'single',
        key: 'sittingHours',
        label: 'Günluk ortalama kaç saat oturuyorsunuz?',
        required: true,
        options: [
          { value: 'under_4', label: '4 saatten az' },
          { value: '4_6', label: '4-6 saat' },
          { value: '7_9', label: '7-9 saat' },
          { value: '10_plus', label: '10 saat+' }
        ]
      },
      {
        type: 'single',
        key: 'smoking',
        label: 'Sigara kullanıyor musunuz?',
        required: true,
        options: [
          { value: 'never', label: 'Hiç kullanmadim' },
          { value: 'former', label: 'Biraktim' },
          { value: 'occasional', label: 'Ara sira' },
          { value: 'daily', label: 'Her gün' }
        ]
      },
      {
        type: 'single',
        key: 'alcohol',
        label: 'Alkol tüketim sıkliginiz nasıl?',
        required: true,
        options: [
          { value: 'none', label: 'Hiç' },
          { value: 'monthly', label: 'Ayda 1-2 kez' },
          { value: 'weekly', label: 'Haftada 1-2 kez' },
          { value: 'frequent', label: 'Haftada 3+ kez' }
        ]
      },
      {
        type: 'single',
        key: 'teaCoffee',
        label: 'Günluk cay/kahve tüketiminiz ne kadar?',
        required: true,
        options: [
          { value: '0_1', label: '0-1 fincan' },
          { value: '2_3', label: '2-3 fincan' },
          { value: '4_5', label: '4-5 fincan' },
          { value: '6_plus', label: '6+ fincan' }
        ]
      },
      {
        type: 'single',
        key: 'travelFrequency',
        label: 'Is veya ozel nedenlerle şehir dışı seyahat sıkliginiz?',
        required: false,
        options: [
          { value: 'rare', label: 'Çok nadir' },
          { value: 'monthly', label: 'Ayda 1 civari' },
          { value: 'biweekly', label: 'Ayda 2-3' },
          { value: 'weekly', label: 'Haftalik' }
        ]
      },
      {
        type: 'single',
        key: 'substanceUse',
        label: 'Sigara dışında madde kullaniminiz var mi?',
        required: true,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'past', label: 'Geçmişte vardi' },
          { value: 'yes', label: 'Evet' }
        ]
      },
      {
        type: 'single',
        key: 'shiftWork',
        label: 'Vardiyali veya duzensiz saatlerde calisiyor musunuz?',
        required: true,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'sometimes', label: 'Dönemsel' },
          { value: 'yes', label: 'Evet, düzenli' }
        ]
      },
      {
        type: 'single',
        key: 'dailySteps',
        label: 'Günluk ortalama adim sayiniz nedir?',
        required: false,
        options: [
          { value: 'under_3000', label: '3000 altı' },
          { value: '3000_6000', label: '3000-6000' },
          { value: '6000_9000', label: '6000-9000' },
          { value: '9000_plus', label: '9000+' }
        ]
      },
      {
        type: 'single',
        key: 'screenTime',
        label: 'Günluk ekran başında geçirdiğiniz toplam sure ne kadar?',
        required: false,
        options: [
          { value: 'under_3', label: '3 saatten az' },
          { value: '3_5', label: '3-5 saat' },
          { value: '6_8', label: '6-8 saat' },
          { value: '9_plus', label: '9 saat+' }
        ]
      },
      {
        type: 'multi',
        key: 'exercisePreferences',
        label: 'Hangi egzersiz turleri size daha keyifli geliyor?',
        required: true,
        options: [
          { value: 'walking', label: 'Yürüyüş' },
          { value: 'strength', label: 'Kuvvet' },
          { value: 'group', label: 'Grup dersleri' },
          { value: 'mindBody', label: 'Yoga/Pilates' },
          { value: 'shortHome', label: 'Kisa ev antrenmani' }
        ]
      },
      {
        type: 'multi',
        key: 'exerciseBarriers',
        label: 'Düzenli egzersiz yapmanizi en çok zorlayan etkenler neler?',
        required: true,
        options: [
          { value: 'time', label: 'Zaman yetersizligi' },
          { value: 'motivation', label: 'Motivasyon düşüklugu' },
          { value: 'pain', label: 'Ağrı/sakatlık korkusu' },
          { value: 'knowledge', label: 'Nasıl yapacagimi bilmiyorum' },
          { value: 'environment', label: 'Uygün ortam yok' }
        ]
      },
      {
        type: 'single',
        key: 'commuteType',
        label: 'Günluk ulaşım sekli en çok hangisi?',
        required: false,
        options: [
          { value: 'car', label: 'Araç' },
          { value: 'public', label: 'Toplu taşıma' },
          { value: 'walk', label: 'Yürüyerek' },
          { value: 'mixed', label: 'Karışık' }
        ]
      }
    ]
  },
  ...DIETITIAN_HEALTH_SECTIONS,
  {
    id: 'women',
    title: 'Kadin Sagligi',
    subtitle: 'Hormonel dongu ve kadin sagligi ozel sorulari',
    icon: 'Venus',
    audience: 'shared',
    genderOnly: 'female',
    questions: [
      {
        type: 'single',
        key: 'pregnancy',
        label: 'Şu an hamilelik durumu var mi?',
        required: true,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'yes', label: 'Evet' },
          { value: 'planning', label: 'Planliyorum' }
        ]
      },
      {
        type: 'single',
        key: 'menstrualRegular',
        label: 'Adet dongünuz genellikle düzenli mi?',
        required: true,
        options: [
          { value: 'regular', label: 'Düzenli' },
          { value: 'irregular', label: 'Duzensiz' },
          { value: 'absent', label: 'Uzun suredir olmuyor' }
        ]
      },
      {
        type: 'multi',
        key: 'pmsSymptoms',
        label: 'Adet oncesi donemde hangi belirtileri sık yasiyorsunuz?',
        required: false,
        options: [
          { value: 'none', label: 'Belirgin yok' },
          { value: 'bloating', label: 'Sislik' },
          { value: 'cravings', label: 'Yeme ataklari' },
          { value: 'mood_swings', label: 'Ruh hali değişimi' },
          { value: 'fatigue', label: 'Yorgünluk' },
          { value: 'headache', label: 'Bas ağrısi' }
        ]
      },
      {
        type: 'single',
        key: 'contraceptionMethod',
        label: 'Dogum kontrol yontemi kullanıyor musunuz?',
        required: false,
        options: [
          { value: 'none', label: 'Kullanmiyorum' },
          { value: 'barrier', label: 'Bariyer yontemleri' },
          { value: 'hormonal', label: 'Hormonal yontem' },
          { value: 'iud', label: 'Spiral (Ria)' },
          { value: 'other', label: 'Diğer' }
        ]
      },
      {
        type: 'single',
        key: 'menopauseStatus',
        label: 'Menopoz durumunuz nedir?',
        required: false,
        options: [
          { value: 'not_applicable', label: 'Uygün degil' },
          { value: 'premenopause', label: 'Premenopoz' },
          { value: 'perimenopause', label: 'Perimenopoz' },
          { value: 'postmenopause', label: 'Postmenopoz' }
        ]
      },
      {
        type: 'single',
        key: 'ironDeficiencyHistory',
        label: 'Demir eksıkligi veya anemi geçmişiniz var mi?',
        required: false,
        options: [
          { value: 'no', label: 'Yok' },
          { value: 'past', label: 'Geçmişte vardi' },
          { value: 'ongoing', label: 'Şu an devam ediyor' }
        ]
      },
      {
        type: 'single',
        key: 'cyclePain',
        label: 'Adet doneminde ağrılariniz ne düzeyde olur?',
        required: false,
        options: [
          { value: 'none', label: 'Yok' },
          { value: 'mild', label: 'Hafif' },
          { value: 'moderate', label: 'Orta' },
          { value: 'severe', label: 'Siddetli' }
        ]
      },
      {
        type: 'single',
        key: 'fertilityPlan',
        label: 'Önümüzdeki 12 ay içinde gebelik plani var mi?',
        required: false,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'maybe', label: 'Belki' },
          { value: 'yes', label: 'Evet' }
        ]
      }
    ]
  },
  {
    id: 'men',
    title: 'Erkek Sagligi',
    subtitle: 'Erkek sagligina ozel tarama ve belirtiler',
    icon: 'Mars',
    audience: 'shared',
    genderOnly: 'male',
    questions: [
      {
        type: 'single',
        key: 'prostateSymptoms',
        label: 'İdrar yapma duzeniyle ilgili prostat kaynakli sıkayetiniz var mi?',
        required: true,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'mild', label: 'Hafif' },
          { value: 'moderate', label: 'Orta' },
          { value: 'severe', label: 'Belirgin' }
        ]
      },
      {
        type: 'single',
        key: 'testosteroneConcerns',
        label: 'Düşük testosteronla iliskili belirtiler yasiyor musunuz?',
        required: true,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'suspect', label: 'Şüpheleniyorum' },
          { value: 'diagnosed', label: 'Tanı aldim' }
        ]
      },
      {
        type: 'single',
        key: 'maleScreening',
        label: 'Son erkek sagligi kontrolunuzu ne zaman yaptırdınız?',
        required: true,
        options: [
          { value: 'last_year', label: 'Son 1 yıl içinde' },
          { value: '1_3_years', label: '1-3 yıl once' },
          { value: 'over_3_years', label: '3 yıldan uzun' },
          { value: 'never', label: 'Hiç' }
        ]
      },
      {
        type: 'single',
        key: 'erectionQuality',
        label: 'Cinsel fonksiyonla ilgili zorlanma yasiyor musunuz?',
        required: true,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'sometimes', label: 'Ara sira' },
          { value: 'often', label: 'Sık' }
        ]
      },
      {
        type: 'single',
        key: 'waistCircumferenceRisk',
        label: 'Bel cevresi olcumu konusunda risk oldugünu dusunuyor musunuz?',
        required: true,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'not_sure', label: 'Emin değilim' },
          { value: 'yes', label: 'Evet' }
        ]
      },
      {
        type: 'single',
        key: 'snoring',
        label: 'Yüksek sesle horlama veya uykuda nefes durması şüpheleri var mi?',
        required: true,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'occasionally', label: 'Ara sira' },
          { value: 'frequent', label: 'Sık' }
        ]
      },
      {
        type: 'single',
        key: 'hairLossConcerns',
        label: 'Saç dökülmesi ile ilgili belirgin bir kaygınız var mi?',
        required: false,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'mild', label: 'Hafif' },
          { value: 'high', label: 'Belirgin' }
        ]
      },
      {
        type: 'single',
        key: 'maleFertilityPlan',
        label: 'Önümüzdeki 12 ay içinde cocuk sahibi olma planiniz var mi?',
        required: false,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'maybe', label: 'Belki' },
          { value: 'yes', label: 'Evet' }
        ]
      }
    ]
  }
];
