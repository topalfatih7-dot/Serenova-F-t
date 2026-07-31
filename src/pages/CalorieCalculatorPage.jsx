import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Camera, Flame, BarChart3,
  CheckCircle, RefreshCw, AlertCircle,
  Send, Sparkles, Keyboard, Trash2, ScanLine,
  ImagePlus, Lock, Crown,
} from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { useApp } from '../context/AppContext'
import { memberHasPhotoCalorieAccess, memberHasManualCalorieAccess } from '../utils/memberPackages'
import { analyzeFoodPhoto } from '../services/aiVision'
import {
  analyzeFoodText,
  formatAnalysisReply,
} from '../services/calorieChat'
import PanelPageHeader, { PanelPageShell } from '../components/layout/PanelPageHeader'
import UnpaidMemberGate from '../components/membership/UnpaidMemberGate'
import { PANEL_IMAGES } from '../utils/panelImages'

function estimateMacros(totalCal) {
  return {
    protein: Math.round((totalCal * 0.25) / 4),
    carb: Math.round((totalCal * 0.45) / 4),
    fat: Math.round((totalCal * 0.30) / 9),
  }
}

function itemsTotalCal(items = []) {
  return items.reduce((sum, i) => sum + (Number(i.cal) || 0), 0)
}

function buildCalorieLogEntry({ mode, input, analysis }) {
  return {
    id: `cal-${Date.now()}`,
    mode,
    input: input?.slice(0, 500) || '',
    totalCal: itemsTotalCal(analysis?.items),
    items: (analysis?.items || []).slice(0, 20).map((i) => ({
      name: i.name || i.label,
      cal: i.cal,
      protein: i.protein,
      carb: i.carb,
      fat: i.fat,
    })),
    createdAt: new Date().toISOString(),
  }
}

function appendCalorieHistory(existing = [], entry) {
  return [entry, ...existing].slice(0, 100)
}

const MODE_OPTIONS = [
  {
    id: 'chat',
    icon: Keyboard,
    label: 'Yazarak Analiz',
    hint: 'Öğünü metin olarak yazın',
    tone: {
      active: 'border-orange-500 bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200/60',
      idle: 'border-orange-200/80 bg-gradient-to-br from-orange-50 to-amber-50/80 text-orange-950 hover:border-orange-300 hover:shadow-md',
      iconActive: 'bg-white/20 text-white',
      iconIdle: 'bg-orange-100 text-orange-600',
    },
  },
  {
    id: 'photo',
    icon: Camera,
    label: 'Fotoğrafla Analiz',
    hint: 'Tablo fotoğrafı yükleyin',
    tone: {
      active: 'border-sage-500 bg-gradient-to-br from-sage-500 to-teal-500 text-white shadow-lg shadow-sage-200/60',
      idle: 'border-sage-200/80 bg-gradient-to-br from-sage-50 to-teal-50/80 text-sage-950 hover:border-sage-300 hover:shadow-md',
      iconActive: 'bg-white/20 text-white',
      iconIdle: 'bg-sage-100 text-sage-600',
    },
  },
]

