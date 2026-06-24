// Kural Tabanlı Analiz Servisi — Kişiselleştirilmiş sağlık analizi
// Basic paket üyelerine kayıt sonrası otomatik olarak uygulanır.

export function generateHealthAnalysis(profile, exercises = []) {
  const bmi = calculateBmi(profile.weight, profile.height)
  const bmiCategory = getBmiCategory(bmi)
  const goalCategories = mapGoalsToCategories(profile.goals || [])
  const coachRecommendations = generateCoachList(profile, exercises, goalCategories)
  const dietitianRecommendations = generateDietitianPlan(profile)

  return {
    generatedAt: new Date().toISOString().split('T')[0],
    bmi: bmi ? Math.round(bmi * 10) / 10 : null,
    bmiCategory,
    idealWeightRange: getIdealWeightRange(profile.height, profile.gender),
    dailyCalories: estimateDailyCalories(profile),
    coachRecommendations,
    dietitianRecommendations,
    fitnessScore: calculateFitnessScore(profile),
    priorityGoal: getPriorityGoal(profile.goals || []),
  }
}

function calculateBmi(weight, height) {
  const w = parseFloat(weight)
  const h = parseFloat(height)
  if (!w || !h || h < 50) return null
  const hm = h / 100
  return w / (hm * hm)
}

function getBmiCategory(bmi) {
  if (!bmi) return null
  if (bmi < 18.5) return { label: 'Zayıf', color: 'blue', advice: 'Kilo almanız ve kas geliştirmeniz önerilir.' }
  if (bmi < 25) return { label: 'Normal', color: 'green', advice: 'Sağlıklı kilonuzu koruyun.' }
  if (bmi < 30) return { label: 'Fazla Kilolu', color: 'amber', advice: 'Düzenli egzersiz ve dengeli beslenme önerilir.' }
  return { label: 'Obez', color: 'red', advice: 'Sağlık uzmanı desteğiyle kilo yönetimi önerilir.' }
}

function getIdealWeightRange(height, gender) {
  const h = parseFloat(height)
  if (!h) return null
  const base = gender === 'male' ? h - 100 : h - 105
  return { min: Math.round(base * 0.9), max: Math.round(base * 1.1) }
}

// Harris-Benedict formülü
function estimateDailyCalories(profile) {
  const w = parseFloat(profile.weight)
  const h = parseFloat(profile.height)
  const a = parseFloat(profile.age)
  if (!w || !h || !a) return null

  let bmr
  if (profile.gender === 'male') {
    bmr = 88.362 + (13.397 * w) + (4.799 * h) - (5.677 * a)
  } else {
    bmr = 447.593 + (9.247 * w) + (3.098 * h) - (4.330 * a)
  }

  const activityMultiplier = { beginner: 1.375, intermediate: 1.55, advanced: 1.725 }
  const multiplier = activityMultiplier[profile.fitnessLevel] || 1.375
  const total = Math.round(bmr * multiplier)

  const goals = profile.goals || []
  const weightGoals = ['weight', 'fatburn']
  const muscleGoals = ['muscle', 'tone']

  if (goals.some((g) => weightGoals.includes(g))) {
    return { maintenance: total, recommended: total - 300, goal: 'Kilo verme' }
  }
  if (goals.some((g) => muscleGoals.includes(g))) {
    return { maintenance: total, recommended: total + 200, goal: 'Kas kazanımı' }
  }
  return { maintenance: total, recommended: total, goal: 'Form koruma' }
}

function calculateFitnessScore(profile) {
  let score = 50
  const bmi = calculateBmi(profile.weight, profile.height)
  if (bmi) {
    if (bmi >= 18.5 && bmi < 25) score += 20
    else if (bmi >= 25 && bmi < 30) score += 5
  }
  if (profile.fitnessLevel === 'intermediate') score += 10
  if (profile.fitnessLevel === 'advanced') score += 20
  if ((profile.goals || []).length >= 2) score += 10
  if ((profile.nutritionPrefs || []).length >= 1) score += 10
  return Math.min(100, score)
}

function getPriorityGoal(goals) {
  const priority = ['fatburn', 'muscle', 'weight', 'tone', 'endurance', 'heart', 'habit', 'sleep', 'performance', 'confidence']
  for (const p of priority) {
    if (goals.includes(p)) return p
  }
  return goals[0] || 'habit'
}

