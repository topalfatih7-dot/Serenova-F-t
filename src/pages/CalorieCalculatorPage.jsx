import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Camera, Flame, BarChart3,
  CheckCircle, RefreshCw, AlertCircle,
  Send, Sparkles, MessageSquare, Trash2, ScanLine,
} from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { useApp } from '../context/AppContext'
import { hasPhotoCalorieAccess, hasManualCalorieAccess } from '../data/membershipPlans'
import { analyzeFoodPhoto } from '../services/aiVision'
import {
  analyzeFoodText,
  formatAnalysisReply,
} from '../services/calorieChat'
import PanelPageHeader, { PanelPageShell } from '../components/layout/PanelPageHeader'

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

export default function CalorieCalculatorPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { membership, user, updateProfile } = useApp()
  const fileRef = useRef(null)
  const chatEndRef = useRef(null)

  const isPaid = hasManualCalorieAccess(membership)
  const isPlatinum = hasPhotoCalorieAccess(membership)

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

  if (!isPaid) {
    return (
      <PanelPageShell>
        <button type="button" onClick={() => navigate(-1)} className="panel-back-btn">
          <ArrowLeft className="h-4 w-4" /> Geri Dön
        </button>
        <div className="glass-card-solid overflow-hidden p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-lg">
            <Flame className="h-8 w-8" />
          </div>
          <h1 className="mt-4 font-display text-xl font-bold text-cream-900">Kalori Hesaplayıcı</h1>
          <p className="mt-2 text-sm text-cream-800/70">Bu özellik Gümüş ve üzeri paketlerde kullanılabilir.</p>
          <Link to="/membership" className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:scale-105">
            Planları İncele
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
      />

      <div className="flex glass-card-solid p-1.5">
        {[
          { id: 'chat', icon: MessageSquare, label: 'Yazarak Analiz' },
          ...(isPlatinum ? [{ id: 'photo', icon: Camera, label: 'Fotoğrafla Analiz' }] : []),
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition ${
              mode === id ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md' : 'text-cream-800/60 hover:text-cream-900'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {activeTotal > 0 && (
        <CalorieSummaryCard totalCal={activeTotal} macros={estimateMacros(activeTotal)} />
      )}

      <AnimatePresence mode="wait">
        {mode === 'chat' ? (
          <motion.div key="chat" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-cream-100 bg-gradient-to-r from-brand-50 to-white px-5 py-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 text-white">
                  <MessageSquare className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-cream-900">Ne Yediniz?</p>
                  <p className="text-xs text-cream-800/50">Yazdığınız öğün için tahmini kalori değerleri hesaplanır</p>
                </div>
              </div>

              <div className="max-h-[min(420px,50dvh)] space-y-2 overflow-y-auto p-4">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user' ? 'rounded-br-sm bg-brand-500 text-white'
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
                    <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-cream-100 px-4 py-2.5 text-sm text-cream-600">
                      <Sparkles className="h-3.5 w-3.5 animate-pulse text-brand-500" /> Analiz ediliyor…
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="border-t border-cream-100 p-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleChatSend()}
                    disabled={chatProcessing}
                    placeholder="Örn: 2 yumurta, 1 dilim ekmek, 200g tavuk"
                    className="flex-1 rounded-xl border border-cream-200 px-4 py-2.5 text-sm focus:border-brand-400 focus:outline-none disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={handleChatSend}
                    disabled={!chatInput.trim() || chatProcessing}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="photo" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">
            {!photo ? (
              <div
                onClick={() => fileRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-brand-200 bg-gradient-to-br from-brand-50/50 to-white py-16 sm:py-20 transition hover:border-brand-400 hover:bg-brand-50/70"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-brand-500">
                  <Camera className="h-10 w-10" />
                </div>
                <div className="text-center px-4">
                  <p className="font-display text-lg font-bold text-cream-900">Yemek Fotoğrafı Yükle</p>
                  <p className="mt-1 text-sm text-cream-800/55">Tabağınızın fotoğrafını çekin veya galeriden seçin</p>
                </div>
                <span className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white">Fotoğraf Seç</span>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-sm">
                <div className="relative">
                  <img src={photo} alt="Yüklenen yemek" className="max-h-[min(360px,45dvh)] w-full object-cover" />
                  {analyzing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500">
                        <Flame className="h-8 w-8 text-white" />
                      </motion.div>
                      <p className="mt-4 font-semibold text-white">Analiz ediliyor…</p>
                    </div>
                  )}
                </div>

                {!photoResult && !analyzing && (
                  <div className="space-y-4 border-t border-cream-100 p-5">
                    <div className="flex items-start gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                      <p className="text-xs leading-relaxed text-brand-800">
                        Fotoğraf yüklendi. Analizi başlatmadan önce görseli kontrol edin; isterseniz silebilirsiniz.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={handlePhotoAnalyze}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-105"
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
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 border-t border-cream-100 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-sage-500" />
                          <p className="font-semibold text-cream-900">{photoResult.label}</p>
                        </div>
                        <button type="button" onClick={resetPhoto} className="flex items-center gap-1.5 text-xs text-cream-800/50 hover:text-brand-600">
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
                            <div key={i} className="flex items-center justify-between px-4 py-3">
                              <div>
                                <p className="text-sm font-medium text-cream-900">{item.name}</p>
                                <p className="text-xs text-cream-800/50">{item.amount} {item.unit}</p>
                              </div>
                              <span className="font-bold text-brand-600">{item.cal} kcal</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
          </motion.div>
        )}
      </AnimatePresence>
    </PanelPageShell>
  )
}

function CalorieSummaryCard({ totalCal, macros }) {
  const level = totalCal < 300 ? 'Az' : totalCal < 600 ? 'Orta' : totalCal < 900 ? 'Yüksek' : 'Çok Yüksek'

  return (
    <motion.div layout className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-xl shadow-brand-500/30">
      <div className="p-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-white/75">Toplam Kalori</p>
            <p className="font-display text-4xl font-bold sm:text-5xl">{totalCal}</p>
            <p className="text-sm text-white/75">kcal · {level}</p>
          </div>
          <Flame className="h-10 w-10 text-white/30" />
        </div>
        {totalCal > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: 'Protein', value: macros.protein, unit: 'g' },
              { label: 'Karb.', value: macros.carb, unit: 'g' },
              { label: 'Yağ', value: macros.fat, unit: 'g' },
            ].map((m) => (
              <div key={m.label} className="rounded-xl bg-white/15 px-3 py-2 text-center">
                <p className="text-lg font-bold">{m.value}{m.unit}</p>
                <p className="text-xs text-white/70">{m.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      {totalCal > 0 && (
        <div className="border-t border-white/10 bg-black/10 px-5 py-3">
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
