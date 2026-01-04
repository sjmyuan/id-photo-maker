interface StepIndicatorProps {
  currentStep: 1 | 2 | 3
}

const STEPS = [
  { id: 1, label: 'Settings & Upload' },
  { id: 2, label: 'ID Photo Preview' },
  { id: 3, label: 'Print Layout' }
] as const

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-8" data-testid="step-indicator">
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center flex-1">
            {/* Step Circle */}
            <div
              data-testid={`step-${step.id}`}
              className={`
                w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold mb-2
                ${step.id < currentStep ? 'bg-green-600' : ''}
                ${step.id === currentStep ? 'bg-blue-600' : ''}
                ${step.id > currentStep ? 'bg-gray-300' : ''}
              `}
            >
              {step.id}
            </div>
            
            {/* Step Label */}
            <div
              className={`
                text-xs text-center
                ${step.id === currentStep ? 'font-semibold text-gray-900' : 'text-gray-600'}
              `}
            >
              {step.label}
            </div>
            
            {/* Connector Line (not shown after last step) */}
            {index < STEPS.length - 1 && (
              <div className="absolute top-5 left-1/2 w-full h-0.5 bg-gray-300 -z-10" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
