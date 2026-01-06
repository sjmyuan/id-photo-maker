/**
 * Hook for managing workflow step navigation
 * Single Responsibility: Workflow step state and transitions
 */

import { useState, useCallback } from 'react'

export type WorkflowStep = 1 | 2 | 3

export interface UseWorkflowStepsReturn {
  currentStep: WorkflowStep
  goToStep: (step: WorkflowStep) => void
  nextStep: () => void
  previousStep: () => void
  resetToFirstStep: () => void
  isFirstStep: boolean
  isLastStep: boolean
}

/**
 * Custom hook for managing workflow step navigation
 */
export function useWorkflowSteps(initialStep: WorkflowStep = 1): UseWorkflowStepsReturn {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>(initialStep)

  const goToStep = useCallback((step: WorkflowStep) => {
    setCurrentStep(step)
  }, [])

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev < 3) return (prev + 1) as WorkflowStep
      return prev
    })
  }, [])

  const previousStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev > 1) return (prev - 1) as WorkflowStep
      return prev
    })
  }, [])

  const resetToFirstStep = useCallback(() => {
    setCurrentStep(1)
  }, [])

  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === 3

  return {
    currentStep,
    goToStep,
    nextStep,
    previousStep,
    resetToFirstStep,
    isFirstStep,
    isLastStep,
  }
}
