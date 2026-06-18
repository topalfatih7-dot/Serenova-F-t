import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Camera, Edit3, Plus, Trash2, Search,
  Flame, BarChart3,
  CheckCircle, RefreshCw, X, AlertCircle,
} from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { useApp } from '../context/AppContext'
import { Link } from 'react-router-dom'
import { analyzeFoodPhoto, isAiVisionEnabled } from '../services/aiVision'

// ── Besin Veritabanı ────────────────────────────────────────────────
const FOOD_DB = [
  // Tahıllar & Ekmek
  { id: 'ekmek-beyaz', name: 'Beyaz Ekmek', category: 'Tahıllar', cal100: 265, unit: 'dilim', unitG: 30 },
  { id: 'ekmek-tam', name: 'Tam Buğday Ekmeği', category: 'Tahıllar', cal100: 247, unit: 'dilim', unitG: 30 },
  { id: 'simit', name: 'Simit', category: 'Tahıllar', cal100: 285, unit: 'adet', unitG: 70 },
  { id: 'pirinc', name: 'Pirinç Pilavı', category: 'Tahıllar', cal100: 130, unit: 'porsiyon', unitG: 150 },
  { id: 'makarna', name: 'Makarna (pişmiş)', category: 'Tahıllar', cal100: 131, unit: 'porsiyon', unitG: 150 },
  { id: 'yulaf', name: 'Yulaf Ezmesi', category: 'Tahıllar', cal100: 379, unit: 'kase', unitG: 50 },
  { id: 'bulgur', name: 'Bulgur Pilavı', category: 'Tahıllar', cal100: 342, unit: 'porsiyon', unitG: 150 },
  { id: 'granola', name: 'Granola', category: 'Tahıllar', cal100: 471, unit: 'kase', unitG: 45 },
  // Et & Balık
  { id: 'tavuk-gogus', name: 'Tavuk Göğsü (pişmiş)', category: 'Et & Balık', cal100: 165, unit: 'porsiyon', unitG: 150 },
  { id: 'kirmizi-et', name: 'Kırmızı Et (pişmiş)', category: 'Et & Balık', cal100: 215, unit: 'porsiyon', unitG: 150 },
  { id: 'somon', name: 'Somon Balığı', category: 'Et & Balık', cal100: 208, unit: 'porsiyon', unitG: 150 },
  { id: 'ton-balik', name: 'Ton Balığı (konserve)', category: 'Et & Balık', cal100: 116, unit: 'kaşık', unitG: 85 },
  { id: 'kofte', name: 'Köfte', category: 'Et & Balık', cal100: 250, unit: 'adet', unitG: 40 },
  { id: 'sucuk', name: 'Sucuk', category: 'Et & Balık', cal100: 393, unit: 'dilim', unitG: 20 },
  // Süt Ürünleri & Yumurta
  { id: 'yumurta', name: 'Yumurta (haşlanmış)', category: 'Süt & Yumurta', cal100: 155, unit: 'adet', unitG: 60 },
  { id: 'sut', name: 'Süt (tam yağlı)', category: 'Süt & Yumurta', cal100: 61, unit: 'bardak', unitG: 240 },
  { id: 'yogurt', name: 'Yoğurt (sade)', category: 'Süt & Yumurta', cal100: 61, unit: 'kase', unitG: 150 },
  { id: 'peynir-beyaz', name: 'Beyaz Peynir', category: 'Süt & Yumurta', cal100: 264, unit: 'dilim', unitG: 30 },
  { id: 'kasar', name: 'Kaşar Peyniri', category: 'Süt & Yumurta', cal100: 402, unit: 'dilim', unitG: 30 },
  { id: 'lor', name: 'Lor Peyniri', category: 'Süt & Yumurta', cal100: 97, unit: 'yemek kaşığı', unitG: 50 },
  { id: 'kefir', name: 'Kefir', category: 'Süt & Yumurta', cal100: 52, unit: 'bardak', unitG: 240 },
  // Meyve
  { id: 'elma', name: 'Elma', category: 'Meyve', cal100: 52, unit: 'adet', unitG: 180 },
  { id: 'muz', name: 'Muz', category: 'Meyve', cal100: 89, unit: 'adet', unitG: 120 },
  { id: 'portakal', name: 'Portakal', category: 'Meyve', cal100: 47, unit: 'adet', unitG: 200 },
  { id: 'uzum', name: 'Üzüm', category: 'Meyve', cal100: 67, unit: 'avuç', unitG: 80 },
  { id: 'cilek', name: 'Çilek', category: 'Meyve', cal100: 32, unit: 'kase', unitG: 150 },
  { id: 'kivi', name: 'Kivi', category: 'Meyve', cal100: 61, unit: 'adet', unitG: 70 },
  // Sebze
  { id: 'domates', name: 'Domates', category: 'Sebze', cal100: 18, unit: 'adet', unitG: 120 },
  { id: 'salatalik', name: 'Salatalık', category: 'Sebze', cal100: 15, unit: 'adet', unitG: 200 },
  { id: 'brokoli', name: 'Brokoli (pişmiş)', category: 'Sebze', cal100: 55, unit: 'kase', unitG: 150 },
  { id: 'ispanak', name: 'Ispanak (çiğ)', category: 'Sebze', cal100: 23, unit: 'kase', unitG: 100 },
  { id: 'havuc', name: 'Havuç', category: 'Sebze', cal100: 41, unit: 'adet', unitG: 80 },
  { id: 'patates', name: 'Haşlanmış Patates', category: 'Sebze', cal100: 77, unit: 'adet', unitG: 150 },
  // Baklagiller
  { id: 'mercimek', name: 'Mercimek Çorbası', category: 'Baklagiller', cal100: 59, unit: 'kase', unitG: 250 },
  { id: 'nohut', name: 'Nohut (pişmiş)', category: 'Baklagiller', cal100: 164, unit: 'porsiyon', unitG: 150 },
  { id: 'fasulye', name: 'Kuru Fasulye', category: 'Baklagiller', cal100: 127, unit: 'porsiyon', unitG: 150 },
  // Yağlar & Tahıl Ürünleri
  { id: 'zeytin', name: 'Zeytin', category: 'Yağlı Tohumlar', cal100: 115, unit: 'adet', unitG: 5 },
  { id: 'badem', name: 'Badem', category: 'Yağlı Tohumlar', cal100: 579, unit: 'avuç', unitG: 30 },
  { id: 'ceviz', name: 'Ceviz', category: 'Yağlı Tohumlar', cal100: 654, unit: 'adet', unitG: 15 },
  { id: 'zeytinyagi', name: 'Zeytinyağı', category: 'Yağlar', cal100: 884, unit: 'yemek kaşığı', unitG: 14 },
  { id: 'tereyagi', name: 'Tereyağı', category: 'Yağlar', cal100: 717, unit: 'çay kaşığı', unitG: 5 },
  // İçecekler
  { id: 'cay', name: 'Çay (şekersiz)', category: 'İçecekler', cal100: 2, unit: 'bardak', unitG: 240 },
  { id: 'kahve', name: 'Kahve (sade)', category: 'İçecekler', cal100: 2, unit: 'fincan', unitG: 120 },
  { id: 'portakal-suyu', name: 'Portakal Suyu', category: 'İçecekler', cal100: 45, unit: 'bardak', unitG: 240 },
  { id: 'ayran', name: 'Ayran', category: 'İçecekler', cal100: 36, unit: 'bardak', unitG: 200 },
  { id: 'kola', name: 'Kola', category: 'İçecekler', cal100: 42, unit: 'bardak', unitG: 250 },
  // Hazır & Fast Food
  { id: 'doner', name: 'Döner (yarım porsiyon)', category: 'Hazır Yemek', cal100: 215, unit: 'porsiyon', unitG: 180 },
  { id: 'lahmacun', name: 'Lahmacun', category: 'Hazır Yemek', cal100: 228, unit: 'adet', unitG: 120 },
  { id: 'burger', name: 'Hamburger', category: 'Hazır Yemek', cal100: 295, unit: 'adet', unitG: 180 },
  { id: 'pizza-dilim', name: 'Pizza Dilimi', category: 'Hazır Yemek', cal100: 266, unit: 'dilim', unitG: 107 },
  // Tatlılar
  { id: 'baklava', name: 'Baklava', category: 'Tatlılar', cal100: 428, unit: 'dilim', unitG: 60 },
  { id: 'seker', name: 'Şeker', category: 'Tatlılar', cal100: 387, unit: 'çay kaşığı', unitG: 4 },
  { id: 'cikolata', name: 'Bitter Çikolata', category: 'Tatlılar', cal100: 546, unit: 'kare', unitG: 10 },
  { id: 'sutlac', name: 'Sütlaç', category: 'Tatlılar', cal100: 139, unit: 'kase', unitG: 150 },
]

