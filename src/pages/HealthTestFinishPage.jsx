import { Navigate } from 'react-router-dom'

/** Eski /health-test/finish rotası — AI senkron kaldırıldı; hub'a yönlendir. */
export default function HealthTestFinishPage() {
  return <Navigate to="/health-test" replace />
}
