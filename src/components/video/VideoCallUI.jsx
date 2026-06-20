import { useRef, useEffect } from 'react'
import { Mic, MicOff, Video, VideoOff, Monitor, User, Loader2, PhoneOff, LogIn } from 'lucide-react'
import { attachTrack } from '../../hooks/useDailyCall'

export default function ParticipantTile({ participant, label, large = false, meta, pip = false }) {
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

  const sizeClass = pip
    ? 'aspect-[3/4] w-28 sm:w-36 shadow-2xl ring-2 ring-white/30'
    : large
      ? 'min-h-[min(50dvh,420px)] w-full flex-1'
      : 'aspect-video w-full'

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gray-950 ring-1 ${meta?.ring || 'ring-white/10'} ${sizeClass}`}>
      <video ref={videoRef} autoPlay playsInline muted={participant?.local} className={`h-full w-full object-cover ${camOn ? '' : 'hidden'}`} />
      {!camOn && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-gray-900 to-gray-950 sm:gap-3">
          <div className={`flex items-center justify-center rounded-full ${meta?.lightBg || 'bg-brand-100'} ${meta?.text || 'text-brand-700'} ${pip ? 'h-12 w-12' : 'h-16 w-16 sm:h-20 sm:w-20'}`}>
            <User className={pip ? 'h-6 w-6' : 'h-8 w-8 sm:h-10 sm:w-10'} />
          </div>
          {!pip && <p className="text-xs font-medium text-white/70 sm:text-sm">Kamera kapalı</p>}
        </div>
      )}
      {!participant?.local && <audio ref={audioRef} autoPlay playsInline className="hidden" />}

      <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent ${pip ? 'px-2 py-1.5' : 'px-3 py-2 sm:px-4 sm:py-3'}`}>
        <div className="flex items-center justify-between gap-1">
          <p className={`truncate font-semibold text-white ${pip ? 'text-[10px]' : 'text-xs sm:text-sm'}`}>{label || participant?.user_name || 'Katılımcı'}</p>
          <div className="flex shrink-0 items-center gap-1">
            {!micOn && <span className="rounded-full bg-red-500/90 p-0.5 sm:p-1"><MicOff className="h-2.5 w-2.5 text-white sm:h-3 sm:w-3" /></span>}
            {!camOn && <span className="rounded-full bg-gray-700/90 p-0.5 sm:p-1"><VideoOff className="h-2.5 w-2.5 text-white sm:h-3 sm:w-3" /></span>}
          </div>
        </div>
      </div>
    </div>
  )
}

export function WaitingTile({ label, message, meta, large = false, pip = false }) {
  const sizeClass = pip
    ? 'aspect-[3/4] w-28 sm:w-36'
    : large
      ? 'min-h-[min(50dvh,420px)] w-full flex-1'
      : 'aspect-video min-h-[200px] w-full sm:min-h-[280px]'

  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-gray-900/50 ring-1 ${meta?.ring || 'ring-white/10'} ${sizeClass}`}>
      <Loader2 className={`animate-spin text-white/35 ${pip ? 'h-5 w-5' : 'h-8 w-8'}`} />
      <p className={`mt-2 font-medium text-white/70 ${pip ? 'text-[10px]' : 'text-xs sm:text-sm'}`}>{label}</p>
      {message && !pip && <p className="mt-1 max-w-xs px-4 text-center text-[11px] text-white/45 sm:text-xs">{message}</p>}
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
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      <button
        type="button"
        onClick={onToggleMic}
        className={`flex h-11 w-11 items-center justify-center rounded-full transition sm:h-12 sm:w-12 ${mediaState.micOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white'}`}
        title={mediaState.micOn ? 'Sesi kapat' : 'Sesi aç'}
      >
        {mediaState.micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </button>
      <button
        type="button"
        onClick={onToggleCam}
        className={`flex h-11 w-11 items-center justify-center rounded-full transition sm:h-12 sm:w-12 ${mediaState.camOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white'}`}
        title={mediaState.camOn ? 'Kamerayı kapat' : 'Kamerayı aç'}
      >
        {mediaState.camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </button>
      {showScreenShare && (
        <button
          type="button"
          onClick={onToggleScreen}
          disabled={!isJoined}
          className={`hidden h-11 w-11 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-40 sm:flex sm:h-12 sm:w-12 ${mediaState.screenSharing ? 'bg-brand-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
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
          className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-amber-700 disabled:opacity-50 sm:px-6 sm:py-3"
        >
          <PhoneOff className="h-4 w-4" />
          <span className="hidden xs:inline">Görüşmeden Ayrıl</span>
          <span className="xs:hidden">Ayrıl</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onJoin}
          disabled={isLoading || !canJoin}
          className="inline-flex items-center gap-2 rounded-full bg-green-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-green-700 disabled:opacity-50 sm:px-6 sm:py-3"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          Katıl
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
