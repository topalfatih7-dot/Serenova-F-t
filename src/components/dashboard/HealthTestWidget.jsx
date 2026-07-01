import { useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import HealthTestPrompt from '../onboarding/HealthTestPrompt'
import HealthTestFlow from '../onboarding/HealthTestFlow'
import DraggableHealthFab from './DraggableHealthFab'
import { isHealthTestComplete } from '../../data/healthTest'
import { syncMemberHealthAssets } from '../../services/memberHealthSync'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'

const DISMISS_KEY = (userId) => `health_test_dismissed_${userId}`

export default function HealthTestWidget({ user, promptOpen, onPromptHandled }) {
  const { updateProfile, createProgram, exercises, myPrograms, packageConfig } = useApp()
  const { toast } = useToast()
  const [flowOpen, setFlowOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showFab, setShowFab] = useState(() => {
    if (!user?.id) return false
    if (isHealthTestComplete(user.healthTest, user.gender, packageConfig)) return false
    try {
      return localStorage.getItem(DISMISS_KEY(user.id)) === '1'
    } catch {
      return false
    }
  })
  const [morphing, setMorphing] = useState(false)

  const testComplete = isHealthTestComplete(user?.healthTest, user?.gender, packageConfig)

  const handleComplete = useCallback(async ({ healthTest, healthAck, disclaimer }) => {
    setSaving(true)
    try {
      await updateProfile({ healthTest, healthAck, disclaimer })
      try {
        if (user?.id) localStorage.removeItem(DISMISS_KEY(user.id))
      } catch { /* ignore */ }
      setShowFab(false)
      setFlowOpen(false)
      onPromptHandled?.()

      const merged = { ...user, healthTest, healthAck, disclaimer }
      const result = await syncMemberHealthAssets({
        user: merged,
        exercises,
        updateProfile,
        createProgram,
        myPrograms,
      })
      if (result.synced) {
        toast('Sağlık profiliniz kaydedildi ve kişisel programlarınız hazırlandı.', 'success')
      } else {
        toast('Sağlık testiniz kaydedildi. Kişisel programlar için profilinizdeki bilgileri tamamlayın.', 'success')
      }
    } finally {
      setSaving(false)
    }
  }, [user, updateProfile, createProgram, exercises, myPrograms, toast, onPromptHandled])

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
  const handleFlowClose = () => {
    setFlowOpen(false)
    parkToFab()
    onPromptHandled?.()
  }

  if (!user?.id || testComplete) return null

  return (
    <>
      <AnimatePresence>
        {promptOpen && !flowOpen && !showFab && !morphing && (
          <HealthTestPrompt
            open
            onStart={() => { setFlowOpen(true); onPromptHandled?.() }}
            onLater={handleLater}
            onClose={handleLater}
          />
        )}
      </AnimatePresence>

      <HealthTestFlow
        open={flowOpen}
        onClose={handleFlowClose}
        gender={user.gender || ''}
        packageConfig={packageConfig}
        initialHealthTest={user.healthTest}
        onComplete={handleComplete}
        saving={saving}
      />

      <AnimatePresence>
        {showFab && !flowOpen && (
          <DraggableHealthFab userId={user.id} onOpen={() => setFlowOpen(true)} />
        )}
      </AnimatePresence>
    </>
  )
}
