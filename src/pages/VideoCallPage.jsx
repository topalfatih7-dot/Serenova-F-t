import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
  ArrowLeft, Clock, Calendar, AlertTriangle, Loader2,
  Settings, Wifi, Dumbbell, Apple, UserRound, ChevronDown, ChevronUp,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useDailyCall } from '../hooks/useDailyCall'
import {
  buildRoomUrl, buildRoomName, isVideoCallConfigured, SESSION_TYPE_META, VIDEO_CALL_CONFIG, getDailyToken,
} from '../config/videoCall'
import { canJoinSession, resolveCallContext } from '../services/videoCallSession'
import { formatMinutesTr } from '../utils/formatDuration'
import ParticipantTile, { CallControls, DeviceSelectors, WaitingTile } from '../components/video/VideoCallUI'
import NoIndexHead from '../components/seo/NoIndexHead'

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
  const [meetingToken, setMeetingToken] = useState('')
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => {
    if (!configured || context.error || !context.roomAccess?.ok) {
      setMeetingToken('')
      return
    }
    let cancelled = false
    const roomName = buildRoomName(context.sessionType, sessionId)
    getDailyToken(roomName, context.displayName, audience === 'staff')
      .then((t) => { if (!cancelled && t) setMeetingToken(t) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [configured, context.error, context.roomAccess?.ok, context.sessionType, sessionId, context.displayName, audience])

  const call = useDailyCall({
    roomUrl,
    userName: context.displayName,
    enabled: configured && !context.error && context.roomAccess?.ok,
    token: meetingToken,
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
      <>
        <NoIndexHead />
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cream-100 to-brand-50 p-4">
        <ConfigMissingPanel />
      </div>
      </>
    )
  }

  if (context.error || !context.roomAccess?.ok) {
    const message = context.error || context.roomAccess?.reason
    return (
      <>
        <NoIndexHead />
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
      </>
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
    <>
      <NoIndexHead />
    <div className="flex h-dvh flex-col overflow-hidden bg-gray-950 text-white">
      <header className={`shrink-0 border-b border-white/10 bg-gradient-to-r ${meta.gradient} px-3 py-3 sm:px-6 sm:py-3`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-2.5 sm:items-center sm:gap-3">
            <button type="button" onClick={handleExit} className="mt-0.5 shrink-0 rounded-lg p-1.5 hover:bg-white/10 sm:mt-0" title="Geri dön">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <RoleIcon className="mt-0.5 h-5 w-5 shrink-0 sm:mt-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-snug break-words sm:text-base">{meta.label}</p>
              {audience === 'staff' && (
                <p className="mt-0.5 text-sm font-semibold leading-snug text-white/95 break-words">
                  {context.remoteLabel}
                </p>
              )}
              <p className="mt-0.5 text-xs leading-relaxed text-white/70 sm:text-sm">
                {format(sessionDate, 'd MMMM yyyy', { locale: tr })}
                <span className="mx-1.5 text-white/40">·</span>
                {format(sessionDate, 'HH:mm')}
              </p>
            </div>
          </div>
          <div className="flex w-full items-center justify-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs sm:w-auto sm:justify-start sm:py-1">
            <span className={`h-2 w-2 shrink-0 rounded-full ${statusBadge.dot}`} />
            <span className="min-w-0 text-center leading-snug sm:text-left">
              {call.isLoading ? 'Bağlanıyor…' : joinCheck.statusLabel || statusBadge.text}
            </span>
          </div>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {call.isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-950/80">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
          </div>
        )}

        <div className="relative flex min-h-0 flex-1 flex-col p-3 sm:p-4 lg:grid lg:grid-cols-[1fr_280px] lg:gap-4 lg:p-6">
          <div className="relative flex min-h-0 flex-1 flex-col">
            {remote ? (
              <ParticipantTile participant={remote} label={context.remoteLabel} large meta={meta} />
            ) : (
              <WaitingTile
                large
                label={call.isJoined ? `${context.remoteLabel} bekleniyor…` : context.remoteLabel}
                message={call.isJoined ? 'Karşı taraf odaya katıldığında burada görünecek.' : joinCheck.reason || 'Görüşmeye katılmadan önce cihazlarınızı test edebilirsiniz.'}
                meta={meta}
              />
            )}

            <div className="pointer-events-none absolute bottom-3 right-3 z-10 max-w-[38%] sm:max-w-[42%] lg:hidden">
              <div className="pointer-events-auto">
                {local ? (
                  <ParticipantTile participant={local} label="Siz" pip meta={meta} />
                ) : (
                  <WaitingTile label="Siz" pip meta={meta} />
                )}
              </div>
            </div>
          </div>

          <div className="hidden space-y-3 lg:block">
            {local ? (
              <ParticipantTile participant={local} label={`${context.displayName} (Siz)`} meta={meta} />
            ) : (
              <WaitingTile label="Kamera önizlemesi" message="Kamera izni verin veya cihaz seçin." meta={meta} />
            )}
            <SessionDetailsPanel
              sessionDate={sessionDate}
              session={session}
              audience={audience}
              context={context}
              meta={meta}
              roomUrl={roomUrl}
              joinCheck={joinCheck}
              call={call}
            />
          </div>
        </div>

        <div className="shrink-0 border-t border-white/10 bg-gray-900/95 lg:hidden">
          <button
            type="button"
            onClick={() => setDetailsOpen((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-semibold text-white/70"
          >
            Görüşme & cihaz ayarları
            {detailsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          {detailsOpen && (
            <div className="max-h-[40dvh] space-y-3 overflow-y-auto border-t border-white/5 px-3 pb-3 pt-2">
              <SessionDetailsPanel
                sessionDate={sessionDate}
                session={session}
                audience={audience}
                context={context}
                meta={meta}
                roomUrl={roomUrl}
                joinCheck={joinCheck}
                call={call}
              />
            </div>
          )}
        </div>

        {call.error && (
          <p className="mx-3 mb-2 shrink-0 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-200 sm:mx-6 sm:text-sm">{call.error}</p>
        )}
      </div>

      <footer className="shrink-0 border-t border-white/10 bg-gray-900/90 px-3 py-3 backdrop-blur sm:px-4 sm:py-5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
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
    </>
  )
}

function SessionDetailsPanel({ sessionDate, session, audience, context, meta, roomUrl, joinCheck, call }) {
  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm sm:p-4">
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

      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4">
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
    </>
  )
}
