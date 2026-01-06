import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWorkflowSteps } from './useWorkflowSteps'

describe('useWorkflowSteps', () => {
  it('should initialize with step 1 by default', () => {
    const { result } = renderHook(() => useWorkflowSteps())

    expect(result.current.currentStep).toBe(1)
    expect(result.current.isFirstStep).toBe(true)
    expect(result.current.isLastStep).toBe(false)
  })

  it('should initialize with custom step', () => {
    const { result } = renderHook(() => useWorkflowSteps(2))

    expect(result.current.currentStep).toBe(2)
    expect(result.current.isFirstStep).toBe(false)
    expect(result.current.isLastStep).toBe(false)
  })

  it('should go to specific step', () => {
    const { result } = renderHook(() => useWorkflowSteps())

    act(() => {
      result.current.goToStep(3)
    })

    expect(result.current.currentStep).toBe(3)
    expect(result.current.isLastStep).toBe(true)
  })

  it('should advance to next step', () => {
    const { result } = renderHook(() => useWorkflowSteps())

    act(() => {
      result.current.nextStep()
    })

    expect(result.current.currentStep).toBe(2)

    act(() => {
      result.current.nextStep()
    })

    expect(result.current.currentStep).toBe(3)
  })

  it('should not advance beyond last step', () => {
    const { result } = renderHook(() => useWorkflowSteps(3))

    act(() => {
      result.current.nextStep()
    })

    expect(result.current.currentStep).toBe(3)
  })

  it('should go to previous step', () => {
    const { result } = renderHook(() => useWorkflowSteps(3))

    act(() => {
      result.current.previousStep()
    })

    expect(result.current.currentStep).toBe(2)

    act(() => {
      result.current.previousStep()
    })

    expect(result.current.currentStep).toBe(1)
  })

  it('should not go before first step', () => {
    const { result } = renderHook(() => useWorkflowSteps(1))

    act(() => {
      result.current.previousStep()
    })

    expect(result.current.currentStep).toBe(1)
  })

  it('should reset to first step', () => {
    const { result } = renderHook(() => useWorkflowSteps(3))

    act(() => {
      result.current.resetToFirstStep()
    })

    expect(result.current.currentStep).toBe(1)
    expect(result.current.isFirstStep).toBe(true)
  })

  it('should correctly identify first step', () => {
    const { result } = renderHook(() => useWorkflowSteps(1))
    expect(result.current.isFirstStep).toBe(true)

    act(() => {
      result.current.nextStep()
    })
    expect(result.current.isFirstStep).toBe(false)
  })

  it('should correctly identify last step', () => {
    const { result } = renderHook(() => useWorkflowSteps(3))
    expect(result.current.isLastStep).toBe(true)

    act(() => {
      result.current.previousStep()
    })
    expect(result.current.isLastStep).toBe(false)
  })
})