// Hedefleri egzersiz kategorileriyle eşleştir
function mapGoalsToCategories(goals) {
  const map = {
    weight:      ['Kardiyo', 'HIIT', 'Yürüyüş', 'Bisiklet'],
    fatburn:     ['HIIT', 'Kardiyo', 'Tabata', 'Circuit Training'],
    muscle:      ['Güç Antrenmanı', 'Vücut Ağırlığı', 'Dambıl', 'Barbell'],
    tone:        ['Pilates', 'Yoga', 'Vücut Ağırlığı', 'Esneklik'],
    endurance:   ['Koşu', 'Kardiyo', 'Bisiklet', 'Yüzme'],
    habit:       ['Genel', 'Esneklik', 'Yoga', 'Meditasyon'],
    sleep:       ['Yoga', 'Nefes Egzersizleri', 'Esneklik', 'Meditasyon'],
    heart:       ['Kardiyo', 'Yürüyüş', 'Koşu', 'Bisiklet'],
    performance: ['HIIT', 'Güç Antrenmanı', 'Fonksiyonel', 'Pliometri'],
    confidence:  ['Yoga', 'Pilates', 'Genel', 'Esneklik'],
  }
  const categories = new Set()
  goals.forEach((g) => (map[g] || ['Genel']).forEach((c) => categories.add(c)))
  return [...categories]
}

// Egzersiz kütüphanesinden hedeflere uygun videolar seç
function generateCoachList(profile, exercises, goalCategories) {
  const filtered = exercises.filter((ex) => {
    if (!ex.category) return true
    return goalCategories.some((cat) => ex.category.toLowerCase().includes(cat.toLowerCase()) || cat.toLowerCase().includes(ex.category.toLowerCase()))
  })

  const sorted = filtered.length > 0 ? filtered : exercises
  const selected = sorted.slice(0, 6)

  const levelTips = {
    beginner:     'Başlangıç seviyeniz için düşük yoğunluklu egzersizlerle başlamanız önerilir.',
    intermediate: 'Orta seviyenize uygun karma antrenmanlar programınıza dahil edildi.',
    advanced:     'İleri seviyenize uygun yüksek yoğunluklu programlar hazırlandı.',
  }

  const goalMessages = {
    weight:    'Kilo yönetimi için kardiyovasküler egzersizler ön plana alındı.',
    fatburn:   'Yağ yakımı için HIIT ve interval antrenmanlar önerildi.',
    muscle:    'Kas gelişimi için güç antrenmanları seçildi.',
    tone:      'Vücut sıkılaştırma için fonksiyonel hareketler eklendi.',
    endurance: 'Dayanıklılık için uzun süreli kardiyo egzersizleri planlandı.',
    habit:     'Düzenli alışkanlık oluşturmak için kolay başlangıç programı hazırlandı.',
    sleep:     'Uyku kalitesi için akşam yoga ve nefes egzersizleri önerildi.',
    heart:     'Kalp sağlığı için düşük-orta yoğunluklu kardiyo seçildi.',
    performance: 'Spor performansı için fonksiyonel güç antrenmanları eklendi.',
    confidence: 'Özgüven için kişisel gelişim odaklı beden farkındalığı programı hazırlandı.',
  }

  const priorityGoal = getPriorityGoal(profile.goals || [])
  const mainMessage = goalMessages[priorityGoal] || 'Genel sağlık için dengeli program hazırlandı.'
  const levelMessage = levelTips[profile.fitnessLevel] || levelTips.beginner

  return {
    exercises: selected,
    totalCount: exercises.length,
    message: `${mainMessage} ${levelMessage}`,
    weeklyPlan: generateWeeklyPlan(profile),
    categories: goalCategories.slice(0, 4),
  }
}

