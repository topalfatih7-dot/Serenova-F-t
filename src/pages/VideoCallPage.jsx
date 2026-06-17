import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
  ArrowLeft, Clock, Calendar, AlertTriangle, Loader2,
  Settings, Wifi, Dumbbell, Apple, UserRound,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useDailyCall } from '../hooks/useDailyCall'
import {
  buildRoomUrl, isVideoCallConfigured, SESSION_TYPE_META, VIDEO_CALL_CONFIG,
} from '../config/videoCall'
import { canJoinSession, resolveCallContext } from '../services/videoCallSession'
import { formatMinutesTr } from '../utils/formatDuration'
import ParticipantTile, { CallControls, DeviceSelectors, WaitingTile } from '../components/video/VideoCallUI'

function ConfigMissingPanel() {
  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-amber-200 bg-white p-8 shadow-xl">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
        <Settings className="h-7 w-7" />
      </div>
      <h1 className="mt-4 font-display text-xl font-bold text-cream-900">Video SDK Yapılandırması Gerekli</h1>
      <p className="mt-2 text-sm leading-relaxed text-cream-800/65">
        Görüşme altyapısı hazır; yalnızca Daily.co bağlantı bilgilerinizi eklemeniz gerekiyor.
      </p>
      <div className="mt-5 rounded-2xl bg-gray-950 p-4 font-mono text-xs text-green-400">
        <p className="text-white/50"># .env dosyanıza ekleyin:</p>
        <p className="mt-2">VITE_DAILY_DOMAIN=yourteam.daily.co</p>
        <p>VITE_DAILY_ROOM_PREFIX=donusum</p>
      </div>
      <Link to="/dashboard" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Panele dön
      </Link>
    </div>
  )
}

