import { Check } from 'lucide-react'

export default function Stepper({ steps, currentStep, onStepClick, maxReached }) {
  const reach = maxReached ?? currentStep
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, i) => {
        const done = i < currentStep
        const active = i === currentStep
        const clickable = typeof onStepClick === 'function' && i <= reach && i !== currentStep
        const Tag = clickable ? 'button' : 'div'
        return (
          <div key={step} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <Tag
                type={clickable ? 'button' : undefined}
                onClick={clickable ? () => onStepClick(i) : undefined}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition ${
                  done
                    ? 'bg-gradient-to-br from-sage-400 to-emerald-500 text-white shadow-sm'
                    : active
                      ? 'bg-gradient-to-br from-brand-400 to-teal-500 text-white shadow-md ring-4 ring-brand-100/80'
                      : 'bg-cream-100 text-cream-800/45'
                } ${clickable ? 'cursor-pointer hover:ring-4 hover:ring-sage-100' : ''}`}
              >
                {done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
              </Tag>
              <span
                onClick={clickable ? () => onStepClick(i) : undefined}
                className={`mt-2 hidden text-[10px] font-semibold sm:block ${active ? 'text-brand-600' : done ? 'text-sage-600' : 'text-cream-800/45'} ${clickable ? 'cursor-pointer' : ''}`}
              >
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`mx-1 h-1 flex-1 rounded-full transition-colors ${done ? 'bg-gradient-to-r from-sage-300 to-emerald-300' : 'bg-cream-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
