import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, ExternalLink, FileText, Loader2, Upload, X } from 'lucide-react'
import {
  getHealthLabResultUrl,
  removeHealthLabResult,
  uploadHealthLabResult,
} from '../../services/supabaseDb'
import {
  HEALTH_LAB_ACCEPT,
  isHealthLabImage,
} from '../../utils/healthLabFiles'

export default function HealthLabFilesPanel({
  memberId,
  files = [],
  canEdit = false,
  onFilesChange,
  busy = false,
}) {
  const [urls, setUrls] = useState({})
  const [urlError, setUrlError] = useState({})
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [removingPath, setRemovingPath] = useState('')

  useEffect(() => {
    if (!memberId || !files.length) {
      setUrls({})
      setUrlError({})
      return undefined
    }
    let cancelled = false
    ;(async () => {
      const next = {}
      const failed = {}
      await Promise.all(files.map(async (file) => {
        const res = await getHealthLabResultUrl(file.path, memberId)
        if (res.success && res.url) next[file.path] = res.url
        else failed[file.path] = true
      }))
      if (!cancelled) {
        setUrls(next)
        setUrlError(failed)
      }
    })()
    return () => { cancelled = true }
  }, [files, memberId])

  const handleFiles = useCallback(async (fileList) => {
    if (!canEdit || !fileList?.length || !memberId || !onFilesChange) return
    setError('')
    setUploading(true)
    try {
      const next = [...files]
      for (const file of Array.from(fileList)) {
        const res = await uploadHealthLabResult(file, memberId)
        if (!res.success) {
          setError(res.error || 'Yükleme başarısız')
          break
        }
        next.push({ path: res.path, name: file.name, contentType: file.type || '' })
      }
      if (next.length !== files.length) await onFilesChange(next)
    } finally {
      setUploading(false)
    }
  }, [canEdit, files, memberId, onFilesChange])

  const handleRemove = useCallback(async (path) => {
    if (!canEdit || !memberId || !onFilesChange) return
    setError('')
    setRemovingPath(path)
    try {
      const res = await removeHealthLabResult(path, memberId)
      if (!res.success) {
        setError(res.error || 'Dosya silinemedi')
        return
      }
      await onFilesChange(files.filter((f) => f.path !== path))
    } finally {
      setRemovingPath('')
    }
  }, [canEdit, files, memberId, onFilesChange])

  const disabled = busy || uploading || Boolean(removingPath)

  return (
    <section className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/70 via-white to-amber-50/40 p-4 sm:p-5">
      <div className="mb-3 flex items-start gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-white shadow-sm">
          <FileText className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-base font-bold text-cream-900">Kan tahlilleri</h3>
          <p className="text-xs leading-relaxed text-cream-800/55">
            {canEdit
              ? 'PDF veya fotoğraf yükleyin. Uzmanlarınız sağlık profilinizde görür.'
              : 'Üyenin yüklediği laboratuvar sonuçları'}
          </p>
        </div>
      </div>

      {files.length === 0 && (
        <p className="rounded-xl border border-dashed border-rose-200/80 bg-white/70 px-3 py-6 text-center text-sm text-cream-800/50">
          Henüz tahlil yüklenmedi
        </p>
      )}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file) => {
            const url = urls[file.path]
            const image = isHealthLabImage(file)
            return (
              <li
                key={file.path}
                className="flex items-center gap-3 rounded-xl border border-cream-200 bg-white px-3 py-2.5"
              >
                {image && url ? (
                  <img
                    src={url}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-lg object-cover ring-1 ring-cream-200"
                  />
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-cream-50 text-cream-800/45 ring-1 ring-cream-200">
                    <FileText className="h-5 w-5" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-cream-900">{file.name}</p>
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                    >
                      Aç <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : urlError[file.path] ? (
                    <p className="mt-0.5 text-xs text-rose-600/80">Dosya açılamadı</p>
                  ) : (
                    <p className="mt-0.5 text-xs text-cream-800/40">Bağlantı hazırlanıyor…</p>
                  )}
                </div>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => handleRemove(file.path)}
                    disabled={disabled}
                    className="rounded-lg p-1.5 text-cream-800/45 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                    aria-label={`${file.name} dosyasını sil`}
                  >
                    {removingPath === file.path
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <X className="h-4 w-4" />}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {canEdit && (
        <label className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-rose-200 bg-white/80 px-4 py-5 transition hover:border-rose-400">
          <Upload className="h-5 w-5 text-rose-500" />
          <span className="text-sm font-semibold text-cream-900">
            {uploading ? 'Yükleniyor…' : 'PDF veya fotoğraf yükleyin'}
          </span>
          <span className="text-xs text-cream-800/50">En fazla 8 MB · PDF, JPG, PNG, WEBP</span>
          <input
            type="file"
            accept={HEALTH_LAB_ACCEPT}
            multiple
            className="hidden"
            disabled={disabled || !memberId}
            onChange={(e) => {
              handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </label>
      )}

      {error && (
        <p className="mt-3 flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
    </section>
  )
}