const CATEGORIES = [...new Set(FOOD_DB.map((f) => f.category))]

function basketItemGrams(b) {
  if (b.portionUnit === 'gram') return Number(b.amount) || 0
  return (Number(b.amount) || 0) * (b.food.unitG || 100)
}

function refCalPerUnit(food) {
  return Math.round((food.cal100 * food.unitG) / 100)
}

// Fotoğraf analizi simülasyonu — farklı yemek setleri döndürür
const PHOTO_MEAL_PRESETS = [
  {
    label: 'Kahvaltı Tabağı',
    items: [
      { name: 'Yumurta (haşlanmış)', amount: 2, unit: 'adet', cal: 186 },
      { name: 'Beyaz Peynir', amount: 1, unit: 'dilim', cal: 79 },
      { name: 'Tam Buğday Ekmeği', amount: 2, unit: 'dilim', cal: 148 },
      { name: 'Domates', amount: 1, unit: 'adet', cal: 22 },
      { name: 'Zeytin', amount: 5, unit: 'adet', cal: 29 },
    ],
  },
  {
    label: 'Öğle Yemeği',
    items: [
      { name: 'Tavuk Göğsü (pişmiş)', amount: 150, unit: 'g', cal: 248 },
      { name: 'Pirinç Pilavı', amount: 1, unit: 'porsiyon', cal: 195 },
      { name: 'Salatalık', amount: 1, unit: 'adet', cal: 30 },
    ],
  },
  {
    label: 'Akşam Yemeği',
    items: [
      { name: 'Kırmızı Et (pişmiş)', amount: 150, unit: 'g', cal: 323 },
      { name: 'Bulgur Pilavı', amount: 1, unit: 'porsiyon', cal: 180 },
      { name: 'Mercimek Çorbası', amount: 1, unit: 'kase', cal: 148 },
    ],
  },
]