function generateWeeklyPlan(profile) {
  const level = profile.fitnessLevel || 'beginner'
  const plans = {
    beginner: [
      { day: 'Pazartesi', focus: 'Vücut Ağırlığı (30 dk)', intensity: 'Düşük' },
      { day: 'Çarşamba', focus: 'Yürüyüş / Hafif Kardiyo (30 dk)', intensity: 'Düşük' },
      { day: 'Cuma', focus: 'Esneklik & Yoga (25 dk)', intensity: 'Düşük' },
    ],
    intermediate: [
      { day: 'Pazartesi', focus: 'Üst Vücut Güç (40 dk)', intensity: 'Orta' },
      { day: 'Salı', focus: 'Kardiyo & HIIT (30 dk)', intensity: 'Orta-Yüksek' },
      { day: 'Perşembe', focus: 'Alt Vücut Güç (40 dk)', intensity: 'Orta' },
      { day: 'Cumartesi', focus: 'Full Body & Core (35 dk)', intensity: 'Orta' },
    ],
    advanced: [
      { day: 'Pazartesi', focus: 'İtme Hareketi (50 dk)', intensity: 'Yüksek' },
      { day: 'Salı', focus: 'HIIT / Sprint (35 dk)', intensity: 'Yüksek' },
      { day: 'Çarşamba', focus: 'Çekme Hareketi (50 dk)', intensity: 'Yüksek' },
      { day: 'Perşembe', focus: 'Alt Vücut Güç (50 dk)', intensity: 'Yüksek' },
      { day: 'Cumartesi', focus: 'Full Body & Olimpik (55 dk)', intensity: 'Yüksek' },
    ],
  }
  return plans[level] || plans.beginner
}

// Beslenme planı oluştur
function generateDietitianPlan(profile) {
  const prefs = profile.nutritionPrefs || []
  const goals = profile.goals || []
  const calories = estimateDailyCalories(profile)

  const mealPlan = buildMealPlan(prefs)
  const tips = buildNutritionTips(prefs, goals)

  return {
    calories,
    mealPlan,
    tips,
    macros: estimateMacros(goals, calories?.recommended),
    hydration: estimateHydration(profile.weight),
    message: buildNutritionMessage(prefs),
  }
}

function buildMealPlan(prefs) {
  const isVegan = prefs.includes('vegan')
  const isVegetarian = prefs.includes('vegetarian')
  const isHighProtein = prefs.includes('high-protein')
  const isKeto = prefs.includes('keto')
  const isMediterranean = prefs.includes('mediterranean')

  if (isKeto) {
    return [
      { meal: 'Kahvaltı', suggestion: 'Yumurta (3 adet), avokado, peynir, yeşil yapraklılar' },
      { meal: 'Öğle', suggestion: 'Tavuk göğsü, zeytinyağlı sebze kavurması' },
      { meal: 'Ara Öğün', suggestion: 'Ceviz, badem, tuzu azaltılmış peynir' },
      { meal: 'Akşam', suggestion: 'Somon veya kırmızı et, brokoli, yeşil salata' },
    ]
  }
  if (isVegan) {
    return [
      { meal: 'Kahvaltı', suggestion: 'Yulaf ezmesi, mevsim meyveleri, chia tohumu, bitki sütü' },
      { meal: 'Öğle', suggestion: 'Mercimek çorbası, tam buğday ekmeği, salata' },
      { meal: 'Ara Öğün', suggestion: 'Muz veya elma, fıstık ezmesi' },
      { meal: 'Akşam', suggestion: 'Nohut yemeği, kinoa, zeytinyağlı sebze' },
    ]
  }
  if (isVegetarian) {
    return [
      { meal: 'Kahvaltı', suggestion: 'Menemen veya omlet, tam buğday tost, domates' },
      { meal: 'Öğle', suggestion: 'Peynirli makarna veya sebze güveç, ayran' },
      { meal: 'Ara Öğün', suggestion: 'Yoğurt, fındık, kuru meyve' },
      { meal: 'Akşam', suggestion: 'Mercimek köftesi, yeşil salata, sebze çorbası' },
    ]
  }
  if (isMediterranean) {
    return [
      { meal: 'Kahvaltı', suggestion: 'Zeytin, peynir, domates, salatalık, tam buğday ekmek' },
      { meal: 'Öğle', suggestion: 'Balık veya tavuk, zeytinyağlı sebze, bulgur pilavı' },
      { meal: 'Ara Öğün', suggestion: 'Humus, tam buğday kraker, taze meyve' },
      { meal: 'Akşam', suggestion: 'Izgara balık, kısır, yoğurtlu meze' },
    ]
  }
  if (isHighProtein) {
    return [
      { meal: 'Kahvaltı', suggestion: 'Protein shake veya yumurta beyazı (4–5 adet), yulaf, muz' },
      { meal: 'Öğle', suggestion: 'Tavuk göğsü 200g, pirinç/bulgur, brokoli' },
      { meal: 'Ara Öğün', suggestion: 'Yoğurt (200g), fındık karışımı' },
      { meal: 'Akşam', suggestion: 'Kırmızı et veya balık 150g, tatlı patates, salata' },
    ]
  }
  // Varsayılan dengeli plan
  return [
    { meal: 'Kahvaltı', suggestion: 'Yulaf veya tam buğday tost, yumurta, meyve, çay/kahve' },
    { meal: 'Öğle', suggestion: 'Protein kaynağı (tavuk/balık/kuru baklagil), sebze, pilav/bulgur' },
    { meal: 'Ara Öğün', suggestion: 'Meyve, yoğurt veya kuruyemiş (küçük porsiyon)' },
    { meal: 'Akşam', suggestion: 'Hafif protein, bol salata, çorba veya sebze yemeği' },
  ]
}

