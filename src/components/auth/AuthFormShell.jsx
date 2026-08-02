/** Giriş/kayıt formları — tablet/desktop ortalı genişlik, iOS odak yakınlaştırmasını önleyen 16px+ tipografi */
export default function AuthFormShell({ children, className = '' }) {
  return (
    <div className={`auth-form-shell mx-auto w-full max-w-[440px] shrink-0 ${className}`}>
      {children}
    </div>
  )
}

export function AuthFormCard({ children, className = '' }) {
  return (
    <div className={`auth-form-card rounded-3xl border border-white/80 bg-white/95 p-6 shadow-xl shadow-sage-900/[0.05] backdrop-blur-sm sm:p-7 ${className}`}>
      {children}
    </div>
  )
}
