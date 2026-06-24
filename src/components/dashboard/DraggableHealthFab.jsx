import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { HeartPulse, X } from 'lucide-react'

const POS_KEY = (userId) => `health_fab_pos_${userId}`
const COLLAPSED_KEY = (userId) => `health_fab_collapsed_${userId}`

function loadPos(userId) {
  try {
    const raw = localStorage.getItem(POS_KEY(userId))
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { edge: 'right', offsetY: 0.72 }
}

function snapPosition(clientX, clientY, size) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const margin = 12
  const cx = clientX
  const cy = clientY
  const dist = {
    left: cx,
    right: vw - cx,
    top: cy,
    bottom: vh - cy,
  }
  const edge = Object.entries(dist).sort((a, b) => a[1] - b[1])[0][0]
  if (edge === 'left') return { edge: 'left', x: margin, y: Math.min(Math.max(cy - size / 2, margin), vh - size - margin) }
  if (edge === 'right') return { edge: 'right', x: vw - size - margin, y: Math.min(Math.max(cy - size / 2, margin), vh - size - margin) }
  if (edge === 'top') return { edge: 'top', x: Math.min(Math.max(cx - size / 2, margin), vw - size - margin), y: margin }
  return { edge: 'bottom', x: Math.min(Math.max(cx - size / 2, margin), vw - size - margin), y: vh - size - margin }
}

function posToStyle(pos) {
  if (pos.x != null && pos.y != null) {
    return { position: 'fixed', left: pos.x, top: pos.y, zIndex: 40 }
  }
  const yPct = pos.offsetY ?? 0.72
  if (pos.edge === 'left') return { position: 'fixed', left: 12, top: `${yPct * 100}vh`, transform: 'translateY(-50%)', zIndex: 40 }
  if (pos.edge === 'top') return { position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 40 }
  if (pos.edge === 'bottom') return { position: 'fixed', bottom: 96, left: '50%', transform: 'translateX(-50%)', zIndex: 40 }
  return { position: 'fixed', right: 12, top: `${yPct * 100}vh`, transform: 'translateY(-50%)', zIndex: 40 }
}

export default function DraggableHealthFab({ userId, onOpen }) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSED_KEY(userId)) === '1' } catch { return false }
  })
  const [pos, setPos] = useState(() => loadPos(userId))
  const dragging = useRef(false)
  const moved = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const fabRef = useRef(null)

  useEffect(() => {
    if (!userId) return
    try { localStorage.setItem(COLLAPSED_KEY(userId), collapsed ? '1' : '0') } catch { /* ignore */ }
  }, [collapsed, userId])

  const persistPos = useCallback((p) => {
    setPos(p)
    try { localStorage.setItem(POS_KEY(userId), JSON.stringify(p)) } catch { /* ignore */ }
  }, [userId])

  const handleCollapse = (e) => {
    e.stopPropagation()
    setCollapsed(true)
  }

  const onPointerDown = (e) => {
    if (!collapsed) return
    if (e.target.closest('button[aria-label="Küçült"]')) return
    dragging.current = true
    moved.current = false
    dragStart.current = { x: e.clientX, y: e.clientY }
    fabRef.current?.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e) => {
    if (!dragging.current || !collapsed) return
    const dx = Math.abs(e.clientX - dragStart.current.x)
    const dy = Math.abs(e.clientY - dragStart.current.y)
    if (dx > 4 || dy > 4) moved.current = true
    const size = 52
    setPos({ x: e.clientX - size / 2, y: e.clientY - size / 2, edge: 'free' })
  }

  const onPointerUp = (e) => {
    if (!dragging.current) return
    dragging.current = false
    try { fabRef.current?.releasePointerCapture(e.pointerId) } catch { /* ignore */ }
    if (moved.current) {
      const snapped = snapPosition(e.clientX, e.clientY, 52)
      persistPos(snapped)
    } else {
      // Sürüklenmeden yapılan dokunuş = tıklama → testi aç.
      // (pointer capture nedeniyle button onClick ateşlenmeyebilir, burada açıyoruz)
      onOpen()
    }
  }

  const onPointerCancel = () => {
    dragging.current = false
  }

  // Genişletilmiş (yazılı) durumda sürükleme yok; normal tıklama çalışır.
  const handleExpandedClick = () => {
    if (!collapsed) onOpen()
  }

  const style = posToStyle(pos)

  return (
    <motion.div
      ref={fabRef}
      layoutId="health-test-prompt"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6 }}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      className={`touch-none select-none ${collapsed ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <div className="relative">
        {!collapsed && (
          <button
            type="button"
            onClick={handleCollapse}
            className="absolute -right-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-cream-900/80 text-white shadow hover:bg-cream-900"
            aria-label="Küçült"
          >
            <X className="h-3 w-3" />
          </button>
        )}
        <button
          type="button"
          onClick={handleExpandedClick}
          className={`flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-sage-500 font-bold text-white shadow-xl shadow-brand-500/30 transition ${
            collapsed ? 'h-[52px] w-[52px]' : 'px-4 py-3 text-sm'
          }`}
        >
          <HeartPulse className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Sağlık Testini Tamamla</span>}
        </button>
      </div>
    </motion.div>
  )
}
