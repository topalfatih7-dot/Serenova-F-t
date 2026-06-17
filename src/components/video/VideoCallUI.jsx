import { useRef, useEffect } from 'react'
import { Mic, MicOff, Video, VideoOff, Monitor, User, Loader2, PhoneOff, LogIn } from 'lucide-react'
import { attachTrack } from '../../hooks/useDailyCall'

export default function ParticipantTile({ participant, label, large = false, meta }) {
  const videoRef = useRef(null)
  const audioRef = useRef(null)

  const videoTrack = participant?.tracks?.video?.persistentTrack || participant?.tracks?.video?.track
  const audioTrack = participant?.tracks?.audio?.persistentTrack || participant?.tracks?.audio?.track
  const camOn = participant?.tracks?.video?.state === 'playable' || participant?.tracks?.video?.state === 'sendable'
  const micOn = participant?.tracks?.audio?.state === 'playable' || participant?.tracks?.audio?.state === 'sendable'

  useEffect(() => {
    attachTrack(videoRef.current, camOn ? videoTrack : null)
  }, [videoTrack, camOn])

  useEffect(() => {
    if (!participant?.local) {
      attachTrack(audioRef.current, audioTrack)
    }
  }, [audioTrack, participant?.local])

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gray-950 ring-1 ${meta?.ring || 'ring-white/10'} ${large ? 'aspect-video min-h-[280px] w-full' : 'aspect-video w-full'}`}>
      <video ref={videoRef} autoPlay playsInline muted={participant?.local} className={`h-full w-full object-cover ${camOn ? '' : 'hidden'}`} />
      {!camOn && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-gray-900 to-gray-950">
          <div className={`flex h-20 w-20 items-center justify-center rounded-full ${meta?.lightBg || 'bg-brand-100'} ${meta?.text || 'text-brand-700'}`}>
            <User className="h-10 w-10" />
          </div>
          <p className="text-sm font-medium text-white/70">Kamera kapalı</p>
        </div>
      )}
      {!participant?.local && <audio ref={audioRef} autoPlay playsInline className="hidden" />}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-white">{label || participant?.user_name || 'Katılımcı'}</p>
          <div className="flex shrink-0 items-center gap-1.5">
            {!micOn && <span className="rounded-full bg-red-500/90 p-1"><MicOff className="h-3 w-3 text-white" /></span>}
            {!camOn && <span className="rounded-full bg-gray-700/90 p-1"><VideoOff className="h-3 w-3 text-white" /></span>}
          </div>
        </div>
      </div>
    </div>
  )
}

export function WaitingTile({ label, message, meta }) {
  return (
    <div className={`flex aspect-video min-h-[280px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-gray-900/50 ring-1 ${meta?.ring || 'ring-white/10'}`}>
      <Loader2 className="h-8 w-8 animate-spin text-white/35" />
      <p className="mt-4 text-sm font-medium text-white/70">{label}</p>
      {message && <p className="mt-1 max-w-xs text-center text-xs text-white/45">{message}</p>}
    </div>
  )
}

export function CallControls({
  mediaState,
  isJoined,
  isLoading,
  canJoin,
  onToggleMic,
  onToggleCam,
  onToggleScreen,
  onJoin,
  onLeaveMeeting,
  showScreenShare = true,
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        onClick={onToggleMic}
        className={`flex h-12 w-12 items-center justify-center rounded-full transition ${mediaState.micOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white'}`}
        title={mediaState.micOn ? 'Sesi kapat' : 'Sesi aç'}
      >
        {mediaState.micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </button>
      <button
        type="button"
        onClick={onToggleCam}
        className={`flex h-12 w-12 items-center justify-center rounded-full transition ${mediaState.camOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white'}`}
        title={mediaState.camOn ? 'Kamerayı kapat' : 'Kamerayı aç'}
      >
        {mediaState.camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </button>
      {showScreenShare && (
        <button
          type="button"
          onClick={onToggleScreen}
          disabled={!isJoined}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-40 ${mediaState.screenSharing ? 'bg-brand-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
          title={isJoined ? 'Ekran paylaş' : 'Ekran paylaşımı için önce görüşmeye katılın'}
        >
          <Monitor className="h-5 w-5" />
        </button>
      )}

      {isJoined ? (
        <button
          type="button"
          onClick={onLeaveMeeting}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-amber-700 disabled:opacity-50"
        >
          <PhoneOff className="h-4 w-4" />
          Görüşmeden Ayrıl
        </button>
      ) : (
        <button
          type="button"
          onClick={onJoin}
          disabled={isLoading || !canJoin}
          className="inline-flex items-center gap-2 rounded-full bg-green-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          Görüşmeye Katıl
        </button>
      )}
    </div>
  )
}

export function DeviceSelectors({ devices, selectedDevices, onCameraChange, onMicChange, disabled }) {
  if (!devices.cameras?.length && !devices.mics?.length) return null
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {devices.cameras?.length > 0 && (
        <label className="block text-left">
          <span className="text-xs font-medium text-white/50">Kamera</span>
          <select
            disabled={disabled}
            value={selectedDevices.cameraId}
            onChange={(e) => onCameraChange(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          >
            {devices.cameras.map((d) => (
              <option key={d.deviceId} value={d.deviceId} className="text-cream-900">{d.label || 'Kamera'}</option>
            ))}
          </select>
        </label>
      )}
      {devices.mics?.length > 0 && (
        <label className="block text-left">
          <span className="text-xs font-medium text-white/50">Mikrofon</span>
          <select
            disabled={disabled}
            value={selectedDevices.micId}
            onChange={(e) => onMicChange(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          >
            {devices.mics.map((d) => (
              <option key={d.deviceId} value={d.deviceId} className="text-cream-900">{d.label || 'Mikrofon'}</option>
            ))}
          </select>
        </label>
      )}
    </div>
  )
}
