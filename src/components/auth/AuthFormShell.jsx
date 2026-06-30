/** Giriş/kayıt formları — sabit genişlik, iOS odak yakınlaştırmasını önleyen 16px+ tipografi */
export default function AuthFormShell({ children, className = '' }) {
  return (
    <div className={`auth-form-shell mx-auto w-[440px] max-w-[calc(100vw-2rem)] shrink-0 ${className}`}>
      {children}
    </div>
  )
}

export function AuthFormCard({ children, className = '' }) {
  return (
    <div className={`auth-form-card rounded-3xl border border-white/80 bg-white/95 p-7 shadow-xl shadow-sage-900/[0.05] backdrop-blur-sm ${className}`}>
      {children}
    </div>
  )
}