// Makro tahmin yardımcısı
function estimateMacros(totalCal) {
  return {
    protein: Math.round((totalCal * 0.25) / 4),
    carb: Math.round((totalCal * 0.45) / 4),
    fat: Math.round((totalCal * 0.30) / 9),
  }
}

export default function CalorieCalculatorPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { membership } = useApp()
  const fileRef = useRef(null)

  // Paket kontrolü: Basic kullanıcılar erişemez
  const isPaid = membership !== 'free'
  const isPlatinum = membership === 'platinum'

  // Mod: 'manual' | 'photo' (fotoğraf modu sadece platinum için)
  const [mode, setMode] = useState('manual')

  // Manuel mod
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Tümü')
  const [basket, setBasket] = useState([])

  // Fotoğraf mod
  const [photo, setPhoto] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [photoResult, setPhotoResult] = useState(null)
  const [presetIdx] = useState(() => Math.floor(Math.random() * PHOTO_MEAL_PRESETS.length))

  // Filtrelenmiş besinler
  const filteredFoods = FOOD_DB.filter((f) => {
    const matchCat = selectedCategory === 'Tümü' || f.category === selectedCategory
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  // Sepete ekle
  const addToBasket = (food) => {
    const existing = basket.find((b) => b.foodId === food.id)
    if (existing) {
      setBasket((prev) => prev.map((b) => b.foodId === food.id ? { ...b, amount: (Number(b.amount) || 0) + 1 } : b))
    } else {
      setBasket((prev) => [...prev, {
        foodId: food.id,
        food,
        amount: 1,
        portionUnit: food.unit,
      }])
    }
    toast(`${food.name} eklendi`, 'success')
  }

  const removeFromBasket = (foodId) => {
    setBasket((prev) => prev.filter((b) => b.foodId !== foodId))
  }

  const updateAmount = (foodId, amount) => {
    setBasket((prev) => prev.map((b) => b.foodId === foodId ? { ...b, amount } : b))
  }

  const updatePortionUnit = (foodId, portionUnit) => {
    setBasket((prev) => prev.map((b) => {
      if (b.foodId !== foodId) return b
      return { ...b, portionUnit, amount: portionUnit === 'gram' ? (b.food.unitG || 100) : 1 }
    }))
  }

  // Kalori hesapla
  const totalCal = basket.reduce((sum, b) => {
    const grams = basketItemGrams(b)
    return sum + (b.food.cal100 * grams) / 100
  }, 0)

  const macros = estimateMacros(totalCal)

  // Fotoğraf yükle — AI açıksa gerçek analiz, değilse/başarısızsa demo presete düşer
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPhoto(url)
    setPhotoResult(null)
    setAnalyzing(true)

    if (isAiVisionEnabled()) {
      const result = await analyzeFoodPhoto(file)
      setAnalyzing(false)
      if (result.ok && result.items?.length > 0) {
        setPhotoResult({ label: result.label, items: result.items })
      } else if (result.ok) {
        toast('Fotoğrafta yemek tespit edilemedi. Lütfen daha net bir görsel deneyin.', 'warning')
        setPhotoResult({ label: 'Tespit Edilemedi', items: [] })
      } else {
        toast('AI analizi yapılamadı, örnek sonuç gösteriliyor.', 'info')
        setPhotoResult(PHOTO_MEAL_PRESETS[presetIdx])
      }
      return
    }

    // AI kapalı → demo mod (gerçekçi gecikme)
    setTimeout(() => {
      setAnalyzing(false)
      setPhotoResult(PHOTO_MEAL_PRESETS[presetIdx])
    }, 2800)
  }

  const photoTotalCal = photoResult?.items.reduce((sum, i) => sum + i.cal, 0) || 0

  const resetPhoto = () => {
    setPhoto(null)
    setPhotoResult(null)
    setAnalyzing(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  // Basic paket kullanıcıları için erişim kısıtlaması
  if (!isPaid) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 rounded-xl border border-cream-200 bg-white px-4 py-2 text-sm font-medium text-cream-800 shadow-sm transition hover:bg-cream-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Geri Dön
        </button>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <Flame className="mx-auto h-12 w-12 text-amber-500" />
          <h1 className="mt-4 font-display text-xl font-bold text-cream-900">Kalori Hesaplayıcı</h1>
          <p className="mt-2 text-sm text-cream-800/70">
            Bu özellik Gümüş ve üzeri paketlerde kullanılabilir.
          </p>
          <Link
            to="/membership"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Planları İncele
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* GERİ BUTONU */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 rounded-xl border border-cream-200 bg-white px-4 py-2 text-sm font-medium text-cream-800 shadow-sm transition hover:bg-cream-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Geri Dön
      </button>

      {/* BAŞLIK */}
      <div>
        <h1 className="font-display text-2xl font-bold text-cream-900">Kalori Hesapla</h1>
        <p className="mt-1 text-sm text-cream-800/60">
          {isPlatinum ? 'Manuel giriş veya fotoğrafla hesaplama' : 'Öğününüzün kalori değerlerini hesaplayın'}
        </p>
      </div>

      {/* MOD SEÇİCİ - Fotoğraf modu sadece Platinum için */}
      <div className="flex rounded-2xl border border-cream-200 bg-white p-1.5 shadow-sm">
        {[
          { id: 'manual', icon: Edit3, label: 'Manuel Giriş' },
          ...(isPlatinum ? [{ id: 'photo', icon: Camera, label: 'Fotoğrafla Hesapla' }] : []),
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition ${
              mode === id
                ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md'
                : 'text-cream-800/60 hover:text-cream-900'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {mode === 'manual' ? (
          <motion.div
            key="manual"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="grid gap-6 lg:grid-cols-5"
          >
            {/* Besin Seçici */}
            <div className="lg:col-span-3 space-y-4">
              <div className="rounded-2xl border border-cream-200 bg-white shadow-sm">
                <div className="border-b border-cream-100 p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-400" />
                    <input
                      type="text"
                      placeholder="Besin ara…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-xl border border-cream-200 py-2.5 pl-9 pr-4 text-sm focus:border-brand-400 focus:outline-none"
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {['Tümü', ...CATEGORIES].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedCategory(c)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                          selectedCategory === c
                            ? 'bg-brand-500 text-white'
                            : 'bg-cream-100 text-cream-800 hover:bg-cream-200'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto divide-y divide-cream-50">
                  {filteredFoods.length === 0 ? (
                    <p className="p-8 text-center text-sm text-cream-800/40">Besin bulunamadı</p>
                  ) : filteredFoods.map((food) => (
                    <button
                      key={food.id}
                      type="button"
                      onClick={() => addToBasket(food)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-brand-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-cream-900">{food.name}</p>
                        <p className="text-xs text-cream-800/50">{food.category} · 1 {food.unit} ≈ {Math.round((food.cal100 * food.unitG) / 100)} kcal</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-brand-600">{food.cal100} kcal/100g</span>
                        <Plus className="h-4 w-4 text-brand-500" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sepet & Sonuç */}
            <div className="lg:col-span-2 space-y-4">
              {/* Toplam */}
              <CalorieSummaryCard totalCal={Math.round(totalCal)} macros={macros} />

              {/* Sepet */}
              <div className="rounded-2xl border border-cream-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-cream-100 px-4 py-3">
                  <p className="font-semibold text-cream-900">Öğünüm ({basket.length})</p>
                  {basket.length > 0 && (
                    <button type="button" onClick={() => setBasket([])} className="text-xs text-red-400 hover:text-red-600">
                      Temizle
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-cream-50">
                  {basket.length === 0 ? (
                    <div className="flex flex-col items-center py-10 text-center">
                      <Flame className="h-8 w-8 text-cream-200" />
                      <p className="mt-2 text-sm text-cream-800/40">Listeden besin ekleyin</p>
                    </div>
                  ) : basket.map((b) => {
                    const grams = basketItemGrams(b)
                    const cal = Math.round((b.food.cal100 * grams) / 100)
                    const refCal = refCalPerUnit(b.food)
                    return (
                      <div key={b.foodId} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-cream-900">{b.food.name}</p>
                            <p className="text-xs font-bold text-brand-600">{cal} kcal</p>
                          </div>
                          <button type="button" onClick={() => removeFromBasket(b.foodId)} className="shrink-0 text-cream-300 hover:text-red-400 transition">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <input
                            type="number"
                            value={b.amount}
                            min={0.1}
                            step={b.portionUnit === 'gram' ? 1 : 0.5}
                            onChange={(e) => updateAmount(b.foodId, e.target.value)}
                            className="w-20 rounded-lg border border-cream-200 px-2 py-1 text-xs focus:border-brand-400 focus:outline-none"
                          />
                          <select
                            value={b.portionUnit}
                            onChange={(e) => updatePortionUnit(b.foodId, e.target.value)}
                            className="rounded-lg border border-cream-200 px-2 py-1 text-xs focus:border-brand-400 focus:outline-none"
                          >
                            <option value={b.food.unit}>{b.food.unit}</option>
                            <option value="gram">gram</option>
                          </select>
                        </div>
                        <p className="mt-1.5 text-[11px] text-cream-800/45">
                          Yaklaşık: 1 {b.food.unit} ≈ {b.food.unitG}g · ~{refCal} kcal
                          {b.portionUnit !== 'gram' && grams > 0 && ` · Toplam ~${Math.round(grams)}g`}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="photo"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6"
          >
            {/* Fotoğraf yükleme alanı */}
            {!photo ? (
              <div
                onClick={() => fileRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-brand-200 bg-gradient-to-br from-brand-50/50 to-white py-20 transition hover:border-brand-400 hover:bg-brand-50/70"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-brand-500">
                  <Camera className="h-10 w-10" />
                </div>
                <div className="text-center">
                  <p className="font-display text-lg font-bold text-cream-900">Yemek Fotoğrafı Yükle</p>
                  <p className="mt-1 text-sm text-cream-800/55">Tabağınızın fotoğrafını çekin veya galeriden seçin</p>
                  <p className="mt-2 text-xs text-cream-800/35">PNG, JPG, WEBP · Maks 10MB</p>
                </div>
                <span className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white">
                  Fotoğraf Seç
                </span>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-sm">
                <div className="relative">
                  <img src={photo} alt="Yüklenen yemek" className="h-64 w-full object-cover" />
                  <button
                    type="button"
                    onClick={resetPhoto}
                    className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {analyzing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500"
                      >
                        <Flame className="h-8 w-8 text-white" />
                      </motion.div>
                      <p className="mt-4 font-semibold text-white">Analiz ediliyor…</p>
                      <p className="mt-1 text-xs text-white/70">Besinler tespit ediliyor</p>
                    </div>
                  )}
                </div>

                {/* Analiz sonucu */}
                <AnimatePresence>
                  {photoResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-sage-500" />
                          <p className="font-semibold text-cream-900">Tespit Edilen: {photoResult.label}</p>
                        </div>
                        <button type="button" onClick={resetPhoto} className="flex items-center gap-1.5 text-xs text-cream-800/50 hover:text-brand-600">
                          <RefreshCw className="h-3.5 w-3.5" /> Yeni Fotoğraf
                        </button>
                      </div>

                      <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                        <p className="text-xs text-amber-700">Fotoğraf analizi tahmini değerlerdir. Gerçek değerler farklılık gösterebilir.</p>
                      </div>

                      <div className="divide-y divide-cream-100 rounded-2xl border border-cream-200">
                        {photoResult.items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-cream-900">{item.name}</p>
                              <p className="text-xs text-cream-800/50">{item.amount} {item.unit}</p>
                            </div>
                            <span className="font-bold text-brand-600">{item.cal} kcal</span>
                          </div>
                        ))}
                      </div>

                      <CalorieSummaryCard totalCal={photoTotalCal} macros={estimateMacros(photoTotalCal)} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Kalori Özet Kartı ───────────────────────────────────────────────
function CalorieSummaryCard({ totalCal, macros }) {
  const level = totalCal < 300 ? 'Az' : totalCal < 600 ? 'Orta' : totalCal < 900 ? 'Yüksek' : 'Çok Yüksek'
  const levelColor = totalCal < 300 ? 'text-sage-600' : totalCal < 600 ? 'text-amber-600' : totalCal < 900 ? 'text-orange-600' : 'text-red-600'

  return (
    <motion.div
      layout
      className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-xl shadow-brand-500/30"
    >
      <div className="p-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-white/75">Toplam Kalori</p>
            <p className="font-display text-5xl font-bold">{totalCal}</p>
            <p className="text-sm text-white/75">kcal</p>
          </div>
          <div className="text-right">
            <Flame className="ml-auto h-10 w-10 text-white/30" />
            <span className={`mt-1 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold ${levelColor.replace('text-', 'text-white')}`}>
              {level}
            </span>
          </div>
        </div>

        {totalCal > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: 'Protein', value: macros.protein, unit: 'g', color: 'bg-red-400/30' },
              { label: 'Karb.', value: macros.carb, unit: 'g', color: 'bg-amber-400/30' },
              { label: 'Yağ', value: macros.fat, unit: 'g', color: 'bg-blue-400/30' },
            ].map((m) => (
              <div key={m.label} className={`rounded-xl ${m.color} px-3 py-2 text-center`}>
                <p className="text-lg font-bold">{m.value}{m.unit}</p>
                <p className="text-xs text-white/70">{m.label}</p>
              </div>
            ))}
          </div>
        )}

        {totalCal === 0 && (
          <p className="mt-3 text-xs text-white/50 text-center">Liste oluşturmaya başlayın</p>
        )}
      </div>

      {totalCal > 0 && (
        <div className="border-t border-white/10 bg-black/10 px-5 py-3">
          <p className="text-xs text-white/60 flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5" />
            Günlük 2000 kcal hedefinin <strong className="text-white">{Math.round((totalCal / 2000) * 100)}%</strong>'i
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((totalCal / 2000) * 100, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-2 rounded-full bg-white"
            />
          </div>
        </div>
      )}
    </motion.div>
  )
}
