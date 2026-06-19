import { useCallback, useEffect, useRef, useState } from 'react'
import DailyIframe from '@daily-co/daily-js'

const IDLE = 'idle'
const PREVIEW = 'preview'
const LOADING = 'loading'
const JOINED = 'joined'
const ERROR = 'error'

function attachTrack(el, track) {
  if (!el) return
  if (!track) {
    el.srcObject = null
    return
  }
  el.srcObject = new MediaStream([track])
}

function bindCallEvents(call, { refreshParticipants, onLeftMeeting }) {
  call.on('joined-meeting', refreshParticipants)
  call.on('participant-joined', refreshParticipants)
  call.on('participant-updated', refreshParticipants)
  call.on('participant-left', refreshParticipants)
  call.on('track-started', refreshParticipants)
  call.on('track-stopped', refreshParticipants)
  call.on('local-screen-share-started', refreshParticipants)
  call.on('local-screen-share-stopped', refreshParticipants)
  call.on('error', (ev) => onLeftMeeting(ev?.errorMsg || 'Bağlantı hatası', true))
  call.on('left-meeting', () => onLeftMeeting(null, false))
}

export function useDailyCall({ roomUrl, userName, enabled, token = '' }) {
  const callRef = useRef(null)
  const userNameRef = useRef(userName)
  const tokenRef = useRef(token)

  useEffect(() => { userNameRef.current = userName }, [userName])
  useEffect(() => { tokenRef.current = token }, [token])

  const [phase, setPhase] = useState(IDLE)
  const [error, setError] = useState(null)
  const [participants, setParticipants] = useState({ local: null, remote: [] })
  const [devices, setDevices] = useState({ cameras: [], mics: [], speakers: [] })
  const [selectedDevices, setSelectedDevices] = useState({ cameraId: '', micId: '', speakerId: '' })
  const [mediaState, setMediaState] = useState({ camOn: true, micOn: true, screenSharing: false })

  const refreshParticipants = useCallback(() => {
    const call = callRef.current
    if (!call) return
    const all = call.participants()
    const local = all.local || null
    const remote = Object.values(all).filter((p) => !p.local)
    setParticipants({ local, remote })
  }, [])

  const loadDevices = useCallback(async () => {
    try {
      const cams = await DailyIframe.getInputDevices()
      setDevices({
        cameras: cams.cameras || [],
        mics: cams.mics || [],
        speakers: cams.speakers || [],
      })
      setSelectedDevices((prev) => ({
        cameraId: prev.cameraId || cams.camera?.deviceId || '',
        micId: prev.micId || cams.mic?.deviceId || '',
        speakerId: prev.speakerId || cams.speaker?.deviceId || '',
      }))
    } catch {
      /* cihaz listesi opsiyonel */
    }
  }, [])

  const ensureCallObject = useCallback(async () => {
    if (callRef.current) return callRef.current

    const call = DailyIframe.createCallObject({
      audioSource: selectedDevices.micId || true,
      videoSource: selectedDevices.cameraId || true,
    })
    callRef.current = call

    bindCallEvents(call, {
      refreshParticipants,
      onLeftMeeting: (msg, isError) => {
        if (isError) setError(msg)
        setPhase(PREVIEW)
        setMediaState((s) => ({ ...s, screenSharing: false }))
        refreshParticipants()
      },
    })

    return call
  }, [selectedDevices.cameraId, selectedDevices.micId, refreshParticipants])

  const startPreview = useCallback(async () => {
    if (!enabled) return
    setError(null)
    try {
      const call = await ensureCallObject()
      if (mediaState.camOn) await call.startCamera({ deviceId: selectedDevices.cameraId || undefined })
      if (mediaState.micOn) await call.startLocalAudio()
      await call.setLocalVideo(mediaState.camOn)
      await call.setLocalAudio(mediaState.micOn)
      setPhase(PREVIEW)
      refreshParticipants()
    } catch (err) {
      setError(err?.message || 'Kamera önizlemesi başlatılamadı.')
      setPhase(ERROR)
    }
  }, [enabled, ensureCallObject, mediaState.camOn, mediaState.micOn, selectedDevices.cameraId, refreshParticipants])

  useEffect(() => {
    if (!enabled) return undefined
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDevices()
    startPreview()
    return undefined
  }, [enabled, loadDevices]) // eslint-disable-line react-hooks/exhaustive-deps

  const join = useCallback(async () => {
    if (!roomUrl || !enabled) return
    setPhase(LOADING)
    setError(null)
    try {
      const call = await ensureCallObject()
      const joinOpts = { url: roomUrl, userName: userNameRef.current || 'Katılımcı' }
      if (tokenRef.current) joinOpts.token = tokenRef.current
      await call.join(joinOpts)
      setPhase(JOINED)
      refreshParticipants()
    } catch (err) {
      setError(err?.message || 'Görüşmeye bağlanılamadı.')
      setPhase(PREVIEW)
      refreshParticipants()
    }
  }, [roomUrl, enabled, ensureCallObject, refreshParticipants])

  const leaveMeeting = useCallback(async () => {
    const call = callRef.current
    if (!call) {
      setPhase(PREVIEW)
      return
    }
    setError(null)
    try {
      if (mediaState.screenSharing) await call.stopScreenShare()
      await call.leave()
      setMediaState((s) => ({ ...s, screenSharing: false }))
      if (mediaState.camOn) await call.startCamera({ deviceId: selectedDevices.cameraId || undefined })
      if (mediaState.micOn) await call.startLocalAudio()
      setPhase(PREVIEW)
      refreshParticipants()
    } catch (err) {
      setError(err?.message || 'Görüşmeden ayrılırken hata oluştu.')
      setPhase(PREVIEW)
    }
  }, [mediaState.screenSharing, mediaState.camOn, mediaState.micOn, selectedDevices.cameraId, refreshParticipants])

  const destroy = useCallback(async () => {
    const call = callRef.current
    if (!call) return
    try {
      await call.destroy()
    } catch {
      /* ignore */
    }
    callRef.current = null
    setPhase(IDLE)
    setParticipants({ local: null, remote: [] })
  }, [])

  const toggleCam = useCallback(async () => {
    const call = callRef.current
    if (!call) return
    const next = !mediaState.camOn
    try {
      if (next) {
        if (phase !== JOINED) await call.startCamera({ deviceId: selectedDevices.cameraId || undefined })
        await call.setLocalVideo(true)
      } else {
        await call.setLocalVideo(false)
      }
      setMediaState((s) => ({ ...s, camOn: next }))
      refreshParticipants()
    } catch (err) {
      setError(err?.message || 'Kamera değiştirilemedi.')
    }
  }, [mediaState.camOn, phase, selectedDevices.cameraId, refreshParticipants])

  const toggleMic = useCallback(async () => {
    const call = callRef.current
    if (!call) return
    const next = !mediaState.micOn
    try {
      if (next && phase !== JOINED) await call.startLocalAudio()
      await call.setLocalAudio(next)
      setMediaState((s) => ({ ...s, micOn: next }))
      refreshParticipants()
    } catch (err) {
      setError(err?.message || 'Mikrofon değiştirilemedi.')
    }
  }, [mediaState.micOn, phase, refreshParticipants])

  const toggleScreenShare = useCallback(async () => {
    const call = callRef.current
    if (!call || phase !== JOINED) return
    try {
      if (mediaState.screenSharing) {
        await call.stopScreenShare()
        setMediaState((s) => ({ ...s, screenSharing: false }))
      } else {
        await call.startScreenShare()
        setMediaState((s) => ({ ...s, screenSharing: true }))
      }
      refreshParticipants()
    } catch (err) {
      setError(err?.message || 'Ekran paylaşımı başlatılamadı.')
    }
  }, [mediaState.screenSharing, phase, refreshParticipants])

  const setCamera = useCallback(async (deviceId) => {
    setSelectedDevices((s) => ({ ...s, cameraId: deviceId }))
    const call = callRef.current
    if (!call) return
    try {
      await call.setInputDevicesAsync({ videoDeviceId: deviceId })
      if (phase !== JOINED && mediaState.camOn) {
        await call.startCamera({ deviceId })
      }
      refreshParticipants()
    } catch {
      /* ignore */
    }
  }, [phase, mediaState.camOn, refreshParticipants])

  const setMic = useCallback(async (deviceId) => {
    setSelectedDevices((s) => ({ ...s, micId: deviceId }))
    const call = callRef.current
    if (!call) return
    try {
      await call.setInputDevicesAsync({ audioDeviceId: deviceId })
      refreshParticipants()
    } catch {
      /* ignore */
    }
  }, [refreshParticipants])

  useEffect(() => () => {
    callRef.current?.destroy?.()
    callRef.current = null
  }, [])

  return {
    phase,
    error,
    participants,
    devices,
    selectedDevices,
    mediaState,
    join,
    leaveMeeting,
    destroy,
    toggleCam,
    toggleMic,
    toggleScreenShare,
    setCamera,
    setMic,
    attachTrack,
    isJoined: phase === JOINED,
    isPreview: phase === PREVIEW,
    isLoading: phase === LOADING,
    isReady: phase === PREVIEW || phase === JOINED,
  }
}

export { attachTrack }
