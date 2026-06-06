export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-cream-200 ${className}`} />
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-cream-100 bg-white p-6">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="mt-4 h-8 w-1/2" />
      <Skeleton className="mt-6 h-20 w-full" />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  )
}
