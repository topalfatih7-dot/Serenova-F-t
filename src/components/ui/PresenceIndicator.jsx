import { isUserOnline, presenceLabel } from '../../utils/presenceStatus'

export default function PresenceIndicator({
  lastSeenAt,
  online,
  size = 'sm',
  showLabel = false,
  className = '',
}) {
  const isOnline = online ?? isUserOnline(lastSeenAt)
  const dotSize = size === 'md' ? 'h-3 w-3' : 'h-2.5 w-2.5'
  const label = presenceLabel(lastSeenAt)

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} title={label}>
      <span
        className={`${dotSize} shrink-0 rounded-full ring-2 ring-white ${
          isOnline ? 'bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.25)]' : 'bg-cream-300'
        }`}
        aria-hidden
      />
      {showLabel && (
        <span className={`text-[11px] font-medium ${isOnline ? 'text-emerald-600' : 'text-cream-800/45'}`}>
          {label}
        </span>
      )}
    </span>
  )
}

export function AvatarWithPresence({ children, lastSeenAt, online, className = '' }) {
  const isOnline = online ?? isUserOnline(lastSeenAt)
  return (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      {children}
      <span
        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
          isOnline ? 'bg-emerald-500' : 'bg-cream-300'
        }`}
        title={presenceLabel(lastSeenAt)}
        aria-hidden
      />
    </span>
  )
}
