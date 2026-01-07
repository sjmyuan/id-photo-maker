import { useTranslation } from 'react-i18next'

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const { t } = useTranslation()
  
  const STEPS = [
    { 
      id: 1, 
      label: t('steps.step1'),
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
  { 
    id: 2, 
    label: t('steps.step2'),
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    )
  },
  { 
    id: 3, 
    label: t('steps.step3'),
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
    )
  }
] as const

  return (
    <div className="mb-8" data-testid="step-indicator">
      <div className="flex items-start justify-between relative">
        {/* Connector Line Background */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200" style={{ zIndex: 0 }} />
        
        {STEPS.map((step, index) => {
          const isCompleted = step.id < currentStep
          const isCurrent = step.id === currentStep
          const isPending = step.id > currentStep
          
          return (
            <div key={step.id} className="flex flex-col items-center flex-1 relative" style={{ zIndex: 1 }}>
              {/* Step Circle */}
              <div
                data-testid={`step-${step.id}`}
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center font-semibold mb-2 transition-all duration-300 shadow-md
                  ${isCompleted ? 'bg-green-500 text-white scale-100' : ''}
                  ${isCurrent ? 'bg-blue-600 text-white scale-110 ring-4 ring-blue-200' : ''}
                  ${isPending ? 'bg-white border-2 border-gray-300 text-gray-400' : ''}
                `}
              >
                {isCompleted ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.icon
                )}
              </div>
              
              {/* Active Connector (for completed steps) */}
              {isCompleted && index < STEPS.length - 1 && (
                <div 
                  className="absolute top-6 left-1/2 w-full h-0.5 bg-green-500 transition-all duration-500"
                  style={{ zIndex: 0 }}
                />
              )}
              
              {/* Step Label */}
              <div
                className={`
                  text-xs text-center px-2 transition-all duration-300
                  ${isCurrent ? 'font-bold text-gray-900' : ''}
                  ${isCompleted ? 'font-medium text-gray-700' : ''}
                  ${isPending ? 'font-normal text-gray-500' : ''}
                `}
              >
                {step.label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