export default function CalorieCalculatorPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user, updateProfile, isUnpaidMember } = useApp()
  const fileRef = useRef(null)
  const chatEndRef = useRef(null)

  const isPaid = memberHasManualCalorieAccess(user)
  const isPlatinum = memberHasPhotoCalorieAccess(user)

  const [mode, setMode] = useState('chat')
  const [chatMessages, setChatMessages] = useState([
    {
      id: 0,
      role: 'system',
      type: 'info',
      content: 'Merhaba! Ne yediğinizi yazın — tahmini kalori değerlerini hesaplayalım.\nÖrnek: “2 yumurta, 1 dilim ekmek, 1 kase yoğurt”',
    },
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatProcessing, setChatProcessing] = useState(false)
  const [lastAnalysis, setLastAnalysis] = useState(null)

  const [photo, setPhoto] = useState(null)
  const [pendingFile, setPendingFile] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [photoResult, setPhotoResult] = useState(null)

  useEffect(() => {
    return () => {
      if (photo?.startsWith('blob:')) URL.revokeObjectURL(photo)
    }
  }, [photo])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, chatProcessing])

  const handleChatSend = async () => {
    const text = chatInput.trim()
    if (!text || chatProcessing) return
    if (text.length > 2000) {
      toast('Metin çok uzun (max 2000 karakter).', 'warning')
      return
    }
    setChatInput('')
    setChatMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', content: text }])
    setChatProcessing(true)

    const result = await analyzeFoodText(text)
    if (result.ok) {
      setLastAnalysis(result)
      const entry = buildCalorieLogEntry({ mode: 'text', input: text, analysis: result })
      updateProfile({ calorieHistory: appendCalorieHistory(user?.calorieHistory, entry) }).catch(() => {})
      setChatMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          type: 'success',
          content: formatAnalysisReply(result),
          analysis: result,
        },
      ])
    } else {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'system',
          type: 'error',
          content: result.error || 'Analiz yapılamadı. Lütfen birkaç dakika sonra tekrar deneyin.',
        },
      ])
    }

    setChatProcessing(false)
  }

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (photo?.startsWith('blob:')) URL.revokeObjectURL(photo)
    setPendingFile(file)
    setPhoto(URL.createObjectURL(file))
    setPhotoResult(null)
    setAnalyzing(false)
  }

  const handlePhotoAnalyze = async () => {
    if (!pendingFile || analyzing) return
    setAnalyzing(true)
    setPhotoResult(null)
    const result = await analyzeFoodPhoto(pendingFile)
    setAnalyzing(false)
    if (result.ok && result.items?.length > 0) {
      setPhotoResult(result)
      setLastAnalysis(result)
      const entry = buildCalorieLogEntry({ mode: 'photo', input: pendingFile?.name || 'fotoğraf', analysis: result })
      updateProfile({ calorieHistory: appendCalorieHistory(user?.calorieHistory, entry) }).catch(() => {})
    } else if (result.ok) {
      toast('Fotoğrafta yemek tespit edilemedi.', 'warning')
      setPhotoResult({ label: 'Tespit Edilemedi', items: [] })
    } else {
      toast(result.error || 'Analiz yapılamadı.', 'error')
    }
  }

  const resetPhoto = () => {
    if (photo?.startsWith('blob:')) URL.revokeObjectURL(photo)
    setPhoto(null)
    setPendingFile(null)
    setPhotoResult(null)
    setAnalyzing(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const activeTotal = mode === 'photo' && photoResult?.items?.length
    ? itemsTotalCal(photoResult.items)
    : lastAnalysis?.items?.length
      ? itemsTotalCal(lastAnalysis.items)
      : 0

  const visibleModes = MODE_OPTIONS.filter((m) => m.id === 'chat' || isPlatinum)

  if (isUnpaidMember) {
    return (
      <PanelPageShell>
        <PanelPageHeader
          title="Kalori Hesaplama"
          subtitle="Yazarak veya fotoğrafla kalori tahmini"
          icon={Flame}
          accent="flame"
          image={PANEL_IMAGES.calorie}
        />
        <UnpaidMemberGate
          title="Kalori analizi paket gerektirir"
          description="Sayfayı gezebilirsiniz. Yazılı veya fotoğraflı kalori AI için uygun bir plan seçin."
        />
      </PanelPageShell>
    )
  }

  if (!isPaid) {
    return (
      <PanelPageShell>
        <button type="button" onClick={() => navigate(-1)} className="panel-back-btn">
          <ArrowLeft className="h-4 w-4" /> Geri Dön
        </button>
        <div className="glass-card-solid overflow-hidden p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <Crown className="h-8 w-8" />
          </div>
          <h1 className="mt-4 font-display text-xl font-bold text-cream-900">Aktif pakette kalori yok</h1>
          <p className="mt-2 text-sm leading-relaxed text-cream-800/70">
            Yazarak veya fotoğrafla kalori analizi paket haklarınıza dahil değil. Uygun bir plan seçerek devam edebilirsiniz.
          </p>
          <Link to="/plans" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600">
            <Crown className="h-4 w-4" /> Plan Seç &amp; Devam Et
          </Link>
        </div>
      </PanelPageShell>
    )
  }

  return (
    <PanelPageShell>
      <button type="button" onClick={() => navigate(-1)} className="panel-back-btn">
        <ArrowLeft className="h-4 w-4" /> Geri Dön
      </button>

      <PanelPageHeader
        title="Kalori Hesapla"
        subtitle={isPlatinum ? 'Yazarak veya fotoğrafla tahmini kalori hesabı' : 'Ne yediğinizi yazın, tahmini kalori değerlerini görün'}
        icon={Flame}
        accent="flame"
        image={PANEL_IMAGES.calorie}
      />

      {/* Mod seçimi — modern, responsive kartlar */}
      <div className={`grid gap-2.5 sm:gap-3 ${visibleModes.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
        {MODE_OPTIONS.map(({ id, icon: Icon, label, hint, tone }) => {
          const available = id === 'chat' || isPlatinum
          const selected = mode === id
          if (!available && !isPlatinum && id === 'photo') {
            return (
              <Link
                key={id}
                to="/plans"
                className="group flex items-center gap-3 rounded-2xl border-2 border-dashed border-cream-300 bg-cream-50/80 px-3.5 py-3.5 transition hover:border-sage-300 hover:bg-sage-50/50 sm:px-4 sm:py-4"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cream-200 text-cream-800/50 sm:h-12 sm:w-12">
                  <Lock className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block text-sm font-bold text-cream-800/70">{label}</span>
                  <span className="mt-0.5 block text-[11px] text-cream-800/45 sm:text-xs">Paket yükseltmesi gerekir</span>
                </span>
              </Link>
            )
          }
          if (!available) return null
          return (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              className={`flex items-center gap-3 rounded-2xl border-2 px-3.5 py-3.5 text-left transition duration-200 sm:px-4 sm:py-4 ${
                selected ? tone.active : tone.idle
              }`}
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${selected ? tone.iconActive : tone.iconIdle}`}>
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold leading-tight sm:text-[15px]">{label}</span>
                <span className={`mt-0.5 block text-[11px] leading-tight sm:text-xs ${selected ? 'text-white/80' : 'opacity-60'}`}>
                  {hint}
                </span>
              </span>
              {selected ? (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/25">
                  <CheckCircle className="h-3.5 w-3.5" />
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      {activeTotal > 0 && (
        <CalorieSummaryCard totalCal={activeTotal} macros={estimateMacros(activeTotal)} />
      )}

      <AnimatePresence mode="wait">
        {mode === 'chat' ? (
          <motion.div key="chat" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-orange-100/80 bg-white shadow-sm sm:rounded-3xl">
              <div className="flex items-center gap-3 border-b border-orange-100/70 bg-gradient-to-r from-orange-50 via-amber-50/80 to-white px-4 py-3.5 sm:gap-3.5 sm:px-5 sm:py-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-200/50 sm:h-11 sm:w-11">
                  <Keyboard className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-cream-900 sm:text-base">Ne Yediniz?</p>
                  <p className="text-[11px] text-cream-800/55 sm:text-xs">Yazdığınız öğün için tahmini kalori değerleri hesaplanır</p>
                </div>
              </div>

              <div className="max-h-[min(420px,50dvh)] space-y-2.5 overflow-y-auto p-3 sm:p-4">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[92%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed sm:max-w-[85%] sm:px-4 ${
                      msg.role === 'user' ? 'rounded-br-sm bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-sm'
                        : msg.type === 'success' ? 'rounded-bl-sm border border-sage-200 bg-sage-50 text-sage-800'
                        : msg.type === 'error' ? 'rounded-bl-sm border border-red-200 bg-red-50 text-red-700'
                        : msg.type === 'warning' ? 'rounded-bl-sm border border-amber-200 bg-amber-50 text-amber-800'
                        : 'rounded-bl-sm bg-cream-100 text-cream-800'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatProcessing && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-orange-50 px-4 py-2.5 text-sm text-orange-800/80">
                      <Sparkles className="h-3.5 w-3.5 animate-pulse text-orange-500" /> Analiz ediliyor…
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="border-t border-orange-100/70 bg-gradient-to-b from-white to-orange-50/30 p-3 sm:p-3.5">
                <div className="flex items-end gap-2 sm:gap-2.5">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleChatSend()}
                    disabled={chatProcessing}
                    maxLength={2000}
                    placeholder="Örn: 2 yumurta, 1 dilim ekmek, 200g tavuk"
                    className="min-w-0 flex-1 rounded-xl border border-orange-200/80 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:opacity-50 sm:rounded-2xl sm:px-4 sm:py-3"
                  />
                  <button
                    type="button"
                    onClick={handleChatSend}
                    disabled={!chatInput.trim() || chatProcessing}
                    aria-label="Gönder"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-200/50 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40 sm:h-12 sm:w-12 sm:rounded-2xl"
                  >
                    <Send className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="photo" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4 sm:space-y-5">
            {!photo ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="group flex w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-sage-300 bg-gradient-to-br from-sage-50 via-teal-50/40 to-white px-4 py-14 transition hover:border-sage-400 hover:shadow-md sm:rounded-3xl sm:py-20"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sage-500 to-teal-500 text-white shadow-lg shadow-sage-200/60 transition group-hover:scale-105 sm:h-20 sm:w-20 sm:rounded-3xl">
                  <ImagePlus className="h-8 w-8 sm:h-10 sm:w-10" />
                </span>
                <div className="text-center">
                  <p className="font-display text-lg font-bold text-cream-900 sm:text-xl">Yemek Fotoğrafı Yükle</p>
                  <p className="mt-1 max-w-sm text-sm text-cream-800/55">Tabağınızın fotoğrafını çekin veya galeriden seçin</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sage-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md">
                  <Camera className="h-4 w-4" /> Fotoğraf Seç
                </span>
              </button>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-sage-100 bg-white shadow-sm sm:rounded-3xl">
                <div className="flex items-center gap-3 border-b border-sage-100 bg-gradient-to-r from-sage-50 via-teal-50/50 to-white px-4 py-3.5 sm:px-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sage-500 to-teal-500 text-white shadow-md">
                    <Camera className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-cream-900">Fotoğrafla Analiz</p>
                    <p className="text-[11px] text-cream-800/55 sm:text-xs">Görseli kontrol edip analizi başlatın</p>
                  </div>
                </div>

                <div className="relative">
                  <img src={photo} alt="Yüklenen yemek" className="max-h-[min(360px,45dvh)] w-full object-cover" />
                  {analyzing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sage-500 to-teal-500">
                        <ScanLine className="h-8 w-8 text-white" />
                      </motion.div>
                      <p className="mt-4 font-semibold text-white">Analiz ediliyor…</p>
                    </div>
                  )}
                </div>

                {!photoResult && !analyzing && (
                  <div className="space-y-3 border-t border-sage-100 p-4 sm:space-y-4 sm:p-5">
                    <div className="flex items-start gap-2 rounded-xl border border-sage-200 bg-sage-50 px-3 py-2.5">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" />
                      <p className="text-xs leading-relaxed text-sage-800">
                        Fotoğraf yüklendi. Analizi başlatmadan önce görseli kontrol edin; isterseniz silebilirsiniz.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={handlePhotoAnalyze}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sage-500 to-teal-500 py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-105"
                      >
                        <ScanLine className="h-4 w-4" /> Analiz Et
                      </button>
                      <button
                        type="button"
                        onClick={resetPhoto}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" /> Fotoğrafı Sil
                      </button>
                    </div>
                  </div>
                )}

                <AnimatePresence>
                  {photoResult && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 border-t border-sage-100 p-4 sm:p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-sage-500" />
                          <p className="font-semibold text-cream-900">{photoResult.label}</p>
                        </div>
                        <button type="button" onClick={resetPhoto} className="flex items-center gap-1.5 text-xs text-cream-800/50 hover:text-sage-700">
                          <RefreshCw className="h-3.5 w-3.5" /> Yeni Fotoğraf
                        </button>
                      </div>
                      <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                        <p className="text-xs text-amber-700">Tahmini değerlerdir; gerçek kalori farklılık gösterebilir.</p>
                      </div>
                      {photoResult.items?.length > 0 && (
                        <div className="divide-y divide-cream-100 rounded-2xl border border-cream-200">
                          {photoResult.items.map((item, i) => (
                            <div key={i} className="flex items-center justify-between gap-3 px-3.5 py-3 sm:px-4">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-cream-900">{item.name}</p>
                                <p className="text-xs text-cream-800/50">{item.amount} {item.unit}</p>
                              </div>
                              <span className="shrink-0 font-bold text-sage-600">{item.cal} kcal</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoSelect} className="hidden" />
          </motion.div>
        )}
      </AnimatePresence>
    </PanelPageShell>
  )
}

function CalorieSummaryCard({ totalCal, macros }) {
  const level = totalCal < 300 ? 'Az' : totalCal < 600 ? 'Orta' : totalCal < 900 ? 'Yüksek' : 'Çok Yüksek'

  return (
    <motion.div layout className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-xl shadow-brand-500/30 sm:rounded-3xl">
      <div className="p-4 sm:p-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-white/75">Toplam Kalori</p>
            <p className="font-display text-4xl font-bold sm:text-5xl">{totalCal}</p>
            <p className="text-sm text-white/75">kcal · {level}</p>
          </div>
          <Flame className="h-9 w-9 text-white/30 sm:h-10 sm:w-10" />
        </div>
        {totalCal > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: 'Protein', value: macros.protein, unit: 'g' },
              { label: 'Karb.', value: macros.carb, unit: 'g' },
              { label: 'Yağ', value: macros.fat, unit: 'g' },
            ].map((m) => (
              <div key={m.label} className="rounded-xl bg-white/15 px-2 py-2 text-center sm:px-3">
                <p className="text-base font-bold sm:text-lg">{m.value}{m.unit}</p>
                <p className="text-[10px] text-white/70 sm:text-xs">{m.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      {totalCal > 0 && (
        <div className="border-t border-white/10 bg-black/10 px-4 py-3 sm:px-5">
          <p className="flex items-center gap-2 text-xs text-white/60">
            <BarChart3 className="h-3.5 w-3.5" />
            Günlük 2000 kcal hedefinin <strong className="text-white">{Math.round((totalCal / 2000) * 100)}%</strong>&apos;i
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