function buildNutritionTips(prefs, goals) {
  const tips = []

  if (goals.includes('fatburn') || goals.includes('weight')) {
    tips.push('Öğünlerinizi günde 3 ana + 1–2 ara öğün şeklinde düzenleyin.')
    tips.push('Şeker ve işlenmiş karbonhidratları minimize edin.')
    tips.push('Her öğünde protein tüketmeye özen gösterin.')
  }
  if (goals.includes('muscle')) {
    tips.push('Antrenman sonrası 30–60 dakika içinde protein alın.')
    tips.push('Günlük protein hedefi: vücut ağırlığının 1.6–2g/kg\'ı.')
    tips.push('Karbonhidratları antrenman öncesi ve sonrasında yoğunlaştırın.')
  }
  if (prefs.includes('gluten-free')) {
    tips.push('Buğday, arpa ve çavdar içeren ürünlerden kaçının.')
    tips.push('Pirinç, mısır, kinoa gibi glutensiz tahılları tercih edin.')
  }
  if (prefs.includes('intermittent')) {
    tips.push('Aralıklı oruç pencerenizde beslenme yoğunluğunuzu koruyun.')
    tips.push('Oruç döneminde su, sade kahve ve çay tüketebilirsiniz.')
  }
  if (goals.includes('heart')) {
    tips.push('Omega-3 içeriği yüksek somon, uskumru gibi balıkları haftada 2–3 kez tüketin.')
    tips.push('Tuz tüketiminizi sınırlandırın (günlük 5g altı).')
  }

  tips.push('Günlük en az 2–2.5 litre su için.')
  tips.push('Mevsim sebze ve meyvelerini günlük öğünlerinize dahil edin.')

  return tips.slice(0, 5)
}

function estimateMacros(goals, calories) {
  if (!calories) return null
  let protein, carb, fat

  if (goals.includes('muscle')) {
    protein = Math.round((calories * 0.35) / 4)
    carb = Math.round((calories * 0.45) / 4)
    fat = Math.round((calories * 0.20) / 9)
  } else if (goals.includes('fatburn') || goals.includes('weight')) {
    protein = Math.round((calories * 0.40) / 4)
    carb = Math.round((calories * 0.30) / 4)
    fat = Math.round((calories * 0.30) / 9)
  } else {
    protein = Math.round((calories * 0.30) / 4)
    carb = Math.round((calories * 0.45) / 4)
    fat = Math.round((calories * 0.25) / 9)
  }

  return { protein, carb, fat, unit: 'gram' }
}

function estimateHydration(weight) {
  const w = parseFloat(weight)
  if (!w) return { amount: 2.5, unit: 'litre' }
  return { amount: Math.round((w * 0.033) * 10) / 10, unit: 'litre' }
}

function buildNutritionMessage(prefs) {
  const prefMap = {
    vegan: 'vegan tercihlerinize',
    vegetarian: 'vejetaryen tercihlerinize',
    'high-protein': 'yüksek protein hedeflerinize',
    'low-carb': 'düşük karbonhidrat tercihinize',
    keto: 'ketojenik beslenme tarzınıza',
    mediterranean: 'Akdeniz diyeti tercihlerinize',
    'gluten-free': 'glutensiz beslenme gereksiniminize',
    intermittent: 'aralıklı oruç programınıza',
    balanced: 'dengeli beslenme anlayışınıza',
  }
  const activePref = prefs.find((p) => prefMap[p])
  const prefText = activePref ? prefMap[activePref] : 'genel beslenme hedeflerinize'
  return `${prefText.charAt(0).toUpperCase() + prefText.slice(1)} göre kişiselleştirilmiş beslenme planı hazırlandı. Diyetisyen görüşmesi için Premium planlara geçiş yapabilirsiniz.`
}
