import { useState } from 'react'
import { Star } from 'lucide-react'
import Modal from '../ui/Modal'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'

export default function SuccessStorySubmitModal({ open, onClose }) {
  const { submitSuccessStory, isAuthenticated } = useApp()
  const { toast } = useToast()
  const [story, setStory] = useState('')
  const [duration, setDuration] = useState('')
  const [consent, setConsent] = useState(false)
  const [saving, setSaving] = useState(false)

  const reset = () => {
    setStory('')
    setDuration('')
    setConsent(false)
  }

  const handleClose = () => {
    if (saving) return
    onClose?.()
  }

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast('Hikaye göndermek için giriş yapın', 'warning')
      return
    }
    if (!story.trim()) {
      toast('Lütfen hikayenizi yazın', 'warning')
      return
    }
    if (!consent) {
      toast('Paylaşım onayı gerekli', 'warning')
      return
    }
    setSaving(true)
    const r = await submitSuccessStory({
      story: story.trim(),
      highlight: story.trim().slice(0, 80),
      duration: duration.trim(),
    })
    setSaving(false)
    if (r?.success === false) {
      toast(r.error || 'Gönderilemedi', 'error')
      return
    }
    reset()
    onClose?.()
    toast('Hikayeniz incelemeye alındı. Teşekkürler!', 'success')
  }

  return (
    <Modal open={open} onClose={handleClose} title="Başarı Hikayesi Gönder" size="lg">
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-2xl bg-gradient-to-r from-brand-50 to-sage-50 p-4">
          <Star className="mt-0.5 h-5 w-5 shrink-0 text-gold-500" />
          <p className="text-sm text-cream-800/70">
            Deneyiminizi paylaşarak başkalarına ilham verin. Hikayeniz ekibimizce incelendikten sonra yayınlanır.
          </p>
        </div>
        <textarea
          value={story}
          onChange={(e) => setStory(e.target.value)}
          rows={5}
          placeholder="Yolculuğunuzu kısaca anlatın... (nasıl başladınız, neler değişti, nasıl hissediyorsunuz)"
          className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm outline-none focus:border-brand-300"
        />
        <input
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="Program süreniz (ör. 12 hafta)"
          className="w-full rounded-xl border border-cream-200 px-4 py-3 text-sm outline-none focus:border-brand-300"
        />
        <label className="flex items-start gap-3 rounded-xl bg-cream-50 p-4">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
          <span className="text-sm text-cream-800/70">
            Hikayemin platformda paylaşılmasına onay veriyorum. Tıbbi sonuç veya garanti iddiası içermeyeceğini kabul ediyorum.
          </span>
        </label>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="w-full rounded-xl bg-gradient-to-r from-brand-500 to-sage-500 py-3 text-sm font-semibold text-white shadow-md hover:brightness-105 disabled:opacity-60"
        >
          {saving ? 'Gönderiliyor…' : 'Gönder'}
        </button>
      </div>
    </Modal>
  )
}
