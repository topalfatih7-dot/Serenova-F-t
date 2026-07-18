import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import HealthTestPrompt from '../onboarding/HealthTestPrompt'
import DraggableHealthFab from './DraggableHealthFab'
import { isHealthTestComplete } from '../../data/healthTest'
import { useApp } from '../../context/AppContext'

const DISMISS_KEY = (userId) => `health_test_dismissed_${userId}`

export default function HealthTestWidget({ user, promptOpen, onPromptHandled }) {
  const { packageConfig, healthTestSchema } = useApp()
  const navigate = useNavigate()
  const [showFab, setShowFab] = useState(() => {
    if (!user?.id) return false
    if (isHealthTestComplete(user.healthTest, user.gender, packageConfig, healthTestSchema)) return false
    try {
      return localStorage.getItem(DISMISS_KEY(user.id)) === '1'
    } catch {
      return false
    }
  })
  const [morphing, setMorphing] = useState(false)

  const testComplete = isHealthTestComplete(user?.healthTest, user?.gender, packageConfig, healthTestSchema)
    && user?.healthAck && user?.disclaimer

  const goToHub = useCallback(() => {
    onPromptHandled?.()
    navigate('/health-test')
  }, [navigate, onPromptHandled])

  const parkToFab = useCallback(() => {
    try {
      if (user?.id) localStorage.setItem(DISMISS_KEY(user.id), '1')
    } catch { /* ignore */ }
    setShowFab(true)
  }, [user])

  const handleLater = () => {
    setMorphing(true)
    setTimeout(() => {
      parkToFab()
      setMorphing(false)
      onPromptHandled?.()
    }, 520)
  }

  // Test yarıda kapatılırsa: bilgiler tamamlanana kadar ikon kaybolmasın.
  const handleFabOpen = () => {
    try {
      if (user?.id) localStorage.removeItem(DISMISS_KEY(user.id))
    } catch { /* ignore */ }
    setShowFab(false)
    goToHub()
  }

  if (!user?.id || testComplete) return null

  return (
    <>
      <AnimatePresence>
        {promptOpen && !showFab && !morphing && (
          <HealthTestPrompt
            open
            onStart={goToHub}
            onLater={handleLater}
            onClose={handleLater}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFab && (
          <DraggableHealthFab userId={user.id} onOpen={handleFabOpen} />
        )}
      </AnimatePresence>
    </>
  )
}
