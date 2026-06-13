import { CheckCircle, Clock } from 'lucide-react'

export default function SuccessStoryCard({ story }) {
  return (
    <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-cream-900">{story.name}</h3>
          <p className="text-sm text-brand-600">{story.highlight}</p>
        </div>
        {story.approved ? (
          <span className="flex items-center gap-1 rounded-full bg-sage-50 px-2.5 py-1 text-xs font-medium text-sage-700">
            <CheckCircle className="h-3.5 w-3.5" /> Onaylı
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
            <Clock className="h-3.5 w-3.5" /> İncelemede
          </span>
        )}
      </div>
      {story.duration && <p className="mt-2 text-xs text-cream-800/50">{story.duration} program süresi</p>}
      {Array.isArray(story.timeline) && story.timeline.length > 0 ? (
        <div className="mt-4 space-y-3">
          {story.timeline.map((step, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="h-2.5 w-2.5 rounded-full bg-brand-400" />
                {i < story.timeline.length - 1 && <div className="w-0.5 flex-1 bg-brand-100" />}
              </div>
              <p className="pb-3 text-sm text-cream-800/70">{step}</p>
            </div>
          ))}
        </div>
      ) : (
        story.story && <p className="mt-4 text-sm text-cream-800/70">{story.story}</p>
      )}
      {story.consent && (
        <p className="mt-2 border-t border-cream-100 pt-3 text-[10px] text-cream-800/40">
          Paylaşım için kullanıcı onayı alınmıştır. Sonuçlar kişiden kişiye değişir.
        </p>
      )}
    </div>
  )
}