export default function VideoCallPage({ audience = 'member' }) {
  const { sessionType, sessionId } = useParams()
  const navigate = useNavigate()
  const {
    user, staffUser, isStaff, platform,
    coachSessions, dietitianSessions,
  } = useApp()

  const [, tick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  const meta = SESSION_TYPE_META[sessionType === 'dietitian' ? 'dietitian' : 'coach']
  const RoleIcon = sessionType === 'dietitian' ? Apple : Dumbbell

  const context = useMemo(() => resolveCallContext({
    audience,
    sessionType,
    sessionId,
    user,
    staffUser,
    isStaff: audience === 'staff' || isStaff,
    platformMembers: platform?.members,
    coachSessions,
    dietitianSessions,
  }), [audience, sessionType, sessionId, user, staffUser, isStaff, platform, coachSessions, dietitianSessions])

  const roomUrl = buildRoomUrl(context.sessionType, sessionId)
  const configured = isVideoCallConfigured()

  const call = useDailyCall({
    roomUrl,
    userName: context.displayName,
    enabled: configured && !context.error && context.roomAccess?.ok,
  })

  const backPath = audience === 'staff'
    ? '/staff'
    : sessionType === 'dietitian' ? '/schedule/dietitian' : '/schedule/coach'

  const handleExit = () => {
    call.destroy()
    navigate(backPath)
  }

  if (!configured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cream-100 to-brand-50 p-4">
        <ConfigMissingPanel />
      </div>
    )
  }

  if (context.error || !context.roomAccess?.ok) {
    const message = context.error || context.roomAccess?.reason
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4">
        <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
          <h1 className="mt-4 font-display text-xl font-bold text-cream-900">Görüşme Bulunamadı</h1>
          <p className="mt-2 text-sm text-cream-800/65">{message}</p>
          <Link to={backPath} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white">
            <ArrowLeft className="h-4 w-4" /> Geri Dön
          </Link>
        </div>
      </div>
    )
  }

  const { session } = context
  const joinCheck = canJoinSession(session)
  const sessionDate = new Date(session.date)
  const remote = call.participants.remote[0]
  const local = call.participants.local
  const canJoinLive = context.roomAccess?.ok

  const statusBadge = call.isJoined
    ? { dot: 'bg-green-400 animate-pulse', text: 'Canlı' }
    : joinCheck.timing?.isBeforeWindow
      ? { dot: 'bg-amber-400', text: 'Beklemede' }
      : { dot: 'bg-white/40', text: 'Hazır' }

  return (
    <div className="flex min-h-screen flex-col bg-gray-950 text-white">
      <header className={`flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-r ${meta.gradient} px-4 py-3 sm:px-6`}>
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleExit} className="rounded-lg p-1.5 hover:bg-white/10" title="Geri dön">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <RoleIcon className="h-5 w-5" />
          <div>
            <p className="text-sm font-bold">{meta.label}</p>
            <p className="text-xs text-white/60">{format(sessionDate, 'd MMMM yyyy · HH:mm', { locale: tr })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs">
          <span className={`h-2 w-2 rounded-full ${statusBadge.dot}`} />
          {call.isLoading ? 'Bağlanıyor…' : joinCheck.statusLabel || statusBadge.text}
        </div>
      </header>

      <div className="relative flex flex-1 flex-col items-center justify-center gap-4 p-4 sm:p-6">
        {call.isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-950/80">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
          </div>
        )}

        <div className="grid w-full max-w-5xl gap-4 lg:grid-cols-[1fr_300px]">
          <div className="relative">
            {remote ? (
              <ParticipantTile participant={remote} label={context.remoteLabel} large meta={meta} />
            ) : (
              <WaitingTile
                label={call.isJoined ? `${context.remoteLabel} bekleniyor…` : context.remoteLabel}
                message={call.isJoined ? 'Karşı taraf odaya katıldığında burada görünecek.' : joinCheck.reason || 'Görüşmeye katılmadan önce cihazlarınızı test edebilirsiniz.'}
                meta={meta}
              />
            )}
          </div>

          <div className="space-y-4">
            {local ? (
              <ParticipantTile participant={local} label={`${context.displayName} (Siz)`} meta={meta} />
            ) : (
              <WaitingTile label="Kamera önizlemesi" message="Kamera izni verin veya cihaz seçin." meta={meta} />
            )}

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
              <p className="font-semibold text-white/90">Görüşme Bilgisi</p>
              <ul className="mt-2 space-y-2 text-xs text-white/55">
                <li className="flex items-start gap-2">
                  <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {format(sessionDate, 'd MMMM yyyy, EEEE', { locale: tr })}
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {format(sessionDate, 'HH:mm')} · {formatMinutesTr(session.duration || 30)}
                </li>
                <li className="flex items-start gap-2">
                  <UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {audience === 'staff' ? `Danışan: ${context.remoteLabel}` : `${meta.roleLabel}: ${context.remoteLabel}`}
                </li>
                <li className="flex items-start gap-2">
                  <Wifi className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Oda: {roomUrl?.split('/').pop()}
                </li>
              </ul>
              {!joinCheck.ok && joinCheck.reason && (
                <p className="mt-3 rounded-lg bg-amber-500/15 px-3 py-2 text-xs text-amber-200">{joinCheck.reason}</p>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold text-white/70">Cihaz Ayarları</p>
              <div className="mt-3">
                <DeviceSelectors
                  devices={call.devices}
                  selectedDevices={call.selectedDevices}
                  onCameraChange={call.setCamera}
                  onMicChange={call.setMic}
                  disabled={call.isLoading}
                />
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-white/35">
                Oda {formatMinutesTr(VIDEO_CALL_CONFIG.joinMinutesBefore)} önce açılır, randevu bitiminden {formatMinutesTr(VIDEO_CALL_CONFIG.joinMinutesAfter)} sonra kapanır.
              </p>
            </div>
          </div>
        </div>

        {call.error && (
          <p className="w-full max-w-5xl rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">{call.error}</p>
        )}
      </div>

      <footer className="border-t border-white/10 bg-gray-900/90 px-4 py-5 backdrop-blur">
        <CallControls
          mediaState={call.mediaState}
          isJoined={call.isJoined}
          isLoading={call.isLoading}
          canJoin={canJoinLive}
          onToggleMic={call.toggleMic}
          onToggleCam={call.toggleCam}
          onToggleScreen={call.toggleScreenShare}
          onJoin={call.join}
          onLeaveMeeting={call.leaveMeeting}
          showScreenShare
        />
      </footer>
    </div>
  )
}
