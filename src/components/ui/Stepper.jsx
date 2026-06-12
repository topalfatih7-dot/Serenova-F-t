import { Check } from 'lucide-react'

export default function Stepper({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, i) => {
        const done = i < currentStep
        const active = i === currentStep
        return (
          <div key={step} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition ${
                  done
                    ? 'bg-sage-500 text-white'
                    : active
                      ? 'bg-brand-500 text-white ring-4 ring-brand-100'
                      : 'bg-cream-200 text-cream-800/50'
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`mt-2 hidden text-[10px] font-medium sm:block ${active ? 'text-brand-600' : 'text-cream-800/50'}`}>
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`mx-1 h-0.5 flex-1 ${done ? 'bg-sage-400' : 'bg-cream-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
