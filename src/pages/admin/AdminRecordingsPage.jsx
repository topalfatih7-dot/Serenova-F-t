import { useCallback, useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
  Video, Loader2, Play, AlertTriangle, Clock,
} from 'lucide-react'
import {
  fetchSessionRecordings,
  getSessionRecordingPlaybackUrl,
  formatRecordingDuration,
} from '../../services/sessionRecording'

const TYPE_META = {
  coach: { label: 'Koç', className: 'text-brand-600 bg-brand-50' },
  dietitian: { label: 'Diyetisyen', className: 'text-sage-600 bg-sage-50' },
  doctor: { label: 'Doktor', className: 'text-amber-600 bg-amber-50' },
}

function RecordingPlayerModal({ recording, onClose }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getSessionRecordingPlaybackUrl(recording.id)
      .then((playbackUrl) => { if (active) setUrl(playbackUrl) })
      .catch((e) => { if (active) setError(e.message || 'Video yüklenemedi.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [recording.id])

  const meta = TYPE_META[recording.session_type] || TYPE_META.coach

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-cream-100 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg font-bold text-cream-900">
                {recording.member_name || 'Üye'} · {meta.label} Görüşmesi
              </p>
              <p className="mt-1 text-sm text-cream-800/60">
                {recording.recorded_at
                  ? format(new Date(recording.recorded_at), 'd MMMM yyyy HH:mm', { locale: tr })
                  : '—'}
                {' · '}
                {formatRecordingDuration(recording.duration_sec)}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-cream-800/60 hover:bg-cream-100"
            >
              Kapat
            </button>
          </div>
        </div>

        <div className="aspect-video bg-gray-950">
          {loading && (
            <div className="flex h-full items-center justify-center gap-2 text-white/70">
              <Loader2 className="h-6 w-6 animate-spin" />
              Video hazırlanıyor…
            </div>
          )}
          {!loading && error && (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-red-200">
              <AlertTriangle className="h-8 w-8" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          {!loading && url && (
            <video src={url} controls autoPlay className="h-full w-full" playsInline />
          )}
        </div>

        {recording.staff_name && (
          <p className="border-t border-cream-100 px-5 py-3 text-xs text-cream-800/55">
            Uzman: {recording.staff_name}
          </p>
        )}
      </div>
    </div>
  )
}

export default function AdminRecordingsPage() {
  const [recordings, setRecordings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeRecording, setActiveRecording] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const rows = await fetchSessionRecordings({ limit: 100 })
      setRecordings(rows)
    } catch (e) {
      setError(e.message || 'Kayıtlar yüklenemedi.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream-900">Görüşme Kayıtları</h1>
        <p className="mt-1 text-sm text-cream-800/60">
          Daily.co üzerinden otomatik kaydedilen koç, diyetisyen ve doktor görüşmeleri
        </p>
      </div>

      <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm text-amber-900/80">
        <p className="font-medium">KVKK notu</p>
        <p className="mt-1 text-xs leading-relaxed">
          Kayıtlar yalnızca admin panelinden izlenebilir. Daily.co webhook yapılandırması
          (`DAILY_WEBHOOK_HMAC`) ve ücretli plan gereklidir.
        </p>
      </div>

      {loading ? (
        <p className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-cream-200 py-12 text-sm text-cream-800/50">
          <Loader2 className="h-4 w-4 animate-spin" /> Kayıtlar yükleniyor…
        </p>
      ) : error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-700">
          {error}
        </p>
      ) : recordings.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-cream-200 py-12 text-center text-sm text-cream-800/50">
          Henüz kayıt yok. Personel görüşmeye katıldığında otomatik kayıt başlar.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-cream-200 bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-cream-100 text-left">
                <th className="px-4 py-3 font-medium text-cream-800/60">Tarih</th>
                <th className="px-4 py-3 font-medium text-cream-800/60">Üye</th>
                <th className="px-4 py-3 font-medium text-cream-800/60">Tür</th>
                <th className="px-4 py-3 font-medium text-cream-800/60">Uzman</th>
                <th className="px-4 py-3 font-medium text-cream-800/60">Süre</th>
                <th className="px-4 py-3 font-medium text-cream-800/60">Durum</th>
                <th className="px-4 py-3 font-medium text-cream-800/60" />
              </tr>
            </thead>
            <tbody>
              {recordings.map((rec) => {
                const meta = TYPE_META[rec.session_type] || TYPE_META.coach
                return (
                  <tr key={rec.id} className="border-b border-cream-50">
                    <td className="px-4 py-3 text-cream-800/70">
                      {rec.recorded_at
                        ? format(new Date(rec.recorded_at), 'd MMM yyyy HH:mm', { locale: tr })
                        : '—'}
                    </td>
                    <td className="px-4 py-3 font-medium">{rec.member_name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.className}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-cream-800/70">{rec.staff_name || '—'}</td>
                    <td className="px-4 py-3 text-cream-800/70">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatRecordingDuration(rec.duration_sec)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        rec.status === 'ready'
                          ? 'bg-sage-50 text-sage-700'
                          : rec.status === 'error'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-amber-50 text-amber-700'
                      }`}>
                        {rec.status === 'ready' ? 'Hazır' : rec.status === 'error' ? 'Hata' : 'İşleniyor'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={rec.status !== 'ready'}
                        onClick={() => setActiveRecording(rec)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Play className="h-3.5 w-3.5" /> İzle
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeRecording && (
        <RecordingPlayerModal
          recording={activeRecording}
          onClose={() => setActiveRecording(null)}
        />
      )}
    </div>
  )
}

export function SessionRecordingBadge({ sessionId }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!sessionId) return undefined
    let active = true
    fetchSessionRecordings({ sessionId, limit: 5 })
      .then((rows) => { if (active) setCount(rows.filter((r) => r.status === 'ready').length) })
      .catch(() => {})
    return () => { active = false }
  }, [sessionId])

  if (!count) return null
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
      <Video className="h-3 w-3" /> {count} kayıt
    </span>
  )
}
