import { Inbox } from 'lucide-react'

export default function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cream-200 bg-white/50 px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-500">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mt-4 font-semibold text-cream-900">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-cream-800/60">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
